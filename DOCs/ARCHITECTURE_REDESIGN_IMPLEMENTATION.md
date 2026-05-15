# Architecture Redesign - Implementation Guide

## Overview

This guide walks through implementing the public/private platform architecture redesign. The system separates:

- **PUBLIC PAGES** - County exploration, tourism, galleries (no auth required)
- **PROTECTED PAGES** - Contributor dashboard, community, resources (auth required)
- **VISIBILITY SYSTEM** - Content filtering by level (public, authenticated, county, admin, private)
- **ROUTE GUARDS** - Frontend protection + Supabase RLS backend security

---

## What's Been Delivered

### System Files

1. **`route-config.js`** - Route definitions and configurations
2. **`route-guard.js`** - Frontend protection and access control
3. **`visibility.js`** - Content filtering by visibility level
4. **`20250513000003_add_rls_policies.sql`** - Backend RLS policies
5. **`public-layout.html`** - Layout for non-authenticated users
6. **`authenticated-layout.html`** - Dashboard layout with sidebar
7. **`ARCHITECTURE_REDESIGN_PUBLIC_PRIVATE.md`** - Design document

### Key Features

✅ **Route Protection** - 13 routes classified and protected
✅ **Content Visibility** - 5 visibility levels implemented
✅ **Dual Layouts** - Public nav vs. authenticated sidebar
✅ **RLS Policies** - Backend database security
✅ **Role Hierarchy** - visitor → contributor → admin
✅ **County Access** - County-specific content filtering

---

## Implementation Steps

### Phase 1: Core Infrastructure Setup

#### Step 1.1: Deploy Backend Security (5 minutes)
```
1. Open Supabase Dashboard
2. Go to: SQL Editor → New Query
3. Paste: supabase/migrations/20250513000003_add_rls_policies.sql
4. Click: Run
5. Verify: All policies created without errors
```

**What this does:**
- Adds `visibility` column to content tables
- Enables Row-Level Security (RLS)
- Creates 30+ policies for content access
- Creates indexes for performance

#### Step 1.2: Deploy Shared JavaScript (10 minutes)
```
1. Create folders if needed:
   - shared/js/
   - shared/layouts/

2. Upload files:
   - route-config.js
   - route-guard.js
   - visibility.js

3. Update file paths in layouts if needed
```

#### Step 1.3: Test Route Configuration (5 minutes)
```javascript
// In browser console, test:
import ROUTE_CONFIG from '/shared/js/route-config.js';

console.log(ROUTE_CONFIG.HOME);        // Should show public route
console.log(ROUTE_CONFIG.DASHBOARD);   // Should show protected route

// Test route functions
import { getPublicRoutes, getProtectedRoutes } from '/shared/js/route-config.js';
console.log(getPublicRoutes());      // 6 public routes
console.log(getProtectedRoutes());   // 7 protected routes
```

---

### Phase 2: Page Layout Implementation

#### Step 2.1: Update Page Templates

**For PUBLIC pages** (home, county, tourism, gallery, about):
```html
<!DOCTYPE html>
<html>
<head>
  <!-- existing head -->
  <link href="https://cdn.tailwindcss.com" rel="stylesheet">
</head>
<body>
  <!-- Include public layout -->
  <nav class="public-nav">
    <!-- Navigation from public-layout.html -->
  </nav>
  
  <main id="app">
    <!-- Your page content here -->
  </main>
  
  <!-- Scripts -->
  <script src="/shared/js/route-guard.js" type="module"></script>
  <script>
    // Protect the page
    import { ProtectedRouter } from '/shared/js/route-guard.js';
    const router = new ProtectedRouter(supabaseClient);
    await router.init();
    router.protectCurrentPage();
  </script>
</body>
</html>
```

**For PROTECTED pages** (dashboard, community, education, opportunities):
```html
<!-- Include authenticated-layout.html structure -->
<!-- Use authenticated-layout.html as template -->
<!-- Add route guard on page load -->
```

#### Step 2.2: Update Existing Pages

**Files to update:**
- `index-page/index.html` → Use public layout
- `county-pages/*.html` → Use public layout
- `tourism-pages/index.html` → Use public layout
- `gallery-page/index.html` → Use public layout
- `auth-page/index.html` → Use auth layout
- `dashboard-page/index.html` → Use authenticated layout
- `profile-page/index.html` → Use authenticated layout
- `settings-page/index.html` → Use authenticated layout
- `community-page/index.html` → Use authenticated layout (**NEW**)
- `education-page/index.html` → Use authenticated layout (**NEW**)
- `opportunities-page/index.html` → Use authenticated layout (**NEW**)

---

### Phase 3: Route Guard Implementation

#### Step 3.1: Add Protection to Each Page

