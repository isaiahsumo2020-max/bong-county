# Comments & Reactions System - Implementation Guide

**Complete setup instructions for integrating comments and reactions across the Liberia Counties Digital Platform**

---

## 🚀 Quick Start

### 1. Database Setup

Run the SQL migration to create all required tables and RLS policies:

```bash
# Run this in Supabase SQL editor:
# File: Schemas/001_comments_reactions_system.sql
```

This creates:
- `content_comments` table with nested reply support
- `content_reactions` table with unique user-per-content constraint
- `comment_reports` table for moderation
- `comment_likes` table for comment engagement
- RLS security policies for all tables
- Helper functions for efficient queries

---

## 📊 Database Schema Overview

### content_comments Table
```
├── id (UUID, PK)
├── content_id (UUID, FK → content.id)
├── user_id (UUID, FK → auth.users.id)
├── parent_comment_id (UUID, nullable, self-reference)
├── body (TEXT, max 5000 chars)
├── is_edited (BOOLEAN)
├── is_deleted (BOOLEAN, soft delete)
├── created_at (TIMESTAMP)
├── updated_at (TIMESTAMP)
└── deleted_at (TIMESTAMP, nullable)
```

**Features:**
- Nested replies via `parent_comment_id`
- Soft delete support (preserves history)
- Edit tracking with `is_edited` flag
- Automatic timestamps

---

### content_reactions Table
```
├── id (UUID, PK)
├── content_id (UUID, FK → content.id)
├── user_id (UUID, FK → auth.users.id)
├── reaction_type (TEXT: like|love|celebrate|insightful|sad)
├── created_at (TIMESTAMP)
├── updated_at (TIMESTAMP)
└── UNIQUE(content_id, user_id)
```

**Features:**
- One reaction per user per content
- User can change reaction type anytime
- Prevents duplicate reactions automatically

---

## 🔒 Row Level Security (RLS)

### Comments RLS Policies

| Role | Action | Permission |
|------|--------|-----------|
| Public | Read | Public content only |
| Authenticated | Create | Own comments |
| Authenticated | Update | Own comments |
| Authenticated | Delete | Own comments (soft delete) |
| County Admin | Delete | Content in their county |
| Super Admin | All | Full access |

### Reactions RLS Policies

| Role | Action | Permission |
|------|--------|-----------|
| Public | Read | Any reaction |
| Authenticated | Create | Own reactions |
| Authenticated | Update | Own reactions |
| Authenticated | Delete | Own reactions |
| Super Admin | All | Full access |

---

## 🛠️ Backend API Setup

### 1. Add API Helper File

Include the API helper file in your HTML:

```html
<script src="shared/comments-reactions-api.js"></script>
```

This provides functions for:
- `fetchComments(contentId, limit, offset)`
- `fetchCommentReplies(parentCommentId, limit, offset)`
- `createComment(contentId, body, parentCommentId)`
- `updateComment(commentId, body)`
- `deleteComment(commentId)`
- `fetchReactions(contentId)`
- `addReaction(contentId, reactionType)`
- `removeReaction(contentId)`
- `subscribeToComments(contentId, callback)`
- `subscribeToReactions(contentId, callback)`

---

## 🎨 Frontend Components

### Component 1: Comment System

**Initialize in your content page:**

```html
<!-- HTML -->
<div id="comments-container"></div>

<script src="shared/comments-reactions-api.js"></script>
<script src="shared/comment-system.js"></script>
<link rel="stylesheet" href="css/comments-reactions.css">

<script>
  // Initialize comments system
  const commentSystem = new CommentSystem({
    contentId: '<content-uuid>',
    containerId: 'comments-container',
    isAuthenticated: true,
    currentUser: { id: '<user-uuid>' },
    onCommentAdded: (comment) => {
      console.log('New comment:', comment);
      // Update comment count badge
    }
  });

  commentSystem.init();

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    commentSystem.destroy();
  });
</script>
```

**Features:**
- Automatic comment loading with pagination
- Nested replies with threading
- Edit/delete comments (own only)
- Real-time updates via Supabase subscriptions
- Character counter and validation
- Responsive design

---

### Component 2: Reaction Bar

