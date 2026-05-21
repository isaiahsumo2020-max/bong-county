# 🏛️ Liberia CountySphere - Complete Frontend Developer Guide

**Version**: 1.0  
**Platform**: Web-based County Information & Contribution Platform  
**Backend**: Supabase (PostgreSQL + Authentication)  
**Last Updated**: May 2026

---

## 📋 Table of Contents

1. [Platform Overview](#platform-overview)
2. [User Flows & Interactions](#user-flows--interactions)
3. [System Architecture](#system-architecture)
4. [Database Schema](#database-schema)
5. [API & Backend Communication](#api--backend-communication)
6. [Authentication & Authorization](#authentication--authorization)
7. [Pages & Features](#pages--features)
8. [UI/UX Components](#uiux-components)
9. [Frontend Technologies & Setup](#frontend-technologies--setup)
10. [Development Guidelines](#development-guidelines)

---

## 🎯 Platform Overview

### What is Liberia CountySphere?

**Liberia CountySphere** is a comprehensive platform designed to:
- Showcase information about Liberia's 15 counties
- Aggregate county-specific content (tourism, news, events, opportunities)
- Enable contributors to submit and manage county-related content
- Provide administrative tools for managing counties, users, and content
- Target government officials, tourism boards, journalists, educators, and community members

### Key Objectives

| Objective | Implementation |
|-----------|-----------------|
| **Content Discovery** | Users browse county information, tourism sites, events without login |
| **Content Contribution** | Authenticated contributors submit county content through forms |
| **Content Management** | Admins review, approve, and manage all platform content |
| **Role-Based Access** | Different features available based on user role |
| **County Management** | Super admins manage county profiles and metadata |
| **Analytics** | Track platform usage, contributions, and user engagement |

### Platform Metrics

- **15 Counties** - All of Liberia covered
- **4 User Roles** - Visitor, Contributor, County Admin, Super Admin
- **12 Contributor Types** - Individual, Organization, NGO, University, etc.
- **6 Main Pages** - Index, Auth, County, Dashboard, Contribute, Admin
- **2-3 Content Types** - Tourism, Events, News, Opportunities (expandable)

---

## 🔄 User Flows & Interactions

### User Journey 1: Anonymous Visitor Browsing

```
┌─────────────────────────────────────────────────────────┐
│ 1. User Lands on Home Page (index-page/)                │
│    - See platform overview                              │
│    - Browse all 15 counties                              │
│    - View featured content                               │
│    - See announcements                                   │
│    - No authentication required                          │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 2. User Clicks on County (county-pages/[county].html)   │
│    - View county overview/hero section                   │
│    - Browse tourism attractions                          │
│    - Read about county leaders                           │
│    - Check upcoming events                               │
│    - Explore business opportunities                      │
│    - Read community news                                 │
│    - View gallery images                                 │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 3. User Sees "Share Your Story" Button                  │
│    - Prompted to create account                          │
│    - Redirected to auth-page with return URL            │
└─────────────────────────────────────────────────────────┘
```

### User Journey 2: New Contributor Registration

```
┌─────────────────────────────────────────────────────────┐
│ STEP 1: Choose Role                                     │
│ - Select "Contributor" (or County Admin)                 │
│ - Select their county from dropdown                      │
│ - Click "Next"                                           │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ STEP 2: Contributor Type (NEW)                          │
│ - Choose from 12 contributor types:                      │
│   • Individual                                           │
│   • Organization                                         │
│   • NGO                                                  │
│   • University                                           │
│   • Vocational Training Center                           │
│   • High School                                          │
│   • Media Institution                                    │
│   • Government Institution                               │
│   • Healthcare Institution                               │
│   • Community Group                                      │
│   • Business                                             │
│   • Other                                                │
│                                                          │
│ IF Individual Selected:                                  │
│   - Show "Individual Category" dropdown (15 options)    │
│   - Hide organization fields                             │
│                                                          │
│ IF Organization/Other Selected:                          │
│   - Show organization fields:                            │
│     • Organization Name (required)                       │
│     • Institution Type (required)                        │
│     • Description (optional)                             │
│     • Website URL (optional)                             │
│   - Hide individual category                             │
│                                                          │
│ - Click "Next"                                           │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ STEP 3: Personal Details                                │
│ - Full Name (required)                                  │
│ - Email Address (required - used for login)              │
│ - Bio/Description (optional - 500 chars)                │
│ - Upload Profile Picture (optional)                      │
│ - Click "Next"                                           │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ STEP 4: Security & Terms                                │
│ - Password (8+ chars, must have upper, lower, number)    │
│ - Confirm Password                                      │
│ - Accept Terms & Conditions (checkbox)                   │
│ - Click "Create Account"                                │
│                                                          │
│ Backend:                                                │
│ - Send verification email                               │
│ - Create auth record in Supabase Auth                    │
│ - Create user profile in users table                     │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ Email Verification (Optional - can be enabled)          │
│ - Check email inbox                                      │
│ - Click verification link                               │
│ - Account becomes active                                │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ Redirect to Dashboard                                   │
│ - Auto-login user                                       │
│ - Show dashboard-page/dashboard.html                     │
│ - Personalized greeting with user name                   │
│ - Show contribution options                              │
└─────────────────────────────────────────────────────────┘
```

### User Journey 3: Contributor Submitting Content

```
┌─────────────────────────────────────────────────────────┐
│ 1. Contributor Logs In & Visits Dashboard               │
│    - See dashboard overview                              │
│    - View submission status                              │
│    - See saved drafts                                    │
│    - View contribution history                           │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 2. Click "Submit New Content" / "Contribute"            │
│    - Navigated to contribute-page/index.html            │
│    - Form loaded with their county pre-selected         │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 3. Fill Contribution Form                               │
│    - Select Content Type:                                │
│      • Tourism Attraction                                │
│      • Event                                             │
│      • Opportunity (job, investment, education)         │
│      • News Article                                      │
│      • Community Story                                   │
│                                                          │
│    - Fill Common Fields:                                 │
│      • Title (required)                                  │
│      • County (pre-selected, can change)                │
│      • Description/Content (rich text editor)            │
│      • Tags (comma-separated)                            │
│      • Featured Image (optional)                         │
│      • Content Category (based on type)                 │
│      • Visibility Level                                  │
│                                                          │
│    - Type-Specific Fields (auto-shown):                  │
│      Tourism:                                            │
│        - Entrance Fee                                    │
│        - GPS Coordinates                                 │
│        - Operating Hours                                 │
│        - Contact Info                                    │
│                                                          │
│      Event:                                              │
│        - Date & Time                                     │
│        - Location/Venue                                  │
│        - Contact Information                             │
│        - Registration URL (optional)                     │
│                                                          │
│      Opportunity:                                        │
│        - Opportunity Type (job, education, investment)   │
│        - Deadline                                        │
│        - Eligibility Requirements                        │
│        - Application Link                                │
│        - Salary (if applicable)                          │
│                                                          │
│    - Visibility Options:                                 │
│      • Public - Visible to everyone                      │
│      • Authenticated Only - Visible to logged-in users   │
│      • County Only - Visible to county members           │
│      • Private - Visible only to author & admin         │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 4. Save or Submit                                       │
│    - Save as Draft: Content saved locally, editable     │
│    - Submit: Content sent for admin review              │
│    - Confirmation message shown                          │
│    - Email notification sent to user & admin             │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 5. Admin Reviews (Admin-Side Flow)                       │
│    - Content appears in admin queue                      │
│    - Admin reviews submission                            │
│    - Can approve, request changes, or reject             │
│    - Contributor notified via email                      │
│    - If approved, content published to public view       │
└─────────────────────────────────────────────────────────┘
```

### User Journey 4: Admin/County Admin Dashboard

```
┌─────────────────────────────────────────────────────────┐
│ 1. Super Admin or County Admin Logs In                   │
│    - Redirected to superadmin/index.html                │
│    - Full dashboard with analytics                       │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 2. Dashboard Modules (Visible based on role)            │
│                                                          │
│ Super Admin Can:                                        │
│   • View all counties & manage county data              │
│   • Manage all users (promote/demote roles)              │
│   • Review all submissions across all counties          │
│   • View platform analytics & statistics                │
│   • Manage system settings                              │
│   • View audit logs                                     │
│                                                          │
│ County Admin Can:                                       │
│   • Manage their county's content                        │
│   • Review submissions for their county                 │
│   • Manage county-specific users                         │
│   • View county analytics                               │
│   • Update county information                            │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 3. Review Content Submission                            │
│    - See submission queue (pending/reviewed/published)   │
│    - Click submission to view details                    │
│    - See contributor info & history                      │
│    - Read content in preview mode                        │
│    - Actions: Approve, Request Changes, Reject          │
│    - Add admin comments/feedback                         │
│    - Send notification to contributor                    │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 4. Manage Counties (Super Admin Only)                    │
│    - View all 15 counties                                │
│    - Update county information:                          │
│      • Name, Description                                 │
│      • Flag/Logo image                                   │
│      • Official website                                  │
│      • County Administrator info                         │
│      • District data                                     │
│      • Historical information                            │
│    - Add/Edit county leaders (Governor, etc.)           │
│    - Manage district information                         │
│    - View county statistics                              │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 5. Manage Users                                         │
│    - View all users with filters:                        │
│      • Role filter                                       │
│      • County filter                                     │
│      • Status filter                                     │
│    - Click user to see:                                  │
│      • Profile information                               │
│      • Contributions                                     │
│      • Activity history                                  │
│    - Actions:                                            │
│      • Change role/permissions                           │
│      • Deactivate account                                │
│      • View detailed profile                             │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 6. Analytics Dashboard                                  │
│    - Statistics Cards:                                   │
│      • Total submissions                                 │
│      • Approved vs pending                               │
│      • Active contributors                               │
│      • Counties with most content                        │
│    - Charts & Graphs:                                    │
│      • Submissions over time                             │
│      • Content by type                                   │
│      • User engagement metrics                           │
│      • Popular counties/content                          │
│    - Export functionality                                │
└─────────────────────────────────────────────────────────┘
```

---

## 🏗️ System Architecture

### High-Level Architecture Diagram

```
┌──────────────────────────────────────────────────────────┐
│                    FRONTEND LAYER                         │
│                                                            │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │ index-page/ │  │ county-pages/ │  │ dashboard-page/│ │
│  │  (Public)   │  │  (Public)     │  │ (Protected)    │ │
│  └─────────────┘  └──────────────┘  └────────────────┘  │
│        ↓                  ↓                   ↓            │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │ auth-page/  │  │profile-page/ │  │contribute-page/│ │
│  │ (Auth)      │  │(Protected)   │  │ (Protected)    │ │
│  └─────────────┘  └──────────────┘  └────────────────┘  │
│        ↓                  ↓                   ↓            │
│  ┌────────────────────────────────────────────────────┐ │
│  │            superadmin/ (Admin Only)                │ │
│  │  ├─ Dashboard                                       │ │
│  │  ├─ Counties Manager                               │ │
│  │  ├─ Content Manager                                │ │
│  │  ├─ Users Manager                                  │ │
│  │  ├─ Analytics                                      │ │
│  │  └─ Settings                                       │ │
│  └────────────────────────────────────────────────────┘ │
│        ↓                                                   │
│  ┌────────────────────────────────────────────────────┐ │
│  │            Shared Resources Layer                   │ │
│  │  ├─ supabaseClient.js                             │ │
│  │  ├─ auth-guard.js                                 │ │
│  │  ├─ route-guard.js                                │ │
│  │  ├─ route-config.js                               │ │
│  │  ├─ visibility.js (Content Visibility)            │ │
│  │  ├─ role-manager.js                               │ │
│  │  ├─ notification-engine.js                        │ │
│  │  └─ content-targeting.js                          │ │
│  └────────────────────────────────────────────────────┘ │
│        ↓                                                   │
│  ┌────────────────────────────────────────────────────┐ │
│  │          HTML/CSS/JS Page Structure                │ │
│  │  Every page has:                                   │ │
│  │  ├─ index.html (semantic structure)              │ │
│  │  ├─ css/ (organized stylesheets)                 │ │
│  │  └─ js/ (modular JavaScript)                     │ │
│  └────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────┐
│                 BACKEND LAYER (Supabase)                 │
│                                                            │
│  ┌────────────────────────────────────────────────────┐ │
│  │          Authentication (Supabase Auth)            │ │
│  │  ├─ Email/Password Auth                            │ │
│  │  ├─ Session Management                             │ │
│  │  ├─ JWT Tokens                                     │ │
│  │  └─ Password Reset/Recovery                        │ │
│  └────────────────────────────────────────────────────┘ │
│        ↓                                                   │
│  ┌────────────────────────────────────────────────────┐ │
│  │          Database (PostgreSQL)                     │ │
│  │  ├─ users                                          │ │
│  │  ├─ counties                                       │ │
│  │  ├─ content                                        │ │
│  │  ├─ submissions                                    │ │
│  │  ├─ user_submissions                               │ │
│  │  ├─ analytics                                      │ │
│  │  ├─ audit_logs                                     │ │
│  │  └─ notifications                                  │ │
│  └────────────────────────────────────────────────────┘ │
│        ↓                                                   │
│  ┌────────────────────────────────────────────────────┐ │
│  │          Storage (File Uploads)                    │ │
│  │  ├─ County images/logos                            │ │
│  │  ├─ User avatars                                   │ │
│  │  ├─ Content images & media                         │ │
│  │  └─ Gallery images                                 │ │
│  └────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

### Data Flow Example: Content Submission

```
USER ACTION: Contributor submits tourism content
                         ↓
            contribute-page/js/forms.js
            ├─ Validate form data
            ├─ Upload featured image (if included)
            ├─ Format submission data
            └─ Send to backend
                         ↓
            supabaseClient.js
            ├─ Call: content.insert()
            ├─ Call: submissions.insert()
            └─ Create audit log entry
                         ↓
        Supabase Backend (PostgreSQL)
            ├─ Store content record
            ├─ Store submission status
            ├─ Trigger notification
            └─ Update analytics
                         ↓
        Frontend receives response
            ├─ Show success message
            ├─ Email sent to admin
            ├─ Update user dashboard
            └─ Redirect to dashboard
```

---

## 📊 Database Schema

### Tables Overview

```sql
-- USERS TABLE
-- Stores user accounts & profiles
CREATE TABLE users (
  id UUID PRIMARY KEY,                    -- Supabase auth user ID
  email TEXT UNIQUE NOT NULL,             -- Login email
  full_name TEXT NOT NULL,                -- User's full name
  role ENUM (visitor, contributor, county_admin, super_admin),
  county_id UUID REFERENCES counties(id), -- Home county
  
  -- NEW Contributor Type Fields
  contributor_kind TEXT,                  -- Type of contributor
  individual_category TEXT,               -- Category if individual
  organization_name TEXT,                 -- Organization name if not individual
  organization_description TEXT,          -- Org description
  institution_type TEXT,                  -- Type of institution
  website_url TEXT,                       -- Organization website
  logo_url TEXT,                          -- Organization logo
  profile_visibility ENUM (public, contributors_only, private),
  
  -- Profile Info
  bio TEXT,                               -- User bio (500 chars max)
  avatar_url TEXT,                        -- User profile picture
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- COUNTIES TABLE
-- Stores information about Liberia's 15 counties
CREATE TABLE counties (
  id UUID PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,              -- County name
  slug TEXT UNIQUE NOT NULL,              -- URL-friendly slug (e.g., "bong")
  description TEXT,                       -- County overview
  flag_url TEXT,                          -- County flag image
  governor_name TEXT,                     -- County governor
  governor_photo_url TEXT,
  official_website TEXT,                  -- County official website
  capital_city TEXT,                      -- County capital
  population INT,
  area_sq_km DECIMAL,
  main_districts TEXT[],                  -- District names
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- CONTENT TABLE
-- Main table for all platform content (tourism, events, news, etc.)
CREATE TABLE content (
  id UUID PRIMARY KEY,
  county_id UUID NOT NULL REFERENCES counties(id),
  author_id UUID NOT NULL REFERENCES users(id),
  
  type ENUM (tourism, event, opportunity, news, community_story),
  title TEXT NOT NULL,
  description TEXT NOT NULL,              -- Main content (rich text)
  category TEXT,                          -- Subcategory based on type
  tags TEXT[],                            -- Comma-separated tags
  
  featured_image_url TEXT,                -- Main image
  gallery_urls TEXT[],                    -- Additional images
  
  visibility ENUM (public, authenticated_only, county_only, admin_only, private),
  status ENUM (draft, submitted, approved, rejected, published) DEFAULT 'draft',
  
  -- Tourism-specific fields (nullable)
  entrance_fee DECIMAL,
  gps_coordinates POINT,                  -- { lat, lon }
  operating_hours TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  
  -- Event-specific fields
  event_date TIMESTAMP,
  event_time TIME,
  venue_location TEXT,
  registration_url TEXT,
  
  -- Opportunity-specific fields
  opportunity_type ENUM (job, education, investment),
  deadline_date DATE,
  eligibility TEXT,
  application_link TEXT,
  salary_range TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  published_at TIMESTAMP,
  view_count INT DEFAULT 0
);

-- SUBMISSIONS TABLE
-- Tracks submission status & admin review
CREATE TABLE submissions (
  id UUID PRIMARY KEY,
  content_id UUID REFERENCES content(id),
  submitter_id UUID NOT NULL REFERENCES users(id),
  admin_id UUID REFERENCES users(id),    -- Admin who reviewed
  
  status ENUM (pending, reviewing, approved, rejected, changes_requested),
  submitted_at TIMESTAMP DEFAULT NOW(),
  reviewed_at TIMESTAMP,
  
  admin_comments TEXT,                    -- Feedback from admin
  rejection_reason TEXT,
  
  version INT DEFAULT 1,                  -- Track revisions
  created_at TIMESTAMP DEFAULT NOW()
);

-- USER SUBMISSIONS TABLE
-- Tracks user's submission history
CREATE TABLE user_submissions (
  user_id UUID NOT NULL REFERENCES users(id),
  submission_id UUID NOT NULL REFERENCES submissions(id),
  
  submitted_count INT DEFAULT 0,
  approved_count INT DEFAULT 0,
  rejected_count INT DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  PRIMARY KEY (user_id, submission_id)
);

-- ANALYTICS TABLE
-- Tracks platform usage & metrics
CREATE TABLE analytics (
  id UUID PRIMARY KEY,
  event_type TEXT,                       -- 'page_view', 'content_view', 'submission', etc.
  user_id UUID REFERENCES users(id),
  county_id UUID REFERENCES counties(id),
  content_id UUID REFERENCES content(id),
  
  metadata JSONB,                        -- Additional context
  created_at TIMESTAMP DEFAULT NOW()
);

-- AUDIT_LOGS TABLE
-- Tracks all admin actions for security/compliance
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  admin_id UUID NOT NULL REFERENCES users(id),
  action TEXT,                           -- 'create', 'update', 'delete', 'approve', etc.
  table_name TEXT,
  record_id UUID,
  
  old_values JSONB,                      -- Previous values
  new_values JSONB,                      -- Updated values
  
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- NOTIFICATIONS TABLE
-- Stores user notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  type TEXT,                             -- 'submission_approved', 'comment', etc.
  title TEXT,
  message TEXT,
  
  related_id UUID,                       -- ID of related content/submission
  related_type TEXT,                     -- Type of related item
  
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Database Relationships

```
users ─┬─→ counties (county_id)
       ├─→ content (author_id)
       └─→ submissions (submitter_id, admin_id)
       
counties ─→ content (county_id)

content ─→ submissions (content_id)

submissions ─→ user_submissions
```

---

## 🔌 API & Backend Communication

### Supabase Client Initialization

**File**: `supabaseClient.js`

```javascript
// Initialize Supabase client
const SUPABASE_URL = 'https://choagncxtmsewzvxoncx.supabase.co';
const SUPABASE_ANON_KEY = '[YOUR_ANON_KEY]';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

### Authentication API Endpoints

#### 1. Register New User

```javascript
// Called from: auth-page/js/auth.js

const { data, error } = await supabaseClient.auth.signUp({
  email: 'user@example.com',
  password: 'securePassword123',
  options: {
    data: {
      full_name: 'John Doe',
      role: 'contributor',
      county_id: 'bong-county-uuid',
      contributor_kind: 'individual',
      individual_category: 'journalist'
      // ... other profile fields
    }
  }
});
```

#### 2. Login User

```javascript
const { data, error } = await supabaseClient.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'securePassword123'
});

// Returns: { user: { id, email, ... }, session: { access_token, ... } }
```

#### 3. Get Current User

```javascript
const { data: { user }, error } = await supabaseClient.auth.getUser();
// Returns: { user: { id, email, ... } } or { user: null }
```

#### 4. Logout User

```javascript
const { error } = await supabaseClient.auth.signOut();
```

#### 5. Refresh Session

```javascript
const { data, error } = await supabaseClient.auth.refreshSession();
```

### Content API Endpoints

#### 1. Fetch Public Content

```javascript
// Get all public content for a county
const { data, error } = await supabaseClient
  .from('content')
  .select('*, counties(name), users(full_name)')
  .eq('county_id', countyId)
  .eq('visibility', 'public')
  .eq('status', 'published')
  .order('published_at', { ascending: false });
```

#### 2. Fetch User's Submissions

```javascript
const { data, error } = await supabaseClient
  .from('content')
  .select('*')
  .eq('author_id', userId)
  .order('created_at', { ascending: false });
```

#### 3. Create New Content (Submit)

```javascript
const { data, error } = await supabaseClient
  .from('content')
  .insert([{
    county_id: countyId,
    author_id: userId,
    type: 'tourism',
    title: 'Beautiful Lake',
    description: 'A scenic lake...',
    category: 'lake',
    featured_image_url: 'https://...',
    visibility: 'public',
    status: 'submitted',
    entrance_fee: 5.00,
    gps_coordinates: { x: 6.3155, y: -10.8070 },
    operating_hours: '9AM - 6PM'
  }])
  .select();
```

#### 4. Update Content

```javascript
const { data, error } = await supabaseClient
  .from('content')
  .update({
    title: 'Updated Title',
    description: 'Updated description',
    updated_at: new Date()
  })
  .eq('id', contentId)
  .select();
```

#### 5. Delete Content

```javascript
const { error } = await supabaseClient
  .from('content')
  .delete()
  .eq('id', contentId);
```

### Admin API Endpoints

#### 1. Fetch Submission Queue

```javascript
// Get pending submissions for review
const { data, error } = await supabaseClient
  .from('submissions')
  .select('*, content(*), users(*)')
  .eq('status', 'pending')
  .order('submitted_at', { ascending: true });
```

#### 2. Approve Submission

```javascript
const { error } = await supabaseClient
  .from('submissions')
  .update({
    status: 'approved',
    admin_id: adminUserId,
    reviewed_at: new Date()
  })
  .eq('id', submissionId);

// Also publish content
const { error: contentError } = await supabaseClient
  .from('content')
  .update({
    status: 'published',
    published_at: new Date()
  })
  .eq('id', contentId);
```

#### 3. Reject Submission

```javascript
const { error } = await supabaseClient
  .from('submissions')
  .update({
    status: 'rejected',
    admin_id: adminUserId,
    reviewed_at: new Date(),
    rejection_reason: 'Inappropriate content'
  })
  .eq('id', submissionId);
```

#### 4. Fetch All Users

```javascript
const { data, error } = await supabaseClient
  .from('users')
  .select('*')
  .eq('role', 'contributor')  // Optional filter
  .order('created_at', { ascending: false });
```

#### 5. Update User Role

```javascript
const { error } = await supabaseClient
  .from('users')
  .update({ role: 'county_admin' })
  .eq('id', userId);
```

#### 6. Manage Counties

```javascript
// Fetch all counties
const { data, error } = await supabaseClient
  .from('counties')
  .select('*')
  .order('name');

// Update county
const { error } = await supabaseClient
  .from('counties')
  .update({
    governor_name: 'New Governor',
    description: 'Updated description'
  })
  .eq('id', countyId);

// Create new county (rarely needed)
const { data, error } = await supabaseClient
  .from('counties')
  .insert([{
    name: 'New County',
    slug: 'new-county',
    description: 'County description'
  }]);
```

### Analytics & Logging API

#### 1. Log Page View

```javascript
const { error } = await supabaseClient
  .from('analytics')
  .insert([{
    event_type: 'page_view',
    user_id: userId,
    county_id: countyId,
    metadata: {
      page: 'county-page',
      referrer: document.referrer
    }
  }]);
```

#### 2. Log Content View

```javascript
const { error } = await supabaseClient
  .from('analytics')
  .insert([{
    event_type: 'content_view',
    user_id: userId,
    content_id: contentId,
    metadata: {
      content_type: 'tourism'
    }
  }]);

// Also increment view count
const { error: updateError } = await supabaseClient
  .from('content')
  .update({ view_count: supabase.raw('view_count + 1') })
  .eq('id', contentId);
```

#### 3. Log Admin Action (Audit Log)

```javascript
const { error } = await supabaseClient
  .from('audit_logs')
  .insert([{
    admin_id: adminId,
    action: 'approve_submission',
    table_name: 'submissions',
    record_id: submissionId,
    old_values: { status: 'pending' },
    new_values: { status: 'approved' },
    ip_address: getUserIP(),
    user_agent: navigator.userAgent
  }]);
```

### Error Handling Pattern

```javascript
// Standard error handling for all API calls
async function safeApiCall(apiFunction) {
  try {
    const { data, error } = await apiFunction();
    
    if (error) {
      console.error('API Error:', error.message);
      if (error.message.includes('JWT')) {
        // Session expired - redirect to login
        window.location.href = '/auth-page/auth.html';
      }
      return { success: false, error: error.message };
    }
    
    return { success: true, data };
  } catch (exception) {
    console.error('Exception:', exception);
    return { success: false, error: 'Network error' };
  }
}

// Usage
const result = await safeApiCall(() => 
  supabaseClient.from('counties').select('*')
);
```

---

## 🔐 Authentication & Authorization

### Role-Based Access Control (RBAC)

**Role Hierarchy** (from least to most privileged):

```
Visitor (0)
    ↓
Contributor (1)
    ↓
County Admin (2)
    ↓
Super Admin (3)
```

### Permission Matrix

| Feature | Visitor | Contributor | County Admin | Super Admin |
|---------|---------|-------------|-------------|------------|
| View public content | ✅ | ✅ | ✅ | ✅ |
| Submit content | ❌ | ✅ | ✅ | ✅ |
| Edit own content | ❌ | ✅ | ✅ | ✅ |
| View dashboard | ❌ | ✅ | ✅ | ✅ |
| Review submissions | ❌ | ❌ | ✅ (county) | ✅ (all) |
| Manage users | ❌ | ❌ | ✅ (county) | ✅ (all) |
| Manage counties | ❌ | ❌ | ❌ | ✅ |
| View analytics | ❌ | ❌ | ✅ (county) | ✅ (all) |
| Access admin panel | ❌ | ❌ | ✅ | ✅ |

### Protected Routes

**File**: `shared/js/route-guard.js`

```javascript
// Example: Protect a page
import { RouteGuard } from '/shared/js/route-guard.js';

await RouteGuard.protectPage({
  requiredAuth: true,                          // Must be logged in
  requiredRoles: ['contributor', 'county_admin', 'super_admin'],
  redirectTo: '/auth-page/auth.html'
});
```

### Visibility Levels

Every piece of content has a visibility level controlling who can see it:

| Level | Visible To | Use Case |
|-------|-----------|----------|
| **public** | Everyone | Tourist attractions, public events |
| **authenticated_only** | Logged-in users | Contributor-submitted stories |
| **county_only** | County members | County-specific opportunities |
| **admin_only** | Admins only | Internal announcements |
| **private** | Author + admin | Draft content, private submissions |

```javascript
// Check visibility when fetching content
const visibleContent = ContentVisibility.filterContent(items, currentUser);

// Show visibility selector in forms
const html = VisibilitySelector.generateHtml(currentUser, 'authenticated_only');
```

---

## 📄 Pages & Features

### 1. Index Page (Home - `/index-page/`)

**Purpose**: Landing page and county discovery

**URL**: `index-page/index.html`

**Protected**: No (public access)

**Key Sections**:
- Hero banner with platform overview
- Counties grid (all 15 counties with preview cards)
- Featured content carousel
- Testimonials/Statistics
- Recent submissions
- Call-to-action (Join/Contribute buttons)
- Footer with platform info

**Key Features**:
- County card click → navigate to county page
- "Share Your Story" → redirect to auth with return URL
- Search counties by name
- Filter by content type
- Responsive design (mobile, tablet, desktop)

**Data Fetching**:
```javascript
// Get featured content
const { data } = await supabaseClient
  .from('content')
  .select('*, counties(name)')
  .eq('visibility', 'public')
  .eq('status', 'published')
  .limit(6)
  .order('published_at', { ascending: false });

// Get all counties
const { data } = await supabaseClient
  .from('counties')
  .select('*')
  .order('name');
```

---

### 2. Authentication Page (`/auth-page/`)

**Purpose**: User login and registration

**URL**: `auth-page/auth.html`

**Protected**: No (public access)

**Key Components**:
- Login tab
- Register tab (with 4-step flow)
- Email verification (optional)
- Password recovery (if enabled)

**Login Form**:
```
Email address
Password
[Login Button]
```

**Registration 4-Step Flow**:

**Step 1 - Role Selection**:
```
County: [Dropdown of 15 counties]
Role: [Contributor or County Admin]
```

**Step 2 - Contributor Type** (NEW):
```
Type: [12 options from Individual to Other]

If Individual:
  Individual Category: [15 options]

If Organization/Other:
  Organization Name: [Text input]
  Institution Type: [Dropdown]
  Description: [Text area]
  Website URL: [URL input]
```

**Step 3 - Personal Details**:
```
Full Name: [Text input]
Email: [Email input]
Bio: [Text area, 500 char max]
Profile Picture: [Upload]
```

**Step 4 - Security**:
```
Password: [Password, 8+ chars, must have uppercase, lowercase, number]
Confirm Password: [Password]
Accept Terms: [Checkbox]
```

**Key Functions**:
```javascript
// Register
async function register(formData) {
  const { data, error } = await supabaseClient.auth.signUp({
    email: formData.email,
    password: formData.password,
    options: {
      data: {
        full_name: formData.fullName,
        role: formData.role,
        county_id: formData.countyId,
        contributor_kind: formData.contributorKind,
        // ... more fields
      }
    }
  });
}

// Login
async function login(email, password) {
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });
}
```

---

### 3. County Pages (`/county-pages/`)

**Purpose**: Display county-specific information and content

**URL Pattern**: `county-pages/[county-slug].html`  
Examples: `county-pages/bong.html`, `county-pages/montserrado.html`

**Protected**: No (public access, but shows different content for authenticated users)

**Key Sections**:

1. **Hero Section**
   - County flag/banner image
   - County name & motto
   - Brief description

2. **County Overview**
   - Governor info
   - Capital city
   - Population
   - Area
   - Districts

3. **Tourism Attractions**
   - Display cards for each attraction
   - Filter by type
   - Shows: entrance fee, hours, GPS coordinates, images
   - Click for detailed view

4. **Events**
   - Upcoming events for county
   - Date, time, location
   - Registration links (if available)
   - Calendar view (optional)

5. **Opportunities**
   - Jobs
   - Educational programs
   - Investment opportunities
   - Application deadlines & links

6. **News & Stories**
   - Recent news articles
   - Community stories
   - Timestamped

7. **Gallery**
   - County images
   - Tourism site photos
   - Historical photos

8. **Leaders**
   - County governor
   - District chiefs
   - Other officials

**Data Fetching**:
```javascript
// Get county info
const { data: county } = await supabaseClient
  .from('counties')
  .select('*')
  .eq('slug', countySlug)
  .single();

// Get all content for county
const { data: content } = await supabaseClient
  .from('content')
  .select('*')
  .eq('county_id', county.id)
  .eq('visibility', 'public')
  .eq('status', 'published')
  .order('published_at', { ascending: false });

// Filter by type
const tourism = content.filter(c => c.type === 'tourism');
const events = content.filter(c => c.type === 'event');
```

---

### 4. Dashboard Page (`/dashboard-page/`)

**Purpose**: Contributor hub for managing submissions and profile

**URL**: `dashboard-page/dashboard.html`

**Protected**: Yes (requires login, role: contributor+)

**Key Sections**:

1. **Dashboard Overview**
   - Welcome message with user name
   - Quick stats:
     - Total submissions
     - Approved count
     - Pending count
     - Rejected count

2. **Submission History**
   - Table of all user's submissions
   - Status: Draft, Submitted, Approved, Rejected, Changes Requested
   - Date submitted
   - Content type
   - Actions: Edit, View, Delete, Resubmit

3. **User Profile**
   - Display user info
   - Edit profile button (modal)
   - Change password
   - Notification preferences

4. **Drafts**
   - Save-in-progress submissions
   - Last saved timestamp
   - Action: Continue editing, Delete

5. **Notifications**
   - Recent notifications
   - Submission status updates
   - Admin feedback
   - Mark as read

6. **Quick Actions**
   - "Submit New Content" button
   - "View Published Content" button
   - "Edit Profile" button

**Key Functions**:
```javascript
// Fetch user's submissions
async function loadUserSubmissions() {
  const { data } = await supabaseClient
    .from('content')
    .select('*')
    .eq('author_id', userId)
    .order('created_at', { ascending: false });
}

// Load user profile
async function loadProfile() {
  const { data } = await supabaseClient
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
}

// Update profile
async function updateProfile(updateData) {
  const { error } = await supabaseClient
    .from('users')
    .update(updateData)
    .eq('id', userId);
}
```

---

### 5. Contribute Page (`/contribute-page/`)

**Purpose**: Submit new content to platform

**URL**: `contribute-page/index.html`

**Protected**: Yes (requires login, role: contributor+)

**Key Components**:

1. **Content Type Selector**
   ```
   [ ] Tourism Attraction
   [ ] Event
   [ ] Opportunity (Job/Education/Investment)
   [ ] News Article
   [ ] Community Story
   ```

2. **Common Fields** (All types):
   ```
   Title: [Text input, 100 char limit]
   County: [Dropdown, pre-selected from user profile]
   Description: [Rich text editor, 5000 char limit]
   Featured Image: [Image upload]
   Tags: [Text input, comma-separated]
   Category: [Dropdown, varies by type]
   Visibility: [Dropdown: public, authenticated_only, county_only, private]
   ```

3. **Type-Specific Fields**:

   **Tourism Attraction**:
   ```
   Entrance Fee: [Number input]
   GPS Coordinates: [Map picker or lat/lon inputs]
   Operating Hours: [Time range input]
   Contact Phone: [Phone input]
   Contact Email: [Email input]
   ```

   **Event**:
   ```
   Date: [Date picker]
   Time: [Time picker]
   Venue Location: [Text input]
   Contact Information: [Phone/email]
   Registration URL: [URL input, optional]
   ```

   **Opportunity**:
   ```
   Opportunity Type: [Dropdown: job, education, investment]
   Deadline: [Date picker]
   Eligibility Requirements: [Text area]
   Application Link: [URL input]
   Salary/Details: [Text input, optional]
   ```

4. **Form Actions**:
   ```
   [Save as Draft]  [Submit for Review]  [Preview]  [Cancel]
   ```

5. **Preview Modal**:
   - Shows how content will look when published
   - Desktop and mobile preview
   - Review fields before submitting

**Key Functions**:
```javascript
// Validate form
function validateForm(formData) {
  if (!formData.title) return { error: 'Title required' };
  if (formData.title.length > 100) return { error: 'Title too long' };
  // ... more validation
  return { valid: true };
}

// Save draft
async function saveDraft(formData) {
  const { data, error } = await supabaseClient
    .from('content')
    .insert([{
      ...formData,
      author_id: userId,
      status: 'draft'
    }])
    .select();
}

// Submit for review
async function submitForReview(formData) {
  const { data, error } = await supabaseClient
    .from('content')
    .insert([{
      ...formData,
      author_id: userId,
      status: 'submitted'
    }])
    .select();

  // Create submission record
  await supabaseClient
    .from('submissions')
    .insert([{
      content_id: data[0].id,
      submitter_id: userId,
      status: 'pending'
    }]);
}
```

---

### 6. Admin Dashboard (`/superadmin/`)

**Purpose**: Administrative control panel for platform management

**URL**: `superadmin/index.html`

**Protected**: Yes (requires: role super_admin or county_admin)

**Key Modules**:

1. **Dashboard/Overview**
   - Stats cards: total users, submissions, approved content, etc.
   - Charts: submissions over time, content by type
   - Recent activity feed

2. **Content Management**
   - List all submissions (filter: pending, approved, rejected)
   - Review modal showing:
     - Content details
     - Contributor info & history
     - Approval/rejection buttons
     - Comment field for feedback
   - Batch actions: approve, reject, request changes

3. **Counties Management** (Super Admin Only)
   - Table of all 15 counties
   - Edit county info (name, description, governor, etc.)
   - Manage county districts
   - Upload county flag/images
   - View county-specific stats

4. **Users Management**
   - Search/filter users by role, county, status
   - View user profile & submission history
   - Change user role
   - Deactivate/activate users
   - View user activity

5. **Analytics**
   - Overall platform statistics
   - Charts: users by role, submissions by type, content by county
   - Timeline charts
   - Export reports

6. **Settings**
   - System configuration
   - Email templates
   - Notification settings
   - Visibility level settings

7. **Audit Logs**
   - View all admin actions
   - Filter by admin, action type, date
   - Track changes to records

**Key Functions**:
```javascript
// Fetch submissions queue
async function loadSubmissions() {
  const { data } = await supabaseClient
    .from('submissions')
    .select('*, content(*), users(*)')
    .order('submitted_at', { ascending: true });
}

// Approve submission
async function approveSubmission(submissionId, contentId) {
  // Update submission status
  await supabaseClient
    .from('submissions')
    .update({
      status: 'approved',
      admin_id: adminId,
      reviewed_at: new Date()
    })
    .eq('id', submissionId);

  // Publish content
  await supabaseClient
    .from('content')
    .update({
      status: 'published',
      published_at: new Date()
    })
    .eq('id', contentId);

  // Log action
  await logAdminAction('approve_submission', 'submissions', submissionId);
}
```

---

## 🎨 UI/UX Components

### Shared Components (Used Across Pages)

1. **Navigation Bar**
   - Logo/home link
   - County navigation (public pages)
   - User menu (authenticated users)
   - Responsive mobile menu

2. **Footer**
   - Contact information
   - Social media links
   - County links
   - Legal (Terms, Privacy)
   - Donation/support CTA

3. **Modal System**
   - Reusable modal template
   - Confirm dialogs
   - Loading states
   - Error messages

4. **Forms**
   - Text inputs with validation
   - Dropdowns
   - Date/time pickers
   - File uploads
   - Rich text editors (for descriptions)
   - Visibility selector

5. **Cards**
   - County cards (grid display)
   - Content cards (tourism, events, etc.)
   - User profile cards
   - Stat cards (dashboard)

6. **Alerts & Notifications**
   - Success messages (green)
   - Error messages (red)
   - Warning messages (yellow)
   - Info messages (blue)
   - Toast notifications (non-blocking)

7. **Loading States**
   - Skeleton loaders
   - Spinner icons
   - Progress bars
   - Full-page loading screen

### Design System

**Colors**:
```css
/* Primary (Liberia flag colors) */
--color-primary-red: #CE1126;
--color-primary-white: #FFFFFF;
--color-primary-blue: #0052CC;

/* Semantic */
--color-success: #28A745;
--color-danger: #DC3545;
--color-warning: #FFC107;
--color-info: #17A2B8;

/* Neutral */
--color-dark: #212529;
--color-light: #F8F9FA;
--color-border: #DEE2E6;
```

**Typography**:
```css
/* Font Stack */
--font-primary: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
--font-display: 'Poppins', sans-serif;

/* Sizes */
--font-size-xs: 0.75rem;
--font-size-sm: 0.875rem;
--font-size-base: 1rem;
--font-size-lg: 1.25rem;
--font-size-xl: 1.5rem;
--font-size-2xl: 2rem;
```

**Spacing**:
```css
--spacing-xs: 0.25rem;
--spacing-sm: 0.5rem;
--spacing-md: 1rem;
--spacing-lg: 1.5rem;
--spacing-xl: 2rem;
--spacing-2xl: 3rem;
```

---

## 🛠️ Frontend Technologies & Setup

### Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend Framework** | Vanilla JavaScript (no framework) |
| **Backend** | Supabase (BaaS) |
| **Database** | PostgreSQL |
| **Authentication** | Supabase Auth |
| **Storage** | Supabase Storage |
| **HTML** | Semantic HTML5 |
| **CSS** | Vanilla CSS (organized into files) |
| **Icons** | Emoji or SVG |
| **Responsive Design** | CSS Media Queries |
| **Build Tool** | None (static files) |

### Project Structure

```
components/
├── index.html                          # Home page entry
├── supabaseClient.js                   # Backend initialization
├── auth-guard.js                       # Authentication guard
│
├── index-page/
│   ├── index.html
│   ├── css/
│   │   ├── styles.css                 # Global styles
│   │   ├── hero.css                   # Hero section
│   │   ├── counties.css               # County grid
│   │   └── responsive.css             # Mobile styles
│   └── js/
│       ├── app.js                     # Page initialization
│       ├── navigation.js              # Nav logic
│       ├── county-loader.js           # County fetching
│       └── utils.js                   # Utilities
│
├── auth-page/
│   ├── index.html (or auth.html)
│   ├── css/
│   │   ├── styles.css
│   │   ├── forms.css
│   │   ├── inputs.css
│   │   └── responsive.css
│   └── js/
│       ├── auth.js                    # Main auth logic
│       ├── registration.js            # Registration flow
│       ├── validation.js              # Form validation
│       └── utils.js
│
├── county-pages/
│   ├── [county-name].html             # One per county
│   ├── css/
│   │   ├── styles.css
│   │   ├── hero.css
│   │   ├── content-sections.css
│   │   ├── cards.css
│   │   └── responsive.css
│   └── js/
│       ├── app.js
│       ├── county-loader.js
│       ├── content-renderer.js
│       ├── tabs.js
│       └── utils.js
│
├── dashboard-page/
│   ├── index.html
│   ├── css/
│   │   ├── styles.css
│   │   ├── sidebar.css
│   │   ├── cards.css
│   │   └── responsive.css
│   └── js/
│       ├── app.js
│       ├── sidebar.js
│       ├── dashboard.js
│       ├── profile.js
│       └── page-protection.js
│
├── contribute-page/
│   ├── index.html
│   ├── css/
│   │   ├── styles.css
│   │   ├── forms.css
│   │   ├── editor.css
│   │   └── responsive.css
│   └── js/
│       ├── app.js
│       ├── form-handler.js
│       ├── validation.js
│       ├── preview.js
│       └── page-protection.js
│
├── superadmin/
│   ├── index.html
│   ├── css/
│   │   ├── styles.css
│   │   ├── sidebar.css
│   │   ├── dashboard.css
│   │   ├── tables.css
│   │   └── responsive.css
│   └── js/
│       ├── app.js
│       ├── page-protection.js
│       ├── modules/
│       │   ├── dashboard.js
│       │   ├── content.js
│       │   ├── counties.js
│       │   ├── users.js
│       │   ├── analytics.js
│       │   └── settings.js
│       └── utils/
│           ├── helpers.js
│           └── modals.js
│
├── shared/
│   ├── js/
│   │   ├── route-guard.js             # Route protection
│   │   ├── route-config.js            # Route definitions
│   │   ├── visibility.js              # Visibility control
│   │   ├── role-manager.js            # Role checking
│   │   ├── notification-engine.js     # Notifications
│   │   ├── auth-guards.js             # Auth utilities
│   │   └── content-targeting.js       # Content filtering
│   └── css/
│       ├── global.css                 # Global styles
│       ├── variables.css              # CSS variables
│       └── components.css             # Reusable components
│
├── css/
│   ├── design-system.css              # Design tokens
│   └── county-branding.css            # County themes
│
├── js/
│   ├── county-branding.js             # County color themes
│   └── county-navigator.js            # County routing
│
├── Assests/
│   ├── banner*.avif                   # Banner images
│   ├── Flags/                         # County flags
│   ├── Leaders/                       # Leader images
│   └── Lib/                           # Other images
│
└── DOCs/
    ├── PROJECT_OVERVIEW.md
    ├── ARCHITECTURE_QUICK_REFERENCE.md
    ├── QUICK_REFERENCE.md
    └── ... (22+ documentation files)
```

### Setup Instructions

**1. Clone/Download Project**
```bash
# Copy files to your web server or local development folder
cd components/
```

**2. Install Supabase Client Library**
```html
<!-- Add to every HTML page <head> -->
<script async src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js"></script>
```

**3. Configure Supabase Credentials**

Update `supabaseClient.js`:
```javascript
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';
```

**4. Serve via HTTP/HTTPS**
```bash
# Python 3
python -m http.server 8000

# Node.js
npx http-server

# Or use your preferred web server
```

**5. Test Pages**
- http://localhost:8000/index-page/index.html (Home)
- http://localhost:8000/auth-page/auth.html (Auth)
- http://localhost:8000/county-pages/bong.html (County)
- (Others when logged in)

---

## 📋 Development Guidelines

### Code Organization Rules

1. **One responsibility per file**
   - `auth.js` = Authentication logic
   - `forms.js` = Form handling
   - `validation.js` = Validation logic
   - `utils.js` = Utility functions

2. **CSS Organization**
   - `styles.css` = Global/layout styles
   - `{component}.css` = Component-specific styles
   - `responsive.css` = Mobile/tablet styles
   - `variables.css` = CSS variables/tokens

3. **JavaScript Modules**
   - Use `export` for reusable functions
   - Use `import` to reference other modules
   - Keep functions focused and small
   - Document with JSDoc comments

### Naming Conventions

**HTML**:
```html
<!-- IDs for JavaScript hooks (kebab-case) -->
<div id="user-profile-modal"></div>
<button id="submit-form-btn"></button>

<!-- Classes for styling (kebab-case) -->
<div class="county-card">
  <div class="card-header">...</div>
  <div class="card-body">...</div>
</div>
```

**JavaScript**:
```javascript
// Functions: camelCase
function loadUserProfile() { }
async function fetchContent() { }

// Constants: UPPER_SNAKE_CASE
const API_URL = 'https://...';
const DEFAULT_TIMEOUT = 5000;

// Variables: camelCase
let currentUser = null;
const submissionData = {};
```

**CSS**:
```css
/* BEM Methodology */
.county-card { }
.county-card__header { }
.county-card__body { }
.county-card--featured { }

/* Variables */
--spacing-lg
--color-primary
--font-size-base
```

### Common Patterns

**1. Protected Page Template**:
```javascript
// STEP 1: Add to <head>
<script src="../supabaseClient.js"></script>
<script src="../auth-guard.js"></script>

// STEP 2: Load protection before any other JS
<script src="./js/page-protection.js"></script>

// STEP 3: In page-protection.js
(async function() {
  const authGuard = new AuthGuard(window.supabaseClient);
  await authGuard.init();
  
  const result = await authGuard.protectPage({
    requiredAuth: true,
    requiredRoles: ['contributor', 'county_admin', 'super_admin'],
    redirectTo: '../auth-page/auth.html'
  });
  
  if (!result.allowed) return;
  
  // Page initialization can proceed
  window.authProtectionComplete = true;
  await initPageContent();
})();
```

**2. API Call Error Handling**:
```javascript
async function safeQuery(operation) {
  try {
    const { data, error } = await operation();
    
    if (error) {
      console.error('Database error:', error);
      showError('Failed to load data');
      return null;
    }
    
    return data;
  } catch (exception) {
    console.error('Exception:', exception);
    showError('Unexpected error occurred');
    return null;
  }
}

// Usage
const counties = await safeQuery(() =>
  supabaseClient
    .from('counties')
    .select('*')
    .order('name')
);
```

**3. Form Submission**:
```javascript
// Validate → Prepare → Submit → Handle Response
async function handleFormSubmit(event) {
  event.preventDefault();
  
  // Validate
  const validation = validateForm();
  if (!validation.valid) {
    showError(validation.error);
    return;
  }
  
  // Prepare
  const formData = gatherFormData();
  showLoading(true);
  
  // Submit
  const { data, error } = await supabaseClient
    .from('content')
    .insert([formData])
    .select();
  
  showLoading(false);
  
  // Handle Response
  if (error) {
    showError(error.message);
    return;
  }
  
  showSuccess('Content submitted successfully!');
  redirectAfterDelay('/dashboard-page/dashboard.html', 2000);
}
```

**4. Loading States**:
```javascript
// Show skeleton/spinner while loading
function showLoading(show) {
  const loader = document.getElementById('loading-spinner');
  const content = document.getElementById('main-content');
  
  if (show) {
    loader.style.display = 'block';
    content.style.opacity = '0.5';
    content.style.pointerEvents = 'none';
  } else {
    loader.style.display = 'none';
    content.style.opacity = '1';
    content.style.pointerEvents = 'auto';
  }
}
```

### Testing Checklist

Before deploying, test:

**Authentication**:
- [ ] User can register with valid data
- [ ] Registration rejects invalid emails
- [ ] Password validation works (length, complexity)
- [ ] User can login with credentials
- [ ] Session persists on refresh
- [ ] User can logout
- [ ] Redirect after login works

**Content Submission**:
- [ ] Contributor can submit new content
- [ ] Form validation works
- [ ] Image upload works
- [ ] Draft saving works
- [ ] Content appears in admin queue

**Admin Review**:
- [ ] Admin can see submission queue
- [ ] Admin can approve/reject submissions
- [ ] Approved content appears publicly
- [ ] Contributor gets notifications
- [ ] Admin comments are saved

**Authorization**:
- [ ] Unauthenticated users can't access protected pages
- [ ] Contributors can't access admin panel
- [ ] Admins can only see own county content (if county admin)
- [ ] Role changes update permissions immediately

**Data Display**:
- [ ] County pages load correct content
- [ ] Filters work (content type, date, etc.)
- [ ] Pagination works for large lists
- [ ] Images load correctly
- [ ] Mobile layout is responsive

### Performance Optimization

1. **Lazy Load Images**:
```html
<img src="county-flag.jpg" loading="lazy" alt="County flag">
```

2. **Debounce Search**:
```javascript
function debounce(func, delay) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
}

const handleSearch = debounce(function(query) {
  fetchSearchResults(query);
}, 500);
```

3. **Pagination for Large Lists**:
```javascript
const pageSize = 20;
const { data, error } = await supabaseClient
  .from('content')
  .select('*')
  .range(offset, offset + pageSize - 1);
```

4. **Cache User Data**:
```javascript
let cachedUserProfile = null;

async function getUserProfile(userId) {
  if (cachedUserProfile?.id === userId) {
    return cachedUserProfile;
  }
  
  const { data } = await supabaseClient
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  
  cachedUserProfile = data;
  return data;
}
```

---

## 🔄 Common Workflows

### Workflow 1: Add a New County

1. **Backend Admin** (Super Admin):
   - Visit superadmin dashboard
   - Go to "Counties Management"
   - Click "Add County"
   - Fill form: name, description, flag image, governor, etc.
   - Click "Save"

2. **Automatic**:
   - County added to database
   - County appears in dropdowns
   - County page HTML generated (or routed dynamically)

3. **Testing**:
   - Check it appears in home page county list
   - Test county page loads correctly
   - Verify from authentication dropdown

### Workflow 2: Add a New Content Type

1. **Update Database Schema**:
   - Add new enum value to content `type` field
   - Add type-specific columns if needed

2. **Update Registration Form** (if applicable):
   - Add to contributor type options
   - Add validation

3. **Update Contribute Form**:
   - Add type-specific fields
   - Show/hide fields based on selection
   - Add validation rules

4. **Update Content Display**:
   - Add rendering logic in county pages
   - Add filter options
   - Update admin dashboard filters

5. **Update Documentation**:
   - Document new field requirements
   - Update API endpoint docs
   - Add UI screenshots

### Workflow 3: Change Visibility Rules

1. **Update `visibility.js`**:
   - Modify `canSee()` function
   - Update role-based rules
   - Test filtering

2. **Update Database Queries**:
   - Add visibility check to SELECT queries
   - Test queries in Supabase dashboard

3. **Update UI**:
   - Visibility selector in forms
   - Visibility indicator on content
   - Help text for visibility levels

4. **Update Documentation**:
   - Document visibility model
   - Update API docs

---

## 📞 Support & Troubleshooting

### Common Issues

**Issue**: User sees "Unauthorized" error
- **Solution**: Check user role in database, verify auth-guard.js is loaded

**Issue**: Images not displaying
- **Solution**: Check Supabase Storage bucket permissions, verify image URLs

**Issue**: Form submission fails silently
- **Solution**: Check browser console for errors, verify API credentials

**Issue**: County dropdown empty in registration
- **Solution**: Check counties table has data, verify .select() query

**Issue**: Admin dashboard blank
- **Solution**: Check user role is 'super_admin' or 'county_admin', verify page-protection.js loads first

---

## 📚 Additional Resources

### Files to Reference

- [ARCHITECTURE_QUICK_REFERENCE.md](./DOCs/ARCHITECTURE_QUICK_REFERENCE.md)
- [QUICK_REFERENCE.md](./DOCs/QUICK_REFERENCE.md)
- [PROJECT_STRUCTURE.md](./DOCs/PROJECT_STRUCTURE.md)
- [SHARED_RESOURCES.md](./DOCs/SHARED_RESOURCES.md)

### External Documentation

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JS Client](https://supabase.com/docs/reference/javascript)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [MDN Web Docs](https://developer.mozilla.org/)

---

## 📝 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | May 2026 | Initial comprehensive documentation |

---

**Created for**: Frontend Developer Onboarding  
**Purpose**: Build compatible UI/UX from scratch  
**Backend Compatibility**: Supabase PostgreSQL + Auth

For questions about specific features, refer to the detailed documentation files in `/DOCs/` folder.
