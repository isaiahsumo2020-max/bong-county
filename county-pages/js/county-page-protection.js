/**
 * COUNTY PAGE ROUTE PROTECTION
 * 
 * Protects county page routes based on visibility levels:
 * - PUBLIC routes: Home, Tourism (no auth required)
 * - PROTECTED routes: About, Education, Leadership, Community, Stories (auth required)
 * 
 * This script should be loaded in county pages before Vue Router initialization
 */

class CountyPageProtection {
  constructor(supabaseClient) {
    this.supabase = supabaseClient;
    this.currentUser = null;
    this.isAuthenticated = false;
    this.router = null;
  }

  /**
   * Initialize protection system
   */
  async initialize() {
    try {
      console.log('🔐 Initializing County Page Protection...');

      // Wait for Supabase to load if needed
      let attempts = 0;
      while (!window.supabaseClient && attempts < 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }

      if (!window.supabaseClient) {
        console.warn('⚠️ Supabase not available - public access only');
        return false;
      }

      // Check current authentication
      const { data, error } = await window.supabaseClient.auth.getSession();
      
      if (error) {
        console.error('Auth check error:', error);
        this.isAuthenticated = false;
      } else {
        this.currentUser = data.session?.user || null;
        this.isAuthenticated = !!this.currentUser;
        console.log('✓ Auth status:', this.isAuthenticated ? 'Authenticated' : 'Public');
      }

      return true;
    } catch (error) {
      console.error('Failed to initialize protection:', error);
      return false;
    }
  }

  /**
   * Define route visibility levels
   */
  getRouteConfig() {
    return {
      // PUBLIC ROUTES - anyone can access
      '/': {
        public: true,
        name: 'Home',
        requiresAuth: false
      },
      '/tourism': {
        public: true,
        name: 'Tourism',
        requiresAuth: false
      },

      // PROTECTED ROUTES - requires authentication
      '/about': {
        public: false,
        name: 'About',
        requiresAuth: true
      },
      '/education': {
        public: false,
        name: 'Education',
        requiresAuth: true
      },
      '/leadership': {
        public: false,
        name: 'Leadership',
        requiresAuth: true
      },
      '/community': {
        public: false,
        name: 'Community',
        requiresAuth: true
      },
      '/stories': {
        public: false,
        name: 'Stories',
        requiresAuth: true
      },

      '/opportunities': {
        public: false,
        name: 'Opportunities',
        requiresAuth: true
      }
    };
  }

  /**
   * Check if user can access a route
   */
  canAccessRoute(path) {
    const config = this.getRouteConfig();
    const routeConfig = config[path];

    if (!routeConfig) {
      return { allowed: false, reason: 'ROUTE_NOT_FOUND' };
    }

    // If route requires auth and user is not authenticated
    if (routeConfig.requiresAuth && !this.isAuthenticated) {
      return {
        allowed: false,
        reason: 'NOT_AUTHENTICATED',
        routeName: routeConfig.name
      };
    }

    return { allowed: true };
  }

  /**
   * Setup Vue Router protection
   */
  setupRouterGuard(router) {
    this.router = router;

    router.beforeEach((to, from, next) => {
      const access = this.canAccessRoute(to.path);

      if (!access.allowed) {
        if (access.reason === 'NOT_AUTHENTICATED') {
          console.warn(`🔒 Access denied to ${access.routeName} - user not authenticated`);
          
          // Redirect to login
          const returnUrl = encodeURIComponent(to.path);
          const countyName = this.getCountyNameFromURL();
          const loginPath = `../../auth-page/auth.html?next=../county-pages/${countyName}.html%23${to.path}`;
          
          window.location.href = loginPath;
          return;
        }
      }

      next();
    });

    console.log('✓ Router guard activated');
  }

  /**
   * Get county name from current URL
   */
  getCountyNameFromURL() {
    const path = window.location.pathname;
    const match = path.match(/\/county-pages\/([^/]+)\.html/);
    return match ? match[1] : 'montserrado';
  }

  /**
   * Get user info for UI
   */
  getUserInfo() {
    return {
      isAuthenticated: this.isAuthenticated,
      user: this.currentUser,
      email: this.currentUser?.email,
      fullName: this.currentUser?.user_metadata?.full_name || 'Visitor'
    };
  }

  /**
   * Show login prompt for protected content
   */
  showLoginPrompt(routeName) {
    const countyName = this.getCountyNameFromURL();
    const message = `The "${routeName}" section requires authentication. Please log in to continue.`;
    
    if (confirm(message + '\n\nWould you like to log in now?')) {
      const returnUrl = encodeURIComponent(window.location.hash || '/');
      window.location.href = `../auth-page/auth.html?next=../county-pages/${countyName}.html`;
    }
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CountyPageProtection;
}
