# System Architecture & Integration Guide

## Platform Architecture Overview

### Three-Layer Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                      │
│  (HTML/CSS/JS Pages - User Interfaces)                      │
├─────────────────────────────────────────────────────────────┤
│  Auth Page  │  Profile Page  │  Settings Page  │  Dashboard │
│    (4-step)  │   (public)     │   (protected)   │  (planned) │
└────────────────────────┬────────────────────────────────────┘
                         │ API Calls
┌────────────────────────▼────────────────────────────────────┐
│                    BUSINESS LOGIC LAYER                      │
│              (JavaScript / Supabase Client)                  │
├─────────────────────────────────────────────────────────────┤
│  Auth Logic │ Profile Logic │ Subscription Logic │ Validation│
└────────────────────────┬────────────────────────────────────┘
                         │ SQL Queries
┌────────────────────────▼────────────────────────────────────┐
│                     DATA LAYER                              │
│           (PostgreSQL via Supabase REST API)                │
├─────────────────────────────────────────────────────────────┤
│  Users Table │ Topics Table │ Subscriptions Table │ Counties │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Model Relationships

### Complete Entity Diagram

```
┌──────────────────────────────────────┐
│          users                       │
├──────────────────────────────────────┤
│ id (PK)                              │
│ email                                │
│ full_name                            │
│ avatar_url                           │
│ profile_image_url          (NEW)     │
│ bio                                  │
│ role                                 │
│ contributor_kind           (NEW)     │
│ individual_category        (NEW)     │
│ organization_name          (NEW)     │
│ organization_description   (NEW)     │
│ institution_type           (NEW)     │
│ website_url                (NEW)     │
│ logo_url                   (NEW)     │
│ profile_visibility         (NEW)     │
│ county_id (FK)                       │
│ created_at                           │
│ updated_at                           │
│ last_login_at              (NEW)     │
└──────────────────────────────────────┘
         │                    │
         │ (many)             │ (many)
         │                    │
    ┌────▼──────────────────┐ │
    │   user_subscriptions  │ │
    │        (NEW)          │ │
    ├───────────────────────┤ │
    │ id (PK)               │ │
    │ user_id (FK)──────────┼─┘
    │ topic_id (FK)─────┐   │
    │ subscribed_at     │   │
    └───────────────────┼───┘
                        │
    ┌───────────────────▼───────────────────┐
    │   notification_topics               │
    │          (NEW)                       │
    ├──────────────────────────────────────┤
    │ id (PK)                              │
    │ slug (UNIQUE)                        │
    │ name (UNIQUE)                        │
    │ description                          │
    │ icon_emoji                           │
    │ color                                │
    │ display_order                        │
    │ is_active                            │
    │ created_at                           │
    │ updated_at                           │
    └──────────────────────────────────────┘
```

---

## Page Flow Diagram

### User Journey

```
START
  │
  ├─→ Not Logged In
  │     │
  │     └─→ /auth-page/index.html (4-step signup)
  │           ├─ Step 1: Platform role + county
  │           ├─ Step 2: Contributor type + category (NEW)
  │           ├─ Step 3: Email + password
  │           └─ Step 4: Confirmation
  │
  └─→ Logged In
        │
        ├─→ /index-page/index.html (Home)
        │    └─ Links to profile & settings
        │
        ├─→ /profile-page/index.html?id={user_id} (View Profile)
        │    ├─ Display user info
        │    ├─ Show statistics
        │    └─ [If own profile] → Settings button
        │
        └─→ /settings-page/index.html (Account Settings)
             ├─ Profile Tab
             │  ├─ Edit name, bio
             │  └─ Upload avatar
             ├─ Subscriptions Tab (NEW)
             │  ├─ Select from 14 topics
             │  └─ Save preferences
             ├─ Notifications Tab
             │  └─ Email preferences
             └─ Security Tab
                ├─ Change password
                └─ Delete account
```

---

## Component Integration Points

### 1. Auth Page ↔ Profile Creation

```
User Completes Signup
    ↓
onRegister() function
    ↓
Collects all form data:
  • Email, Password (auth)
  • Full Name, Bio, County (profile)
  • Platform Role (admin/contributor)
  • Contributor Kind (12 types)         ← NEW
  • Individual Category (15 types)      ← NEW
  • Organization Fields (if applicable) ← NEW
    ↓
CREATE User in Supabase Auth
    ↓
INSERT User profile in users table
    ↓
Redirect to dashboard/home
```

### 2. Profile Page ↔ Settings Page

```
View Profile: /profile-page/index.html?id={user_id}
    ↓
Load user data:
  SELECT id, full_name, email, bio, profile_image_url,
    contributor_kind, individual_category,
    organization_*, created_at, county
  FROM users WHERE id = ?
    ↓
Display profile info
    ↓
If own profile:
  └─→ Show Settings button
      ↓
      Navigate to /settings-page/index.html
      ↓
      Load same user data + subscriptions
      ↓
      Can edit and save
```

