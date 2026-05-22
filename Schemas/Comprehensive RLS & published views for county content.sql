-- ============================================================
-- SAFE POLICY CREATION SCRIPT
-- Prevents "policy already exists" errors

-- CONTENT POLICIES

drop policy if exists "Contributors can edit own draft content" on content;
create policy "Contributors can edit own draft content"
on content
for update
using (
  author_id = auth.uid()
  and status = 'draft'
)
with check (
  author_id = auth.uid()
  and status in ('draft', 'pending_review')
);

drop policy if exists "County admins can view all county content" on content;
create policy "County admins can view all county content"
on content
for select
using (
  get_my_role() = 'county_admin'
  and county_id = get_my_county_id()
);

drop policy if exists "County admins can update county content" on content;
create policy "County admins can update county content"
on content
for update
using (
  get_my_role() = 'county_admin'
  and county_id = get_my_county_id()
);

drop policy if exists "Super admin full content access" on content;
create policy "Super admin full content access"
on content
for all
using (
  get_my_role() = 'super_admin'
);

-- ============================================================
-- LEADERS POLICIES
-- ============================================================

drop policy if exists "Public can view published leaders" on leaders;
create policy "Public can view published leaders"
on leaders
for select
using (
  is_published = true
);

drop policy if exists "County admins manage their county leaders" on leaders;
create policy "County admins manage their county leaders"
on leaders
for all
using (
  get_my_role() = 'county_admin'
  and county_id = get_my_county_id()
)
with check (
  get_my_role() = 'county_admin'
  and county_id = get_my_county_id()
);

drop policy if exists "Super admin full leaders access" on leaders;
create policy "Super admin full leaders access"
on leaders
for all
using (
  get_my_role() = 'super_admin'
);

-- ============================================================
-- OPPORTUNITIES POLICIES
-- ============================================================

drop policy if exists "Public can view published opportunities" on opportunities;
create policy "Public can view published opportunities"
on opportunities
for select
using (
  is_published = true
);

drop policy if exists "Contributors can submit opportunities" on opportunities;
create policy "Contributors can submit opportunities"
on opportunities
for insert
with check (
  county_id = get_my_county_id()
  and author_id = auth.uid()
);

drop policy if exists "County admins manage opportunities" on opportunities;
create policy "County admins manage opportunities"
on opportunities
for all
using (
  get_my_role() = 'county_admin'
  and county_id = get_my_county_id()
);

drop policy if exists "Super admin full opportunities access" on opportunities;
create policy "Super admin full opportunities access"
on opportunities
for all
using (
  get_my_role() = 'super_admin'
);

-- ============================================================
-- EVENTS POLICIES
-- ============================================================

drop policy if exists "Public can view published events" on events;
create policy "Public can view published events"
on events
for select
using (
  is_published = true
);

drop policy if exists "Contributors can submit events" on events;
create policy "Contributors can submit events"
on events
for insert
with check (
  county_id = get_my_county_id()
  and author_id = auth.uid()
);

drop policy if exists "County admins manage events" on events;
create policy "County admins manage events"
on events
for all
using (
  get_my_role() = 'county_admin'
  and county_id = get_my_county_id()
);

drop policy if exists "Super admin full events access" on events;
create policy "Super admin full events access"
on events
for all
using (
  get_my_role() = 'super_admin'
);

-- ============================================================
-- MEDIA POLICIES
-- ============================================================

drop policy if exists "Public can view media" on media;
create policy "Public can view media"
on media
for select
using (true);

drop policy if exists "Users can upload media to their county" on media;
create policy "Users can upload media to their county"
on media
for insert
with check (
  county_id = get_my_county_id()
  and uploader_id = auth.uid()
);

drop policy if exists "Users can delete own media" on media;
create policy "Users can delete own media"
on media
for delete
using (
  uploader_id = auth.uid()
);

drop policy if exists "Super admin full media access" on media;
create policy "Super admin full media access"
on media
for all
using (
  get_my_role() = 'super_admin'
);

-- ============================================================
-- NOTIFICATIONS POLICIES
-- ============================================================

drop policy if exists "Users see own notifications" on notifications;
create policy "Users see own notifications"
on notifications
for select
using (
  user_id = auth.uid()
);

drop policy if exists "Users can update own notifications" on notifications;
create policy "Users can update own notifications"
on notifications
for update
using (
  user_id = auth.uid()
);

drop policy if exists "Super admin sees all notifications" on notifications;
create policy "Super admin sees all notifications"
on notifications
for all
using (
  get_my_role() = 'super_admin'
);

-- ============================================================
-- ANALYTICS POLICIES
-- ============================================================

drop policy if exists "County admins view own analytics" on analytics;
create policy "County admins view own analytics"
on analytics
for select
using (
  get_my_role() = 'county_admin'
  and county_id = get_my_county_id()
);

drop policy if exists "Super admin views all analytics" on analytics;
create policy "Super admin views all analytics"
on analytics
for all
using (
  get_my_role() = 'super_admin'
);

-- ============================================================
-- DISTRICTS POLICIES
-- ============================================================

drop policy if exists "Public can view districts" on districts;
create policy "Public can view districts"
on districts
for select
using (true);

drop policy if exists "County admins manage their districts" on districts;
create policy "County admins manage their districts"
on districts
for all
using (
  get_my_role() = 'county_admin'
  and county_id = get_my_county_id()
);

drop policy if exists "Super admin full districts access" on districts;
create policy "Super admin full districts access"
on districts
for all
using (
  get_my_role() = 'super_admin'
);