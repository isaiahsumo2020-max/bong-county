/**
 * ROUTE CONFIGURATION
 * 
 * Defines all application routes with:
 * - Path pattern
 * - Authentication requirement
 * - Minimum role required
 * - Layout type
 * - Description
 */

export const ROUTE_CONFIG = {
  // ===== PUBLIC ROUTES (No Authentication Required) =====
  
  HOME: {
    path: '/',
    name: 'home',
    requiresAuth: false,
    layout: 'public',
    title: 'Home',
    icon: '🏠',
    visible: true,
    description: 'Platform landing page and county discovery'
  },
  
  COUNTY: {
    path: '/county/:name',
    name: 'county',
    requiresAuth: false,
    layout: 'public',
    title: 'County',
    icon: '🏛️',
    description: 'County information and content'
  },
  
  TOURISM: {
    path: '/tourism',
    name: 'tourism',
    requiresAuth: false,
    layout: 'public',
    title: 'Tourism',
    icon: '✈️',
    description: 'Tourism exploration and travel content'
  },
  
  GALLERY: {
    path: '/gallery',
    name: 'gallery',
    requiresAuth: false,
    layout: 'public',
    title: 'Gallery',
    icon: '🖼️',
    description: 'Photo galleries and media'
  },
  
  ABOUT: {
    path: '/about',
    name: 'about',
    requiresAuth: false,
    layout: 'public',
    title: 'About',
    icon: 'ℹ️',
    description: 'About the platform'
  },
  
  ANNOUNCEMENTS: {
    path: '/announcements',
    name: 'announcements',
    requiresAuth: false,
    layout: 'public',
    title: 'Announcements',
    icon: '📢',
    description: 'Public announcements and news'
  },
  
  // ===== AUTHENTICATION PAGES =====
  
  LOGIN: {
    path: '/auth',
    name: 'auth',
    requiresAuth: false,
    layout: 'auth',
    title: 'Login',
    icon: '🔐',
    description: 'Sign in or create account'
  },
  
  // ===== PROTECTED ROUTES (Authentication Required) =====
  
  DASHBOARD: {
    path: '/dashboard',
    name: 'dashboard',
    requiresAuth: true,
    minRole: 'contributor',
    layout: 'authenticated',
    title: 'Dashboard',
    icon: '📊',
    visible: true,
    description: 'User dashboard and hub'
  },
  
  PROFILE: {
    path: '/profile',
    name: 'profile',
    requiresAuth: true,
    minRole: 'contributor',
    layout: 'authenticated',
    title: 'Profile',
    icon: '👤',
    visible: true,
    description: 'View and edit your profile'
  },
  
  SETTINGS: {
    path: '/settings',
    name: 'settings',
    requiresAuth: true,
    minRole: 'contributor',
    layout: 'authenticated',
    title: 'Settings',
    icon: '⚙️',
    visible: true,
    description: 'Account settings and preferences'
  },
  
  COMMUNITY: {
    path: '/community',
    name: 'community',
    requiresAuth: true,
    minRole: 'contributor',
    layout: 'authenticated',
    title: 'Community',
    icon: '👥',
    visible: true,
    description: 'Community discussions and collaboration'
  },
  
  EDUCATION: {
    path: '/education',
    name: 'education',
    requiresAuth: true,
    minRole: 'contributor',
    layout: 'authenticated',
    title: 'Education',
    icon: '📚',
    visible: true,
    description: 'Education resources and learning'
  },
  
  OPPORTUNITIES: {
    path: '/opportunities',
    name: 'opportunities',
    requiresAuth: true,
    minRole: 'contributor',
    layout: 'authenticated',
    title: 'Opportunities',
    icon: '💼',
    visible: true,
    description: 'Jobs, grants, internships, and scholarships'
  },
  
  COLLABORATE: {
    path: '/collaborate',
    name: 'collaborate',
    requiresAuth: true,
    minRole: 'contributor',
    layout: 'authenticated',
    title: 'Collaborate',
    icon: '🤝',
    visible: true,
    description: 'Team collaboration and projects'
  },
  
  CONTRIBUTE: {
    path: '/contribute',
    name: 'contribute',
    requiresAuth: true,
    minRole: 'contributor',
    layout: 'authenticated',
    title: 'Contribute',
    icon: '✍️',
    visible: true,
    description: 'Submit content and stories'
  },
  
  // ===== ADMIN ROUTES =====
  
  ADMIN: {
    path: '/admin',
    name: 'admin',
    requiresAuth: true,
    minRole: 'super_admin',
    layout: 'admin',
    title: 'Admin Panel',
    icon: '🔧',
    visible: false,
    description: 'Administrative controls'
  },
  
  ADMIN_USERS: {
    path: '/admin/users',
    name: 'admin-users',
    requiresAuth: true,
    minRole: 'super_admin',
    layout: 'admin',
    title: 'User Management',
    description: 'Manage platform users'
  },
  
  ADMIN_CONTENT: {
    path: '/admin/content',
    name: 'admin-content',
    requiresAuth: true,
    minRole: 'super_admin',
    layout: 'admin',
    title: 'Content Management',
    description: 'Manage all content'
  },
  
  ADMIN_VISIBILITY: {
    path: '/admin/visibility',
    name: 'admin-visibility',
    requiresAuth: true,
    minRole: 'super_admin',
    layout: 'admin',
    title: 'Visibility Settings',
    description: 'Manage content visibility'
  }
};

