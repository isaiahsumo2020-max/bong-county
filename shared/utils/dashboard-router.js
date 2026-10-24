/**
 * DASHBOARD ROUTER - Central Route Handler
 * 
 * Redirects users to their correct dashboard based on role
 * Use this after successful login to route users appropriately
 * 
 * Usage:
 *   const router = new DashboardRouter(supabaseClient);
 *   await router.redirectToDashboard();
 */

class DashboardRouter {
  constructor(supabaseClient) {
    this.supabase = supabaseClient;
  }

  /**
   * Get dashboard URL for a specific role
   */
  getDashboardUrl(role) {
    const routes = {
      'super_admin': '/superadmin/superadmin.html',
      'county_admin': '/county-admin-dashboard/county-admin-dashboard.html',
      'contributor': '/contributor-dashboard/contributor-dashboard.html',
      'visitor': '/auth-page/auth.html'
    };

    return routes[role] || routes['visitor'];
  }

  /**
   * Redirect user to their appropriate dashboard
   */
  async redirectToDashboard(returnUrl = null) {
    try {
      // Get current session
      const { data: { session } } = await this.supabase.auth.getSession();
      
      if (!session) {
        window.location.href = this.getDashboardUrl('visitor');
        return;
      }

      // Get user profile
      const { data: profile, error: profileError } = await this.supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (profileError) throw profileError;

      const userRole = profile?.role || 'visitor';
      const dashboardUrl = this.getDashboardUrl(userRole);

      console.log(`Routing ${userRole} to ${dashboardUrl}`);
      window.location.assign(dashboardUrl);

    } catch (error) {
      console.error('Error redirecting to dashboard:', error);
      window.location.assign(this.getDashboardUrl('visitor'));
    }
  }

  /**
   * Check if user should be redirected to dashboard
   */
  async shouldRedirect() {
    try {
      const { data: { session } } = await this.supabase.auth.getSession();
      return !!session;
    } catch {
      return false;
    }
  }
}

// Make globally available
if (typeof window !== 'undefined') {
  window.DashboardRouter = DashboardRouter;
}
