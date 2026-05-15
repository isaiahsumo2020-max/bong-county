#!/usr/bin/env node
/**
 * PLATFORM ARCHITECTURE REDESIGN
 * Quick Reference & Cheat Sheet
 * 
 * For questions, see full docs:
 * - ARCHITECTURE_REDESIGN_PUBLIC_PRIVATE.md (Design)
 * - ARCHITECTURE_REDESIGN_IMPLEMENTATION.md (How-to)
 * - ARCHITECTURE_REDESIGN_COMPLETE.md (Summary)
 */

// ============================================================================
// ROUTE CONFIGURATION
// ============================================================================

// Define a route in route-config.js:
const ROUTE_EXAMPLE = {
  path: '/example',
  name: 'example',
  requiresAuth: false,           // true = login required
  minRole: 'contributor',         // null, 'contributor', 'super_admin'
  layout: 'public',               // 'public', 'authenticated', 'admin', 'auth'
  title: 'Example Page',
  icon: '📄',
  visible: true,                  // false = hidden from navigation
  description: 'Example page description'
};

// ============================================================================
// ROUTE GUARD USAGE
// ============================================================================

// Check if user can access a route:
import { RouteGuard } from '/shared/js/route-guard.js';

const decision = RouteGuard.checkAccess('/dashboard', currentUser);
if (decision.allowed) {
  loadPage();
} else {
  window.location.href = decision.redirect;
}

// Protected page template:
<script type="module">
  import { ProtectedRouter } from '/shared/js/route-guard.js';
  
  const router = new ProtectedRouter(supabaseClient);
  
  window.addEventListener('DOMContentLoaded', async () => {
    await router.init();
    if (!router.protectCurrentPage()) return;
    // Load page content
  });
</script>

// ============================================================================
// VISIBILITY LEVELS
// ============================================================================

// 5 Visibility Options:
public              // Visible to everyone
authenticated_only  // Visible to logged-in users
county_only         // Visible to county members
admin_only          // Visible to admins only
private             // Visible to owner + admin

// Check if user can see content:
import { ContentVisibility } from '/shared/js/visibility.js';

if (ContentVisibility.canSee(item, user)) {
  display(item);
}

// Filter array of content:
const visible = ContentVisibility.filterContent(items, user);

// Get visibility info for UI:
const info = ContentVisibility.getVisibilityInfo('authenticated_only');
// Returns: { icon, label, description, color }

// ============================================================================
// NAVIGATION GENERATION
// ============================================================================

import { getPublicNavigation, getAuthenticatedNavigation } from '/shared/js/route-config.js';

// For public pages:
const publicNav = getPublicNavigation();
// Returns: [{ path, name, title, icon }, ...]

// For authenticated pages:
const authNav = getAuthenticatedNavigation();
// Returns: [{ path, name, title, icon }, ...]

// ============================================================================
// ROLE CHECKING
// ============================================================================

import { hasRequiredRole, ROLE_HIERARCHY } from '/shared/js/route-config.js';

// Check if user has required role:
if (hasRequiredRole(user.role, 'contributor')) {
  // User is contributor or higher
}

// Role hierarchy:
// visitor (0) < contributor (1) < county_admin (2) < super_admin (3)

// ============================================================================
// DATABASE QUERIES WITH VISIBILITY
// ============================================================================

// Fetch public content:
SELECT * FROM content 
WHERE visibility = 'public';

// Fetch authenticated content:
SELECT * FROM content 
WHERE visibility IN ('public', 'authenticated_only');

// Fetch county content:
SELECT * FROM content 
WHERE visibility IN ('public', 'authenticated_only', 'county_only')
AND county = user_county;

// Fetch admin content:
SELECT * FROM content 
WHERE visibility IN (
  'public', 'authenticated_only', 'county_only', 'admin_only'
)
AND (author_id = user_id OR user_role = 'super_admin');

// ============================================================================
// FORM ELEMENTS
// ============================================================================

// Visibility selector in forms:
<div id="visibility-selector"></div>