/**
 * Get all public routes
 * @returns {Array} Array of public route configs
 */
export function getPublicRoutes() {
  return Object.values(ROUTE_CONFIG).filter(route => !route.requiresAuth && route.visible !== false);
}

/**
 * Get all protected routes
 * @returns {Array} Array of protected route configs
 */
export function getProtectedRoutes() {
  return Object.values(ROUTE_CONFIG).filter(
    route => route.requiresAuth && route.visible !== false && !route.minRole?.includes('admin')
  );
}

/**
 * Get all admin routes
 * @returns {Array} Array of admin route configs
 */
export function getAdminRoutes() {
  return Object.values(ROUTE_CONFIG).filter(
    route => route.minRole === 'super_admin' && route.visible !== false
  );
}

/**
 * Get authenticated navigation items (for sidebar)
 * @returns {Array} Formatted navigation array
 */
export function getAuthenticatedNavigation() {
  const routes = getProtectedRoutes();
  return routes.map(route => ({
    path: route.path,
    name: route.name,
    title: route.title,
    icon: route.icon,
    description: route.description
  }));
}

/**
 * Get public navigation items (for top bar)
 * @returns {Array} Formatted navigation array
 */
export function getPublicNavigation() {
  const excludePaths = ['/auth'];
  const routes = getPublicRoutes().filter(r => !excludePaths.includes(r.path));
  return routes.map(route => ({
    path: route.path,
    name: route.name,
    title: route.title,
    icon: route.icon
  }));
}

/**
 * Check if a route requires authentication
 * @param {string} path - Route path
 * @returns {boolean}
 */
export function routeRequiresAuth(path) {
  const route = findRouteByPath(path);
  return route ? route.requiresAuth : false;
}

/**
 * Get minimum role required for a route
 * @param {string} path - Route path
 * @returns {string|null} Minimum role or null if no requirement
 */
export function getMinRoleForRoute(path) {
  const route = findRouteByPath(path);
  return route ? route.minRole || null : null;
}

/**
 * Get layout for a route
 * @param {string} path - Route path
 * @returns {string} Layout name (public, authenticated, admin, auth)
 */
export function getLayoutForRoute(path) {
  const route = findRouteByPath(path);
  return route ? route.layout : 'public';
}

/**
 * Find route config by path
 * @param {string} path - Route path
 * @returns {Object|null} Route config or null
 */
function findRouteByPath(path) {
  return Object.values(ROUTE_CONFIG).find(route => {
    // Exact match
    if (route.path === path) return true;
    
    // Dynamic route match (e.g., /county/:name)
    const routePattern = route.path.replace(/:[^/]+/g, '[^/]+');
    const routeRegex = new RegExp(`^${routePattern}$`);
    return routeRegex.test(path);
  });
}

/**
 * Role hierarchy
 * Higher number = more permissions
 */
export const ROLE_HIERARCHY = {
  'visitor': 0,
  'contributor': 1,
  'county_admin': 2,
  'super_admin': 3
};

/**
 * Check if user has required role or higher
 * @param {string} userRole - User's current role
 * @param {string} requiredRole - Required minimum role
 * @returns {boolean}
 */
export function hasRequiredRole(userRole, requiredRole) {
  const userLevel = ROLE_HIERARCHY[userRole] || 0;
  const requiredLevel = ROLE_HIERARCHY[requiredRole] || 0;
  return userLevel >= requiredLevel;
}

export default ROUTE_CONFIG;
