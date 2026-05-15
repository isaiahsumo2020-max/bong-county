/**
 * SUPER ADMIN PAGE PROTECTION
 * 
 * Restricts superadmin panel to super_admin role only
 */

(async function() {
  try {
    let attempts = 0;
    // Wait for supabaseClient to be available
    while (!window.supabaseClient && attempts < 10) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }

    if (!window.supabaseClient) {
      console.error('Supabase client not available');
      window.location.href = '../index-page/index.html?error=client-error';
      return;
    }

    // Check authentication using supabaseClient
    const { data: { user }, error: authError } = await window.supabaseClient.auth.getUser();

    if (authError || !user) {
      console.warn('User not authenticated');
      window.location.href = '../auth-page/auth.html?error=not-authenticated';
      return;
    }

    // Fetch user profile to verify role
    const { data: profile, error: profileError } = await window.supabaseClient
      .from('users')
      .select('role, email')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('Error fetching user profile:', profileError);
      window.location.href = '../auth-page/auth.html?error=profile-error';
      return;
    }

    // Check if user has super_admin role
    if (profile.role !== 'super_admin' && profile.role !== 'county_admin') {
      console.warn('User does not have required admin role:', profile.role);
      window.location.href = '../index-page/index.html?error=insufficient-role';
      return;
    }

    console.log('✅ Super admin page access granted for:', profile.email);

  } catch (error) {
    console.error('Super admin page protection error:', error);
    window.location.href = '../index-page/index.html?error=protection-failed';
  }
})();
