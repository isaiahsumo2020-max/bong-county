/**
 * AUTH GUARD SYSTEM - Comprehensive Route Protection
 * 
 * Provides reusable authentication and authorization checks
 * Enforces content visibility levels and role-based access control
 * 
 * Usage:
 * 1. Check authentication: await authGuard.checkAuth()
 * 2. Check role: await authGuard.checkRole(['contributor', 'county_admin'])
 * 3. Check visibility: await authGuard.checkContentVisibility(content)
 * 4. Protect page: await authGuard.protectPage({ requiredRole: 'contributor' })
 */

class AuthGuard {
  constructor(supabaseClient) {
    this.supabase = supabaseClient;
    this.currentUser = null;
    this.userProfile = null;
    this.initialized = false;
  }

  /**
   * Initialize the auth guard by fetching current user and profile
   */
  async init() {
    if (this.initialized) return true;
    
    try {
      // Get current authenticated user
      const { data: { user }, error: authError } = await this.supabase.auth.getUser();
      
      if (authError || !user) {
        console.log('No authenticated user found');
        this.currentUser = null;
        this.userProfile = null;
        this.initialized = true;
        return false;
      }

      this.currentUser = user;

      // Fetch user profile for role and permissions
      const { data: profile, error: profileError } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!profileError && profile) {
        this.userProfile = profile;
      }

      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Auth guard initialization error:', error);
      this.initialized = true;
      return false;
    }
  }

  /**
   * Check if user is authenticated
   * @returns {boolean} True if user is logged in
   */
  async isAuthenticated() {
    await this.init();
    return !!this.currentUser;
  }

  /**
   * Get current user
   * @returns {object|null} Current user object or null
   */
  async getCurrentUser() {
    await this.init();
    return this.currentUser;
  }

  /**
   * Get current user profile with role and metadata
   * @returns {object|null} User profile or null
   */
  async getUserProfile() {
    await this.init();
    return this.userProfile;
  }

  /**
   * Check if user has required role(s)
   * @param {string|string[]} requiredRoles - Single role or array of roles
   * @returns {boolean} True if user has at least one required role
   */
  async hasRole(requiredRoles) {
    await this.init();
    
    if (!this.userProfile) return false;

    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    const userRole = this.userProfile.role || 'visitor';
    
    return roles.includes(userRole);
  }

  /**
   * Check if user has specific permission
   * @param {string} permission - Permission to check
   * @returns {boolean} True if user has permission
   */
  async hasPermission(permission) {
    await this.init();
    
    if (!this.userProfile) return false;

    // Super admins have all permissions
    if (this.userProfile.role === 'super_admin') return true;

    // Check permissions array if it exists
    const permissions = this.userProfile.permissions || [];
    return permissions.includes(permission);
  }

  /**
   * Check if content is visible to current user based on visibility level
   * @param {string} visibility - Visibility level: 'public', 'authenticated_only', 'county_only', 'admin_only', 'private'
   * @param {string} authorId - Content author's user ID (for 'private' visibility)
   * @param {string} county - County associated with content (for 'county_only')
   * @returns {boolean} True if user can see content
   */
  async canViewContent(visibility, authorId = null, county = null) {
    await this.init();

    switch (visibility) {
      case 'public':
        return true;

      case 'authenticated_only':
        return this.currentUser !== null;

      case 'county_only':
        if (!this.currentUser) return false;
        // User can view if they're from the same county or are admin
        if (this.userProfile?.county === county) return true;
        if (this.userProfile?.role === 'super_admin' || this.userProfile?.role === 'county_admin') return true;
        return false;

      case 'admin_only':
        if (!this.currentUser) return false;
        return this.userProfile?.role === 'super_admin' || this.userProfile?.role === 'county_admin';

      case 'private':
        if (!this.currentUser) return false;
        return this.currentUser.id === authorId || this.userProfile?.role === 'super_admin';

      default:
        return false;
    }
  }

  /**
   * MAIN FUNCTION: Protect a page with authentication and authorization
   * Redirects unauthorized users immediately
   * 
   * @param {object} options - Protection options
   *   - requiredAuth: boolean (default: true) - User must be authenticated
   *   - requiredRoles: string|string[] - User must have one of these roles
   *   - requiredPermissions: string|string[] - User must have one of these permissions
   *   - requiredCounty: string - User must be from this county (for county admins)
   *   - redirectTo: string (default: '/auth-page/index.html') - Where to redirect unauthorized users
   * @returns {object} { allowed: boolean, user: object, profile: object }
   */
  async protectPage(options = {}) {
    const {
      requiredAuth = true,
      requiredRoles = null,
      requiredPermissions = null,
      requiredCounty = null,
      redirectTo = '/auth-page/auth.html'
    } = options;

    try {
      // Initialize auth guard
      await this.init();

      // Check authentication
      if (requiredAuth && !this.currentUser) {
        console.warn('Page access denied: User not authenticated');
        this.redirect(redirectTo);
        return { allowed: false, user: null, profile: null };
      }

      // Check role-based access
      if (requiredRoles && this.currentUser) {
        const hasRequiredRole = await this.hasRole(requiredRoles);
        if (!hasRequiredRole) {
          console.warn('Page access denied: User does not have required role');
          this.redirect('/auth-page/auth.html?error=unauthorized');
          return { allowed: false, user: this.currentUser, profile: this.userProfile };
        }
      }

      // Check permissions
      if (requiredPermissions && this.currentUser) {
        const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];
        let hasPermission = false;

        for (const permission of permissions) {
          if (await this.hasPermission(permission)) {
            hasPermission = true;
            break;
          }
        }

        if (!hasPermission) {
          console.warn('Page access denied: User does not have required permissions');
          this.redirect('/auth-page/auth.html?error=insufficient-permissions');
          return { allowed: false, user: this.currentUser, profile: this.userProfile };
        }
      }

      // Check county restriction
      if (requiredCounty && this.userProfile) {
        if (this.userProfile.county !== requiredCounty && this.userProfile.role !== 'super_admin') {
          console.warn('Page access denied: User is not from required county');
          this.redirect('/auth-page/auth.html?error=county-mismatch');
          return { allowed: false, user: this.currentUser, profile: this.userProfile };
        }
      }

      // All checks passed
      return {
        allowed: true,
        user: this.currentUser,
        profile: this.userProfile
      };

    } catch (error) {
      console.error('Error protecting page:', error);
      this.redirect(redirectTo);
      return { allowed: false, user: null, profile: null };
    }
  }

  /**
   * Check if user is logged in as a specific role type
   * @param {string} role - Role to check ('contributor', 'county_admin', 'super_admin', 'visitor')
   * @returns {boolean}
   */
  async isRole(role) {
    return await this.hasRole(role);
  }

  /**
   * Get user's county (for county-based filtering)
   * @returns {string|null} County name or null
   */
  async getUserCounty() {
    await this.init();
    return this.userProfile?.county || null;
  }

  /**
   * Redirect to a different page
   * @param {string} url - URL to redirect to
   */
  redirect(url) {
    // Handle relative paths
    if (url.startsWith('/')) {
      window.location.href = window.location.origin + url;
    } else {
      window.location.href = url;
    }
  }

  /**
   * Redirect back to login with optional error message
   * @param {string} errorMessage - Optional error message to display
   */
  redirectToLogin(errorMessage = null) {
    let url = '/auth-page/auth.html';
    if (errorMessage) {
      url += `?error=${encodeURIComponent(errorMessage)}`;
    }
    this.redirect(url);
  }

  /**
   * Logout current user
   */
  async logout() {
    try {
      await this.supabase.auth.signOut();
      this.currentUser = null;
      this.userProfile = null;
      this.initialized = false;
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }
}

