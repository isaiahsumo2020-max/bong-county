# Notification & Security Architecture
## Liberia Counties Digital Platform - Advanced Features

**Document Version:** 1.0  
**Date:** May 13, 2026  
**Status:** Complete Implementation Plan

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Data Schema](#data-schema)
3. [Content Targeting System](#content-targeting-system)
4. [Notification Engine](#notification-engine)
5. [Role-Based Access Control](#role-based-access-control)
6. [Security Implementation](#security-implementation)
7. [Dashboard Architecture](#dashboard-architecture)
8. [RLS Policies](#rls-policies)
9. [Future Architecture](#future-architecture)
10. [Implementation Timeline](#implementation-timeline)

---

## System Overview

### Architecture Layers

```
┌─────────────────────────────────────────────┐
│          CLIENT LAYER (Browser)             │
│  ├─ Authentication Guards                   │
│  ├─ Role-Based Navigation                   │
│  └─ Dashboard UI (Role-Specific)            │
└────────────────┬────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│       BUSINESS LOGIC LAYER (JS)             │
│  ├─ Content Targeting Engine                │
│  ├─ Notification Manager                    │
│  ├─ Permission Validator                    │
│  └─ Role Controller                         │
└────────────────┬────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│      API & DATABASE LAYER (Supabase)        │
│  ├─ Authentication                          │
│  ├─ RLS Policies (Row-Level Security)       │
│  ├─ Data Access Control                     │
│  └─ Query Authorization                     │
└─────────────────────────────────────────────┘
```

### Key Components

```
CONTENT TARGETING SYSTEM
├─ Tags (flexible, searchable)
├─ Opportunity Types (jobs, grants, scholarships)
├─ Target Audiences (8 audience types)
├─ Visibility Levels (5 levels)
└─ Content Filters

NOTIFICATION ENGINE
├─ In-App Notifications
├─ Email Notifications
├─ Dashboard Alerts
├─ Notification Queue
└─ Subscriber Management

ROLE-BASED ACCESS CONTROL
├─ Role Hierarchy (visitor→contributor→county_admin→super_admin)
├─ Permission Matrix (40+ permissions)
├─ Resource Ownership
└─ County Isolation

SECURITY LAYER
├─ Auth Guards (frontend protection)
├─ Middleware (backend protection)
├─ RLS Policies (database protection)
├─ Permission Validation
└─ Secure API Access
```

---

## Data Schema

### 1. Content Table (Enhanced)

```sql
CREATE TABLE content (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  body TEXT NOT NULL,
  author_id UUID REFERENCES auth.users,
  county TEXT,
  
  -- TARGETING FIELDS
  tags JSONB DEFAULT '[]',                    -- ["agriculture", "youth"]
  opportunity_type TEXT,                      -- job, grant, scholarship, none
  target_audiences JSONB DEFAULT '[]',        -- ["students", "journalists"]
  
  -- VISIBILITY & ACCESS
  visibility TEXT DEFAULT 'authenticated_only',
  requires_subscription BOOLEAN DEFAULT FALSE,
  
  -- METADATA
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  published_at TIMESTAMP,
  
  -- ANALYTICS
  view_count INT DEFAULT 0,
  engagement_score INT DEFAULT 0
);

-- Indexes for targeting
CREATE INDEX idx_content_tags ON content USING GIN(tags);
CREATE INDEX idx_content_audiences ON content USING GIN(target_audiences);
CREATE INDEX idx_content_opportunity_type ON content(opportunity_type);
```

### 2. Notifications Table

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  recipient_id UUID REFERENCES auth.users,
  sender_id UUID REFERENCES auth.users,
  
  type TEXT NOT NULL,                         -- content_published, opportunity_matched, message
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  icon TEXT,
  action_url TEXT,
  
  -- TARGETING
  target_audience TEXT,                       -- specific audience this matches
  
  -- STATUS
  is_read BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  
  -- DELIVERY
  created_at TIMESTAMP DEFAULT NOW(),
  read_at TIMESTAMP,
  
  -- CHANNELS
  in_app_sent BOOLEAN DEFAULT TRUE,
  email_sent BOOLEAN DEFAULT FALSE,
  email_sent_at TIMESTAMP,
  
  -- PERSONALIZATION
  personalization_context JSONB              -- { matched_tags: [...], matched_audiences: [...] }
);

-- Indexes for notification queries
CREATE INDEX idx_notifications_recipient ON notifications(recipient_id, is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
```

### 3. User Subscriptions Table

```sql
CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users UNIQUE,
  
  -- INTERESTS
  interested_tags JSONB DEFAULT '[]',         -- Tags user cares about
  interested_audiences TEXT[],                -- Audience types they belong to
  interested_counties TEXT[],                 -- Counties of interest
  
  -- PREFERENCES
  notification_frequency TEXT DEFAULT 'daily', -- immediate, daily, weekly
  notification_channels TEXT[] DEFAULT '{"in_app", "email"}',
  
  -- SUBSCRIPTION TIER
  tier TEXT DEFAULT 'free',                   -- free, premium, enterprise
  tier_start_date TIMESTAMP,
  tier_end_date TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_tier ON user_subscriptions(tier);
```

### 4. Permission Roles Table

```sql
CREATE TABLE permission_roles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  
  role TEXT NOT NULL,                         -- super_admin, county_admin, contributor, visitor
  assigned_county TEXT,                       -- NULL for super_admin/visitor
  
  -- PERMISSIONS (stored as JSONB for flexibility)
  permissions JSONB DEFAULT '{}',             -- {can_create_content, can_manage_users, ...}
  
  created_at TIMESTAMP DEFAULT NOW(),
  assigned_by UUID REFERENCES auth.users
);

CREATE INDEX idx_permission_roles_user ON permission_roles(user_id);
CREATE INDEX idx_permission_roles_role ON permission_roles(role);
```

### 5. Tag Table

```sql
CREATE TABLE tags (
  id UUID PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  category TEXT,                              -- general, industry, skill, topic
  usage_count INT DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tags_category ON tags(category);
```

### 6. Opportunity Types Table

```sql
CREATE TABLE opportunity_types (
  id UUID PRIMARY KEY,
  type TEXT UNIQUE NOT NULL,                  -- job, grant, scholarship, partnership, event
  label TEXT NOT NULL,
  icon TEXT,
  description TEXT,
  
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 7. Audience Segments Table

```sql
CREATE TABLE audience_segments (
  id UUID PRIMARY KEY,
  segment_name TEXT UNIQUE NOT NULL,          -- students, journalists, etc
  description TEXT,
  icon TEXT,
  
  filter_criteria JSONB,                      -- criteria to auto-match users
  
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Content Targeting System

### Architecture

```
CONTENT CREATION FLOW
    │
    ├─ Author sets tags
    │   └─ Flexible, searchable
    │
    ├─ Author selects opportunity type
    │   └─ job, grant, scholarship, partnership, event, none
    │
    ├─ Author targets audiences
    │   ├─ students
    │   ├─ journalists
    │   ├─ organizations
    │   ├─ universities
    │   ├─ healthcare workers
    │   ├─ youth advocates
    │   ├─ NGOs
    │   └─ developers
    │
    ├─ Author sets visibility
    │   └─ public, authenticated_only, county_only, admin_only, private
    │
    └─ System matches with subscribers
        ├─ Filter by target audiences
        ├─ Filter by tags
        ├─ Filter by visibility
        └─ Send notifications
```

### Content Targeting Data Structure

```javascript
const contentTarget = {
  tags: [
    { name: 'agriculture', category: 'industry' },
    { name: 'youth', category: 'topic' },
    { name: 'sustainable', category: 'skill' }
  ],
  
  opportunityType: 'grant',                   // or: job, scholarship, partnership, event, none
  
  targetAudiences: [
    'youth advocates',
    'organizations',
    'ngos'
  ],
  
  visibility: 'authenticated_only',           // Public, Authenticated, County, Admin, Private
  
  county: 'bong',                             // For county-specific content
  
  metadata: {
    createdAt: '2026-05-13T10:00:00Z',
    publishedAt: '2026-05-13T10:00:00Z',
    viewCount: 0,
    engagementScore: 0
  }
};
```

### 8 Target Audiences

```
1. STUDENTS
   - University students
   - Tech bootcamp participants
   - Online course enrollees
   - Scholarships, internships, academic opportunities

2. JOURNALISTS
   - Media professionals
   - Content creators
   - Investigative reporters
   - News stories, press releases, exclusive content

3. ORGANIZATIONS
   - NGOs
   - Non-profits
   - Businesses
   - Partnership opportunities, funding, resources

4. UNIVERSITIES
   - Academic institutions
   - Research centers
   - Educational partnerships
   - Academic content, research opportunities

5. HEALTHCARE WORKERS
   - Doctors, nurses, health professionals
   - Medical students
   - Health organizations
   - Medical opportunities, health content

6. YOUTH ADVOCATES
   - Youth leaders
   - Community organizers
   - Young professionals
   - Youth programs, advocacy, mentorship

7. NGOs (Non-Governmental Organizations)
   - Development organizations
   - Humanitarian groups
   - Social enterprises
   - Funding, partnerships, projects

8. DEVELOPERS
   - Software developers
   - Tech entrepreneurs
   - Tech teams
   - Tech opportunities, APIs, resources
```

### Implementation Functions

```javascript
// src/shared/js/content-targeting.js

class ContentTargeting {
  
  // Get all available tags
  static getAllTags() {
    return [
      { name: 'agriculture', category: 'industry' },
      { name: 'technology', category: 'industry' },
      { name: 'healthcare', category: 'industry' },
      { name: 'education', category: 'industry' },
      { name: 'tourism', category: 'industry' },
      // ... more tags
    ];
  }
  
  // Get available opportunity types
  static getOpportunityTypes() {
    return [
      { type: 'job', label: 'Job Opportunity' },
      { type: 'grant', label: 'Grant/Funding' },
      { type: 'scholarship', label: 'Scholarship' },
      { type: 'partnership', label: 'Partnership' },
      { type: 'event', label: 'Event' },
      { type: 'none', label: 'No Opportunity' }
    ];
  }
  
  // Get available target audiences
  static getTargetAudiences() {
    return [
      { name: 'students', icon: '🎓' },
      { name: 'journalists', icon: '📰' },
      { name: 'organizations', icon: '🏢' },
      { name: 'universities', icon: '🎓' },
      { name: 'healthcare workers', icon: '⚕️' },
      { name: 'youth advocates', icon: '👥' },
      { name: 'ngos', icon: '🤝' },
      { name: 'developers', icon: '💻' }
    ];
  }
  
  // Check if content matches user's interests
  static matchesUserInterests(content, userSubscription) {
    // Check if any target audience matches
    const audienceMatch = content.targetAudiences.some(aud => 
      userSubscription.interestedAudiences.includes(aud)
    );
    
    // Check if any tag matches
    const tagMatch = content.tags.some(tag => 
      userSubscription.interestedTags.includes(tag.name)
    );
    
    // Check county match
    const countyMatch = content.county === userSubscription.interestedCounties[0];
    
    return audienceMatch || tagMatch || countyMatch;
  }
  
  // Build content filter query
  static buildTargetingQuery(filters) {
    let query = '';
    
    if (filters.tags && filters.tags.length > 0) {
      query += `tags IN (${filters.tags.join(',')})`;
    }
    
    if (filters.audiences && filters.audiences.length > 0) {
      query += ` AND targetAudiences IN (${filters.audiences.join(',')})`;
    }
    
    if (filters.opportunityType) {
      query += ` AND opportunityType = '${filters.opportunityType}'`;
    }
    
    return query;
  }
}
```

---

## Notification Engine

### Architecture

```
CONTENT PUBLISHED
    │
    ├─ Extract targeting metadata
    │   ├─ Tags
    │   ├─ Target audiences
    │   └─ Opportunity type
    │
    ├─ Query matching subscribers
    │   ├─ Filter by audience
    │   ├─ Filter by interests
    │   ├─ Filter by visibility
    │   └─ Filter by permissions
    │
    ├─ Create notifications
    │   ├─ In-app (immediate)
    │   ├─ Email (batch)
    │   └─ Dashboard alert (real-time)
    │
    └─ Track delivery
        ├─ Read status
        ├─ Engagement metrics
        └─ Personalization context
```

### Notification Types

```javascript
// In-App Notification
{
  type: 'content_published',
  title: 'New Opportunity: Agriculture Grant',
  body: 'A new grant opportunity matching your interests',
  icon: '💰',
  actionUrl: '/opportunities/123',
  createdAt: '2026-05-13T10:00:00Z'
}

// Email Notification
{
  subject: 'New Opportunity Matching Your Interests',
  template: 'opportunity_published',
  recipient: 'user@example.com',
  personalization: {
    firstName: 'John',
    opportunityTitle: 'Agriculture Grant',
    matchedTags: ['agriculture', 'sustainable'],
    matchedAudiences: ['youth advocates']
  }
}

// Dashboard Alert
{
  type: 'alert',
  priority: 'high',
  title: '3 New Opportunities Match Your Interests',
  body: 'Check the Opportunities section',
  actionUrl: '/opportunities',
  icon: '🔔'
}
```

### Notification Manager Implementation

```javascript
// src/shared/js/notification-engine.js

class NotificationEngine {
  
  constructor(supabaseClient) {
    this.db = supabaseClient;
    this.notificationQueue = [];
  }
  
  // Called when content is published
  async onContentPublished(content, author) {
    // Get matching subscribers
    const matchingSubscribers = await this.findMatchingSubscribers(content);
    
    // Create notifications for each subscriber
    for (const subscriber of matchingSubscribers) {
      await this.createNotification(content, subscriber, author);
    }
  }
  
  // Find subscribers interested in this content
  async findMatchingSubscribers(content) {
    const { data: subscribers } = await this.db
      .from('user_subscriptions')
      .select('*')
      .gte('updated_at', new Date(Date.now() - 30*24*60*60*1000)); // Active last 30 days
    
    return subscribers.filter(sub => this.contentMatches(content, sub));
  }
  
  // Check if content matches subscriber interests
  contentMatches(content, subscriber) {
    // Check visibility permissions
    if (!this.userCanSeeContent(subscriber.user_id, content)) {
      return false;
    }
    
    // Check audience match
    const audienceMatch = content.target_audiences.some(aud => 
      subscriber.interested_audiences.includes(aud)
    );
    
    // Check tag match
    const tagMatch = content.tags.some(tag => 
      subscriber.interested_tags.includes(tag)
    );
    
    // Check county match
    const countyMatch = !subscriber.interested_counties.length ||
      subscriber.interested_counties.includes(content.county);
    
    return audienceMatch || tagMatch || countyMatch;
  }
  
  // Create notification for subscriber
  async createNotification(content, subscriber, author) {
    const notification = {
      recipient_id: subscriber.user_id,
      sender_id: author.id,
      type: 'content_published',
      title: `New ${content.opportunity_type || 'Content'}: ${content.title}`,
      body: content.description,
      icon: this.getIcon(content.opportunity_type),
      action_url: `/content/${content.id}`,
      target_audience: this.getTargetAudience(content, subscriber),
      personalization_context: {
        matched_tags: this.getMatchedTags(content, subscriber),
        matched_audiences: this.getMatchedAudiences(content, subscriber)
      }
    };
    
    // Add to queue
    this.notificationQueue.push(notification);
    
    // Send in-app immediately
    await this.sendInAppNotification(notification);
    
    // Queue email for batch
    if (subscriber.notification_channels.includes('email')) {
      await this.queueEmailNotification(notification, subscriber);
    }
  }
  
  // Send in-app notification
  async sendInAppNotification(notification) {
    const { error } = await this.db
      .from('notifications')
      .insert([{
        ...notification,
        in_app_sent: true
      }]);
    
    if (error) console.error('Failed to send notification:', error);
  }
  
  // Queue email notification for batch sending
  async queueEmailNotification(notification, subscriber) {
    // Store in email queue table
    const { error } = await this.db
      .from('email_queue')
      .insert([{
        notification_id: notification.id,
        recipient_email: subscriber.email,
        template: 'content_published',
        scheduled_for: new Date()
      }]);
    
    if (error) console.error('Failed to queue email:', error);
  }
  
  // Get notification preferences for user
  async getUserNotificationPreferences(userId) {
    const { data } = await this.db
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    return {
      frequency: data.notification_frequency,
      channels: data.notification_channels,
      interests: {
        tags: data.interested_tags,
        audiences: data.interested_audiences,
        counties: data.interested_counties
      }
    };
  }
  
  // Update notification as read
  async markAsRead(notificationId) {
    await this.db
      .from('notifications')
      .update({ is_read: true, read_at: new Date() })
      .eq('id', notificationId);
  }
  
  // Helper functions
  getIcon(opportunityType) {
    const icons = {
      'job': '💼',
      'grant': '💰',
      'scholarship': '🎓',
      'partnership': '🤝',
      'event': '📅'
    };
    return icons[opportunityType] || '📢';
  }
  
  getTargetAudience(content, subscriber) {
    return content.target_audiences.find(aud => 
      subscriber.interested_audiences.includes(aud)
    );
  }
  
  getMatchedTags(content, subscriber) {
    return content.tags.filter(tag => 
      subscriber.interested_tags.includes(tag)
    );
  }
  
  getMatchedAudiences(content, subscriber) {
    return content.target_audiences.filter(aud => 
      subscriber.interested_audiences.includes(aud)
    );
  }
  
  userCanSeeContent(userId, content) {
    // Check visibility and permissions
    // Implemented with RLS policies
    return true; // Actual check done by RLS
  }
}
```

---

## Role-Based Access Control

### 4 Role Hierarchy

```
SUPER_ADMIN (Level 3)
├─ Full system access
├─ Manage all users
├─ Manage all content
├─ Configure system settings
├─ View all analytics
└─ Access all counties

    ↓
COUNTY_ADMIN (Level 2)
├─ Manage county content
├─ Manage county users
├─ County-specific analytics
├─ Cannot access other counties
└─ Cannot change system settings

    ↓
CONTRIBUTOR (Level 1)
├─ Create content
├─ Edit own content
├─ View county content
├─ Receive notifications
└─ Cannot manage users

    ↓
VISITOR (Level 0)
├─ View public content
├─ Browse counties
├─ View public galleries
└─ Cannot create content
```

### Permission Matrix

```
PERMISSION              | VISITOR | CONTRIBUTOR | COUNTY_ADMIN | SUPER_ADMIN
View Public Content     |   ✓     |      ✓      |      ✓       |     ✓
View Auth Content       |         |      ✓      |      ✓       |     ✓
View County Content     |         |      ✓      |      ✓       |     ✓
View Admin Content      |         |             |      ✓       |     ✓
Create Content          |         |      ✓      |      ✓       |     ✓
Edit Own Content        |         |      ✓      |      ✓       |     ✓
Edit Any Content        |         |             |      ✓       |     ✓
Delete Own Content      |         |      ✓      |      ✓       |     ✓
Delete Any Content      |         |             |      ✓       |     ✓
Manage Users            |         |             |      ✓       |     ✓
Manage County           |         |             |      ✓       |     ✓
Manage System Settings  |         |             |             |     ✓
View Analytics          |         |      ✓      |      ✓       |     ✓
Manage Permissions      |         |             |             |     ✓
Configure Audiences     |         |             |             |     ✓
```

### Role Manager Implementation

```javascript
// src/shared/js/role-manager.js

class RoleManager {
  
  static ROLES = {
    SUPER_ADMIN: 'super_admin',
    COUNTY_ADMIN: 'county_admin',
    CONTRIBUTOR: 'contributor',
    VISITOR: 'visitor'
  };
  
  static PERMISSIONS = {
    // Content permissions
    'view:public_content': { level: 0 },
    'view:authenticated_content': { level: 1 },
    'view:county_content': { level: 1 },
    'view:admin_content': { level: 2 },
    'create:content': { level: 1 },
    'edit:own_content': { level: 1 },
    'edit:any_content': { level: 2 },
    'delete:own_content': { level: 1 },
    'delete:any_content': { level: 2 },
    
    // User management
    'manage:users': { level: 2 },
    'manage:county_users': { level: 2 },
    'manage:permissions': { level: 3 },
    
    // Settings
    'manage:system_settings': { level: 3 },
    'manage:county_settings': { level: 2 },
    'configure:audiences': { level: 3 },
    
    // Analytics
    'view:analytics': { level: 1 },
    'view:admin_analytics': { level: 3 }
  };
  
  // Get user's role level
  static getRoleLevel(role) {
    const levels = {
      'visitor': 0,
      'contributor': 1,
      'county_admin': 2,
      'super_admin': 3
    };
    return levels[role] || 0;
  }
  
  // Check if user has permission
  static hasPermission(user, permission) {
    const perm = this.PERMISSIONS[permission];
    if (!perm) return false;
    
    const userLevel = this.getRoleLevel(user.role);
    return userLevel >= perm.level;
  }
  
  // Get all permissions for role
  static getPermissionsForRole(role) {
    const roleLevel = this.getRoleLevel(role);
    const permissions = {};
    
    for (const [perm, config] of Object.entries(this.PERMISSIONS)) {
      if (roleLevel >= config.level) {
        permissions[perm] = true;
      }
    }
    
    return permissions;
  }
  
  // Check resource ownership
  static isResourceOwner(user, resource) {
    return user.id === resource.author_id;
  }
  
  // Check county access
  static hasCountyAccess(user, county) {
    if (user.role === 'super_admin') return true;
    if (user.role === 'county_admin') return user.county === county;
    if (user.role === 'contributor') return true;
    return false;
  }
  
  // Assign role to user
  static async assignRole(targetUserId, role, assignedBy, assignedCounty = null) {
    // Can only be done by super_admin or county_admin (for county_admin role)
    const permissionGranter = {
      'super_admin': 3,
      'county_admin': 2,
      'contributor': 1,
      'visitor': 0
    };
    
    if (permissionGranter[assignedBy.role] < permissionGranter[role]) {
      throw new Error('Insufficient permissions to assign this role');
    }
    
    // Assign role
    return {
      userId: targetUserId,
      role: role,
      county: assignedCounty,
      assignedAt: new Date(),
      assignedBy: assignedBy.id
    };
  }
}
```

---

## Security Implementation

### Authentication Guards

```javascript
// src/shared/js/auth-guards.js

class AuthGuards {
  
  constructor(supabaseClient) {
    this.supabase = supabaseClient;
  }
  
  // Main guard for page access
  async guardPageAccess(page, requiredRole = null) {
    const user = await this.getCurrentUser();
    
    if (!user && page.requiresAuth) {
      return {
        allowed: false,
        redirect: '/auth?next=' + window.location.pathname,
        reason: 'NOT_AUTHENTICATED'
      };
    }
    
    if (requiredRole && !this.hasRole(user, requiredRole)) {
      return {
        allowed: false,
        redirect: '/dashboard',
        reason: 'INSUFFICIENT_ROLE'
      };
    }
    
    return { allowed: true };
  }
  
  // Guard for content access
  async guardContentAccess(contentId, user) {
    const content = await this.getContent(contentId);
    
    // Check visibility
    if (!this.canViewContent(content, user)) {
      return { allowed: false, reason: 'CONTENT_NOT_VISIBLE' };
    }
    
    return { allowed: true };
  }
  
  // Guard for API calls
  async guardApiCall(endpoint, method, user) {
    const token = await this.getAuthToken();
    
    if (!token) {
      return { allowed: false, reason: 'NO_AUTH_TOKEN' };
    }
    
    // Verify token validity
    const valid = await this.verifyToken(token);
    if (!valid) {
      return { allowed: false, reason: 'INVALID_TOKEN' };
    }
    
    return {
      allowed: true,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  }
  
  // Get current authenticated user
  async getCurrentUser() {
    const { data } = await this.supabase.auth.getSession();
    return data.session?.user || null;
  }
  
  // Check if user has required role
  hasRole(user, requiredRole) {
    const userLevel = RoleManager.getRoleLevel(user.role);
    const requiredLevel = RoleManager.getRoleLevel(requiredRole);
    return userLevel >= requiredLevel;
  }
  
  // Check if user can view content
  canViewContent(content, user) {
    // Use visibility system
    return ContentVisibility.canSee(content, user);
  }
  
  // Get auth token
  async getAuthToken() {
    const { data } = await this.supabase.auth.getSession();
    return data.session?.access_token || null;
  }
  
  // Verify token is valid
  async verifyToken(token) {
    try {
      const { data } = await this.supabase.auth.getUser(token);
      return !!data.user;
    } catch {
      return false;
    }
  }
}
```

### Middleware for Requests

```javascript
// src/shared/js/middleware.js

class SecurityMiddleware {
  
  static async validateRequest(request, user, requiredPermission) {
    const checks = [
      this.validateAuth(user),
      this.validatePermission(user, requiredPermission),
      this.validateRateLimit(user),
      this.validateInput(request),
      this.validateCSRFToken(request)
    ];
    
    for (const check of checks) {
      if (!check) {
        return { valid: false, reason: check.reason };
      }
    }
    
    return { valid: true };
  }
  
  // Validate user is authenticated
  static validateAuth(user) {
    if (!user) {
      return { valid: false, reason: 'NOT_AUTHENTICATED' };
    }
    return { valid: true };
  }
  
  // Validate user has permission
  static validatePermission(user, permission) {
    if (!RoleManager.hasPermission(user, permission)) {
      return { valid: false, reason: 'INSUFFICIENT_PERMISSION' };
    }
    return { valid: true };
  }
  
  // Check rate limiting
  static validateRateLimit(user) {
    // Implement rate limiting logic
    return { valid: true };
  }
  
  // Validate input data
  static validateInput(request) {
    if (!request || !request.data) {
      return { valid: false, reason: 'INVALID_INPUT' };
    }
    
    // Sanitize input
    request.data = this.sanitizeInput(request.data);
    
    return { valid: true };
  }
  
  // Sanitize user input
  static sanitizeInput(data) {
    // Remove potentially dangerous characters
    // Prevent SQL injection, XSS, etc.
    return data;
  }
  
  // Validate CSRF token
  static validateCSRFToken(request) {
    const token = request.headers['x-csrf-token'];
    // Verify token
    return { valid: true };
  }
}
```

---

## Dashboard Architecture

### Super Admin Dashboard

```
SUPER_ADMIN DASHBOARD
├─ System Overview
│  ├─ Total Users
│  ├─ Total Content
│  ├─ System Health
│  └─ Analytics
├─ User Management
│  ├─ All Users
│  ├─ Assign Roles
│  ├─ Manage Permissions
│  └─ Ban/Suspend
├─ Content Management
│  ├─ All Content
│  ├─ Moderate Content
│  ├─ Remove Content
│  └─ Manage Tags
├─ Configuration
│  ├─ System Settings
│  ├─ Visibility Levels
│  ├─ Opportunity Types
│  └─ Audience Segments
├─ Analytics
│  ├─ User Growth
│  ├─ Content Performance
│  ├─ Engagement Metrics
│  └─ System Metrics
└─ County Management
   ├─ Assign County Admins
   ├─ County Stats
   └─ County Settings
```

### County Admin Dashboard

```
COUNTY_ADMIN DASHBOARD
├─ County Overview
│  ├─ County Stats
│  ├─ User Count
│  ├─ Content Count
│  └─ Recent Activity
├─ User Management
│  ├─ County Users
│  ├─ Assign Contributors
│  └─ User Stats
├─ Content Management
│  ├─ County Content
│  ├─ Moderate Content
│  ├─ Featured Content
│  └─ Manage Tags (County)
├─ County Settings
│  ├─ County Info
│  ├─ County Logo/Banner
│  └─ County Details
├─ Analytics
│  ├─ User Engagement
│  ├─ Content Performance
│  ├─ Popular Tags
│  └─ County Metrics
└─ Opportunities
   ├─ County Opportunities
   ├─ Create Opportunity
   └─ Opportunity Stats
```

### Contributor Dashboard

```
CONTRIBUTOR DASHBOARD
├─ My Profile
│  ├─ Profile Info
│  ├─ Interests
│  ├─ Subscriptions
│  └─ Settings
├─ My Content
│  ├─ Published Content
│  ├─ Create New
│  ├─ Draft Content
│  └─ Analytics
├─ Notifications
│  ├─ All Notifications
│  ├─ Mark as Read
│  ├─ Preferences
│  └─ Notification Center
├─ Opportunities
│  ├─ Matching Opportunities
│  ├─ Saved Opportunities
│  ├─ Applied Opportunities
│  └─ My Opportunities
├─ Community
│  ├─ Discussions
│  ├─ Messages
│  └─ Network
└─ Resources
   ├─ Educational Resources
   ├─ Tools
   └─ Documentation
```

---

## RLS Policies

### Enhanced Content Policies

```sql
-- PUBLIC CONTENT: Visible to everyone
CREATE POLICY "public_content_readable"
  ON content FOR SELECT
  USING (visibility = 'public');

-- AUTHENTICATED CONTENT: Visible to logged-in users
CREATE POLICY "authenticated_content_readable"
  ON content FOR SELECT
  USING (
    visibility IN ('public', 'authenticated_only')
    AND auth.role() = 'authenticated'
  );

-- COUNTY CONTENT: Visible to county members
CREATE POLICY "county_content_readable"
  ON content FOR SELECT
  USING (
    visibility IN ('public', 'authenticated_only', 'county_only')
    AND (
      visibility != 'county_only'
      OR county = auth.jwt() ->> 'county'
    )
  );

-- ADMIN CONTENT: Visible to admins and super admins
CREATE POLICY "admin_content_readable"
  ON content FOR SELECT
  USING (
    visibility IN ('public', 'authenticated_only', 'county_only', 'admin_only')
    AND (
      visibility != 'admin_only'
      OR auth.jwt() ->> 'role' IN ('admin', 'super_admin')
    )
  );

-- PRIVATE CONTENT: Visible to owner and super admins
CREATE POLICY "private_content_readable"
  ON content FOR SELECT
  USING (
    visibility = 'private'
    AND (
      author_id = auth.uid()
      OR auth.jwt() ->> 'role' = 'super_admin'
    )
  );

-- CREATE CONTENT: Contributors and above can create
CREATE POLICY "create_content"
  ON content FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND auth.jwt() ->> 'role' IN ('contributor', 'county_admin', 'super_admin')
    AND author_id = auth.uid()
  );

-- UPDATE CONTENT: Own content or admin
CREATE POLICY "update_content"
  ON content FOR UPDATE
  USING (
    author_id = auth.uid()
    OR auth.jwt() ->> 'role' IN ('county_admin', 'super_admin')
  );

-- DELETE CONTENT: Own content or admin
CREATE POLICY "delete_content"
  ON content FOR DELETE
  USING (
    author_id = auth.uid()
    OR auth.jwt() ->> 'role' IN ('county_admin', 'super_admin')
  );
```

### Notification Policies

```sql
-- NOTIFICATIONS: Users can only see their own
CREATE POLICY "view_own_notifications"
  ON notifications FOR SELECT
  USING (
    recipient_id = auth.uid()
  );

-- RECIPIENTS CAN MARK AS READ
CREATE POLICY "update_own_notifications"
  ON notifications FOR UPDATE
  USING (
    recipient_id = auth.uid()
  );

-- ADMINS CAN DELETE
CREATE POLICY "delete_notifications"
  ON notifications FOR DELETE
  USING (
    auth.jwt() ->> 'role' = 'super_admin'
  );
```

---

## Future Architecture

### Phase 2: Mobile App Support

```
MOBILE APP ENDPOINTS
├─ /api/v1/content
│  ├─ GET /content (filtered)
│  ├─ POST /content (create)
│  └─ GET /content/:id
├─ /api/v1/notifications
│  ├─ GET /notifications
│  ├─ POST /notifications/:id/read
│  └─ DELETE /notifications/:id
├─ /api/v1/opportunities
│  ├─ GET /opportunities (personalized)
│  ├─ POST /opportunities/:id/apply
│  └─ GET /my-applications
├─ /api/v1/user
│  ├─ GET /profile
│  ├─ PUT /profile
│  └─ GET /subscriptions
└─ /api/v1/search
   ├─ GET /search (with filters)
   └─ GET /trending
```

### Phase 3: Push Notifications

```
PUSH NOTIFICATION SERVICE
├─ Firebase Cloud Messaging (FCM)
├─ Device Token Management
├─ Notification Scheduling
├─ Delivery Tracking
└─ User Preferences
```

### Phase 4: Real-Time Notifications

```
REAL-TIME ARCHITECTURE
├─ WebSocket Connection
├─ Live Notification Stream
├─ Presence Detection
├─ Message Delivery Confirmation
└─ Offline Queue
```

### Phase 5: AI Recommendations

```
RECOMMENDATION ENGINE
├─ Content-Based Filtering
│  ├─ User interests + Content tags
│  └─ Similarity scoring
├─ Collaborative Filtering
│  ├─ User similarity
│  └─ Item similarity
├─ Personalization
│  ├─ User behavior
│  ├─ Historical data
│  └─ ML model
└─ A/B Testing
   ├─ Experiment variants
   ├─ Performance metrics
   └─ Winner selection
```

### Phase 6: Advanced Analytics

```
ANALYTICS DASHBOARD
├─ Real-Time Metrics
│  ├─ Active users
│  ├─ Content views
│  └─ Engagement rate
├─ Historical Trends
│  ├─ Growth curves
│  ├─ Seasonal patterns
│  └─ User retention
├─ Content Performance
│  ├─ Most viewed
│  ├─ Most shared
│  └─ Engagement by tag
├─ User Segmentation
│  ├─ Cohort analysis
│  ├─ Retention cohorts
│  └─ Behavior segments
└─ Conversion Funnels
   ├─ Registration flow
   ├─ Content creation
   └─ Opportunity applications
```

---

## Implementation Timeline

### Week 1: Core Systems
- [ ] Deploy RLS policies to Supabase
- [ ] Implement notification tables/schema
- [ ] Build notification engine
- [ ] Create role manager system
- [ ] Implement auth guards

### Week 2: Targeting & UI
- [ ] Implement content targeting system
- [ ] Build content targeting UI
- [ ] Create notification center UI
- [ ] Add audience selector to forms
- [ ] Add tag management interface

### Week 3: Dashboards
- [ ] Build super admin dashboard
- [ ] Build county admin dashboard
- [ ] Build contributor dashboard
- [ ] Add analytics to dashboards
- [ ] Implement dashboard navigation

### Week 4: Testing & Polish
- [ ] Test notifications end-to-end
- [ ] Test role-based access
- [ ] Test permission checks
- [ ] Performance testing
- [ ] Security audit
- [ ] User testing

### Week 5: Deployment
- [ ] Deploy to production
- [ ] Monitor for issues
- [ ] Gather user feedback
- [ ] Make final adjustments
- [ ] Document for admins

---

## Success Criteria

### Functionality
- [ ] Content creators can add tags and target audiences
- [ ] Notifications sent to matching users
- [ ] Role-based dashboards work correctly
- [ ] Permissions enforced at all levels
- [ ] RLS policies prevent unauthorized access

### Performance
- [ ] Notification delivery < 5 seconds
- [ ] Dashboard loads < 2 seconds
- [ ] Search queries < 1 second
- [ ] No database performance degradation

### Security
- [ ] No unauthorized access possible
- [ ] All data properly encrypted
- [ ] RLS policies working correctly
- [ ] Auth tokens validated
- [ ] CSRF protection active

### User Experience
- [ ] Targeting UI intuitive
- [ ] Notification center easy to use
- [ ] Dashboards clear and organized
- [ ] Mobile responsive
- [ ] No broken links/features

---

## Conclusion

This architecture provides:
- ✅ Sophisticated content targeting
- ✅ Personalized notifications
- ✅ Robust security
- ✅ Role-based access control
- ✅ Scalable design
- ✅ Future extensibility

**Status: READY FOR IMPLEMENTATION**

---

**Document Version:** 1.0  
**Last Updated:** May 13, 2026  
**Next Review:** After implementation phase
