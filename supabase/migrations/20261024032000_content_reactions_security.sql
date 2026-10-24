DROP POLICY IF EXISTS "Users can manage their own reactions" ON public.content_reactions;
DROP POLICY IF EXISTS "Super admin full access on reactions" ON public.content_reactions;

CREATE POLICY "Authenticated users can read published content reactions"
  ON public.content_reactions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.content
      WHERE content.id = content_reactions.content_id
        AND content.status = 'published'
    )
  );

CREATE POLICY "Users can add their own published content reactions"
  ON public.content_reactions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.content
      WHERE content.id = content_reactions.content_id
        AND content.status = 'published'
    )
  );

CREATE POLICY "Users can update their own published content reactions"
  ON public.content_reactions
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.content
      WHERE content.id = content_reactions.content_id
        AND content.status = 'published'
    )
  );

CREATE POLICY "Users can remove their own published content reactions"
  ON public.content_reactions
  FOR DELETE
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.content
      WHERE content.id = content_reactions.content_id
        AND content.status = 'published'
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_reactions TO authenticated;
