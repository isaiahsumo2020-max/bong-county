# Supabase account deletion

## Community feature migrations

The community dashboard also depends on three database migrations. Apply them
in order before enabling the related production features:

1. `migrations/20261024030000_social_discovery.sql` creates follows and the
   restricted profile-discovery RPC.
2. `migrations/20261024031000_direct_messaging.sql` depends on the follow table
   and profile-eligibility function from the first migration.
3. `migrations/20261024032000_content_reactions_security.sql` replaces
   reaction policies and assumes the deployed `public.content_reactions` and
   `public.content` schemas match the application.

These migrations have not been applied to the linked project. In particular,
the direct-messaging RPC is currently absent from the live PostgREST schema
cache; messaging displays a migration-pending state instead of reporting a
successful load. Confirm the live table columns, existing policies, and
constraints, then apply and smoke-test the migrations before enabling these
features for production users.

## Social discovery

The shared dashboards use `public.user_follows` for following contributors and
the `get_discovery_profiles` RPC to return only active, public contributor
profiles. Apply `migrations/20261024030000_social_discovery.sql` before enabling
the people and organization directories, follows, follower counts, or follower
lists in a deployed environment. Until it is applied, those screens display a
migration-pending message rather than using direct frontend profile queries.

The Super Admin user list deletes accounts through the `admin-delete-user` Edge
Function. The browser sends the current access token and the target user's
confirmation email; the function verifies the token and the caller's current
`public.users.role` before calling `auth.admin.deleteUser`. The service-role
key is read only from the Edge Function environment and must never be added to
frontend files.

## Apply and deploy

1. Apply `migrations/20261024012500_admin_user_deletion_retention.sql` to the
   linked Supabase project. It is safe to apply before deploying the function:
   the function checks that the database safeguards are installed and refuses
   deletion otherwise.
2. Deploy the function with `supabase functions deploy admin-delete-user
   --project-ref choagncxtmsewzvxoncx`.
3. Confirm the deployed function has the standard Supabase Edge Function
   environment variables `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and
   `SUPABASE_SERVICE_ROLE_KEY`. Do not put the service-role key in this
   repository or in browser configuration.

## Deletion and retention rules

- A Super Admin cannot delete their own account or any other Super Admin
  through the dashboard.
- Published content, published opportunities and events remain, with author
  references anonymized. Comments remain with anonymous author references.
- Media referenced by published records or retained comments is copied to a
  service-owned path and those references are updated before the original
  user-owned object is removed. Unreferenced user-owned files and all profile
  avatar files are removed.
- Draft/unpublished content, user engagement, user notifications, profile and
  account settings are removed by the existing foreign-key cascades.
- Audit rows and moderation/review references configured with `SET NULL` are
  retained without a user reference. Queued email for the account is removed.
- Versioned Storage objects fail closed with an actionable error instead of
  attempting an incomplete deletion.

The database trigger runs in the same transaction as deletion from
`auth.users`, so a failed Auth deletion does not cascade-delete the profile or
published records. Storage moves happen first through the Storage API; if a
later step fails, the function returns an error and the dashboard keeps the
user visible so an administrator can retry or investigate.

## Live smoke test

Use a disposable email address and verify the account exists in both
**Authentication → Users** and `public.users`. Delete it from the Super Admin
dashboard after the function and migration are deployed. Confirm that the Auth
account and profile disappear, published records/comments remain anonymous,
their referenced media still loads, and the same email can be registered again.
