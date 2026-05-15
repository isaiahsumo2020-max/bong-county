/**
 * ROUTE GUARD SYSTEM
 * 
 * Protects routes by checking:
 * - Authentication status
 * - User role and permissions
 * - County access requirements
 * 
 * Used on page load and route transitions
 */

import { ROUTE_CONFIG, getMinRoleForRoute, hasRequiredRole, getLayoutForRoute } from './route-config.js';

/**
 * Route Access Decision
 * @typedef {Object} AccessDecision
 * @property {boolean} allowed - Can user access this route?
 * @property {string} [reason] - Why was access denied?
 * @property {string} [redirect] - Where to redirect if denied?
 */

/**
 * Main Route Guard Class
 */
export class RouteGuard {
  /**
   * Check if user can access a route
   * @param {string} path - Route path
   * @param {Object|null} user - Current user or null if not authenticated
   * @returns {AccessDecision}
   */
  static checkAccess(path, user) {
    // Find route configuration
    const route = this.findRoute(path);
    if (!route) {
      return {
        allowed: false,
        reason: 'ROUTE_NOT_FOUND',
        redirect: '/'
      };
    }

    // Check 1: Authentication requirement
    if (route.requiresAuth && !user) {
      return {
        allowed: false,
        reason: 'NOT_AUTHENTICATED',
        redirect: '/auth?next=' + encodeURIComponent(path)
      };
    }

    // Check 2: Role requirement
    if (route.minRole && user && !hasRequiredRole(user.role, route.minRole)) {
      return {
        allowed: false,
        reason: 'INSUFFICIENT_ROLE',
        redirect: '/dashboard',
        userRole: user.role,
        requiredRole: route.minRole
      };
    }

    // Check 3: Admin access (super_admin only)
    if (route.minRole === 'super_admin' && user && user.role !== 'super_admin') {
      return {
        allowed: false,
        reason: 'ADMIN_ONLY',
        redirect: '/dashboard'
      };
    }

    // All checks passed
    return {
      allowed: true,
      layout: route.layout
    };
  }

  /**
   * Find route configuration by path
   * Handles dynamic routes like /county/:name
   * @private
   */
  static findRoute(path) {
    return Object.values(ROUTE_CONFIG).find(route => {
      // Exact match
      if (route.path === path) return true;

      // Dynamic route pattern match
      if (route.path.includes(':')) {
        const pattern = route.path
          .replace(/\//g, '\\/')
          .replace(/:[^/]+/g, '[^/]+');
        const regex = new RegExp(`^${pattern}$`);
        return regex.test(path);
      }

      return false;
    });
  }

  /**
   * Get required role for a route
   * @param {string} path - Route path
   * @returns {string|null} Role name or null
   */
  static getRequiredRole(path) {
    const route = this.findRoute(path);
    return route ? route.minRole || null : null;
  }

  /**
   * Check if route requires authentication
   * @param {string} path - Route path
   * @returns {boolean}
   */
  static requiresAuth(path) {
    const route = this.findRoute(path);
    return route ? route.requiresAuth : false;
  }

  /**
   * Get layout type for a route
   * @param {string} path - Route path
   * @returns {string} Layout name (public, authenticated, admin, auth)
   */
  static getLayout(path) {
    const route = this.findRoute(path);
    return route ? route.layout : 'public';
  }

  /**
   * Check if user can perform action on resource
   * @param {Object} user - Current user
   * @param {string} action - Action type (read, write, delete, admin)
   * @param {Object} resource - Resource being accessed
   * @returns {boolean}
   */
  static checkResourceAccess(user, action, resource) {
    // Not authenticated
    if (!user) {
      return action === 'read' && resource.visibility === 'public';
    }

    // Check visibility levels
    const visibility = resource.visibility || 'public';

    switch (visibility) {
      case 'public':
        return true;

      case 'authenticated_only':
        return !!user;

      case 'county_only':
        return user.county === resource.county;

      case 'admin_only':
        return user.role === 'super_admin' || user.role === 'county_admin';

      case 'private':
        return user.id === resource.author_id || user.role === 'super_admin';

      default:
        return false;
    }
  }

  /**
   * Get content visibility levels user can see
   * @param {Object|null} user - Current user or null
   * @returns {Array} Array of visibility levels visible to user
   */
  static getVisibleLevels(user) {
    const levels = ['public'];

    if (user) {
      levels.push('authenticated_only');

      if (user.county) {
        levels.push('county_only');
      }

      if (user.role === 'super_admin' || user.role === 'county_admin') {
        levels.push('admin_only');
      }

      // Always include private if user is owner/admin
      levels.push('private');
    }

    return levels;
  }
}

/**
 * Frontend Route Protection
 * 
 * Usage:
 * On page load or route change:
 * 1. Get current user from Supabase session
 * 2. Get target path
 * 3. Call RouteGuard.checkAccess()
 * 4. If not allowed, redirect
 * 5. If allowed, load layout and page
 */
export class ProtectedRouter {
  constructor(supabaseClient) {
    this.sb = supabaseClient;
    this.currentUser = null;
  }