**Example for dashboard-page/index.html:**
```html
<!DOCTYPE html>
<html>
<head>
  <title>Dashboard</title>
  <!-- Include shared layout -->
</head>
<body>
  <div class="authenticated-layout">
    <!-- Layout structure -->
  </div>

  <script src="/shared/js/supabase.js"></script>
  <script src="/shared/js/route-guard.js" type="module"></script>
  
  <script type="module">
    import { ProtectedRouter } from '/shared/js/route-guard.js';
    
    // Initialize router with Supabase client
    const router = new ProtectedRouter(window.supabaseClient);
    
    // Initialize on page load
    window.addEventListener('DOMContentLoaded', async () => {
      await router.init();
      
      // Protect current page
      if (!router.protectCurrentPage()) {
        // Protection failed, user was redirected
        return;
      }
      
      // Load sidebar navigation
      loadSidebarNav();
      
      // Load page content
      loadDashboardContent();
    });
    
    function loadSidebarNav() {
      import { getAuthenticatedNavigation } from '/shared/js/route-config.js';
      const navItems = getAuthenticatedNavigation();
      const navContainer = document.getElementById('sidebar-nav');
      
      navItems.forEach(item => {
        const link = document.createElement('a');
        link.className = 'nav-item';
        link.href = item.path;
        link.innerHTML = `
          <span class="nav-item-icon">${item.icon}</span>
          <span>${item.title}</span>
        `;
        navContainer.appendChild(link);
      });
    }
  </script>
</body>
</html>
```

#### Step 3.2: Handle Navigation Clicks

```javascript
// When user clicks a navigation link
document.addEventListener('click', (e) => {
  if (e.target.closest('a[href^="/"]')) {
    const href = e.target.closest('a').href;
    const path = new URL(href).pathname;
    
    // Check if navigation is allowed
    const decision = router.canAccess(path);
    
    if (!decision.allowed) {
      e.preventDefault();
      alert(`Access denied: ${decision.reason}`);
      if (decision.redirect) {
        window.location.href = decision.redirect;
      }
    }
  }
});
```

---

### Phase 4: Content Visibility Integration

#### Step 4.1: Update Database Content Tables

**Add visibility column to existing tables:**
```sql
-- Already handled in RLS migration
-- But verify in Supabase:
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'content' AND column_name = 'visibility';
```

#### Step 4.2: Filter Content in Queries

**Example fetching content:**
```javascript
import { ContentVisibility } from '/shared/js/visibility.js';

// Fetch content
const { data: allContent } = await supabase
  .from('content')
  .select('*');

// Filter by visibility
const visibleContent = ContentVisibility.filterContent(allContent, currentUser);
```

#### Step 4.3: Add Visibility Selector to Forms

**In contribute/edit pages:**
```html
<!-- Visibility Selector -->
<div class="form-group">
  <label>Content Visibility</label>
  <div id="visibility-selector"></div>
  <div id="visibility-info"></div>
</div>

<script>
import { VisibilitySelector, ContentVisibility } from '/shared/js/visibility.js';

// Render selector
const selectorHtml = VisibilitySelector.generateHtml(currentUser, 'authenticated_only');
document.getElementById('visibility-selector').innerHTML = selectorHtml;

// Show info when changed
document.getElementById('visibility-select').addEventListener('change', (e) => {
  const info = VisibilitySelector.generateInfo(e.target.value);
  document.getElementById('visibility-info').innerHTML = info;
});
</script>
```

---

### Phase 5: Testing

#### Test Case 1: Public Access
```
1. Open browser in incognito mode (no auth)
2. Navigate to: /county/bong
3. Verify: Page loads successfully
4. Try to: Navigate to /dashboard
5. Verify: Redirected to /auth
```

#### Test Case 2: Authenticated Access
```
1. Login as contributor
2. Navigate to: /dashboard
3. Verify: Page loads with sidebar
4. Check: All sidebar items visible
5. Click: "Profile" link
6. Verify: Navigates to /profile
```

#### Test Case 3: Content Visibility
```
1. Create content as public
2. Logout and view
3. Verify: Content visible
4. Create content as authenticated_only
5. Logout and try to view
6. Verify: Hidden from public
7. Login and view
8. Verify: Now visible
```

#### Test Case 4: Admin Access
```
1. Login as super_admin
2. Navigate to: /admin
3. Verify: Admin panel loads
4. Try as contributor
5. Verify: Redirected with 403 error
```

---

## File Organization

### New Structure

```
components/
├── PUBLIC/
│  ├── index-page/
│  │  └── index.html (uses public-layout)
│  ├── county-pages/
│  │  └── *.html (uses public-layout)
│  └── tourism-pages/
│     └── index.html (uses public-layout)
│
├── PROTECTED/
│  ├── dashboard-page/
│  │  └── index.html (uses authenticated-layout)
│  ├── profile-page/
│  │  └── index.html (uses authenticated-layout)
│  ├── community-page/
│  │  └── index.html (uses authenticated-layout) [NEW]
│  ├── education-page/
│  │  └── index.html (uses authenticated-layout) [NEW]
│  └── opportunities-page/
│     └── index.html (uses authenticated-layout) [NEW]
│
├── shared/
│  ├── layouts/
│  │  ├── public-layout.html
│  │  └── authenticated-layout.html
│  └── js/
│     ├── route-config.js
│     ├── route-guard.js
│     └── visibility.js
│
└── supabase/
   └── migrations/
      └── 20250513000003_add_rls_policies.sql
```

