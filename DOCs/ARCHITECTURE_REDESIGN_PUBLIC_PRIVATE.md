# Platform Architecture Redesign - Public + Private Ecosystem

## System Overview

The platform is being restructured into two distinct ecosystems:

```
LIBERIA COUNTIES DIGITAL PLATFORM
│
├─── PUBLIC ECOSYSTEM (No Auth Required)
│    ├─ Landing Page
│    ├─ Tourism Pages
│    ├─ County Discovery
│    ├─ Gallery/Media
│    ├─ About Pages
│    └─ Public Announcements
│
└─── PRIVATE ECOSYSTEM (Authentication Required)
     ├─ Contributor Dashboard
     ├─ Community Pages
     ├─ Education Hub
     ├─ Opportunities
     ├─ Discussion Forums
     ├─ Collaboration Tools
     └─ Content Management
```

---

## Route Classification

### PUBLIC ROUTES (No Authentication Required)

| Route | Page | Purpose |
|-------|------|---------|
| `/` | Landing Page | Discovery hub |
| `/county/{name}` | County Pages | County information |
| `/tourism` | Tourism Pages | Tourism content |
| `/gallery` | Gallery Pages | Photo/media galleries |
| `/about` | About Page | Platform information |
| `/announcements` | Announcements | Public news |
| `/auth` | Auth Page | Login/signup |

**Access Control:** Open to everyone

---

### PROTECTED ROUTES (Authentication Required)

| Route | Page | Min Role | Purpose |
|-------|------|----------|---------|
| `/dashboard` | Dashboard | contributor | User hub |
| `/profile` | Profile | contributor | Profile view |
| `/settings` | Settings | contributor | Preferences |
| `/community` | Community | contributor | Discussion |
| `/education` | Education | contributor | Learning |
| `/opportunities` | Opportunities | contributor | Jobs/grants |
| `/collaborate` | Collaboration | contributor | Teamwork |
| `/contribute` | Contribute | contributor | Content submit |
| `/admin` | Admin Panel | super_admin | Admin tools |

**Access Control:** Requires login

---

## Content Visibility Levels

### Visibility Tiers

```
Visitor        Admin          Contributor    County Admin    Super Admin
(Non-Auth)     (Special Role) (Auth)         (Special Role)  (Full Access)
│              │              │              │               │
├─ public      ├─ public      ├─ public      ├─ public       ├─ public
│              ├─ admin_only  ├─ public      ├─ public       ├─ admin_only
│              │              ├─ auth_only   ├─ public       ├─ auth_only
│              │              │              ├─ county_only  ├─ county_only
│              │              │              ├─ admin_only   └─ private
└─ BLOCKED     └─ FULL        └─ LIMITED     └─ LIMITED         │
                  ACCESS          ACCESS         ACCESS       FULL ACCESS
```

### Visibility Options

**1. Public (`public`)**
- Visible to everyone
- No authentication required
- Publicly indexed

**2. Authenticated Only (`authenticated_only`)**
- Visible only to logged-in users
- All contributor types see it
- Not indexed publicly

**3. County Only (`county_only`)**
- Visible to users from that county
- Requires authentication + county match
- County-specific content

**4. Admin Only (`admin_only`)**
- Visible only to admins
- Super admin or county admin
- Internal management content

**5. Private (`private`)**
- Visible only to owner + super_admin
- Personal or draft content
- Never publicly available

---

## Route Protection System

### Architecture

```
User Visits URL
    ↓
Frontend Router
    ↓
Check Authentication Status
    ├─ Not Logged In?
    │  ├─ Route is PUBLIC → Allow
    │  └─ Route is PROTECTED → Redirect to /auth
    │
    ├─ Logged In?
    │  ├─ Check User Role & Permissions
    │  ├─ Route is PROTECTED → Check Role Match
    │  │  ├─ Role matches → Allow
    │  │  └─ Role insufficient → Show 403
    │  └─ Route is PUBLIC → Allow
    │
    └─ Complete Auth Check
       ↓
       Load Page Component
       ↓
       Backend RLS Policies Verify Access
```

### Frontend Route Guard Implementation

