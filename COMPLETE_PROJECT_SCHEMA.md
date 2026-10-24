# 📊 Liberia CountySphere - Complete Project Schema

**Comprehensive schema documentation for the entire platform - Database, API, Architecture, and Frontend Structure**

---

## 📑 Table of Contents

1. [Project Overview](#project-overview)
2. [Database Schema (Supabase PostgreSQL)](#database-schema)
3. [Authentication & Security](#authentication--security)
4. [API Reference](#api-reference)
5. [Frontend Architecture](#frontend-architecture)
6. [User Roles & Permissions](#user-roles--permissions)
7. [Data Flow & Relationships](#data-flow--relationships)
8. [File Storage Structure](#file-storage-structure)

---

## 🎯 Project Overview

**Liberia CountySphere** is a comprehensive web platform for Liberia's 15 counties that enables:
- **Visitors**: Browse county information and published content (no login required)
- **Contributors**: Submit and manage county-related content (with login)
- **County Admins**: Review, approve, and manage content for their county
- **Super Admins**: Platform-wide administration and settings

### Key Features
- County information pages with leaders, tourism, and opportunities
- Content submission and approval workflow
- Comments and reactions on published content
- Analytics and engagement tracking
- Multi-tenant architecture with county-based access control
- Role-based access control (RBAC)

---

## 🗄️ Database Schema

### Core Enumerations (ENUM Types)

```sql
-- User Roles
user_role: 'super_admin' | 'county_admin' | 'contributor' | 'visitor'

-- County Status
county_status: 'live' | 'coming_soon' | 'draft'

-- Content Types
content_type: 'story' | 'announcement' | 'article'

-- Content Status (Workflow)
content_status: 'draft' | 'pending_review' | 'published' | 'rejected'

-- Opportunity Types
opportunity_type: 'scholarship' | 'internship' | 'training' | 'fellowship' | 'grant' | 'job'

-- Opportunity Status
opportunity_status: 'open' | 'closing_soon' | 'closed'

-- Event Status
event_status: 'upcoming' | 'ongoing' | 'past' | 'cancelled'

-- Leader Category
leader_category: 'current' | 'historical' | 'traditional' | 'past'

-- Notification Type
notification_type: 'content_approved' | 'content_rejected' | 'content_submitted' | 'welcome' | 'announcement'

-- Analytics Event
analytics_event: 'page_view' | 'content_view' | 'opportunity_view' | 'search'

-- Contributor Classification
contributor_kind: 'individual' | 'organization' | 'ngo' | 'university' | 'vocational_training_center' | 'high_school' | 'media_institution' | 'government_institution' | 'healthcare_institution' | 'community_group' | 'business' | 'other'

-- Individual Category
individual_category: 'student' | 'journalist' | 'writer' | 'teacher' | 'doctor' | 'researcher' | 'software_developer' | 'youth_advocate' | 'photographer' | 'designer' | 'entrepreneur' | 'volunteer' | 'activist' | 'farmer' | 'content_creator' | 'other'

-- Profile Visibility
profile_visibility: 'public' | 'contributors_only' | 'private'

-- Content Reaction Types
reaction_type: 'like' | 'love' | 'celebrate' | 'insightful' | 'sad'
```

### Master Tables

#### **1. counties** (Core Reference Table)
Master data for all 15 Liberian counties. Every other table links back to this.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | TEXT | County name (unique) - e.g., "Bong County" |
| `slug` | TEXT | URL-friendly slug (unique) - e.g., "bong-county" |
| `region` | TEXT | Geographic region - e.g., "North Central" |
| `capital` | TEXT | County capital - e.g., "Gbarnga" |
| `status` | county_status | Publication status |
| `tagline` | TEXT | County motto or tagline |
| `description` | TEXT | County overview/description |
| `population` | TEXT | Population figure |
| `area_km2` | TEXT | Area in square kilometers |
| `established` | TEXT | Year established - e.g., "1964" |
| `districts_count` | INTEGER | Number of administrative districts |
| `primary_color` | TEXT | Hex color for county branding |
| `cover_image_url` | TEXT | County header image URL |
| `coat_of_arms_url` | TEXT | County coat of arms image URL |
| `created_at` | TIMESTAMPTZ | Timestamp created |
| `updated_at` | TIMESTAMPTZ | Timestamp last updated (auto-updated) |

**Indexes**: name, slug
**Cascade behavior**: All county data deletes with county deletion

---

#### **2. users** (Extends Supabase auth.users)
User profiles extending Supabase's built-in authentication.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (references auth.users.id) |
| `county_id` | UUID | FK → counties (user's primary county) |
| `full_name` | TEXT | User's full name |
| `email` | TEXT | Email (unique) |
| `role` | user_role | Platform role |
| `bio` | TEXT | User biography/about section |
| `avatar_url` | TEXT | Profile picture URL |
| `verified` | BOOLEAN | Email verification status |
| `is_active` | BOOLEAN | Account active status |
| `contributor_kind` | contributor_kind | Type of contributor (if applicable) |
| `individual_category` | individual_category | Category if individual contributor |
| `organization_name` | TEXT | Organization name (if not individual) |
| `organization_description` | TEXT | Organization description |
| `institution_type` | TEXT | Type of institution (e.g., "University") |
| `website_url` | TEXT | Website URL |
| `logo_url` | TEXT | Logo/branding image |
| `profile_visibility` | profile_visibility | Profile access level |
| `created_at` | TIMESTAMPTZ | Account creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last profile update |

**Indexes**: county_id, role, contributor_kind, profile_visibility
**Authentication**: Password managed by Supabase auth
**Cascade behavior**: Content/contributions deleted when user deleted

---

#### **3. content** (User-Generated Content)
All published stories, announcements, and articles. Supports full approval workflow.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `county_id` | UUID | FK → counties (content's county) |
| `author_id` | UUID | FK → users (content creator) |
| `reviewed_by` | UUID | FK → users (admin reviewer) |
| `type` | content_type | story \| announcement \| article |
| `title` | TEXT | Content title |
| `body` | TEXT | Main content/body text |
| `excerpt` | TEXT | Short preview text |
| `cover_image_url` | TEXT | Featured image URL |
| `status` | content_status | Workflow status |
| `pinned` | BOOLEAN | Pin to top of county page |
| `rejection_note` | TEXT | Reason if rejected by admin |
| `view_count` | INTEGER | Total views (analytics) |
| `tags` | TEXT[] | Array of tag strings |
| `published_at` | TIMESTAMPTZ | Publication timestamp |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

**Indexes**: county_id, status, author_id, published_at (desc), pinned
**Workflow**:
- Draft → Pending Review → Published (or Rejected)
- Only "published" content visible to visitors
- Authors can edit drafts; admins can approve/reject

---

#### **4. leaders** (County Leadership)
Current and historical leaders for each county.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `county_id` | UUID | FK → counties |
| `name` | TEXT | Leader's full name |
| `role` | TEXT | Position/title - e.g., "County Superintendent" |
| `era` | TEXT | Time period - e.g., "2024 – Present" |
| `bio` | TEXT | Biography |
| `photo_url` | TEXT | Leader's photo |
| `category` | leader_category | current \| historical \| traditional \| past |
| `display_order` | INTEGER | Sort order (for UI) |
| `is_published` | BOOLEAN | Publish status |
| `created_at` | TIMESTAMPTZ | Created timestamp |
| `updated_at` | TIMESTAMPTZ | Updated timestamp |

**Indexes**: county_id, category

---

#### **5. opportunities** (Jobs, Scholarships, Grants, etc.)
Employment, educational, and funding opportunities by county.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `county_id` | UUID | FK → counties |
| `author_id` | UUID | FK → users (submitter) |
| `type` | opportunity_type | scholarship \| internship \| job \| grant \| etc. |
| `title` | TEXT | Opportunity title |
| `description` | TEXT | Full description and requirements |
| `deadline` | DATE | Application deadline |
| `status` | opportunity_status | open \| closing_soon \| closed |
| `apply_url` | TEXT | External application link |
| `contact_email` | TEXT | Contact email for inquiries |
| `tags` | TEXT[] | Category/topic tags |
| `is_published` | BOOLEAN | Publication status |
| `created_at` | TIMESTAMPTZ | Created timestamp |
| `updated_at` | TIMESTAMPTZ | Updated timestamp |

**Indexes**: county_id, status, deadline

---

#### **6. events** (Community Events & Festivals)
Community events, conferences, festivals, and gatherings.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `county_id` | UUID | FK → counties |
| `author_id` | UUID | FK → users (event organizer) |
| `title` | TEXT | Event name |
| `description` | TEXT | Event details |
| `event_date` | TIMESTAMPTZ | Event start date/time |
| `end_date` | TIMESTAMPTZ | Event end date/time |
| `location` | TEXT | Physical location |
| `cover_image_url` | TEXT | Event poster/image |
| `status` | event_status | upcoming \| ongoing \| past \| cancelled |
| `is_published` | BOOLEAN | Published status |
| `created_at` | TIMESTAMPTZ | Created timestamp |
| `updated_at` | TIMESTAMPTZ | Updated timestamp |

---

#### **7. content_comments** (Comments on Content)
Nested comment system for user engagement on published content.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `content_id` | UUID | FK → content (commented on) |
| `user_id` | UUID | FK → users (commenter) |
| `parent_comment_id` | UUID | FK → content_comments (for nested replies) |
| `body` | TEXT | Comment text |
| `is_edited` | BOOLEAN | Edit flag |
| `is_deleted` | BOOLEAN | Soft delete flag |
| `created_at` | TIMESTAMPTZ | Created timestamp |
| `updated_at` | TIMESTAMPTZ | Updated timestamp |
| `deleted_at` | TIMESTAMPTZ | Soft delete timestamp |

**Indexes**: content_id, user_id, parent_comment_id, created_at (desc)
**Features**: Supports nested replies, soft deletes, edit tracking

---

#### **8. content_reactions** (Likes, Reactions)
User reactions (emoji-style) on published content.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `content_id` | UUID | FK → content |
| `user_id` | UUID | FK → users |
| `reaction_type` | reaction_type | like \| love \| celebrate \| insightful \| sad |
| `created_at` | TIMESTAMPTZ | Created timestamp |
| `updated_at` | TIMESTAMPTZ | Updated timestamp |

**Constraints**: UNIQUE(content_id, user_id) - one reaction per user per content
**Indexes**: content_id, user_id, reaction_type

---

#### **9. comment_reports** (Moderation)
Reports on inappropriate comments for admin review.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `comment_id` | UUID | FK → content_comments |
| `reported_by` | UUID | FK → users |
| `reason` | TEXT | Report reason/justification |
| `status` | TEXT | pending \| reviewed \| resolved |
| `admin_notes` | TEXT | Admin review notes |
| `resolved_at` | TIMESTAMPTZ | Resolution timestamp |
| `created_at` | TIMESTAMPTZ | Report creation |
| `updated_at` | TIMESTAMPTZ | Last update |

**Indexes**: status, created_at (desc)

---

#### **10. comment_likes** (Comment Engagement)
Users liking comments to show appreciation.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `comment_id` | UUID | FK → content_comments |
| `user_id` | UUID | FK → users |
| `created_at` | TIMESTAMPTZ | Created timestamp |

---

#### **11. media** (File Storage Metadata)
Metadata for uploaded images and files (actual files in Supabase Storage).

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `county_id` | UUID | FK → counties |
| `uploader_id` | UUID | FK → users |
| `content_id` | UUID | FK → content (optional, if associated) |
| `file_url` | TEXT | Supabase Storage URL |
| `file_type` | TEXT | MIME type - e.g., "image/jpeg" |
| `file_name` | TEXT | Original filename |
| `file_size_bytes` | INTEGER | File size |
| `alt_text` | TEXT | Accessibility description |
| `uploaded_at` | TIMESTAMPTZ | Upload timestamp |

**Indexes**: county_id, content_id

---

#### **12. notifications** (In-App Alerts)
In-app notifications for contributors and admins about platform activities.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | FK → users |
| `type` | notification_type | content_approved \| content_rejected \| etc. |
| `title` | TEXT | Notification title |
| `message` | TEXT | Notification message |
| `link` | TEXT | Deep link to related content |
| `read` | BOOLEAN | Read status |
| `created_at` | TIMESTAMPTZ | Created timestamp |

**Indexes**: user_id, read (WHERE read = false)

---

#### **13. analytics** (Event Tracking)
Lightweight analytics for page views and engagement (no personal data).

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `county_id` | UUID | FK → counties |
| `content_id` | UUID | FK → content (optional) |
| `event_type` | analytics_event | page_view \| content_view \| search \| etc. |
| `visitor_country` | TEXT | Country from request headers |
| `referrer` | TEXT | HTTP referrer |
| `created_at` | TIMESTAMPTZ | Event timestamp |

**Indexes**: county_id, event_type, created_at (desc)

---

#### **14. districts** (Administrative Divisions)
Administrative districts within each county.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `county_id` | UUID | FK → counties |
| `name` | TEXT | District name |
| `description` | TEXT | District description |
| `tags` | TEXT[] | Category tags |
| `display_order` | INTEGER | Sort order |
| `created_at` | TIMESTAMPTZ | Created timestamp |

---

#### **15. tourism_sites** (Tourist Attractions)
Points of interest, attractions, and tourist sites in each county.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `county_id` | UUID | FK → counties |
| `name` | TEXT | Site name |
| `slug` | TEXT | URL-friendly slug |
| `description` | TEXT | Site description |
| `location` | TEXT | Physical address/location |
| `cover_image_url` | TEXT | Main image |
| `gallery_urls` | TEXT[] | Array of additional images |
| `category` | TEXT | Site category - e.g., "Beach", "Historical" |
| `entry_fee` | TEXT | Entry fee information |
| `opening_hours` | TEXT | Operating hours |
| `contact_info` | TEXT | Contact details |
| `latitude` | NUMERIC | GPS latitude |
| `longitude` | NUMERIC | GPS longitude |
| `is_featured` | BOOLEAN | Featured on county page |
| `is_published` | BOOLEAN | Published status |
| `created_at` | TIMESTAMPTZ | Created timestamp |
| `updated_at` | TIMESTAMPTZ | Updated timestamp |

**Indexes**: county_id, slug

---

#### **16. galleries** (Image Collections)
Organized galleries/albums of images for counties.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `county_id` | UUID | FK → counties |
| `title` | TEXT | Gallery title |
| `description` | TEXT | Gallery description |
| `cover_image_url` | TEXT | Gallery cover image |
| `is_published` | BOOLEAN | Published status |
| `created_at` | TIMESTAMPTZ | Created timestamp |

**Indexes**: county_id

---

#### **17. gallery_images** (Gallery Items)
Individual images within galleries.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `gallery_id` | UUID | FK → galleries |
| `image_url` | TEXT | Image URL |
| `caption` | TEXT | Image caption |
| `display_order` | INTEGER | Sort order |
| `created_at` | TIMESTAMPTZ | Created timestamp |

**Indexes**: gallery_id

---

#### **18. partners** (County Partners)
Organizations and businesses partnering with counties.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `county_id` | UUID | FK → counties |
| `name` | TEXT | Partner name |
| `logo_url` | TEXT | Partner logo |
| `website_url` | TEXT | Partner website |
| `description` | TEXT | About the partner |
| `category` | TEXT | Partner category |
| `is_published` | BOOLEAN | Published status |
| `created_at` | TIMESTAMPTZ | Created timestamp |

**Indexes**: county_id

---

#### **19. newsletters** (Subscription Management)
Email subscribers for county newsletters.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `email` | TEXT | Email address (unique) |
| `county_id` | UUID | FK → counties |
| `subscribed_at` | TIMESTAMPTZ | Subscription timestamp |

**Indexes**: county_id

---

### Relationships Diagram

```
counties (Master)
    ├── users (assigned to county)
    │   ├── content (authored)
    │   ├── leaders (edited by)
    │   ├── opportunities (authored)
    │   ├── events (organized)
    │   ├── media (uploaded)
    │   ├── content_comments (written)
    │   ├── content_reactions (created)
    │   ├── comment_reports (filed by)
    │   └── comment_likes (created)
    ├── content
    │   ├── content_comments (nested)
    │   ├── content_reactions (reactions)
    │   └── media (associated)
    ├── leaders
    ├── opportunities
    ├── events
    ├── districts
    ├── tourism_sites
    ├── galleries
    │   └── gallery_images
    ├── partners
    └── newsletters
```

---

## 🔐 Authentication & Security

### Supabase Authentication

**Built-in Features**:
- Email/password authentication
- Password reset via email
- Session management with JWT tokens
- Automatic session persistence

**Authentication Flow**:

```javascript
// Registration
await supabaseClient.auth.signUp({
  email: 'user@example.com',
  password: 'Password123',
  options: {
    data: {
      full_name: 'John Doe',
      role: 'contributor',
      county_id: 'uuid',
      contributor_kind: 'individual',
      individual_category: 'journalist'
    }
  }
});

// Login
await supabaseClient.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'Password123'
});

// Get Current User
const { data: { user } } = await supabaseClient.auth.getUser();

// Logout
await supabaseClient.auth.signOut();
```

### JWT Custom Claims

JWT tokens include custom claims for RLS policies:

```javascript
// JWT payload includes:
{
  "role": "contributor",  // from users table
  "email": "user@example.com",
  "sub": "user-uuid"
}
```

### Row Level Security (RLS)

All tables have RLS enabled. Key policies:

**Content Visibility**:
- Published content → visible to everyone
- Draft/pending → only author and admins can see
- Rejected → only author and admins can see

**User Profiles**:
- Public profiles → visible to everyone
- Contributors only → visible to logged-in users
- Private → only own user can see

**Comments**:
- Comments on published content → visible to everyone
- All users can create comments on published content
- Only authors/admins can edit/delete

**Admin Actions**:
- Only super_admin and county_admin can approve/reject content
- County admins scoped to their county only

---

## 📡 API Reference

### Core API Endpoints

#### User Management

```javascript
// GET user profile
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId)
  .single();

// UPDATE user profile
await supabase
  .from('users')
  .update({
    full_name: 'New Name',
    bio: 'Updated bio',
    avatar_url: 'https://...'
  })
  .eq('id', userId);

// GET all contributors (paginated)
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('role', 'contributor')
  .order('created_at', { ascending: false })
  .range(0, 19);  // 20 per page
```

#### Content Management

```javascript
// GET published content by county
const { data } = await supabase
  .from('content')
  .select('*, counties(name), users(full_name)')
  .eq('county_id', countyId)
  .eq('status', 'published')
  .order('published_at', { ascending: false });

// CREATE new content (draft)
const { data } = await supabase
  .from('content')
  .insert({
    county_id: countyId,
    author_id: userId,
    type: 'story',
    title: 'Content Title',
    body: 'Content body...',
    status: 'draft'
  });

// UPDATE content
await supabase
  .from('content')
  .update({ title: 'New Title', body: 'New body' })
  .eq('id', contentId);

// SUBMIT for review
await supabase
  .from('content')
  .update({ status: 'pending_review' })
  .eq('id', contentId);

// APPROVE (admin)
await supabase
  .from('content')
  .update({
    status: 'published',
    reviewed_by: adminId,
    published_at: new Date()
  })
  .eq('id', contentId);

// REJECT (admin)
await supabase
  .from('content')
  .update({
    status: 'rejected',
    rejection_note: 'Reason for rejection...'
  })
  .eq('id', contentId);
```

#### Comments & Reactions

```javascript
// GET comments for content
const { data } = await supabase
  .from('content_comments')
  .select('*, users(full_name, avatar_url)')
  .eq('content_id', contentId)
  .is('parent_comment_id', null)  // top-level only
  .order('created_at', { ascending: false });

// GET comment replies
const { data } = await supabase
  .from('content_comments')
  .select('*, users(full_name, avatar_url)')
  .eq('parent_comment_id', parentCommentId)
  .order('created_at', { ascending: true });

// ADD comment
await supabase
  .from('content_comments')
  .insert({
    content_id: contentId,
    user_id: userId,
    parent_comment_id: parentId,  // null for top-level
    body: 'Comment text...'
  });

// EDIT comment
await supabase
  .from('content_comments')
  .update({ body: 'Updated text...', is_edited: true })
  .eq('id', commentId)
  .eq('user_id', userId);

// DELETE comment (soft delete)
await supabase
  .from('content_comments')
  .update({ is_deleted: true, deleted_at: new Date() })
  .eq('id', commentId);

// ADD reaction
const { data } = await supabase
  .from('content_reactions')
  .upsert({
    content_id: contentId,
    user_id: userId,
    reaction_type: 'like'  // or love, celebrate, etc.
  });

// GET reaction counts
const { data } = await supabase
  .from('content_reactions')
  .select('reaction_type, count', { count: 'exact' })
  .eq('content_id', contentId)
  .group_by('reaction_type');
```

#### Opportunities & Events

```javascript
// GET opportunities by county
const { data } = await supabase
  .from('opportunities')
  .select('*')
  .eq('county_id', countyId)
  .eq('is_published', true)
  .in('status', ['open', 'closing_soon'])
  .order('deadline', { ascending: true });

// CREATE opportunity
await supabase
  .from('opportunities')
  .insert({
    county_id: countyId,
    author_id: userId,
    type: 'scholarship',
    title: 'Opportunity Title',
    description: 'Details...',
    deadline: '2026-12-31',
    apply_url: 'https://...'
  });

// GET events by county
const { data } = await supabase
  .from('events')
  .select('*')
  .eq('county_id', countyId)
  .in('status', ['upcoming', 'ongoing'])
  .order('event_date', { ascending: true });
```

#### Tourism & Galleries

```javascript
// GET tourism sites
const { data } = await supabase
  .from('tourism_sites')
  .select('*')
  .eq('county_id', countyId)
  .eq('is_published', true)
  .order('is_featured', { ascending: false });

// GET galleries
const { data } = await supabase
  .from('galleries')
  .select('*, gallery_images(*)')
  .eq('county_id', countyId);
```

---

## 🎨 Frontend Architecture

### Folder Structure

```
components/
├── index-page/              # Landing/home page
├── county-pages/            # Individual county pages
│   ├── bong.html
│   ├── montserrado.html
│   └── lofa.html
├── auth-page/              # Registration/login
│   ├── auth.html
│   ├── auth.js
│   └── css/
├── profile-page/           # User profiles
├── contributor-dashboard/  # Contributor dashboard
│   ├── index.html
│   ├── dashboard.js
│   └── dashboard.css
├── county-admin-dashboard/ # Admin dashboard
│   ├── index.html
│   ├── dashboard.js
│   └── dashboard.css
├── settings-page/          # User settings
├── shared/                 # Shared components
├── superadmin/             # Super admin controls
├── css/                    # Global styles
│   ├── design-system.css
│   ├── county-branding.css
│   └── comments-reactions.css
└── js/                     # Global utilities
    ├── supabaseClient.js   # Supabase initialization
    └── auth-guard.js       # Auth middleware
```

### Key Frontend Components

#### **County Pages** (Public)
- Display county information
- List published content (stories, announcements)
- Show tourism sites, events, opportunities
- Display leaders and partners
- Comment section for published content
- Reaction buttons (anonymous-friendly)

#### **Authentication** (auth-page/)
- Registration form (4-step process)
- Login form
- Password reset
- Role & county selection

#### **Contributor Dashboard** (contributor-dashboard/)
- List user's content (draft, submitted, published, rejected)
- Create new content form
- Edit/delete drafts
- Submit for review
- View notifications
- Profile management

#### **Admin Dashboard** (county-admin-dashboard/)
- Approve/reject submitted content
- View pending submissions
- Manage county leaders
- Manage tourism sites
- View analytics/statistics
- Moderate comments

#### **Global Components** (shared/)
- Navigation bar
- Header/footer
- Auth guard (route protection)
- Notification toasts
- Loading spinners

### Frontend Technologies

- **HTML5** - Markup
- **CSS3** - Styling with custom properties for theming
- **Vanilla JavaScript** - No framework dependencies
- **Supabase JS Client** - Database and auth
- **Responsive Design** - Mobile-first approach

---

## 👥 User Roles & Permissions

### Role Hierarchy

```
Super Admin (Platform Owner)
    └─ Can: Manage all counties, users, content, system settings
    └─ Access: All pages and admin dashboards

County Admin (County Manager)
    └─ Can: Approve/reject content in assigned county
    └─ Can: Manage county leaders, opportunities, events
    └─ Can: View county analytics
    └─ Access: County-specific dashboard and county page

Contributor (Content Creator)
    └─ Can: Submit content for their county
    └─ Can: Manage own drafts and submissions
    └─ Can: Comment and react on published content
    └─ Access: Dashboard, county page

Visitor (Unauthenticated)
    └─ Can: View published content
    └─ Can: View county pages
    └─ Can: React to content (basic)
    └─ Cannot: Submit content, comment (no login)
```

### Permission Matrix

| Action | Visitor | Contributor | County Admin | Super Admin |
|--------|---------|-------------|-------------|-----------|
| View published content | ✓ | ✓ | ✓ | ✓ |
| View county pages | ✓ | ✓ | ✓ | ✓ |
| Submit content | ✗ | ✓ (own county) | ✓ | ✓ |
| Edit own content | ✗ | ✓ (draft) | ✓ | ✓ |
| Approve content | ✗ | ✗ | ✓ (own county) | ✓ |
| Manage leaders | ✗ | ✗ | ✓ (own county) | ✓ |
| Manage users | ✗ | ✗ | ✗ | ✓ |
| View analytics | ✗ | ✓ (own) | ✓ (county) | ✓ |
| Comment | ✓ (limited) | ✓ | ✓ | ✓ |
| React to content | ✓ | ✓ | ✓ | ✓ |

---

## 🔄 Data Flow & Relationships

### Content Workflow

```
1. CONTRIBUTOR CREATES CONTENT
   └─ Fills form with title, body, images
   └─ Selects county & content type
   └─ Saves as DRAFT

2. CONTRIBUTOR SUBMITS
   └─ Status: pending_review
   └─ Notification sent to county_admin

3. COUNTY ADMIN REVIEWS
   ├─ APPROVES
   │  └─ Status: published
   │  └─ published_at set
   │  └─ Notification: "Content Approved"
   │  └─ Visible on county page
   │
   └─ REJECTS
      └─ Status: rejected
      └─ rejection_note set
      └─ Notification: "Content Rejected"

4. PUBLISHED CONTENT
   ├─ Visitors can view
   ├─ Visitors can comment & react
   ├─ view_count incremented
   └─ Analytics tracked
```

### Comment & Reaction Flow

```
PUBLISHED CONTENT
    ├─ VISITOR/CONTRIBUTOR VIEWS
    │  └─ Sees comments & reactions
    │  └─ Can react (emoji buttons)
    │  └─ view_count++
    │
    ├─ CONTRIBUTOR COMMENTS
    │  └─ Comment created
    │  └─ Linked to parent if reply
    │  └─ Visible immediately
    │
    └─ COMMUNITY ENGAGEMENT
       ├─ Comments get likes (comment_likes)
       ├─ Comments reported (comment_reports)
       ├─ Reports reviewed by admin
       └─ Inappropriate comments deleted (is_deleted=true)
```

---

## 📁 File Storage Structure

### Supabase Storage Buckets

#### **1. county-covers**
- County header/banner images
- File naming: `{county_id}/{filename}`
- Accessible: Public

#### **2. content-media**
- User-uploaded content images
- File naming: `{county_id}/{content_id}/{filename}`
- Accessible: Public (after content published)

#### **3. tourism-images**
- Tourism site photos and gallery images
- File naming: `{county_id}/tourism/{site_id}/{filename}`
- Accessible: Public

#### **4. user-avatars**
- User profile pictures
- File naming: `{user_id}/avatar.{ext}`
- Accessible: Public

#### **5. org-logos**
- Organization logos for partners
- File naming: `{county_id}/logos/{partner_id}/logo.{ext}`
- Accessible: Public

### URL Structure

```
https://{project}.supabase.co/storage/v1/object/public/{bucket}/{path}

Examples:
- County cover: https://proj.supabase.co/storage/.../county-covers/bong-county/cover.jpg
- Content: https://proj.supabase.co/storage/.../content-media/bong/article-1/image.jpg
- Avatar: https://proj.supabase.co/storage/.../user-avatars/user-uuid/avatar.jpg
```

---

## 📊 Summary Statistics

| Metric | Count | Notes |
|--------|-------|-------|
| Database Tables | 19 | Core & engagement tables |
| Enum Types | 11 | Controlled value lists |
| User Roles | 4 | visitor, contributor, county_admin, super_admin |
| Content Types | 3 | story, announcement, article |
| Reaction Types | 5 | like, love, celebrate, insightful, sad |
| Opportunity Types | 6 | scholarship, internship, job, grant, fellowship, training |
| Counties (Liberia) | 15 | Master data |
| Frontend Pages | 8+ | Public, authenticated, admin |
| Storage Buckets | 5 | Images & media |

---

## 🔗 Key Files Reference

- **Database Schemas**: `Schemas/` directory (12 SQL files)
- **Authentication Setup**: `Schemas/JWT-Custom-Claims-Setup.sql`
- **Comments System**: `Schemas/001_comments_reactions_system.sql`
- **RLS Policies**: `Schemas/Row-Level-Content-Visibility-Policies.sql`
- **API Documentation**: `API_REFERENCE.md`
- **System Architecture**: `SYSTEM_ARCHITECTURE.md`
- **Frontend Guide**: `FRONTEND_DEVELOPER_GUIDE.md`

---

## 🚀 Quick Start for Developers

1. **Connect to Supabase**: Use `supabaseClient.js` with your project URL and API key
2. **Implement Auth Guard**: Use `auth-guard.js` for route protection
3. **Query Data**: Use examples from API Reference
4. **Handle RLS**: Ensure authenticated context for mutations
5. **Track Events**: Add analytics calls for important user actions
6. **Manage Notifications**: Send notifications when content status changes

---

**Last Updated**: May 28, 2026
**Platform**: Liberia CountySphere
**Status**: Active & Maintained
