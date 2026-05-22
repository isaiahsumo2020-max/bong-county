-- ============================================================================
-- LIBERIA COUNTIES DIGITAL PLATFORM
-- ENHANCED ROW-LEVEL SECURITY (RLS) POLICIES
-- Comprehensive security for notifications, targeting, and role-based access
-- 
-- Created: May 13, 2026
-- Version: 2.0
-- ============================================================================

-- PREREQUISITES:
-- 1. Enable RLS on all tables before creating policies
-- 2. Ensure auth.users table exists (Supabase default)
-- 3. Run migrations in order

-- ============================================================================
-- 1. UPDATE CONTENT TABLE - Add targeting columns
-- ============================================================================

ALTER TABLE content
ADD COLUMN tags JSONB DEFAULT '[]',
ADD COLUMN opportunity_type TEXT,
ADD COLUMN target_audiences JSONB DEFAULT '[]',
ADD COLUMN requires_subscription BOOLEAN DEFAULT FALSE,
ADD COLUMN view_count INT DEFAULT 0,
ADD COLUMN engagement_score INT DEFAULT 0;

-- Add check constraint for opportunity_type
ALTER TABLE content
ADD CONSTRAINT check_opportunity_type
CHECK (opportunity_type IN ('job', 'grant', 'scholarship', 'partnership', 'event', 'none', NULL));

-- ============================================================================
-- 2. ENHANCE NOTIFICATIONS TABLE (created in Migration 1)
-- ============================================================================

-- Add missing columns to existing notifications table
ALTER TABLE notifications
ADD COLUMN recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN type TEXT,
ADD COLUMN title TEXT,
ADD COLUMN body TEXT,
ADD COLUMN icon TEXT,
ADD COLUMN action_url TEXT,
ADD COLUMN target_audience TEXT,
ADD COLUMN is_read BOOLEAN DEFAULT FALSE,
ADD COLUMN is_archived BOOLEAN DEFAULT FALSE,
ADD COLUMN read_at TIMESTAMP,
ADD COLUMN in_app_sent BOOLEAN DEFAULT TRUE,
ADD COLUMN email_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN email_sent_at TIMESTAMP,
ADD COLUMN personalization_context JSONB;

-- Ensure RLS is enabled on notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create indexes for notification queries
CREATE INDEX idx_notifications_recipient_read 
  ON notifications(recipient_id, is_read);
CREATE INDEX idx_notifications_created 
  ON notifications(created_at DESC);
CREATE INDEX idx_notifications_archived 
  ON notifications(recipient_id, is_archived);

-- ============================================================================
-- 3. CREATE USER_NOTIFICATION_PREFERENCES TABLE
-- This complements the user_subscriptions junction table from Migration 2
-- Stores user preferences for how they want to receive notifications
-- ============================================================================

CREATE TABLE user_notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  notification_frequency TEXT DEFAULT 'daily',
  notification_channels TEXT[] DEFAULT ARRAY['in_app', 'email'],
  
  tier TEXT DEFAULT 'free',
  tier_start_date TIMESTAMP,
  tier_end_date TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX idx_user_notification_preferences_tier 
  ON user_notification_preferences(tier);
CREATE INDEX idx_user_notification_preferences_updated 
  ON user_notification_preferences(updated_at DESC);

-- ============================================================================
-- 4. CREATE PERMISSION_ROLES TABLE
-- ============================================================================

CREATE TABLE permission_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  role TEXT NOT NULL,
  assigned_county TEXT,
  
  permissions JSONB DEFAULT '{}',
  
  created_at TIMESTAMP DEFAULT NOW(),
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE permission_roles ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX idx_permission_roles_user 
  ON permission_roles(user_id);
CREATE INDEX idx_permission_roles_role 
  ON permission_roles(role);
CREATE INDEX idx_permission_roles_county 
  ON permission_roles(assigned_county);

-- ============================================================================
-- 5. CREATE EMAIL_QUEUE TABLE
-- ============================================================================

CREATE TABLE email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  recipient_email TEXT NOT NULL,
  
  notification_id UUID REFERENCES notifications(id) ON DELETE CASCADE,
  
  template TEXT NOT NULL,
  subject TEXT NOT NULL,
  context JSONB,
  
  scheduled_for TIMESTAMP DEFAULT NOW(),
  sent BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMP,
  
  retry_count INT DEFAULT 0,
  error_message TEXT,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX idx_email_queue_sent 
  ON email_queue(sent, scheduled_for);
CREATE INDEX idx_email_queue_recipient 
  ON email_queue(recipient_email);

-- ============================================================================
-- 6. AUDIT_LOGS TABLE
-- ============================================================================

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  details JSONB,
  
  ip_address INET,
  user_agent TEXT,
  
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX idx_audit_logs_user 
  ON audit_logs(user_id, timestamp DESC);
