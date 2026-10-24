-- ============================================================================
-- COMMENTS & REACTIONS SYSTEM - DATABASE MIGRATION
-- Liberia Counties Digital Platform
-- ============================================================================
-- This migration creates the complete comments and reactions infrastructure
-- for the platform, supporting nested comments, reactions, and real-time updates.

-- ============================================================================
-- 1. CREATE CONTENT_COMMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.content_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES public.content_comments(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  is_edited BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX idx_content_comments_content_id ON public.content_comments(content_id);
CREATE INDEX idx_content_comments_user_id ON public.content_comments(user_id);
CREATE INDEX idx_content_comments_parent_id ON public.content_comments(parent_comment_id);
CREATE INDEX idx_content_comments_created_at ON public.content_comments(created_at DESC);
CREATE INDEX idx_content_comments_not_deleted ON public.content_comments(content_id)
  WHERE is_deleted = FALSE;

-- Enable RLS
ALTER TABLE public.content_comments ENABLE ROW LEVEL SECURITY;

-- Add trigger for updated_at
CREATE TRIGGER update_content_comments_updated_at BEFORE UPDATE
  ON public.content_comments FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- 2. CREATE CONTENT_REACTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.content_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN (
    'like', 'love', 'celebrate', 'insightful', 'sad'
  )),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,

  -- One reaction per user per content
  UNIQUE(content_id, user_id)
);

-- Create indexes for performance
CREATE INDEX idx_content_reactions_content_id ON public.content_reactions(content_id);
CREATE INDEX idx_content_reactions_user_id ON public.content_reactions(user_id);
CREATE INDEX idx_content_reactions_type ON public.content_reactions(reaction_type);

-- Enable RLS
ALTER TABLE public.content_reactions ENABLE ROW LEVEL SECURITY;

-- Add trigger for updated_at
CREATE TRIGGER update_content_reactions_updated_at BEFORE UPDATE
  ON public.content_reactions FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- 3. CREATE COMMENT_REPORTS TABLE (for moderation)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.comment_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES public.content_comments(id) ON DELETE CASCADE,
  reported_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved')),
  admin_notes TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_comment_reports_status ON public.comment_reports(status);
CREATE INDEX idx_comment_reports_created_at ON public.comment_reports(created_at DESC);
ALTER TABLE public.comment_reports ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 4. CREATE COMMENT_LIKES TABLE (for liking comments)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES public.content_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,

  UNIQUE(comment_id, user_id)
);

CREATE INDEX idx_comment_likes_comment_id ON public.comment_likes(comment_id);
CREATE INDEX idx_comment_likes_user_id ON public.comment_likes(user_id);
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 5. AGGREGATION VIEWS (for performance)
-- ============================================================================

-- View for comment counts per content
CREATE OR REPLACE VIEW public.content_comment_stats AS
SELECT
  content_id,
  COUNT(*) FILTER (WHERE is_deleted = FALSE) as comment_count,
  COUNT(*) FILTER (WHERE parent_comment_id IS NULL AND is_deleted = FALSE) as thread_count,
  MAX(created_at) FILTER (WHERE is_deleted = FALSE) as last_comment_at
FROM public.content_comments
GROUP BY content_id;

-- View for reaction counts per content
CREATE OR REPLACE VIEW public.content_reaction_stats AS
SELECT
  content_id,
  reaction_type,
  COUNT(*) as count
FROM public.content_reactions
GROUP BY content_id, reaction_type;

-- View for user's reactions on content
CREATE OR REPLACE VIEW public.user_content_reactions AS
SELECT
  content_id,
  user_id,
  reaction_type
FROM public.content_reactions;

-- ============================================================================
-- 6. ROW LEVEL SECURITY POLICIES - COMMENTS
-- ============================================================================

-- Policy: Anyone can read comments on public content
CREATE POLICY "Anyone can read comments on public content"
  ON public.content_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.content
      WHERE content.id = content_comments.content_id
        AND (
          content.visibility = 'public'
          OR content.status = 'published'
        )
    )
    AND content_comments.is_deleted = FALSE
  );

-- Policy: Authenticated users can create comments
CREATE POLICY "Authenticated users can create comments"
  ON public.content_comments FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.content
      WHERE content.id = content_comments.content_id
    )
  );

-- Policy: Users can edit their own comments
CREATE POLICY "Users can edit their own comments"
  ON public.content_comments FOR UPDATE
  USING (
    user_id = auth.uid()
    AND is_deleted = FALSE
  )
  WITH CHECK (
    user_id = auth.uid()
    AND is_deleted = FALSE
  );

-- Policy: Users can soft delete their own comments
CREATE POLICY "Users can delete their own comments"
  ON public.content_comments FOR UPDATE
  USING (
    user_id = auth.uid()
    AND is_deleted = FALSE
  )
  WITH CHECK (
    user_id = auth.uid()
    AND (is_deleted = TRUE OR is_deleted = FALSE)
  );

-- Policy: County admins can moderate comments in their county
CREATE POLICY "County admins can moderate comments"
  ON public.content_comments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.content
      INNER JOIN public.users admin_user ON admin_user.id = auth.uid()
      WHERE content.id = content_comments.content_id
        AND content.county_id = admin_user.county_id
        AND admin_user.role = 'county_admin'
    )
  );

-- Policy: Super admin has full access
CREATE POLICY "Super admin full access on comments"
  ON public.content_comments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
        AND users.role = 'super_admin'
    )
  );

-- ============================================================================
-- 7. ROW LEVEL SECURITY POLICIES - REACTIONS
-- ============================================================================