```javascript
// Route Guard Logic

class RouteGuard {
  static checkAccess(route, user) {
    const routeConfig = ROUTE_CONFIG[route];
    
    // Public route - always allow
    if (routeConfig.requiresAuth === false) {
      return { allowed: true };
    }
    
    // Protected route - check authentication
    if (!user) {
      return { 
        allowed: false, 
        reason: 'NOT_AUTHENTICATED',
        redirect: '/auth'
      };
    }
    
    // Check role requirement
    if (routeConfig.minRole && !hasRequiredRole(user, routeConfig.minRole)) {
      return {
        allowed: false,
        reason: 'INSUFFICIENT_ROLE',
        redirect: '/dashboard'
      };
    }
    
    // Check county requirement if applicable
    if (routeConfig.requiresCounty && user.county !== routeConfig.county) {
      return {
        allowed: false,
        reason: 'COUNTY_MISMATCH'
      };
    }
    
    return { allowed: true };
  }
}
```

---

## Dashboard Architecture

### Authenticated User Shell

```
┌─────────────────────────────────────────────┐
│        Authenticated Top Navigation          │
│  Logo    Search    Notifications    Profile │
└─────────────────────────────────────────────┘
│                                             │
│ ┌──────────────┬───────────────────────────┤
│ │              │                           │
│ │  SIDEBAR     │      MAIN CONTENT         │
│ │  NAVIGATION  │                           │
│ │              │                           │
│ │  • Dashboard │                           │
│ │  • Profile   │    [Page Component]       │
│ │  • Community │                           │
│ │  • Education │                           │
│ │  • Opps      │                           │
│ │  • Collab    │                           │
│ │  • Contribute│                           │
│ │  • Settings  │                           │
│ │              │                           │
│ │  ─────────── │                           │
│ │  Logout      │                           │
│ │              │                           │
│ └──────────────┴───────────────────────────┤
│                                             │
└─────────────────────────────────────────────┘
```

### Public Navigation (Non-Authenticated)

```
┌─────────────────────────────────────────────┐
│      Public Top Navigation                  │
│  Logo    Counties    Tourism    About  Auth │
└─────────────────────────────────────────────┘
│                                             │
│                                             │
│         [Page Component]                    │
│                                             │
│         No Sidebar                          │
│         Full Width Content                  │
│                                             │
│                                             │
└─────────────────────────────────────────────┘
```

---

## Database RLS Policies

### Implementation Strategy

Each table will have RLS policies based on visibility level:

```sql
-- Example: Public Content
CREATE POLICY "public_visible"
  ON content
  FOR SELECT
  USING (visibility = 'public');

-- Example: Authenticated Content
CREATE POLICY "authenticated_visible"
  ON content
  FOR SELECT
  USING (
    visibility = 'authenticated_only'
    AND auth.uid() IS NOT NULL
  );

-- Example: County-Specific Content
CREATE POLICY "county_visible"
  ON content
  FOR SELECT
  USING (
    visibility = 'county_only'
    AND auth.jwt() -> 'user_metadata' ->> 'county' = county_id
  );

-- Example: Admin-Only Content
CREATE POLICY "admin_visible"
  ON content
  FOR SELECT
  USING (
    visibility = 'admin_only'
    AND (
      auth.jwt() -> 'user_metadata' ->> 'role' = 'super_admin'
      OR auth.jwt() -> 'user_metadata' ->> 'role' = 'county_admin'
    )
  );
```

---

## Content Visibility System

### Database Schema

```sql
-- Add visibility column to content table
ALTER TABLE content ADD COLUMN
  visibility text DEFAULT 'public'
    CHECK (visibility IN (
      'public',
      'authenticated_only', 
      'county_only',
      'admin_only',
      'private'
    ));

-- Add to announcements
ALTER TABLE announcements ADD COLUMN
  visibility text DEFAULT 'public';

-- Add to opportunities
ALTER TABLE opportunities ADD COLUMN
  visibility text DEFAULT 'public';

-- Add to community posts
ALTER TABLE community_posts ADD COLUMN
  visibility text DEFAULT 'authenticated_only';
```

### Frontend Content Filter

```javascript
function filterContentByVisibility(content, user) {
  return content.filter(item => {
    switch(item.visibility) {
      case 'public':
        return true;
      
      case 'authenticated_only':
        return user !== null;
      
      case 'county_only':
        return user && user.county === item.county;
      
      case 'admin_only':
        return user && (user.role === 'super_admin' || user.role === 'county_admin');
      
      case 'private':
        return user && (user.id === item.author_id || user.role === 'super_admin');
      
      default:
        return false;
    }
  });
}
```

