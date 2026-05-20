/**
 * CONTRIBUTE PAGE PROTECTION
 * 
 * Allows authenticated contributors to create and submit content
 */

(async function() {
  try {
    let attempts = 0;
    while (!window.supabaseClient && attempts < 10) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }

    if (!window.supabaseClient) {
      window.location.href = '../../index.html?error=client-error';
      return;
    }

    if (!window.authGuard) {
      window.authGuard = new AuthGuard(window.supabaseClient);
      await window.authGuard.init();
    }

    const protection = await window.authGuard.protectPage({
      requiredAuth: true,
      requiredRoles: ['contributor', 'county_admin', 'super_admin'],
      redirectTo: '../../auth-page/auth.html?return=../../../contribute-page/index.html'
    });

    if (!protection.allowed) {
      return;
    }

    console.log('Contribute page access granted for:', protection.profile?.email);

  } catch (error) {
    console.error('Contribute page protection error:', error);
    window.location.href = '../../index.html?error=init-failed';
  }
})();