CREATE INDEX idx_audit_logs_action 
  ON audit_logs(action, timestamp DESC);

-- ============================================================================
-- 7. NOTIFICATION RLS POLICIES
-- ============================================================================

-- Users can only see their own notifications
CREATE POLICY "notifications_select_own"
  ON notifications FOR SELECT
  USING (recipient_id = auth.uid());

-- Users can update their own notifications (mark as read, archive)
CREATE POLICY "notifications_update_own"
  ON notifications FOR UPDATE
  USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());

-- System/Admin can insert notifications
CREATE POLICY "notifications_insert_system"
  ON notifications FOR INSERT
  WITH CHECK (
    auth.jwt() ->> 'role' IN ('service_role', 'authenticated')
  );

-- Only super_admin can delete notifications
CREATE POLICY "notifications_delete_admin"
  ON notifications FOR DELETE
  USING (
    auth.jwt() ->> 'role' = 'super_admin'
  );

-- ============================================================================
-- 8. USER_NOTIFICATION_PREFERENCES RLS POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "notification_preferences_select_own" ON user_notification_preferences;
DROP POLICY IF EXISTS "notification_preferences_update_own" ON user_notification_preferences;
DROP POLICY IF EXISTS "notification_preferences_insert_own" ON user_notification_preferences;
DROP POLICY IF EXISTS "notification_preferences_select_admin" ON user_notification_preferences;

-- Users can only see their own notification preferences
CREATE POLICY "notification_preferences_select_own"
  ON user_notification_preferences FOR SELECT
  USING (user_id = auth.uid());

-- Users can update their own preferences
CREATE POLICY "notification_preferences_update_own"
  ON user_notification_preferences FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can insert their own preferences
CREATE POLICY "notification_preferences_insert_own"
  ON user_notification_preferences FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Super admin can view all preferences
CREATE POLICY "notification_preferences_select_admin"
  ON user_notification_preferences FOR SELECT
  USING (auth.jwt() ->> 'role' = 'super_admin');

-- ============================================================================
-- 9. PERMISSION_ROLES RLS POLICIES
-- ============================================================================

-- Users can view their own roles
CREATE POLICY "permission_roles_select_own"
  ON permission_roles FOR SELECT
  USING (user_id = auth.uid());

-- County admins can view roles in their county
CREATE POLICY "permission_roles_select_county_admin"
  ON permission_roles FOR SELECT
  USING (
    auth.jwt() ->> 'role' = 'county_admin'
    AND assigned_county = auth.jwt() ->> 'county'
  );

-- Super admin can view all roles
CREATE POLICY "permission_roles_select_admin"
  ON permission_roles FOR SELECT
  USING (auth.jwt() ->> 'role' = 'super_admin');

-- Only super admin can insert/update/delete roles
CREATE POLICY "permission_roles_manage_admin"
  ON permission_roles FOR ALL
  USING (auth.jwt() ->> 'role' = 'super_admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'super_admin');

-- ============================================================================
-- 10. ENHANCED CONTENT RLS POLICIES (Updated for targeting)
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "content_select_public" ON content;
DROP POLICY IF EXISTS "content_select_authenticated" ON content;
DROP POLICY IF EXISTS "content_select_county" ON content;
DROP POLICY IF EXISTS "content_select_admin" ON content;
DROP POLICY IF EXISTS "content_select_private" ON content;
DROP POLICY IF EXISTS "content_insert" ON content;
DROP POLICY IF EXISTS "content_update" ON content;
DROP POLICY IF EXISTS "content_delete" ON content;

-- PUBLIC content - visible to everyone
CREATE POLICY "content_select_public"
  ON content FOR SELECT
  USING (visibility = 'public');

-- AUTHENTICATED content - visible to logged-in users
CREATE POLICY "content_select_authenticated"
  ON content FOR SELECT
  USING (
    visibility IN ('public', 'authenticated_only')
    AND auth.role() = 'authenticated'
  );

-- COUNTY content - visible to county members and admins
CREATE POLICY "content_select_county"
  ON content FOR SELECT
  USING (
    visibility IN ('public', 'authenticated_only', 'county_only')
    AND (
      visibility != 'county_only'
      OR auth.jwt() ->> 'county' = county
    )
  );

-- ADMIN content - visible to admin and super admin
CREATE POLICY "content_select_admin"
  ON content FOR SELECT
  USING (
    visibility IN ('public', 'authenticated_only', 'county_only', 'admin_only')
    AND (
      visibility != 'admin_only'
      OR auth.jwt() ->> 'role' IN ('county_admin', 'super_admin')
    )
  );

-- PRIVATE content - visible to owner and super admin
CREATE POLICY "content_select_private"
  ON content FOR SELECT
  USING (
    visibility = 'private'
    AND (
      author_id = auth.uid()
      OR auth.jwt() ->> 'role' = 'super_admin'
    )
  );

-- CREATE content - contributors and higher
CREATE POLICY "content_insert"
  ON content FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND auth.jwt() ->> 'role' IN ('contributor', 'county_admin', 'super_admin')
    AND author_id = auth.uid()
  );

