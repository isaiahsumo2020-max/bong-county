/**
 * DASHBOARD PAGE PROTECTION & INITIALIZATION
 * 
 * This script MUST be loaded first in the dashboard page
 * It protects the page from unauthorized access before rendering any content
 */

(async function() {
  console.log('════════════════════════════════════════════════════════');
  console.log('PAGE PROTECTION: Starting authentication check...');
  console.log('════════════════════════════════════════════════════════');

  // ============================================================================
  // PHASE 1: INITIALIZE AUTH GUARD
  // ============================================================================
  
  try {
    console.log('PHASE 1: Initializing auth guard...');
    
    // Wait for supabaseClient to be available
    let attempts = 0;
    while (!window.supabaseClient && attempts < 10) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }

    if (!window.supabaseClient) {
      console.error('✗ Supabase client not loaded after 1000ms');
      window.location.href = '../index-page/index.html?error=client-error';
      return;
    }

    console.log('✓ Supabase client loaded');

    // Initialize global auth guard
    if (!window.authGuard) {
      console.log('ℹ Creating new AuthGuard instance...');
      window.authGuard = new AuthGuard(window.supabaseClient);
      await window.authGuard.init();
      console.log('✓ AuthGuard initialized');
    } else {
      console.log('ℹ AuthGuard already exists');
    }

  } catch (error) {
    console.error('✗ Failed to initialize auth system:', error);
    window.location.href = '../index-page/index.html?error=init-failed';
    return;
  }

  // ============================================================================
  // PHASE 2: PROTECT PAGE - REQUIRE AUTHENTICATION & CONTRIBUTOR ROLE
  // ============================================================================

  console.log('PHASE 2: Checking page access...');
  
  const protection = await window.authGuard.protectPage({
    requiredAuth: true,  // Must be logged in
    requiredRoles: ['contributor', 'county_admin', 'super_admin'],  // Must be contributor or higher
    redirectTo: '../auth-page/auth.html?return=../dashboard-page/dashboard.html'
  });

  if (!protection.allowed) {
    // Auth guard will handle redirect
    console.warn('⚠ Dashboard access denied - user will be redirected by auth guard');
    return;
  }

  console.log('✓ Access allowed for user:', protection.profile?.email);

  // ============================================================================
  // PHASE 3: USER AUTHENTICATED - HIDE LOADING, SHOW CONTENT
  // ============================================================================

  console.log('PHASE 3: Hiding loading screen...');
  
  // Remove loading screen / show dashboard
  const loadingScreen = document.getElementById('view-loading');
  if (loadingScreen) {
    loadingScreen.style.display = 'none';
    console.log('✓ Loading screen hidden');
  } else {
    console.warn('⚠ Loading screen element not found');
  }

  // Populate user information
  const userProfile = protection.profile;
  if (userProfile) {
    console.log('ℹ Setting user information...');
    // Set user avatar/name
    const userNameElement = document.querySelector('.user-name');
    const userRoleElement = document.querySelector('.user-role');
    const userAvatarElement = document.querySelector('.user-avatar');

    if (userNameElement) userNameElement.textContent = userProfile.full_name || 'Contributor';
    if (userRoleElement) userRoleElement.textContent = userProfile.role || 'contributor';
    if (userAvatarElement) {
      const initials = (userProfile.full_name || 'C')
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
      userAvatarElement.textContent = initials;
    }
    console.log('✓ User info populated:', userProfile.full_name);
  }

  // ============================================================================
  // PHASE 4: SETUP LOGOUT
  // ============================================================================

  console.log('PHASE 4: Setting up logout button...');

  const logoutBtn = document.querySelector('.logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        await window.authGuard.logout();
        window.location.href = '../index-page/index.html?logout=success';
      } catch (error) {
        console.error('Logout error:', error);
        window.location.href = '../index-page/index.html';
      }
    });
    console.log('✓ Logout button configured');
  }

  // ============================================================================
  // PHASE 5: SIGNAL THAT AUTH IS COMPLETE - ALLOW INIT() TO RUN
  // ============================================================================
  
  console.log('PHASE 5: Auth protection complete, signaling dashboard to initialize...');
  window.authProtectionComplete = true;
  console.log('✓ Auth protection complete for user:', userProfile?.email);
  
  // If initDashboard() has already been defined, call it
  if (typeof initDashboard === 'function') {
    console.log('✓ Calling initDashboard() from page-protection.js');
    try {
      await initDashboard();
      console.log('✓ Dashboard initialized successfully from page-protection');
    } catch (error) {
      console.error('✗ Error calling initDashboard from page-protection:', error);
    }
  } else {
    console.log('ℹ initDashboard() not yet defined, will be called by startInit()');
  }
  
  console.log('════════════════════════════════════════════════════════');
  console.log('PAGE PROTECTION: Complete');
  console.log('════════════════════════════════════════════════════════');

})();
