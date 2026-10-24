/**
 * AUTH ROUTER - Role-Based Dashboard Routing
 * 
 * Routes users to their appropriate dashboard based on their role:
 * - super_admin → superadmin dashboard
 * - county_admin → county admin dashboard
 * - contributor → contributor dashboard
 * - visitor → login page
 * 
 * Usage:
 *   await AuthRouter.redirectToDashboard();
 */

class AuthRouter {
  constructor(supabaseClient, authGuard) {
    this.supabase = supabaseClient;
    this.authGuard = authGuard;
  }

  /**
   * Get the correct dashboard URL based on user role
   * @param {string} userRole - User's role
   * @returns {string} Dashboard URL or login page
   */
  getDashboardUrl(userRole) {
    const dashboardMap = {
      super_admin: '/superadmin/superadmin.html',
      county_admin: '/county-admin-dashboard/county-admin-dashboard.html',
      contributor: '/contributor-dashboard/contributor-dashboard.html',
      visitor: '/auth-page/auth.html'
    };

    return dashboardMap[userRole] || dashboardMap.visitor;
  }

  /**
   * Redirect user to their appropriate dashboard
   * @param {object} returnUrl - Optional URL to return to after
   */
  async redirectToDashboard(returnUrl = null) {
    try {
      await this.authGuard.init();
      
      const userRole = this.authGuard.userProfile?.role || 'visitor';
      const dashboardUrl = this.getDashboardUrl(userRole);

      console.log(`✓ Redirecting ${userRole} to ${dashboardUrl}`);
      window.location.assign(dashboardUrl);
    } catch (error) {
      console.error('✗ Error redirecting to dashboard:', error);
      window.location.assign('/auth-page/auth.html');
    }
  }

  /**
   * Check if user is on the correct dashboard for their role
   * @param {string} expectedRole - Role that should access this dashboard
   * @returns {boolean} True if user has correct role for this dashboard
   */
  async validateDashboardAccess(expectedRole) {
    try {
      const hasAccess = await this.authGuard.hasRole(expectedRole);
      
      if (!hasAccess) {
        console.warn(`✗ User does not have access to ${expectedRole} dashboard`);
        // Redirect to correct dashboard
        await this.redirectToDashboard();
      }

      return hasAccess;
    } catch (error) {
      console.error('✗ Error validating dashboard access:', error);
      return false;
    }
  }

  /**
   * Get dashboard metadata for current user
   * @returns {object} Dashboard config with role, permissions, etc.
   */
  async getDashboardMetadata() {
    try {
      await this.authGuard.init();

      return {
        role: this.authGuard.userProfile?.role || 'visitor',
        email: this.authGuard.currentUser?.email,
        name: this.authGuard.userProfile?.full_name || 'User',
        county: this.authGuard.userProfile?.county,
        permissions: this.authGuard.userProfile?.permissions || [],
        id: this.authGuard.currentUser?.id
      };
    } catch (error) {
      console.error('✗ Error getting dashboard metadata:', error);
      return null;
    }
  }
}

// Make AuthRouter globally available
if (typeof window !== 'undefined') {
  window.AuthRouter = AuthRouter;
}
