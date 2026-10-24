CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_low uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  participant_high uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT conversations_distinct_participants CHECK (participant_low < participant_high),
  CONSTRAINT conversations_unique_pair UNIQUE (participant_low, participant_high)
);

CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (length(btrim(body)) BETWEEN 1 AND 5000),
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz
);

CREATE INDEX IF NOT EXISTS messages_conversation_created_idx
  ON public.messages (conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS messages_unread_conversation_idx
  ON public.messages (conversation_id, read_at)
  WHERE read_at IS NULL;

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Conversation participants can view conversations" ON public.conversations;
CREATE POLICY "Conversation participants can view conversations"
  ON public.conversations
  FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) IN (participant_low, participant_high)
  );

DROP POLICY IF EXISTS "Conversation participants can view messages" ON public.messages;
CREATE POLICY "Conversation participants can view messages"
  ON public.messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.conversations AS conversation
      WHERE conversation.id = messages.conversation_id
        AND (SELECT auth.uid()) IN (conversation.participant_low, conversation.participant_high)
    )
  );

REVOKE ALL ON public.conversations, public.messages FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.conversations, public.messages TO authenticated;

CREATE OR REPLACE FUNCTION public.are_mutually_followed(first_user uuid, second_user uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_follows AS first_follows
    JOIN public.user_follows AS second_follows
      ON second_follows.follower_id = first_follows.following_id
     AND second_follows.following_id = first_follows.follower_id
    WHERE first_follows.follower_id = first_user
      AND first_follows.following_id = second_user
  );
$$;

REVOKE ALL ON FUNCTION public.are_mutually_followed(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.are_mutually_followed(uuid, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.start_direct_conversation(target_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  caller_id uuid := auth.uid();
  low_id uuid;
  high_id uuid;
  conversation_id uuid;
BEGIN
  IF caller_id IS NULL OR target_user_id IS NULL OR target_user_id = caller_id THEN
    RAISE EXCEPTION 'A valid, different recipient is required.';
  END IF;

  IF NOT public.can_view_discovery_profile(target_user_id)
     OR NOT public.are_mutually_followed(caller_id, target_user_id) THEN
    RAISE EXCEPTION 'A conversation requires an eligible recipient and mutual follows.';
  END IF;

  IF caller_id < target_user_id THEN
    low_id := caller_id;
    high_id := target_user_id;
  ELSE
    low_id := target_user_id;
    high_id := caller_id;
  END IF;

  INSERT INTO public.conversations (participant_low, participant_high)
  VALUES (low_id, high_id)
  ON CONFLICT (participant_low, participant_high)
  DO UPDATE SET updated_at = public.conversations.updated_at
  RETURNING id INTO conversation_id;

  RETURN conversation_id;
END;
$$;

REVOKE ALL ON FUNCTION public.start_direct_conversation(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.start_direct_conversation(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.send_direct_message(target_conversation_id uuid, message_body text)
RETURNS public.messages
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  caller_id uuid := auth.uid();
  recipient_id uuid;
  created_message public.messages;
  clean_body text := btrim(message_body);
BEGIN
  IF caller_id IS NULL OR clean_body IS NULL OR length(clean_body) NOT BETWEEN 1 AND 5000 THEN
    RAISE EXCEPTION 'Message must contain between 1 and 5000 characters.';
  END IF;

  SELECT CASE
    WHEN conversation.participant_low = caller_id THEN conversation.participant_high
    WHEN conversation.participant_high = caller_id THEN conversation.participant_low
    ELSE NULL
  END
  INTO recipient_id
  FROM public.conversations AS conversation
  WHERE conversation.id = target_conversation_id;

  IF recipient_id IS NULL OR NOT public.are_mutually_followed(caller_id, recipient_id) THEN
    RAISE EXCEPTION 'Only mutually connected conversation participants can send messages.';
  END IF;

  INSERT INTO public.messages (conversation_id, sender_id, body)
  VALUES (target_conversation_id, caller_id, clean_body)
  RETURNING * INTO created_message;

  UPDATE public.conversations
  SET updated_at = created_message.created_at
  WHERE id = target_conversation_id;

  RETURN created_message;
END;
$$;

REVOKE ALL ON FUNCTION public.send_direct_message(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.send_direct_message(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.mark_direct_messages_read(target_conversation_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  caller_id uuid := auth.uid();
  changed_count integer;
BEGIN
  IF caller_id IS NULL OR NOT EXISTS (
    SELECT 1
    FROM public.conversations AS conversation
    WHERE conversation.id = target_conversation_id
      AND caller_id IN (conversation.participant_low, conversation.participant_high)
  ) THEN
    RAISE EXCEPTION 'Conversation not found or access denied.';
  END IF;

  UPDATE public.messages
  SET read_at = now()
  WHERE conversation_id = target_conversation_id
    AND sender_id <> caller_id
    AND read_at IS NULL;

  GET DIAGNOSTICS changed_count = ROW_COUNT;
  RETURN changed_count;
END;
$$;

REVOKE ALL ON FUNCTION public.mark_direct_messages_read(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mark_direct_messages_read(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_my_conversations()
RETURNS TABLE (
  conversation_id uuid,
  other_user_id uuid,
  other_full_name text,
  other_organization_name text,
  other_avatar_url text,
  other_logo_url text,
  other_county_id uuid,
  last_message text,
  last_message_at timestamptz,
  unread_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    conversation.id,
    other_user.id,
    other_user.full_name,
    other_user.organization_name,
    other_user.avatar_url,
    other_user.logo_url,
    other_user.county_id,
    latest.body,
    latest.created_at,
    (
      SELECT count(*)
      FROM public.messages AS unread
      WHERE unread.conversation_id = conversation.id
        AND unread.sender_id <> (SELECT auth.uid())
        AND unread.read_at IS NULL
    )
  FROM public.conversations AS conversation
  JOIN public.users AS other_user
    ON other_user.id = CASE
      WHEN conversation.participant_low = (SELECT auth.uid()) THEN conversation.participant_high
      ELSE conversation.participant_low
    END
  LEFT JOIN LATERAL (
    SELECT message.body, message.created_at
    FROM public.messages AS message
    WHERE message.conversation_id = conversation.id
    ORDER BY message.created_at DESC
    LIMIT 1
  ) AS latest ON true
  WHERE (SELECT auth.uid()) IN (conversation.participant_low, conversation.participant_high)
  ORDER BY coalesce(latest.created_at, conversation.created_at) DESC;
$$;

REVOKE ALL ON FUNCTION public.get_my_conversations() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_conversations() TO authenticated;
