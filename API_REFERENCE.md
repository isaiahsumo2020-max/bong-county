# 🔗 Liberia CountySphere - API Reference & Quick Lookup

**Quick guide for API endpoints, database queries, and common code patterns**

---

## 📍 API Endpoints Quick Reference

### Authentication Endpoints

```javascript
// REGISTER
const { data, error } = await supabaseClient.auth.signUp({
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

// LOGIN
const { data, error } = await supabaseClient.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'Password123'
});

// GET CURRENT USER
const { data: { user }, error } = await supabaseClient.auth.getUser();

// LOGOUT
const { error } = await supabaseClient.auth.signOut();

// REFRESH SESSION
const { data, error } = await supabaseClient.auth.refreshSession();

// PASSWORD RESET REQUEST
const { data, error } = await supabaseClient.auth.resetPasswordForEmail(
  'user@example.com'
);

// UPDATE PASSWORD (after reset)
const { data, error } = await supabaseClient.auth.updateUser({
  password: 'NewPassword123'
});
```

### User Profile Endpoints

```javascript
// GET USER PROFILE
const { data, error } = await supabaseClient
  .from('users')
  .select('*')
  .eq('id', userId)
  .single();

// GET ALL USERS (ADMIN)
const { data, error } = await supabaseClient
  .from('users')
  .select('*')
  .eq('role', 'contributor')
  .order('created_at', { ascending: false })
  .range(0, 19);  // Pagination: first 20

// UPDATE USER PROFILE
const { error } = await supabaseClient
  .from('users')
  .update({
    full_name: 'New Name',
    bio: 'Updated bio',
    avatar_url: 'https://...'
  })
  .eq('id', userId);

// UPDATE USER ROLE (ADMIN)
const { error } = await supabaseClient
  .from('users')
  .update({ role: 'county_admin' })
  .eq('id', userId);

// DEACTIVATE USER (ADMIN)
const { error } = await supabaseClient
  .from('users')
  .update({ is_active: false })
  .eq('id', userId);
```

### Content Endpoints

```javascript
// GET ALL PUBLIC CONTENT
const { data, error } = await supabaseClient
  .from('content')
  .select('*, counties(name), users(full_name)')
  .eq('visibility', 'public')
  .eq('status', 'published')
  .order('published_at', { ascending: false })
  .limit(20);

// GET CONTENT BY COUNTY
const { data, error } = await supabaseClient
  .from('content')
  .select('*')
  .eq('county_id', countyId)
  .eq('status', 'published')
  .order('published_at', { ascending: false });

// GET CONTENT BY TYPE (tourism, event, opportunity, news)
const { data, error } = await supabaseClient
  .from('content')
  .select('*')
  .eq('type', 'tourism')
  .eq('status', 'published')
  .order('published_at', { ascending: false });

// GET USER'S SUBMISSIONS
const { data, error } = await supabaseClient
  .from('content')
  .select('*')
  .eq('author_id', userId)
  .order('created_at', { ascending: false });

// GET SINGLE CONTENT ITEM
const { data, error } = await supabaseClient
  .from('content')
  .select('*, counties(*), users(*)')
  .eq('id', contentId)
  .single();

// CREATE NEW CONTENT (SUBMIT)
const { data, error } = await supabaseClient
  .from('content')
  .insert([{
    county_id: countyId,
    author_id: userId,
    type: 'tourism',
    title: 'Attraction Name',
    description: 'Full description...',
    category: 'lake',
    featured_image_url: 'https://...',
    visibility: 'public',
    status: 'submitted',
    entrance_fee: 5.00,
    gps_coordinates: '6.3155,-10.8070'
  }])
  .select();

// UPDATE CONTENT
const { error } = await supabaseClient
  .from('content')
  .update({
    title: 'Updated Title',
    description: 'Updated description',
    updated_at: new Date()
  })
  .eq('id', contentId);

// DELETE CONTENT
const { error } = await supabaseClient
  .from('content')
  .delete()
  .eq('id', contentId);

// SEARCH CONTENT BY TAGS
const { data, error } = await supabaseClient
  .from('content')
  .select('*')
  .contains('tags', ['tourism', 'attraction']);

// INCREMENT VIEW COUNT
const { error } = await supabaseClient
  .from('content')
  .update({ view_count: supabase.raw('view_count + 1') })
  .eq('id', contentId);
```

### County Endpoints