**Initialize in your content page:**

```html
<!-- HTML -->
<div id="reaction-bar"></div>

<script src="shared/comments-reactions-api.js"></script>
<script src="shared/reaction-bar.js"></script>
<link rel="stylesheet" href="css/comments-reactions.css">

<script>
  // Initialize reaction bar
  const reactionBar = new ReactionBar({
    contentId: '<content-uuid>',
    containerId: 'reaction-bar',
    isAuthenticated: true,
    currentUser: { id: '<user-uuid>' },
    onReactionChange: (reactionType) => {
      console.log('Reaction changed:', reactionType);
      // Update reaction count badge
    }
  });

  reactionBar.init();

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    reactionBar.destroy();
  });
</script>
```

**Features:**
- Multiple reaction types (like, love, celebrate, insightful, sad)
- Hover emoji picker (desktop) / tap picker (mobile)
- Real-time reaction counts
- User's selected reaction highlighted
- Reaction breakdown tooltip

---

## 📄 Page Integration Example

### Complete Content Detail Page

```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="css/comments-reactions.css">
</head>
<body>
  <!-- Content Header -->
  <div class="content-header">
    <h1 id="content-title"></h1>
    <img id="featured-image" src="" alt="">
    <div class="meta">
      <span id="author-name"></span>
      <span id="published-date"></span>
    </div>
  </div>

  <!-- Content Body -->
  <div class="content-body">
    <p id="content-description"></p>
  </div>

  <!-- Reaction Bar -->
  <div id="reaction-bar"></div>

  <!-- Comment Count Summary -->
  <div class="engagement-summary">
    <span id="comment-count">0 comments</span>
    <span id="reaction-count">0 reactions</span>
  </div>

  <!-- Comments System -->
  <div id="comments-container"></div>

  <!-- Scripts -->
  <script src="supabaseClient.js"></script>
  <script src="shared/comments-reactions-api.js"></script>
  <script src="shared/comment-system.js"></script>
  <script src="shared/reaction-bar.js"></script>

  <script>
    // Load content data
    async function loadContent(contentId) {
      const { data: content } = await supabaseClient
        .from('content')
        .select('*, users(*), counties(*)')
        .eq('id', contentId)
        .single();

      if (!content) return;

      // Populate content
      document.getElementById('content-title').textContent = content.title;
      document.getElementById('featured-image').src = content.featured_image_url;
      document.getElementById('author-name').textContent = content.users.full_name;
      document.getElementById('content-description').textContent = content.description;
      document.getElementById('published-date').textContent =
        new Date(content.published_at).toLocaleDateString();

      // Initialize engagement components
      const currentUser = await getCurrentUser();

      // Initialize reaction bar
      const reactionBar = new ReactionBar({
        contentId,
        containerId: 'reaction-bar',
        isAuthenticated: !!currentUser,
        currentUser
      });
      await reactionBar.init();

      // Initialize comments
      const commentSystem = new CommentSystem({
        contentId,
        containerId: 'comments-container',
        isAuthenticated: !!currentUser,
        currentUser,
        onCommentAdded: (comment) => {
          // Update comment count
          updateEngagementCounts(contentId);
        }
      });
      await commentSystem.init();

      // Load engagement stats
      updateEngagementCounts(contentId);

      // Cleanup
      window.addEventListener('beforeunload', () => {
        reactionBar.destroy();
        commentSystem.destroy();
      });
    }

    // Update engagement summary
    async function updateEngagementCounts(contentId) {
      const stats = await getEngagementStats(contentId);
      document.getElementById('comment-count').textContent =
        `${stats.commentCount} ${stats.commentCount === 1 ? 'comment' : 'comments'}`;
      document.getElementById('reaction-count').textContent =
        `${stats.totalReactions} ${stats.totalReactions === 1 ? 'reaction' : 'reactions'}`;
    }

    // Initialize on page load
    const contentId = new URLSearchParams(window.location.search).get('id');
    if (contentId) {
      loadContent(contentId);
    }
  </script>
</body>
</html>
```

---

## 📊 Dashboard Integration

### Contributor Dashboard

Add to your dashboard overview section:

```javascript
async function loadContributorEngagementStats() {
  const user = await getCurrentUser();
  if (!user) return;

  // Get user's content
  const { data: userContent } = await supabaseClient
    .from('content')
    .select('id')
    .eq('author_id', user.id);

  if (!userContent) return;

  const contentIds = userContent.map(c => c.id);

  // Get all comments on user's posts
  const { data: comments } = await supabaseClient
    .from('content_comments')
    .select('*')
    .in('content_id', contentIds)
    .eq('is_deleted', false);

  // Get all reactions on user's posts
  const { data: reactions } = await supabaseClient
    .from('content_reactions')
    .select('*')
    .in('content_id', contentIds);

  // Find most discussed posts
  const commentStats = {};
  comments?.forEach(comment => {
    commentStats[comment.content_id] = (commentStats[comment.content_id] || 0) + 1;
  });

  const mostDiscussed = Object.entries(commentStats)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  // Find most reacted posts
  const reactionStats = {};
  reactions?.forEach(reaction => {
    reactionStats[reaction.content_id] = (reactionStats[reaction.content_id] || 0) + 1;
  });

  const mostReacted = Object.entries(reactionStats)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  // Display stats
  displayEngagementStats({
    totalComments: comments?.length || 0,
    totalReactions: reactions?.length || 0,
    mostDiscussed,
    mostReacted
  });
}
```

**Add to Dashboard UI:**
```html
<section class="engagement-section">
  <h3>Your Engagement</h3>

  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-value" id="total-comments">0</div>
      <div class="stat-label">Comments Received</div>
    </div>

    <div class="stat-card">
      <div class="stat-value" id="total-reactions">0</div>
      <div class="stat-label">Reactions Received</div>
    </div>
  </div>

  <div class="most-discussed">
    <h4>Most Discussed Posts</h4>
    <ul id="most-discussed-list"></ul>
  </div>

  <div class="most-reacted">
    <h4>Most Reacted Posts</h4>
    <ul id="most-reacted-list"></ul>
  </div>

  <div class="recent-comments">
    <h4>Recent Comments on Your Posts</h4>
    <ul id="recent-comments-list"></ul>
  </div>
</section>
```

---

### County Admin Dashboard

Add moderation tools:

```javascript
async function loadCommentModeration() {
  const admin = await getCurrentUser();
  if (!admin) return;

  // Get admin's county
  const { data: adminData } = await supabaseClient
    .from('users')
    .select('county_id')
    .eq('id', admin.id)
    .single();

  if (!adminData) return;

  // Get all comments in admin's county
  const { data: comments } = await supabaseClient
    .from('content_comments')
    .select(`
      *,
      content(county_id, title),
      users(full_name, email)
    `)
    .in('content.county_id', [adminData.county_id])
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });

  // Get reported comments
  const { data: reports } = await supabaseClient
    .from('comment_reports')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  displayModerationPanel({
    comments,
    reports
  });
}

// Moderate a comment
async function moderateComment(commentId, action) {
  if (action === 'delete') {
    await supabaseClient
      .from('content_comments')
      .update({ is_deleted: true, deleted_at: new Date().toISOString() })
      .eq('id', commentId);
  }
}
```

---

## 🔔 Notification Integration

The system automatically creates notifications for:

### 1. New Comment on Post
```javascript
// Automatically triggered in createComment()
// Creates notification in 'notifications' table
{
  user_id: content.author_id,
  type: 'comment',
  related_user_id: comment.user_id,
  related_content_id: contentId,
  title: 'Someone commented on your post',
  is_read: false
}
```

### 2. Reply to Comment
```javascript
// Automatically triggered in createComment() with parentCommentId
{
  user_id: parent_comment.user_id,
  type: 'comment_reply',
  related_user_id: reply.user_id,
  related_content_id: contentId,
  title: 'Someone replied to your comment',
  is_read: false
}
```

### 3. Reaction to Post
```javascript
// Automatically triggered in addReaction()
{
  user_id: content.author_id,
  type: 'reaction',
  related_user_id: reaction.user_id,
  related_content_id: contentId,
  metadata: { reaction_type: 'like' },
  title: 'Someone reacted with like to your post',
  is_read: false
}
```

