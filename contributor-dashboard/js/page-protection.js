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
      const fallback = '../index.html?error=client-error';
      if (window.location.pathname + window.location.search !== new URL(fallback, window.location.href).pathname + new URL(fallback, window.location.href).search) {
        try {
          const REDIRECT_KEY = '__redirect_in_progress_v1';
          const last = Number(sessionStorage.getItem(REDIRECT_KEY) || 0);
          if (!last || (Date.now() - last) > 5000) {
            sessionStorage.setItem(REDIRECT_KEY, String(Date.now()));
            window.location.replace(fallback);
          } else {
            console.log('Safe redirect suppressed (client not loaded)');
          }
        } catch (e) {
          window.location.replace(fallback);
        }
      }
      return;
    }

    // Initialize auth guard
    if (!window.authGuard) {
      window.authGuard = new AuthGuard(window.supabaseClient);
      await window.authGuard.init();
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
      let target = '../auth-page/auth.html';
      if (userRole === 'county_admin') target = '../county-admin-dashboard/county-admin-dashboard.html';
      else if (userRole === 'super_admin') target = '../superadmin/superadmin.html';

      if (window.location.pathname + window.location.search !== new URL(target, window.location.href).pathname + new URL(target, window.location.href).search) {
        // Prefer AuthGuard's redirect helper when available (it has its own guard)
        if (window.authGuard && typeof window.authGuard.redirect === 'function') {
          window.authGuard.redirect(target);
        } else {
          try {
            const REDIRECT_KEY = '__redirect_in_progress_v1';
            const last = Number(sessionStorage.getItem(REDIRECT_KEY) || 0);
            if (!last || (Date.now() - last) > 5000) {
              sessionStorage.setItem(REDIRECT_KEY, String(Date.now()));
              window.location.replace(target);
            } else {
              console.log('Safe redirect suppressed (access denied)');
            }
          } catch (e) {
            window.location.replace(target);
          }
        }
      } else {
        console.log('Not redirecting — already on', target);
      }
      return;
    }

    console.log('✓ Access allowed for contributor:', protection.profile?.email);

    // PHASE 3: Hide loading, apply theme
    console.log('PHASE 3: Setting up dashboard...');
    
    const authLoading = document.getElementById('auth-loading');
    if (authLoading) authLoading.style.display = 'none';
    const loadingScreen = document.getElementById('view-loading');
    if (loadingScreen) loadingScreen.style.display = 'none';

    const dashboardRoot = document.getElementById('dashboard-root');
    if (dashboardRoot) {
      Array.from(dashboardRoot.children)
        .filter(child => child.tagName === 'SECTION')
        .forEach(section => section.remove());
      dashboardRoot.style.display = 'flex';
    }

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
    const fallback = '../auth-page/auth.html?error=init-failed';
    if (window.location.pathname + window.location.search !== new URL(fallback, window.location.href).pathname + new URL(fallback, window.location.href).search) {
      try {
        const REDIRECT_KEY = '__redirect_in_progress_v1';
        const last = Number(sessionStorage.getItem(REDIRECT_KEY) || 0);
        if (!last || (Date.now() - last) > 5000) {
          sessionStorage.setItem(REDIRECT_KEY, String(Date.now()));
          window.location.replace(fallback);
        } else {
          console.log('Safe redirect suppressed (init failed)');
        }
      } catch (e) {
        window.location.replace(fallback);
      }
    }
  }
})();