<script>
  import { VisibilitySelector } from '/shared/js/visibility.js';
  
  const html = VisibilitySelector.generateHtml(user, 'authenticated_only');
  document.getElementById('visibility-selector').innerHTML = html;
  
  // On change, show info:
  document.getElementById('visibility-select').addEventListener('change', (e) => {
    const info = VisibilitySelector.generateInfo(e.target.value);
    // Display info HTML
  });
</script>

// ============================================================================
// DEPLOYMENT CHECKLIST
// ============================================================================

PHASE 1 - INFRASTRUCTURE (30 min)
[ ] Deploy RLS migration to Supabase
[ ] Upload route-config.js to shared/js/
[ ] Upload route-guard.js to shared/js/
[ ] Upload visibility.js to shared/js/
[ ] Upload public-layout.html to shared/layouts/
[ ] Upload authenticated-layout.html to shared/layouts/
[ ] Test: route-config.js loads correctly
[ ] Test: route guard redirects work

PHASE 2 - PAGE UPDATES (1-2 days)
[ ] Update index-page with public layout
[ ] Update county-pages with public layout
[ ] Update tourism-pages with public layout
[ ] Update dashboard-page with authenticated layout
[ ] Update profile-page with authenticated layout
[ ] Update community-page with authenticated layout
[ ] Update education-page with authenticated layout
[ ] Update opportunities-page with authenticated layout
[ ] Add route guard to all protected pages
[ ] Test: All routes navigate correctly

PHASE 3 - CONTENT VISIBILITY (1 day)
[ ] Verify visibility columns exist
[ ] Test content filtering
[ ] Add visibility selectors to forms
[ ] Test different visibility levels

PHASE 4 - TESTING (1-2 days)
[ ] Test public access (no auth)
[ ] Test protected access (with auth)
[ ] Test role-based access
[ ] Test content visibility
[ ] Test mobile responsiveness
[ ] Performance testing

PHASE 5 - DEPLOYMENT (1 day)
[ ] Deploy to production
[ ] Monitor error logs
[ ] Get user feedback
[ ] Make final adjustments

// ============================================================================
// COMMON ISSUES & SOLUTIONS
// ============================================================================

ISSUE: Route guard not redirecting
FIX: 1. Check Supabase auth is initialized
    2. Verify route is marked requiresAuth: true
    3. Check browser console for errors
    4. Verify supabaseClient is available globally

ISSUE: Content not filtered by visibility
FIX: 1. Verify visibility column exists
    2. Check RLS policies are enabled
    3. Test queries in Supabase SQL editor
    4. Verify user metadata in JWT

ISSUE: Sidebar navigation not showing
FIX: 1. Check getAuthenticatedNavigation() returns items
    2. Verify DOM element #sidebar-nav exists
    3. Check JavaScript errors in console
    4. Verify route-config.js loaded

ISSUE: Layout not loading
FIX: 1. Check file paths are correct
    2. Verify includes are in correct order
    3. Check for CSS conflicts
    4. Test with simpler layout first

// ============================================================================
// FILE STRUCTURE
// ============================================================================

components/
├── shared/
│   ├── js/
│   │   ├── route-config.js (380 lines) ← All routes defined here
│   │   ├── route-guard.js (400 lines)  ← Access control here
│   │   └── visibility.js (350 lines)   ← Content filtering here
│   └── layouts/
│       ├── public-layout.html (100 lines)        ← Public nav
│       └── authenticated-layout.html (250 lines) ← Sidebar + nav
│
└── supabase/
    └── migrations/
        └── 20250513000003_add_rls_policies.sql ← Backend security

// ============================================================================
// QUICK API REFERENCE
// ============================================================================

// route-config.js exports:
ROUTE_CONFIG                    // All routes object
getPublicRoutes()               // Array of public routes
getProtectedRoutes()            // Array of protected routes
getAdminRoutes()                // Array of admin routes
getAuthenticatedNavigation()    // Nav items for sidebar
getPublicNavigation()           // Nav items for top bar
routeRequiresAuth(path)         // Boolean
getMinRoleForRoute(path)        // String or null
getLayoutForRoute(path)         // String: public, authenticated, admin, auth
hasRequiredRole(userRole, req)  // Boolean