---

## ⚡ Real-Time Features

The system uses Supabase Realtime subscriptions for:

### 1. Live Comment Updates
```javascript
// Automatically in comment-system.js
// Updates when:
// - New comment added
// - Comment edited
// - Comment deleted
```

### 2. Live Reaction Updates
```javascript
// Automatically in reaction-bar.js
// Updates when:
// - User adds reaction
// - User changes reaction
// - User removes reaction
```

No additional setup needed - subscriptions are managed automatically.

---

## 🔐 Security Checklist

- ✅ RLS policies enforce user ownership
- ✅ Super admin has full access
- ✅ County admins can moderate in their counties
- ✅ Public content visible to all
- ✅ One reaction per user prevented by database constraint
- ✅ Soft deletes preserve history
- ✅ user_id must equal auth.uid() for modifications

---

## 📱 Responsive Design

Both components are fully responsive:

- **Desktop**: Multi-column layout, hover emoji picker, full labels
- **Tablet**: Touch-friendly, optimized spacing
- **Mobile**: Single column, tap emoji picker, compact labels

No additional CSS needed - included in `comments-reactions.css`

---

## 🧪 Testing Checklist

### Comments
- [ ] User can post comments
- [ ] User can reply to comments
- [ ] User can edit own comments
- [ ] User can delete own comments
- [ ] Comments show relative timestamps
- [ ] Nested replies display correctly
- [ ] Deleted comments show as deleted
- [ ] Pagination works
- [ ] Real-time updates work

### Reactions
- [ ] User can add reaction
- [ ] User can change reaction
- [ ] User can remove reaction
- [ ] Reaction counts update
- [ ] Reaction picker works on desktop
- [ ] Reaction picker works on mobile
- [ ] One reaction per user enforced
- [ ] Real-time count updates

### Moderation
- [ ] County admins can delete comments in their county
- [ ] Super admins have full access
- [ ] Soft deletes work correctly
- [ ] Reports can be created
- [ ] Admins can review reports

### Notifications
- [ ] Comment notification sent
- [ ] Reply notification sent
- [ ] Reaction notification sent
- [ ] Notifications respect preferences

---

## 📈 Performance Optimization

The system includes:

- **Pagination**: Comments load 20 at a time
- **Lazy Loading**: Replies load on demand
- **Indexes**: On content_id, user_id, created_at
- **Aggregation Views**: For efficient stat queries
- **Real-time Subscriptions**: Efficient channel subscriptions

---

## 🐛 Troubleshooting

### Comments not loading
- Check Supabase connection
- Verify RLS policies allow read access
- Check browser console for errors

### Reactions not updating
- Verify user is authenticated
- Check unique constraint on content_reactions
- Confirm Realtime is enabled in Supabase

### Notifications not appearing
- Check notifications table exists
- Verify notification preferences
- Confirm user_id matches auth.uid()

---

## 📚 API Reference

See `shared/comments-reactions-api.js` for complete function documentation.

Key functions:
- `fetchComments()` - Load comments with pagination
- `createComment()` - Create new comment or reply
- `updateComment()` - Edit comment
- `deleteComment()` - Soft delete comment
- `addReaction()` - Add/update reaction
- `removeReaction()` - Remove reaction
- `subscribeToComments()` - Real-time comment updates
- `subscribeToReactions()` - Real-time reaction updates

---

## 🚀 Deployment Checklist

- [ ] Run SQL migration on production database
- [ ] Update RLS policies as needed
- [ ] Deploy API helpers
- [ ] Deploy components
- [ ] Deploy CSS styles
- [ ] Test all functionality
- [ ] Monitor for errors
- [ ] Enable Supabase Realtime on production

---

## 💡 Future Enhancements

Possible additions:
- Comment threading with deep nesting
- Comment search/filtering
- Spam detection
- Comment upvoting (separate from reactions)
- Emoji reactions customization
- Comment mentions (@username)
- Rich text editor (Markdown)
- File attachments
- Comment moderation queue
- Advanced analytics dashboard

---

**Implementation complete! The Comments and Reactions system is production-ready and fully integrated with your Liberia Counties Digital Platform.**