---

## Testing Checklist

### Frontend Protection
- [ ] Public pages load without login
- [ ] Protected pages redirect to /auth when not logged in
- [ ] After login, protected pages load
- [ ] Insufficient role gets 403 error
- [ ] Mobile sidebar works on narrow screens

### Content Visibility
- [ ] Public content visible to all
- [ ] Authenticated-only content hidden from public
- [ ] County-only content filtered correctly
- [ ] Admin-only content restricted
- [ ] Private content only visible to owner

### Navigation
- [ ] Public navigation shows correct items
- [ ] Authenticated navigation shows sidebar
- [ ] Nav links navigate correctly
- [ ] Mobile nav toggle works
- [ ] Logout works properly

### Security
- [ ] No auth token in URLs
- [ ] Session tokens stored securely
- [ ] RLS policies enforced on backend
- [ ] No direct API access bypasses protection
- [ ] CORS configured correctly

---

## Deployment Checklist

### Pre-Deployment
- [ ] All files uploaded to server
- [ ] RLS migration deployed to Supabase
- [ ] Route guard code tested locally
- [ ] Content visibility tested
- [ ] Mobile responsiveness verified

### Deployment Day
- [ ] Deploy RLS migration first
- [ ] Deploy shared JavaScript files
- [ ] Deploy updated page templates
- [ ] Test all routes
- [ ] Monitor error logs
- [ ] Get user feedback

### Post-Deployment
- [ ] Monitor error logs for 24 hours
- [ ] Test user signup and login
- [ ] Verify content visibility working
- [ ] Test navigation links
- [ ] Check performance metrics

---

## Troubleshooting

### Issue: "Cannot find route-guard.js"
**Solution:** Check file path is correct, upload to `/shared/js/`

### Issue: Route guard not redirecting to auth
**Solution:**
1. Check Supabase auth is initialized
2. Verify route is marked as `requiresAuth: true`
3. Check browser console for errors

### Issue: Content not being filtered
**Solution:**
1. Verify visibility column exists in table
2. Check RLS policies are enabled
3. Test with database queries directly

### Issue: Sidebar navigation not showing
**Solution:**
1. Check `getAuthenticatedNavigation()` returns items
2. Verify DOM element `#sidebar-nav` exists
3. Check JavaScript errors in console

---

## Performance Optimization

### Caching
```javascript
// Cache navigation items
const navCache = {};

function getNavigation() {
  if (navCache.authenticated) {
    return navCache.authenticated;
  }
  
  const nav = getAuthenticatedNavigation();
  navCache.authenticated = nav;
  return nav;
}
```

### Lazy Loading
```javascript
// Load content visibility filter only when needed
import { lazy } from 'some-module';
const ContentVisibility = lazy(() => 
  import('/shared/js/visibility.js')
);
```

### Database Indexes
Already created in RLS migration:
- `idx_content_visibility`
- `idx_content_county`
- `idx_content_author_id`

---

## Security Best Practices

1. **Frontend is UX** - Route guards improve user experience
2. **Backend is Security** - RLS policies are security-critical
3. **Never trust client** - Always verify on backend
4. **Defense in Depth** - Use both frontend + backend
5. **Minimal data** - Only send what user needs to see

---

## Migration from Old Architecture

### Old vs New

| Aspect | Old | New |
|--------|-----|-----|
| Routes | No classification | 13 defined routes |
| Access Control | None | Role-based |
| Content Filtering | Manual | Automatic |
| RLS | None | Full coverage |
| Layouts | Mixed | Separated |
| Navigation | Same for all | Role-specific |

### Migration Steps

1. Keep old pages running during transition
2. Deploy new route infrastructure
3. Deploy new layouts
4. Migrate pages one at a time
5. Test thoroughly
6. Deprecate old pages
7. Clean up

---

## Success Criteria

✅ Public users can browse without login  
✅ Protected pages require authentication  
✅ Content visibility respected  
✅ RLS policies enforced  
✅ Navigation appropriate for role  
✅ No unauthorized access possible  
✅ Mobile responsiveness maintained  
✅ Performance acceptable  

---

## Next Steps

1. **Week 1:** Deploy infrastructure & test
2. **Week 2:** Migrate pages and layouts
3. **Week 3:** Full testing and hardening
4. **Week 4:** Monitor and optimize

---

## Support

For issues:
1. Check troubleshooting section
2. Review browser console
3. Check Supabase logs
4. Verify RLS policies
5. Test with curl/Postman

---

**Status:** Ready for Implementation  
**Estimated Time:** 3 weeks  
**Priority:** HIGH