---

## File Structure Organization

### New Directory Layout

```
components/
│
├─ PUBLIC/
│  ├─ landing-page/          (Homepage - public)
│  ├─ county-pages/          (County info - public)
│  ├─ tourism-pages/         (Tourism - public)
│  ├─ gallery-page/          (Gallery - public)
│  ├─ about-page/            (About - public)
│  └─ announcements-page/    (Public news)
│
├─ PROTECTED/
│  ├─ dashboard-page/        (Main hub)
│  ├─ profile-page/          (User profile)
│  ├─ settings-page/         (Preferences)
│  ├─ community-page/        (Discussions)
│  ├─ education-page/        (Learning)
│  ├─ opportunities-page/    (Opps)
│  ├─ collaborate-page/      (Teamwork)
│  └─ contribute-page/       (Submit)
│
├─ SHARED/
│  ├─ layouts/
│  │  ├─ public-layout.html          (Public nav)
│  │  ├─ authenticated-layout.html   (Dashboard nav)
│  │  ├─ admin-layout.html           (Admin nav)
│  │  └─ auth-layout.html            (Auth pages)
│  │
│  ├─ components/
│  │  ├─ top-nav.js
│  │  ├─ sidebar-nav.js
│  │  ├─ auth-guard.js
│  │  └─ content-filter.js
│  │
│  └─ js/
│     ├─ route-config.js       (Route definitions)
│     ├─ route-guard.js        (Protection logic)
│     ├─ visibility.js         (Content filtering)
│     └─ auth-service.js       (Supabase auth)
│
├─ auth-page/                (Auth pages)
├─ admin/                    (Super admin)
└─ supabase/
   └─ migrations/
      └─ rls-policies.sql    (New: RLS setup)
```

---

## Configuration Files

### Route Configuration (`route-config.js`)

```javascript
const ROUTE_CONFIG = {
  // PUBLIC ROUTES
  '/': {
    requiresAuth: false,
    layout: 'public'
  },
  '/county/:name': {
    requiresAuth: false,
    layout: 'public'
  },
  '/tourism': {
    requiresAuth: false,
    layout: 'public'
  },
  '/gallery': {
    requiresAuth: false,
    layout: 'public'
  },
  '/about': {
    requiresAuth: false,
    layout: 'public'
  },
  
  // PROTECTED ROUTES
  '/dashboard': {
    requiresAuth: true,
    minRole: 'contributor',
    layout: 'authenticated'
  },
  '/profile': {
    requiresAuth: true,
    minRole: 'contributor',
    layout: 'authenticated'
  },
  '/community': {
    requiresAuth: true,
    minRole: 'contributor',
    layout: 'authenticated'
  },
  '/education': {
    requiresAuth: true,
    minRole: 'contributor',
    layout: 'authenticated'
  },
  '/opportunities': {
    requiresAuth: true,
    minRole: 'contributor',
    layout: 'authenticated'
  },
  '/collaborate': {
    requiresAuth: true,
    minRole: 'contributor',
    layout: 'authenticated'
  },
  '/contribute': {
    requiresAuth: true,
    minRole: 'contributor',
    layout: 'authenticated'
  },
  
  // ADMIN ROUTES
  '/admin': {
    requiresAuth: true,
    minRole: 'super_admin',
    layout: 'admin'
  }
};
```

---

## Implementation Phases

### Phase 1: Route Infrastructure (Week 1)
- [ ] Create route configuration
- [ ] Implement frontend route guard
- [ ] Create public/authenticated layouts
- [ ] Deploy layout system

### Phase 2: Content Visibility (Week 1-2)
- [ ] Add visibility column to tables
- [ ] Implement RLS policies
- [ ] Create content filter function
- [ ] Test visibility levels

### Phase 3: Dashboard UI (Week 2)
- [ ] Design authenticated dashboard
- [ ] Create sidebar navigation
- [ ] Implement dashboard layout
- [ ] Add dashboard pages

### Phase 4: Page Migration (Week 2-3)
- [ ] Move pages to appropriate folders
- [ ] Update navigation links
- [ ] Test all routes
- [ ] Update documentation

