CREATE TABLE IF NOT EXISTS public.user_follows (
  follower_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_follows_pkey PRIMARY KEY (follower_id, following_id),
  CONSTRAINT user_follows_no_self_follow CHECK (follower_id <> following_id)
);

CREATE INDEX IF NOT EXISTS user_follows_following_id_created_at_idx
  ON public.user_follows (following_id, created_at DESC);

ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.can_view_discovery_profile(target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users AS target_user
    WHERE target_user.id = target_user_id
      AND target_user.is_active = true
      AND target_user.profile_visibility = 'public'::public.profile_visibility
      AND target_user.role IN (
        'contributor'::public.user_role,
        'county_admin'::public.user_role
      )
  );
$$;

REVOKE ALL ON FUNCTION public.can_view_discovery_profile(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_view_discovery_profile(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_discovery_profiles(
  p_search text DEFAULT NULL,
  p_county_id uuid DEFAULT NULL,
  p_organizations boolean DEFAULT false,
  p_offset integer DEFAULT 0,
  p_limit integer DEFAULT 20,
  p_target_user_id uuid DEFAULT NULL,
  p_user_ids uuid[] DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  full_name text,
  bio text,
  avatar_url text,
  logo_url text,
  verified boolean,
  county_id uuid,
  role public.user_role,
  is_active boolean,
  profile_visibility public.profile_visibility,
  created_at timestamptz,
  contributor_kind text,
  individual_category text,
  organization_name text,
  organization_description text,
  institution_type text,
  website_url text,
  total_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    target_user.id,
    target_user.full_name,
    target_user.bio,
    target_user.avatar_url,
    target_user.logo_url,
    target_user.verified,
    target_user.county_id,
    target_user.role,
    target_user.is_active,
    target_user.profile_visibility,
    target_user.created_at,
    target_user.contributor_kind::text,
    target_user.individual_category::text,
    target_user.organization_name,
    target_user.organization_description,
    target_user.institution_type,
    target_user.website_url,
    count(*) OVER ()
  FROM public.users AS target_user
  JOIN public.users AS requester ON requester.id = (SELECT auth.uid())
  WHERE requester.is_active = true
    AND requester.role IN (
      'contributor'::public.user_role,
      'county_admin'::public.user_role,
      'super_admin'::public.user_role
    )
    AND target_user.is_active = true
    AND (
      (
        p_target_user_id IS NOT NULL
        AND target_user.id = p_target_user_id
        AND (
          target_user.id = (SELECT auth.uid())
          OR (
            target_user.role IN (
              'contributor'::public.user_role,
              'county_admin'::public.user_role
            )
            AND target_user.profile_visibility = 'public'::public.profile_visibility
          )
        )
      )
      OR (
        p_target_user_id IS NULL
        AND p_user_ids IS NULL
        AND target_user.id <> (SELECT auth.uid())
        AND target_user.role IN (
          'contributor'::public.user_role,
          'county_admin'::public.user_role
        )
        AND target_user.profile_visibility = 'public'::public.profile_visibility
      )
      OR (
        p_user_ids IS NOT NULL
        AND target_user.id = ANY (p_user_ids)
        AND target_user.role IN (
          'contributor'::public.user_role,
          'county_admin'::public.user_role
        )
        AND target_user.profile_visibility = 'public'::public.profile_visibility
      )
    )
    AND (p_county_id IS NULL OR target_user.county_id = p_county_id)
    AND (
      p_user_ids IS NOT NULL
      OR p_target_user_id IS NOT NULL
      OR (
        p_organizations
        AND target_user.contributor_kind IS NOT NULL
        AND target_user.contributor_kind <> 'individual'
      )
      OR (
        NOT p_organizations
        AND (
          target_user.contributor_kind IS NULL
          OR target_user.contributor_kind = 'individual'
        )
      )
    )
    AND (
      nullif(btrim(p_search), '') IS NULL
      OR (
        CASE WHEN p_organizations
          THEN coalesce(target_user.organization_name, target_user.full_name, '')
          ELSE coalesce(target_user.full_name, '')
        END
      ) ILIKE '%' || btrim(p_search) || '%'
    )
  ORDER BY target_user.full_name
  OFFSET greatest(p_offset, 0)
  LIMIT least(greatest(p_limit, 1), 50);
$$;

REVOKE ALL ON FUNCTION public.get_discovery_profiles(text, uuid, boolean, integer, integer, uuid, uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_discovery_profiles(text, uuid, boolean, integer, integer, uuid, uuid[]) TO authenticated;

DROP POLICY IF EXISTS "Users can read visible follow relationships" ON public.user_follows;
CREATE POLICY "Users can read visible follow relationships"
  ON public.user_follows
  FOR SELECT
  TO authenticated
  USING (
    follower_id = (SELECT auth.uid())
    OR following_id = (SELECT auth.uid())
    OR public.can_view_discovery_profile(following_id)
  );

DROP POLICY IF EXISTS "Users can follow discoverable contributors" ON public.user_follows;
CREATE POLICY "Users can follow discoverable contributors"
  ON public.user_follows
  FOR INSERT
  TO authenticated
  WITH CHECK (
    follower_id = (SELECT auth.uid())
    AND follower_id <> following_id
    AND EXISTS (
      SELECT 1
      FROM public.users AS follower
      WHERE follower.id = (SELECT auth.uid())
        AND follower.is_active = true
        AND follower.role IN (
          'contributor'::public.user_role,
          'county_admin'::public.user_role,
          'super_admin'::public.user_role
        )
    )
    AND public.can_view_discovery_profile(following_id)
  );

DROP POLICY IF EXISTS "Users can unfollow themselves" ON public.user_follows;
CREATE POLICY "Users can unfollow themselves"
  ON public.user_follows
  FOR DELETE
  TO authenticated
  USING (follower_id = (SELECT auth.uid()));

GRANT SELECT, INSERT, DELETE ON public.user_follows TO authenticated;