```javascript
// GET ALL COUNTIES
const { data, error } = await supabaseClient
  .from('counties')
  .select('*')
  .order('name');

// GET SINGLE COUNTY
const { data, error } = await supabaseClient
  .from('counties')
  .select('*')
  .eq('slug', 'bong')
  .single();

// GET COUNTY WITH STATS
const { data, error } = await supabaseClient
  .from('counties')
  .select(`
    *,
    content!county_id(id)
  `)
  .eq('id', countyId)
  .single();

// CREATE COUNTY (SUPER ADMIN)
const { data, error } = await supabaseClient
  .from('counties')
  .insert([{
    name: 'New County',
    slug: 'new-county',
    description: 'County description',
    flag_url: 'https://...',
    governor_name: 'Governor Name'
  }])
  .select();

// UPDATE COUNTY (SUPER ADMIN)
const { error } = await supabaseClient
  .from('counties')
  .update({
    governor_name: 'New Governor',
    description: 'Updated description'
  })
  .eq('id', countyId);
```

### Submission/Review Endpoints

```javascript
// GET PENDING SUBMISSIONS (ADMIN)
const { data, error } = await supabaseClient
  .from('submissions')
  .select('*, content(*), users(full_name, email)')
  .eq('status', 'pending')
  .order('submitted_at', { ascending: true });

// GET SUBMISSIONS BY STATUS (ADMIN)
const { data, error } = await supabaseClient
  .from('submissions')
  .select('*')
  .eq('status', 'approved')  // or 'pending', 'rejected', etc.
  .order('reviewed_at', { ascending: false });

// APPROVE SUBMISSION (ADMIN)
const { error: subError } = await supabaseClient
  .from('submissions')
  .update({
    status: 'approved',
    admin_id: adminId,
    reviewed_at: new Date()
  })
  .eq('id', submissionId);

const { error: contentError } = await supabaseClient
  .from('content')
  .update({
    status: 'published',
    published_at: new Date()
  })
  .eq('id', contentId);

// REJECT SUBMISSION (ADMIN)
const { error } = await supabaseClient
  .from('submissions')
  .update({
    status: 'rejected',
    admin_id: adminId,
    reviewed_at: new Date(),
    rejection_reason: 'Duplicate content',
    admin_comments: 'This content already exists...'
  })
  .eq('id', submissionId);

// REQUEST CHANGES (ADMIN)
const { error } = await supabaseClient
  .from('submissions')
  .update({
    status: 'changes_requested',
    admin_id: adminId,
    admin_comments: 'Please add more details about...'
  })
  .eq('id', submissionId);

// CREATE SUBMISSION RECORD
const { data, error } = await supabaseClient
  .from('submissions')
  .insert([{
    content_id: contentId,
    submitter_id: userId,
    status: 'pending'
  }])
  .select();
```

### Notification Endpoints

```javascript
// GET USER NOTIFICATIONS
const { data, error } = await supabaseClient
  .from('notifications')
  .select('*')
  .eq('user_id', userId)
  .eq('is_read', false)
  .order('created_at', { ascending: false });

// MARK NOTIFICATION AS READ
const { error } = await supabaseClient
  .from('notifications')
  .update({ is_read: true })
  .eq('id', notificationId);

// CREATE NOTIFICATION (SYSTEM)
const { error } = await supabaseClient
  .from('notifications')
  .insert([{
    user_id: userId,
    type: 'submission_approved',
    title: 'Your submission was approved!',
    message: 'Your tourism submission "Lake X" has been published.',
    related_id: contentId,
    related_type: 'content'
  }]);

// DELETE NOTIFICATION
const { error } = await supabaseClient
  .from('notifications')
  .delete()
  .eq('id', notificationId);
```

### Analytics Endpoints

```javascript
// LOG PAGE VIEW
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

// LOG CONTENT VIEW
const { error } = await supabaseClient
  .from('analytics')
  .insert([{
    event_type: 'content_view',
    user_id: userId,
    content_id: contentId,
    metadata: { content_type: 'tourism' }
  }]);

// LOG CONTENT SUBMISSION
const { error } = await supabaseClient
  .from('analytics')
  .insert([{
    event_type: 'content_submitted',
    user_id: userId,
    content_id: contentId,
    metadata: { content_type: 'event' }
  }]);

// GET ANALYTICS DATA (ADMIN)
const { data, error } = await supabaseClient
  .from('analytics')
  .select('*')
  .gte('created_at', sevenDaysAgo)
  .order('created_at', { ascending: false });

// GET CONTENT STATS BY TYPE
const { data, error } = await supabaseClient
  .from('content')
  .select('type, count:id.count()')
  .eq('status', 'published')
  .group_by('type');
```

### Audit Log Endpoints

```javascript
// LOG ADMIN ACTION
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

// GET AUDIT LOGS (SUPER ADMIN)
const { data, error } = await supabaseClient
  .from('audit_logs')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(100);

// GET LOGS BY ADMIN
const { data, error } = await supabaseClient
  .from('audit_logs')
  .select('*')
  .eq('admin_id', adminId)
  .gte('created_at', thirtyDaysAgo)
  .order('created_at', { ascending: false });
```

---

## 🎯 Common Query Patterns

### Pagination Pattern