### 3. Settings Page ↔ Subscriptions System

```
Settings: Subscriptions Tab
    ↓
Load notification_topics:
  SELECT * FROM notification_topics
    WHERE is_active = true
    ORDER BY display_order
    ↓ (14 topics)
    ↓
Load user subscriptions:
  SELECT topic_id FROM user_subscriptions
    WHERE user_id = ?
    ↓
Render 14-topic visual grid
    ↓
Pre-check user's subscribed topics
    ↓
User selects/deselects topics
    ↓
Click Save Subscriptions
    ↓
Compare previous vs current selections
    ↓
INSERT new subscriptions
DELETE removed subscriptions
    ↓
Show success: "Subscriptions updated! (X topics)"
```

---

## Database Query Flows

### Flow 1: Complete User Registration

```sql
-- 1. Auth system creates user (handled by Supabase Auth)
INSERT INTO auth.users (email, encrypted_password, ...)
VALUES (...)

-- 2. Create profile in users table
INSERT INTO users (
  id, email, full_name, bio, 
  county_id, role,
  contributor_kind, individual_category,
  organization_name, organization_description,
  institution_type, website_url,
  profile_visibility
) VALUES (...)

-- Result: User account ready for profile/subscriptions
```

### Flow 2: Load User Profile for Display

```sql
-- Single query with relationships
SELECT 
  u.id, u.full_name, u.email, u.bio,
  u.profile_image_url, u.contributor_kind,
  u.individual_category, u.organization_name,
  u.organization_description, u.institution_type,
  u.website_url, u.created_at,
  c.name as county_name,
  COUNT(DISTINCT cs.id) as content_count,
  COALESCE(SUM(cs.view_count), 0) as total_views,
  COUNT(DISTINCT us.id) as subscriptions_count
FROM users u
LEFT JOIN counties c ON u.county_id = c.id
LEFT JOIN content cs ON u.id = cs.author_id
LEFT JOIN user_subscriptions us ON u.id = us.user_id
WHERE u.id = ?
GROUP BY u.id, c.id

-- Result: All data needed to render profile page
```

### Flow 3: Manage Subscriptions

```sql
-- Get current subscriptions
SELECT topic_id FROM user_subscriptions WHERE user_id = ?

-- Add new subscriptions
INSERT INTO user_subscriptions (user_id, topic_id)
VALUES (?, ?), (?, ?), ...
ON CONFLICT DO NOTHING

-- Remove unsubscribed topics
DELETE FROM user_subscriptions 
WHERE user_id = ? AND topic_id IN (?, ?, ...)

-- Get updated counts
SELECT name, COUNT(*) as subscribers
FROM notification_topics t
LEFT JOIN user_subscriptions s ON t.id = s.topic_id
GROUP BY t.id
```

---

## Request/Response Flows

### Request 1: Update Profile

```
Frontend: /settings-page/index.html
    │
    └─→ POST to Supabase
        URL: https://[project].supabase.co/rest/v1/users?id=eq.[user_id]
        Headers: Authorization, Content-Type: application/json
        Body: {
          full_name: "New Name",
          bio: "New Bio",
          profile_image_url: "https://...",
          organization_name: "Org Name",
          ...
        }
        │
        └─→ Supabase REST API
            │
            └─→ PostgreSQL
                UPDATE users SET ... WHERE id = ?
                │
                └─→ Response: 200 OK
                    │
                    └─→ Frontend: Show "Profile updated!"
```

### Request 2: Subscribe to Topics

```
Frontend: /settings-page/index.html
    │
    └─→ POST to Supabase
        URL: https://[project].supabase.co/rest/v1/user_subscriptions
        Body: [
          { user_id: "uuid-123", topic_id: "uuid-scholarships" },
          { user_id: "uuid-123", topic_id: "uuid-jobs" },
          ...
        ]
        │
        └─→ Supabase REST API
            │
            └─→ PostgreSQL
                INSERT INTO user_subscriptions ...
                │
                └─→ Response: 201 Created
                    │
                    └─→ Frontend: Show "5 topics saved!"
```

---

## State Management

### Frontend State Variables

#### Auth Page
```javascript
// Step tracking
currentStep = 1  // 1-4
completedSteps = []

// Form data (new in Phase 1)
selectedContributorKind = null      // 12 types
selectedIndividualCategory = null   // 15 categories

// Form data (existing)
selectedRole = null
selectedCounty = null
email = ""
password = ""
```

#### Profile Page
```javascript
// URL parameter
userId = getUrlParam('id')

// Loaded data
currentUser = null  // From auth
viewedUser = null   // From URL parameter
subscriptionCount = 0
contentStats = {}

// UI state
isOwnProfile = currentUser.id === userId
isLoading = false
```