-- Policy: Anyone can read reaction counts (read public reactions)
CREATE POLICY "Anyone can read reactions"
  ON public.content_reactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.content
      WHERE content.id = content_reactions.content_id
        AND (
          content.visibility = 'public'
          OR content.status = 'published'
        )
    )
  );

-- Policy: Authenticated users can create/update their own reactions
CREATE POLICY "Users can manage their own reactions"
  ON public.content_reactions FOR ALL
  USING (
    auth.role() = 'authenticated'
    AND user_id = auth.uid()
  )
  WITH CHECK (
    auth.role() = 'authenticated'
    AND user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.content
      WHERE content.id = content_reactions.content_id
    )
  );

-- Policy: Super admin full access
CREATE POLICY "Super admin full access on reactions"
  ON public.content_reactions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
        AND users.role = 'super_admin'
    )
  );

-- ============================================================================
-- 8. RLS POLICIES - COMMENT REPORTS
-- ============================================================================

CREATE POLICY "Users can read reports for their content"
  ON public.comment_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.content_comments c
      INNER JOIN public.content ON content.id = c.content_id
      WHERE c.id = comment_reports.comment_id
        AND content.author_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
        AND (users.role = 'county_admin' OR users.role = 'super_admin')
    )
  );

CREATE POLICY "Users can report comments"
  ON public.comment_reports FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND reported_by = auth.uid()
  );

CREATE POLICY "Admins can manage reports"
  ON public.comment_reports FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
        AND (users.role = 'county_admin' OR users.role = 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
        AND (users.role = 'county_admin' OR users.role = 'super_admin')
    )
  );

-- ============================================================================
-- 9. RLS POLICIES - COMMENT LIKES
-- ============================================================================

CREATE POLICY "Anyone can read comment likes"
  ON public.comment_likes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.content_comments c
      INNER JOIN public.content ON content.id = c.content_id
      WHERE c.id = comment_likes.comment_id
        AND (
          content.visibility = 'public'
          OR content.status = 'published'
        )
    )
  );

CREATE POLICY "Users can manage their own comment likes"
  ON public.comment_likes FOR ALL
  USING (
    auth.role() = 'authenticated'
    AND user_id = auth.uid()
  )
  WITH CHECK (
    auth.role() = 'authenticated'
    AND user_id = auth.uid()
  );

-- ============================================================================
-- 10. HELPER FUNCTIONS
-- ============================================================================

-- Function to get comment thread with replies
CREATE OR REPLACE FUNCTION public.get_comment_thread(
  p_parent_id UUID,
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  content_id UUID,
  user_id UUID,
  parent_comment_id UUID,
  body TEXT,
  is_edited BOOLEAN,
  is_deleted BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  user_full_name TEXT,
  user_avatar_url TEXT,
  reply_count INT,
  like_count INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cc.id,
    cc.content_id,
    cc.user_id,
    cc.parent_comment_id,
    cc.body,
    cc.is_edited,
    cc.is_deleted,
    cc.created_at,
    cc.updated_at,
    u.full_name,
    u.avatar_url,
    COUNT(DISTINCT cc2.id) FILTER (WHERE cc2.is_deleted = FALSE)::INT as reply_count,
    COUNT(DISTINCT cl.id)::INT as like_count
  FROM public.content_comments cc
  LEFT JOIN public.users u ON u.id = cc.user_id
  LEFT JOIN public.content_comments cc2 ON cc2.parent_comment_id = cc.id AND cc2.is_deleted = FALSE
  LEFT JOIN public.comment_likes cl ON cl.comment_id = cc.id
  WHERE
    cc.parent_comment_id = p_parent_id
    AND cc.is_deleted = FALSE
  GROUP BY cc.id, u.full_name, u.avatar_url
  ORDER BY cc.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get content stats with comments and reactions
CREATE OR REPLACE FUNCTION public.get_content_engagement_stats(p_content_id UUID)
RETURNS TABLE (
  comment_count INT,
  thread_count INT,
  last_comment_at TIMESTAMP WITH TIME ZONE,
  reaction_likes INT,
  reaction_loves INT,
  reaction_celebrates INT,
  reaction_insightfuls INT,
  reaction_sads INT,
  total_reactions INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(COUNT(*) FILTER (WHERE cc.is_deleted = FALSE), 0)::INT,
    COALESCE(COUNT(*) FILTER (WHERE cc.parent_comment_id IS NULL AND cc.is_deleted = FALSE), 0)::INT,
    MAX(cc.created_at) FILTER (WHERE cc.is_deleted = FALSE),
    COALESCE(COUNT(*) FILTER (WHERE cr.reaction_type = 'like'), 0)::INT,
    COALESCE(COUNT(*) FILTER (WHERE cr.reaction_type = 'love'), 0)::INT,
    COALESCE(COUNT(*) FILTER (WHERE cr.reaction_type = 'celebrate'), 0)::INT,
    COALESCE(COUNT(*) FILTER (WHERE cr.reaction_type = 'insightful'), 0)::INT,
    COALESCE(COUNT(*) FILTER (WHERE cr.reaction_type = 'sad'), 0)::INT,
    COALESCE(COUNT(DISTINCT cr.id), 0)::INT
  FROM public.content_comments cc
  FULL OUTER JOIN public.content_reactions cr ON cr.content_id = cc.content_id
  WHERE cc.content_id = p_content_id OR cr.content_id = p_content_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

-- Migration complete! Comments and Reactions tables created with RLS policies.
-- Next steps:
-- 1. Create frontend components for comment display and input
-- 2. Create helper functions in JavaScript for CRUD operations
-- 3. Implement real-time subscriptions using Supabase Realtime
-- 4. Add notification integration
-- 5. Integrate with dashboards