```javascript
const pageSize = 20;
const pageNumber = 1;
const offset = (pageNumber - 1) * pageSize;

const { data, error, count } = await supabaseClient
  .from('content')
  .select('*', { count: 'exact' })
  .range(offset, offset + pageSize - 1)
  .order('created_at', { ascending: false });

// Calculate total pages
const totalPages = Math.ceil(count / pageSize);
```

### Filtering Pattern

```javascript
let query = supabaseClient.from('content').select('*');

// Add filters conditionally
if (filters.county) {
  query = query.eq('county_id', filters.county);
}
if (filters.type) {
  query = query.eq('type', filters.type);
}
if (filters.status) {
  query = query.eq('status', filters.status);
}
if (filters.dateFrom) {
  query = query.gte('created_at', filters.dateFrom);
}

const { data, error } = await query.order('created_at', { ascending: false });
```

### Join Pattern (Relations)

```javascript
// Fetch content WITH related county and user info
const { data, error } = await supabaseClient
  .from('content')
  .select(`
    id,
    title,
    description,
    counties (name, slug),
    users (full_name, email)
  `)
  .eq('status', 'published');

// Result structure:
// {
//   id: '...',
//   title: '...',
//   counties: { name: 'Bong', slug: 'bong' },
//   users: { full_name: 'John Doe', email: '...' }
// }
```

### Search Pattern

```javascript
// Full-text search (if text_search column exists)
const { data, error } = await supabaseClient
  .from('content')
  .select('*')
  .textSearch('fts', query);

// Alternative: Simple LIKE search
const { data, error } = await supabaseClient
  .from('content')
  .select('*')
  .ilike('title', `%${query}%`);
```

### Error Handling Pattern

```javascript
async function handleApiCall(operation, fallback = null) {
  try {
    const { data, error } = await operation();
    
    if (error) {
      console.error('API Error:', error.code, error.message);
      
      // Handle specific errors
      if (error.code === 'PGRST116') {
        // Row not found
        return fallback;
      } else if (error.code === 'PGRST') {
        // PostgreSQL error
        showError('Database error');
      } else if (error.status === 401) {
        // Unauthorized - redirect to login
        window.location.href = '/auth-page/auth.html';
      }
      
      return fallback;
    }
    
    return data;
  } catch (exception) {
    console.error('Exception:', exception);
    showError('Unexpected error');
    return fallback;
  }
}
```

---

## 🔄 Data Flow Examples

### Example 1: User Submits Tourism Content

```javascript
// 1. User fills form and clicks submit
async function submitTourismContent(formData) {
  // 2. Validate
  if (!formData.title || formData.title.length > 100) {
    showError('Title required (max 100 chars)');
    return;
  }

  // 3. Insert content record
  const { data: content, error: contentError } = await supabaseClient
    .from('content')
    .insert([{
      county_id: formData.countyId,
      author_id: currentUser.id,
      type: 'tourism',
      title: formData.title,
      description: formData.description,
      featured_image_url: uploadedImageUrl,
      visibility: formData.visibility,
      status: 'submitted',
      entrance_fee: formData.entranceFee,
      gps_coordinates: formData.gpsCoords,
      operating_hours: formData.hours,
      contact_phone: formData.phone
    }])
    .select();

  if (contentError) {
    showError('Failed to submit content');
    return;
  }

  // 4. Create submission record
  const { error: subError } = await supabaseClient
    .from('submissions')
    .insert([{
      content_id: content[0].id,
      submitter_id: currentUser.id,
      status: 'pending'
    }]);

  // 5. Log to analytics
  await supabaseClient
    .from('analytics')
    .insert([{
      event_type: 'content_submitted',
      user_id: currentUser.id,
      content_id: content[0].id,
      metadata: { type: 'tourism' }
    }]);

  // 6. Show success
  showSuccess('Content submitted for review!');
  redirectAfterDelay('/dashboard-page/dashboard.html', 2000);
}
```

### Example 2: Admin Approves Content

```javascript
async function approveSubmission(submissionId, contentId) {
  // 1. Update submission status
  const { error: subError } = await supabaseClient
    .from('submissions')
    .update({
      status: 'approved',
      admin_id: currentAdminId,
      reviewed_at: new Date()
    })
    .eq('id', submissionId);

  // 2. Publish content
  const { error: contentError } = await supabaseClient
    .from('content')
    .update({
      status: 'published',
      published_at: new Date()
    })
    .eq('id', contentId);

  // 3. Log admin action
  await supabaseClient
    .from('audit_logs')
    .insert([{
      admin_id: currentAdminId,
      action: 'approve_submission',
      table_name: 'submissions',
      record_id: submissionId,
      old_values: { status: 'pending' },
      new_values: { status: 'approved' },
      ip_address: getUserIP()
    }]);

  // 4. Create notification for user
  const submission = await getSubmission(submissionId);
  await supabaseClient
    .from('notifications')
    .insert([{
      user_id: submission.submitter_id,
      type: 'submission_approved',
      title: 'Your submission was approved!',
      message: `Your content "${content.title}" has been published.`,
      related_id: contentId,
      related_type: 'content'
    }]);

  // 5. Send email to user (external service)
  await sendApprovalEmail(submission.submitter_id, contentId);
}
```