#### Settings Page
```javascript
// User data
profile = {}
topics = []  // All 14 notification topics
currentSubscriptions = []  // User's subscriptions

// UI state
activeTab = 'profile'
isLoading = false
isDirty = false
selectedTopics = new Set()  // For subscriptions tab

// Form state
avatar = null  // File for upload
```

---

## Error Handling Flow

```
User Action (Signup/Save/Subscribe)
    ↓
Client-side Validation
    ├─ Required fields empty?
    ├─ Email format valid?
    ├─ Passwords match?
    ├─ File size ok?
    └─ → Show validation error
         Stop here
    ↓ (Validation passes)
Send to Supabase
    ↓
Server-side Validation
    ├─ User exists?
    ├─ Email unique?
    ├─ Type constraints?
    └─ → DB error
         ↓
Response Error
    ├─ 400: Bad Request
    ├─ 401: Unauthorized
    ├─ 409: Conflict
    └─ → Show error toast
         Stop here
    ↓ (No error)
Success
    ├─ Update local state
    ├─ Refresh UI
    └─ Show success message
```

---

## Caching & Performance Strategy

### What's Cached

1. **notification_topics** (Level: Browser)
   - Load once on settings page
   - Stored in JS variable
   - 14 items, rarely change
   - Refresh on page reload

2. **User subscriptions** (Level: Browser)
   - Load on settings page init
   - Compare with selected topics
   - Refresh on save
   - Diff updates to minimize DB writes

3. **User profile** (Level: Browser)
   - Load on profile page open
   - Cache for session
   - Refresh on manual reload

### Query Optimization

```
Problem: Loading profile with statistics
Solution: Single JOIN query with aggregation

SELECT u.*, COUNT(c.id) as content_count
FROM users u
LEFT JOIN content c ON u.id = c.author_id
WHERE u.id = ?
GROUP BY u.id

Result: One query instead of three
```

---

## Integration Checklist

### Pre-Integration
- [ ] Read all migration files
- [ ] Understand data structure
- [ ] Review page components
- [ ] Plan deployment timeline

### Integration Phase
- [ ] Deploy Phase 1 migration
- [ ] Deploy Phase 1 frontend
- [ ] Test Phase 1 fully
- [ ] Deploy Phase 2 migration
- [ ] Deploy Phase 2 frontend
- [ ] Update navigation
- [ ] Run full test suite

### Post-Integration
- [ ] Monitor database
- [ ] Check error logs
- [ ] Get user feedback
- [ ] Document integration
- [ ] Plan next features

---

## Future Integration Points

### Ready for Integration

1. **Personalized Feed** (Priority: HIGH)
   - Use `user_subscriptions` to filter content
   - Show content matching topics
   - Sort by relevance

2. **Smart Notifications** (Priority: HIGH)
   - Notify on new content in subscribed topics
   - Batch daily digest
   - User preference-based frequency

3. **Discovery Pages** (Priority: MEDIUM)
   - Topic-specific content pages
   - Contributor type filtering
   - Trending contributors

### Requires Additional Work

1. **Recommendation Engine** (Priority: MEDIUM)
   - Analyze subscription patterns
   - Suggest related topics
   - ML-based suggestions

2. **Social Features** (Priority: MEDIUM)
   - Follow other contributors
   - Comment/react system
   - Bookmarks/favorites

3. **Advanced Analytics** (Priority: LOW)
   - Contributor growth tracking
   - Topic popularity trends
   - Engagement analytics

---

## Configuration Reference

### Supabase Configuration

```javascript
// Client initialization
const sb = createClient(
  'https://choagncxtmsewzvxoncx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
);

// User session check
const session = await sb.auth.getSession();
const isAuthenticated = !!session?.data?.session;

// Current user
const currentUser = session?.data?.session?.user;
```

### API Endpoints (Auto-generated by Supabase)

```
GET    /rest/v1/users              - List users
GET    /rest/v1/users?id=eq.{id}   - Get user
POST   /rest/v1/users              - Create user
PATCH  /rest/v1/users?id=eq.{id}   - Update user

GET    /rest/v1/notification_topics     - List topics
GET    /rest/v1/user_subscriptions      - List subscriptions
POST   /rest/v1/user_subscriptions      - Create subscription
DELETE /rest/v1/user_subscriptions      - Delete subscription
```

---

## Summary

This architecture provides:
- ✅ Clean separation of concerns (3 layers)
- ✅ Scalable database design (indexes, normalization)
- ✅ Responsive user interface
- ✅ Real-time data synchronization
- ✅ Error handling & validation
- ✅ Performance optimization
- ✅ Future extension points

All components are ready for immediate deployment and integrate seamlessly with existing platform infrastructure.

---

**Architecture Version:** 2.0  
**Status:** ✅ Complete & Ready  
**Last Updated:** May 13, 2026
