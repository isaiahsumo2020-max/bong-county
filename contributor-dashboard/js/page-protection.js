/**
 * CONTRIBUTOR DASHBOARD - PAGE PROTECTION
 * 
 * Ensures only contributors can access this dashboard
 * Redirects other users to their appropriate dashboard
 */

(async function() {
  console.log('════════════════════════════════════════════════════════');
  console.log('CONTRIBUTOR DASHBOARD: Starting authentication check...');
  console.log('════════════════════════════════════════════════════════');

  try {
    console.log('PHASE 1: Initializing auth system...');
    
    // Wait for supabaseClient
    let attempts = 0;
    while (!window.supabaseClient && attempts < 10) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }

    if (!window.supabaseClient) {
      console.error('✗ Supabase client not loaded');
      window.location.href = '../index-page/index.html?error=client-error';
      return;
    }

    // Initialize auth guard
    if (!window.authGuard) {
      window.authGuard = new AuthGuard(window.supabaseClient);
      await window.authGuard.init();
    }

    // Initialize auth router
    if (!window.authRouter) {
      window.authRouter = new AuthRouter(window.supabaseClient, window.authGuard);
    }

    console.log('✓ Auth system initialized');

    // PHASE 2: Protect page
    console.log('PHASE 2: Checking access permissions...');
    
    const protection = await window.authGuard.protectPage({
      requiredAuth: true,
      requiredRoles: 'contributor',
      redirectTo: '../auth-page/auth.html'
    });

    if (!protection.allowed) {
      console.warn('⚠ Access denied - redirecting to appropriate dashboard');
      
      // Redirect to correct dashboard based on role
      const userRole = window.authGuard.userProfile?.role || 'visitor';
      if (userRole === 'county_admin') {
        window.location.href = '../county-admin-dashboard/index.html';
      } else if (userRole === 'super_admin') {
        window.location.href = '../superadmin/superadmin.html';
      } else {
        window.location.href = '../auth-page/auth.html';
      }
      return;
    }

    console.log('✓ Access allowed for contributor:', protection.profile?.email);

    // PHASE 3: Hide loading, apply theme
    console.log('PHASE 3: Setting up dashboard...');
    
    const loadingScreen = document.getElementById('view-loading');
    if (loadingScreen) loadingScreen.style.display = 'none';

    const dashboardRoot = document.getElementById('dashboard-root');
    if (dashboardRoot) dashboardRoot.style.display = 'flex';

    // Apply theme
    if (window.ThemeManager) {
      window.ThemeManager.applyTheme();
    }

    // Apply county branding if available
    if (window.CountyBranding && protection.profile?.county) {
      CountyBranding.applyTheme(protection.profile.county);
    }

    console.log('✓ Contributor dashboard ready');
    window.contributorDashboardReady = true;

  } catch (error) {
    console.error('✗ Dashboard initialization error:', error);
    window.location.href = '../auth-page/auth.html?error=init-failed';
  }
})();