### Phase 5: Testing & Hardening (Week 3)
- [ ] Test all route protection
- [ ] Test visibility levels
- [ ] Security audit
- [ ] Performance testing

---

## Security Considerations

### Frontend Security
✅ **Route Guards:** Check auth before rendering protected routes
✅ **Local Storage:** Secure session tokens
✅ **Redirect:** Unauthenticated users to /auth
✅ **Error Handling:** Don't expose sensitive info

### Backend Security (RLS)
✅ **Row-Level Security:** Enforce on database
✅ **User Verification:** Check auth.uid() on all queries
✅ **Role Verification:** Check user role from JWT
✅ **County Verification:** Validate county_id match

### Combined Security
✅ **Defense in Depth:** Frontend + Backend protection
✅ **Never Trust Client:** Always verify on backend
✅ **Clear Separation:** Public vs. authenticated code paths

---

## User Experience

### Public Visitor Experience
```
1. Land on homepage
2. Browse counties
3. Explore tourism
4. View galleries
5. Read about platform
6. Discover contributor stories (public content)
7. Click "Join as Contributor"
8. Signup/Login
9. Redirected to dashboard
```

### Authenticated Contributor Experience
```
1. Login
2. Redirected to dashboard
3. See personalized content
4. Browse community discussions
5. Access education resources
6. View opportunities
7. Submit content
8. Manage profile & preferences
9. Access restricted content
```

### Admin Experience
```
1. Login as admin
2. Redirected to admin dashboard
3. Manage users
4. Review content
5. Manage visibility levels
6. View analytics
7. System administration
```

---

## API Endpoints (With Authorization)

### Public Endpoints
```
GET  /api/counties          → Public counties list
GET  /api/tourism           → Public tourism content
GET  /api/gallery           → Public galleries
GET  /api/announcements     → Public announcements
GET  /api/about             → About information
```

### Protected Endpoints
```
GET  /api/community         → Requires: auth
GET  /api/education         → Requires: auth
GET  /api/opportunities     → Requires: auth
POST /api/content           → Requires: auth + contributor
GET  /api/profile/:id       → Requires: auth (limited fields)
```

### Admin Endpoints
```
GET  /api/admin/users       → Requires: super_admin
GET  /api/admin/content     → Requires: admin
PUT  /api/admin/visibility  → Requires: admin
```

---

## Testing Strategy

### Test Cases

**1. Public Route Access**
- [ ] Visitor can view home page
- [ ] Visitor can view county pages
- [ ] Visitor can view tourism pages
- [ ] Visitor can see galleries

**2. Protected Route Access**
- [ ] Unauthenticated user redirected from /dashboard
- [ ] Authenticated user can access /dashboard
- [ ] Insufficient role gets 403 error

**3. Content Visibility**
- [ ] Public content visible to all
- [ ] Auth-only content hidden from visitors
- [ ] County-only content filtered correctly
- [ ] Admin-only content hidden from contributors
- [ ] Private content only visible to owner

**4. Navigation**
- [ ] Public navigation shows correct items
- [ ] Authenticated navigation shows sidebar
- [ ] Admin navigation shows admin items

---

## Migration Path

### From Current to New

**Current State:**
- All pages mixed in components/
- Some pages require auth, some don't
- No clear separation

**New State:**
- Clear PUBLIC/PROTECTED folders
- Route guards on all protected pages
- RLS policies on database
- Content visibility levels

**Migration Steps:**
1. Create new folder structure
2. Move pages to appropriate folders
3. Implement route guards
4. Deploy RLS policies
5. Add visibility column to content
6. Update navigation
7. Test thoroughly
8. Deprecate old routes

---

## Success Metrics

✅ Public visitors can browse without login
✅ Protected pages require authentication
✅ Content visibility respected
✅ No unauthorized access possible
✅ Clear user experience differences
✅ Admin functions protected
✅ Dashboard accessible to contributors
✅ All routes properly configured

---

## Version & Status

**Architecture Version:** 3.0  
**Status:** Design Complete, Ready for Implementation  
**Phases:** 5  
**Estimated Time:** 3 weeks  
**Priority:** HIGH - Core system change

---

## Next Steps

1. Review this document
2. Approve the route structure
3. Begin Phase 1 implementation
4. Create route configuration files
5. Implement frontend route guards
6. Design dashboard layouts

**Ready to proceed with implementation?**