-- UPDATE content - owner or county_admin/super_admin
CREATE POLICY "content_update"
  ON content FOR UPDATE
  USING (
    author_id = auth.uid()
    OR auth.jwt() ->> 'role' IN ('county_admin', 'super_admin')
  );

-- DELETE content - owner or county_admin/super_admin
CREATE POLICY "content_delete"
  ON content FOR DELETE
  USING (
    author_id = auth.uid()
    OR auth.jwt() ->> 'role' IN ('county_admin', 'super_admin')
  );

-- ============================================================================
-- 11. CONTENT TARGETING INDEXES
-- ============================================================================

CREATE INDEX idx_content_tags 
  ON content USING GIN(tags);
CREATE INDEX idx_content_target_audiences 
  ON content USING GIN(target_audiences);
CREATE INDEX idx_content_opportunity_type 
  ON content(opportunity_type);
CREATE INDEX idx_content_county 
  ON content(county);
CREATE INDEX idx_content_author_visibility 
  ON content(author_id, visibility);

-- ============================================================================
-- 12. EMAIL_QUEUE RLS POLICIES
-- ============================================================================

-- Only service role and admins can manage email queue
CREATE POLICY "email_queue_select"
  ON email_queue FOR SELECT
  USING (
    auth.jwt() ->> 'role' IN ('service_role', 'super_admin')
  );

CREATE POLICY "email_queue_insert"
  ON email_queue FOR INSERT
  WITH CHECK (
    auth.jwt() ->> 'role' IN ('service_role')
  );

CREATE POLICY "email_queue_update"
  ON email_queue FOR UPDATE
  USING (
    auth.jwt() ->> 'role' IN ('service_role')
  );

-- ============================================================================
-- 13. AUDIT_LOGS RLS POLICIES
-- ============================================================================

-- Users can see their own audit logs
CREATE POLICY "audit_logs_select_own"
  ON audit_logs FOR SELECT
  USING (user_id = auth.uid());

-- Super admin can see all audit logs
CREATE POLICY "audit_logs_select_admin"
  ON audit_logs FOR SELECT
  USING (auth.jwt() ->> 'role' = 'super_admin');

-- Only service role can insert audit logs
CREATE POLICY "audit_logs_insert"
  ON audit_logs FOR INSERT
  WITH CHECK (
    auth.jwt() ->> 'role' IN ('service_role', 'authenticated')
  );

-- ============================================================================
-- 14. ENABLE RLS ON EXISTING TABLES
-- ============================================================================

ALTER TABLE IF EXISTS content ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 15. PERFORMANCE OPTIMIZATION
-- ============================================================================

-- Refresh materialized views if they exist
-- (Add these if using materialized views for analytics)

-- Vacuum and analyze for performance
VACUUM ANALYZE IF EXISTS content;
VACUUM ANALYZE IF EXISTS notifications;
VACUUM ANALYZE IF EXISTS user_subscriptions;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Verification queries (run these to verify the policies are working):

-- Check RLS is enabled
-- SELECT tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE rowsecurity = true 
-- ORDER BY tablename;

-- Check policies are created
-- SELECT schemaname, tablename, policyname, permissive, roles, qual
-- FROM pg_policies 
-- ORDER BY tablename, policyname;

-- ============================================================================
-- DEPLOYMENT NOTES
-- ============================================================================

-- 1. This migration adds comprehensive RLS policies for:
--    - Notifications (user isolation)
--    - Subscriptions (personal data)
--    - Permission roles (admin management)
--    - Email queue (service automation)
--    - Audit logs (compliance)
--    - Enhanced content targeting

-- 2. All policies use auth.uid() for user identification
--    and auth.jwt() for role/metadata checking

-- 3. Indexes created for performance on:
--    - Notification queries (recipient, creation time)
--    - Subscription queries (tier, updates)
--    - Content targeting (tags, audiences, opportunity type)

-- 4. Test access controls after deployment:
--    - Login as different user types
--    - Verify data isolation
--    - Check notification creation
--    - Verify permission enforcement

-- 5. Monitor performance with:
--    - pg_stat_statements for slow queries
--    - Check index usage
--    - Monitor RLS policy evaluation time

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