  /**
   * Initialize router
   * Get current user session
   */
  async init() {
    const { data: { session } } = await this.sb.auth.getSession();
    this.currentUser = session?.user || null;

    // Load user role from users table
    if (this.currentUser) {
      const { data } = await this.sb
        .from('users')
        .select('role, county')
        .eq('id', this.currentUser.id)
        .single();

      if (data) {
        this.currentUser.role = data.role;
        this.currentUser.county = data.county;
      }
    }
  }

  /**
   * Check if current user can access path
   * @param {string} path - Route path to check
   * @returns {AccessDecision}
   */
  canAccess(path) {
    return RouteGuard.checkAccess(path, this.currentUser);
  }

  /**
   * Navigate to path with protection
   * @param {string} path - Target path
   * @returns {boolean} True if navigation allowed
   */
  navigateTo(path) {
    const decision = this.canAccess(path);

    if (!decision.allowed) {
      console.warn(`Navigation blocked: ${decision.reason}`);
      if (decision.redirect) {
        window.location.href = decision.redirect;
      }
      return false;
    }

    // Load appropriate layout
    this.loadLayout(decision.layout);

    // Navigate to page
    window.history.pushState({ path }, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));

    return true;
  }

  /**
   * Protect current page
   * Call on page load
   * @returns {boolean} True if page access allowed
   */
  protectCurrentPage() {
    const path = window.location.pathname;
    const decision = this.canAccess(path);

    if (!decision.allowed) {
      console.warn(`Page access blocked: ${decision.reason}`);
      if (decision.redirect) {
        window.location.href = decision.redirect;
      }
      return false;
    }

    // Load appropriate layout
    this.loadLayout(decision.layout);

    return true;
  }

  /**
   * Load layout based on type
   * @private
   * @param {string} layout - Layout type
   */
  loadLayout(layout) {
    // Remove old layouts
    document.querySelectorAll('[data-layout]').forEach(el => el.remove());

    // Load appropriate layout
    switch (layout) {
      case 'public':
        this.loadPublicLayout();
        break;
      case 'authenticated':
        this.loadAuthenticatedLayout();
        break;
      case 'admin':
        this.loadAdminLayout();
        break;
      case 'auth':
        this.loadAuthLayout();
        break;
    }
  }

  /**
   * Load public layout
   * @private
   */
  loadPublicLayout() {
    const layout = document.createElement('div');
    layout.setAttribute('data-layout', 'public');
    layout.innerHTML = `
      <nav data-component="public-nav">
        <!-- Navigation will be injected here -->
      </nav>
      <main id="app">
        <!-- Page content will be injected here -->
      </main>
      <footer>
        <!-- Footer will be injected here -->
      </footer>
    `;
    document.body.insertBefore(layout, document.body.firstChild);
  }

  /**
   * Load authenticated layout with sidebar
   * @private
   */
  loadAuthenticatedLayout() {
    const layout = document.createElement('div');
    layout.setAttribute('data-layout', 'authenticated');
    layout.innerHTML = `
      <div style="display: flex; min-height: 100vh;">
        <nav data-component="sidebar-nav" style="width: 250px; background: #1a1a1a;">
          <!-- Sidebar navigation will be injected here -->
        </nav>
        <div style="flex: 1;">
          <nav data-component="top-nav">
            <!-- Top navigation will be injected here -->
          </nav>
          <main id="app" style="padding: 20px;">
            <!-- Page content will be injected here -->
          </main>
        </div>
      </div>
    `;
    document.body.insertBefore(layout, document.body.firstChild);
  }

  /**
   * Load admin layout
   * @private
   */
  loadAdminLayout() {
    const layout = document.createElement('div');
    layout.setAttribute('data-layout', 'admin');
    layout.innerHTML = `
      <div style="display: flex; min-height: 100vh;">
        <nav data-component="admin-sidebar" style="width: 280px; background: #0a0a0a;">
          <!-- Admin sidebar will be injected here -->
        </nav>
        <div style="flex: 1;">
          <nav data-component="admin-top-nav" style="background: #1a1a1a; padding: 15px 20px;">
            <!-- Admin top nav will be injected here -->
          </nav>
          <main id="app" style="padding: 20px;">
            <!-- Admin content will be injected here -->
          </main>
        </div>
      </div>
    `;
    document.body.insertBefore(layout, document.body.firstChild);
  }

  /**
   * Load auth layout
   * @private
   */
  loadAuthLayout() {
    const layout = document.createElement('div');
    layout.setAttribute('data-layout', 'auth');
    layout.innerHTML = `
      <div style="display: flex; justify-content: center; align-items: center; min-height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
        <main id="app">
          <!-- Auth forms will be injected here -->
        </main>
      </div>
    `;
    document.body.insertBefore(layout, document.body.firstChild);
  }

  /**
   * Handle logout
   */
  async logout() {
    await this.sb.auth.signOut();
    this.currentUser = null;
    window.location.href = '/';
  }

  /**
   * Handle login success
   * Redirect to requested page or dashboard
   */
  handleLoginSuccess(nextUrl = null) {
    this.init(); // Refresh user data
    const redirect = nextUrl || '/dashboard';
    window.location.href = redirect;
  }
}

export default RouteGuard;