---

## 🛡️ Security Patterns

### Validate User Has Permission

```javascript
// Check if user can edit content
async function canEditContent(userId, contentId) {
  const { data: content, error } = await supabaseClient
    .from('content')
    .select('author_id')
    .eq('id', contentId)
    .single();

  if (error || !content) return false;
  
  // User is author OR is admin
  return content.author_id === userId || userRole === 'super_admin';
}

// Check if user can approve submissions
async function canApproveSubmissions(userId) {
  const { data: user, error } = await supabaseClient
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();

  return user?.role === 'county_admin' || user?.role === 'super_admin';
}
```

### Validate Content Visibility

```javascript
// Check if user can see content
function canSeeContent(content, user) {
  if (content.visibility === 'public') return true;
  if (content.visibility === 'authenticated_only') return !!user;
  if (content.visibility === 'county_only') {
    return user && user.county_id === content.county_id;
  }
  if (content.visibility === 'admin_only') {
    return user && (user.role === 'super_admin' || user.role === 'county_admin');
  }
  if (content.visibility === 'private') {
    return user && (user.id === content.author_id || user.role === 'super_admin');
  }
  return false;
}
```

---

## 📋 Table Schemas (SQL)

### Quick Reference of Key Columns

```sql
-- USERS
id (UUID)                          -- Supabase Auth ID
email (TEXT)                       -- Login email
full_name (TEXT)
role (contributor, county_admin, super_admin)
county_id (UUID -> counties)
contributor_kind (individual, organization, ngo, ...)
individual_category (journalist, teacher, ...)
organization_name, website_url
created_at (TIMESTAMP)

-- COUNTIES
id (UUID)
name (TEXT)
slug (TEXT)                        -- URL-friendly: 'bong'
description (TEXT)
flag_url (TEXT)                    -- Image URL
governor_name (TEXT)

-- CONTENT
id (UUID)
county_id (UUID -> counties)
author_id (UUID -> users)
type (tourism, event, opportunity, news)
title (TEXT)
description (TEXT)
status (draft, submitted, published, rejected)
visibility (public, authenticated_only, county_only, private)
featured_image_url (TEXT)
created_at, published_at (TIMESTAMP)
view_count (INT)

-- SUBMISSIONS
id (UUID)
content_id (UUID -> content)
submitter_id (UUID -> users)
admin_id (UUID -> users)
status (pending, approved, rejected, changes_requested)
submitted_at, reviewed_at (TIMESTAMP)
admin_comments (TEXT)

-- NOTIFICATIONS
id (UUID)
user_id (UUID -> users)
type (submission_approved, comment, etc.)
title, message (TEXT)
related_id (UUID)                  -- FK to related record
is_read (BOOLEAN)

-- ANALYTICS
event_type (page_view, content_view, submission)
user_id, county_id, content_id (UUIDs)
metadata (JSONB)                   -- Custom data
created_at (TIMESTAMP)

-- AUDIT_LOGS
admin_id (UUID -> users)
action (approve_submission, delete_content, etc.)
table_name, record_id (TEXT, UUID)
old_values, new_values (JSONB)
created_at (TIMESTAMP)
```

---

## 🎭 Response Examples

### Success Response

```javascript
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "county_id": "550e8400-e29b-41d4-a716-446655440001",
      "title": "Beautiful Lake",
      "description": "A scenic lake...",
      "status": "published",
      "created_at": "2024-05-20T10:30:00Z"
    }
  ],
  "error": null
}
```

### Error Response

```javascript
{
  "data": null,
  "error": {
    "code": "PGRST116",
    "message": "Failed to retrieve rows",
    "details": "Invalid UUID",
    "hint": "Ensure ID is a valid UUID"
  }
}
```

---

## ⚡ Performance Tips

1. **Use Pagination**: Limit queries to 20-50 records at a time
2. **Select Only Needed Fields**: `select('id, title, county_id')` instead of `select('*')`
3. **Index Frequently Queried Fields**: county_id, author_id, status
4. **Cache User Data**: Store user profile in localStorage or session
5. **Lazy Load Images**: Use `loading="lazy"` attribute
6. **Debounce Search**: Delay API calls when user is typing
7. **Use Real-time Subscriptions Sparingly**: They consume resources

---

**Last Updated**: May 2026  
**For Full Documentation**: See `FRONTEND_DEVELOPER_GUIDE.md`
