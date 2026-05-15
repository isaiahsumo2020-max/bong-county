/**
 * PROFILE PAGE PROTECTION & INITIALIZATION
 * 
 * This script protects the profile page from unauthorized access
 * Users must be authenticated to access their profile
 */

(async function() {
  try {
    // Wait for supabaseClient
    let attempts = 0;
    while (!window.supabaseClient && attempts < 10) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }

    if (!window.supabaseClient) {
      window.location.href = '../index-page/index.html?error=client-error';
      return;
    }

    // Initialize auth guard
    if (!window.authGuard) {
      window.authGuard = new AuthGuard(window.supabaseClient);
      await window.authGuard.init();
    }

    // ====== PROTECT PAGE ======
    const protection = await window.authGuard.protectPage({
      requiredAuth: true,  // Must be logged in
      requiredRoles: ['contributor', 'county_admin', 'super_admin'],
      redirectTo: '../auth-page/auth.html?return=../profile-page/profile.html'
    });

    if (!protection.allowed) {
      return;  // Auth guard handles redirect
    }

    // User authenticated - allow page to load
    console.log('Profile page access granted for:', protection.profile?.email);

  } catch (error) {
    console.error('Profile page protection error:', error);
    window.location.href = '../index-page/index.html?error=init-failed';
  }
})();