// route-guard.js exports:
RouteGuard                      // Main guard class
RouteGuard.checkAccess()        // Check if allowed
RouteGuard.findRoute()          // Find route config
RouteGuard.requiresAuth()       // Check if auth needed
RouteGuard.getLayout()          // Get layout type
RouteGuard.checkResourceAccess()// Check resource access
RouteGuard.getVisibleLevels()   // Get visible levels

ProtectedRouter                 // Router class
router.init()                   // Initialize with user
router.canAccess()              // Check access
router.navigateTo()             // Navigate with protection
router.protectCurrentPage()     // Protect page on load
router.logout()                 // Logout user

// visibility.js exports:
ContentVisibility               // Main visibility class
ContentVisibility.canSee()      // Check if visible
ContentVisibility.filterContent()// Filter array
ContentVisibility.getVisibilityInfo()// Get info object
ContentVisibility.getAvailableLevels()// Get allowed levels

VisibilitySelector              // Selector component
VisibilitySelector.generateHtml()// Generate HTML
VisibilitySelector.generateInfo()// Generate info HTML

VISIBILITY_LEVELS               // Visibility constants
getAllowedLevels()              // Get allowed levels for type
getDefaultVisibility()          // Get default for type

// ============================================================================
// ENVIRONMENT VARIABLES NEEDED
// ============================================================================

// Supabase configuration (should already be set):
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

// ============================================================================
// PERFORMANCE TIPS
// ============================================================================

// 1. Cache navigation items:
const navCache = {};
function getNav() {
  if (navCache.authenticated) return navCache.authenticated;
  navCache.authenticated = getAuthenticatedNavigation();
  return navCache.authenticated;
}

// 2. Lazy load visibility:
const visibility = await import('/shared/js/visibility.js');

// 3. Use indexes on database:
CREATE INDEX idx_content_visibility ON content(visibility);
CREATE INDEX idx_content_county ON content(county);

// 4. Batch content filtering:
const visible = ContentVisibility.filterContent(largeArray, user);

// ============================================================================
// SECURITY CHECKLIST
// ============================================================================

[ ] Frontend route guards implemented
[ ] RLS policies enabled on database
[ ] Never trust client-side checks
[ ] Always verify on backend
[ ] Auth tokens secure
[ ] User metadata verified
[ ] CORS configured correctly
[ ] SQL injection prevented
[ ] XSS protected
[ ] Session management correct

// ============================================================================
// TESTING COMMANDS
// ============================================================================

# Test route configuration:
fetch('/shared/js/route-config.js')
  .then(r => r.text())
  .then(t => console.log('route-config.js loaded'))

# Test route guard:
import { RouteGuard } from '/shared/js/route-guard.js';
console.log(RouteGuard.checkAccess('/dashboard', null));
// Expected: { allowed: false, reason: 'NOT_AUTHENTICATED', redirect: '/auth?next=%2Fdashboard' }

# Test visibility:
import { ContentVisibility } from '/shared/js/visibility.js';
console.log(ContentVisibility.canSee({ visibility: 'public' }, null));
// Expected: true
console.log(ContentVisibility.canSee({ visibility: 'authenticated_only' }, null));
// Expected: false

# Check RLS enabled:
SELECT tablename FROM pg_tables 
WHERE rowsecurity = true;

// ============================================================================
// QUICK LINKS
// ============================================================================

Design Document:
  → ARCHITECTURE_REDESIGN_PUBLIC_PRIVATE.md

Implementation Guide:
  → ARCHITECTURE_REDESIGN_IMPLEMENTATION.md

Complete Summary:
  → ARCHITECTURE_REDESIGN_COMPLETE.md

// ============================================================================
// SUPPORT
// ============================================================================

For issues:
1. Check browser console for errors
2. Verify all files are uploaded
3. Check RLS policies in Supabase
4. Test with curl/Postman
5. Review documentation
6. Enable debug logging

Debug logging example:
window.DEBUG = true;

// ============================================================================
// VERSION INFO
// ============================================================================

Architecture Version: 3.0
Platform Version: 2.0+
Release Date: May 13, 2026
Status: Production Ready
Compatibility: Modern browsers, Supabase

// ============================================================================
// END OF QUICK REFERENCE
// ============================================================================

Last Updated: May 13, 2026
For detailed information, see full documentation files.