/**
 * QUICK HELPER FUNCTIONS for use in pages
 * Initialize once at top of your page
 */

// Global instance (initialized when supabaseClient is available)
let authGuard = null;

/**
 * Initialize auth guard (call this once per page)
 * @returns {AuthGuard} The auth guard instance
 */
async function initAuthGuard() {
  if (typeof supabaseClient !== 'undefined' && supabaseClient && !authGuard) {
    authGuard = new AuthGuard(supabaseClient);
    await authGuard.init();
  }
  return authGuard;
}

/**
 * USAGE EXAMPLES:
 * 
 * 1. Protect a page to authenticated users only:
 *    const result = await authGuard.protectPage({ requiredAuth: true });
 *    if (!result.allowed) return;
 * 
 * 2. Protect a contributor-only page:
 *    const result = await authGuard.protectPage({ 
 *      requiredRoles: ['contributor', 'county_admin', 'super_admin'] 
 *    });
 *    if (!result.allowed) return;
 * 
 * 3. Protect an admin-only page:
 *    const result = await authGuard.protectPage({ 
 *      requiredRoles: ['super_admin', 'county_admin'] 
 *    });
 *    if (!result.allowed) return;
 * 
 * 4. Check visibility before rendering content:
 *    const canView = await authGuard.canViewContent(
 *      'county_only', 
 *      authorId, 
 *      'Montserrado'
 *    );
 *    if (!canView) return; // Don't render
 * 
 * 5. Get current user info:
 *    const user = await authGuard.getCurrentUser();
 *    const profile = await authGuard.getUserProfile();
 */
