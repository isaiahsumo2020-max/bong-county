-- ============================================================================
--  JWT CUSTOM CLAIMS SETUP
--  Required for RLS policies to work with user roles
--  This adds a custom 'role' claim to JWT tokens
-- ============================================================================

-- 1. Create a function to get user role from the users table
CREATE OR REPLACE FUNCTION public.get_jwt_claims()
RETURNS jsonb AS $$
DECLARE
  v_user_id uuid;
  v_role user_role;
BEGIN
  -- Get the current user's ID from the auth context
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN '{"role": "anon"}'::jsonb;
  END IF;

  -- Fetch the user's role from the users table
  SELECT role INTO v_role
  FROM public.users
  WHERE id = v_user_id
  LIMIT 1;

  -- Return the JWT claims with the role
  RETURN jsonb_build_object(
    'role', COALESCE(v_role::text, 'contributor')
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 2. Update Supabase JWT configuration via trigger
-- This trigger will be called when a user is created/updated in auth.users
-- and will ensure the custom claims are available in JWT tokens

CREATE OR REPLACE FUNCTION public.sync_jwt_claims()
RETURNS TRIGGER AS $$
BEGIN
  -- When a user signs in or their profile updates, refresh their claims
  -- Supabase automatically includes custom claims if set in auth.users.user_metadata
  
  -- Update auth.users metadata with role information
  UPDATE auth.users
  SET raw_user_meta_data = 
    COALESCE(raw_user_meta_data, '{}'::jsonb) || 
    jsonb_build_object('role', (
      SELECT role::text FROM public.users WHERE id = NEW.id LIMIT 1
    ))
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create trigger on users table to sync JWT claims when role changes
DROP TRIGGER IF EXISTS trigger_sync_jwt_claims ON public.users;
CREATE TRIGGER trigger_sync_jwt_claims
AFTER INSERT OR UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.sync_jwt_claims();

-- 4. Update existing users to have their role in JWT metadata
-- Run this once to populate existing users
UPDATE auth.users
SET raw_user_meta_data = 
  COALESCE(raw_user_meta_data, '{}'::jsonb) || 
  jsonb_build_object('role', (
    SELECT role::text FROM public.users WHERE id = auth.users.id LIMIT 1
  ))
WHERE id IN (SELECT id FROM public.users);

-- ============================================================================
--  VERIFY RLS POLICIES CAN ACCESS JWT ROLE
-- ============================================================================

-- Test query (run as authenticated user):
-- SELECT auth.jwt() ->> 'role' as user_role;
-- Should return one of: 'contributor', 'county_admin', 'super_admin'

GRANT EXECUTE ON FUNCTION public.get_jwt_claims() TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_jwt_claims() TO authenticated;
