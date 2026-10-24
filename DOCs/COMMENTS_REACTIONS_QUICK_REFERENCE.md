# Comments & Reactions - Quick Reference

**Fast lookup guide for developers implementing the Comments & Reactions system**

---

## 📋 Files Overview

| File | Purpose |
|------|---------|
| `Schemas/001_comments_reactions_system.sql` | Database schema & RLS policies |
| `shared/comments-reactions-api.js` | Backend API functions |
| `shared/comment-system.js` | Reusable comments component |
| `shared/reaction-bar.js` | Reusable reactions component |
| `css/comments-reactions.css` | All styling |

---

## 🚀 Minimum Setup (5 minutes)

### Step 1: Add to HTML
```html
<link rel="stylesheet" href="css/comments-reactions.css">
<script src="supabaseClient.js"></script>
<script src="shared/comments-reactions-api.js"></script>
<script src="shared/comment-system.js"></script>
<script src="shared/reaction-bar.js"></script>
```

### Step 2: Add containers
```html
<div id="reaction-bar"></div>
<div id="comments-container"></div>
```

### Step 3: Initialize
```javascript
const contentId = 'your-content-id';
const user = await getCurrentUser();

// Reactions
new ReactionBar({
  contentId,
  containerId: 'reaction-bar',
  isAuthenticated: !!user,
  currentUser: user
}).init();

// Comments
new CommentSystem({
  contentId,
  containerId: 'comments-container',
  isAuthenticated: !!user,
  currentUser: user
}).init();
```

---

## 🔧 API Quick Reference

### Comments

```javascript
// Fetch comments
await fetchComments(contentId, limit=20, offset=0)

// Create comment
await createComment(contentId, body, parentCommentId=null)

// Update comment
await updateComment(commentId, body)

// Delete comment
await deleteComment(commentId)

// Fetch single comment
await fetchComment(commentId)

// Fetch replies
await fetchCommentReplies(parentCommentId, limit=10, offset=0)
```

### Reactions

```javascript
// Get reaction counts
await fetchReactions(contentId)
// Returns: { like: 5, love: 2, celebrate: 1, insightful: 0, sad: 0, total: 8 }

// Get user's reaction
await getUserReaction(contentId)
// Returns: 'like' or null

// Add/update reaction
await addReaction(contentId, 'like')

// Remove reaction
await removeReaction(contentId)
```

### Stats

```javascript
// Get engagement stats
await getEngagementStats(contentId)
// Returns: {
//   commentCount: 15,
//   threadCount: 10,
//   reactions: { like: 5, love: 2, celebrate: 1, insightful: 0, sad: 0 },
//   totalReactions: 8
// }
```

### Real-time

```javascript
// Subscribe to comments
subscribeToComments(contentId, (update) => {
  console.log(update.event); // 'INSERT', 'UPDATE', or 'DELETE'
  console.log(update.data);  // Comment object
})

// Subscribe to reactions
subscribeToReactions(contentId, (update) => {
  console.log(update.event); // 'INSERT', 'UPDATE', or 'DELETE'
  console.log(update.data);  // Reaction object
})
```

### Utilities

```javascript
// Format timestamp
getRelativeTime('2024-01-15T10:30:00Z')
// Returns: '2h ago'

// Get avatar initials
getAvatarInitials('John Doe')
// Returns: 'JD'
```

---

## 🎨 Component Options

### CommentSystem

```javascript
new CommentSystem({
  contentId: string,              // Required: Content UUID
  containerId: string,             // Default: 'comments-container'
  isAuthenticated: boolean,        // Default: false
  currentUser: object,             // Current user object
  onCommentAdded: function,        // Callback when comment posted
  pageSize: number,                // Default: 20
  replyPageSize: number            // Default: 5
})
```

### ReactionBar

```javascript
new ReactionBar({
  contentId: string,              // Required: Content UUID
  containerId: string,             // Default: 'reaction-bar'
  isAuthenticated: boolean,        // Default: false
  currentUser: object,             // Current user object
  onReactionChange: function       // Callback when reaction changes
})
```

---

## 📊 Database Queries

### Get comments count
```javascript
const { data } = await supabaseClient
  .from('content_comments')
  .select('id', { count: 'exact' })
  .eq('content_id', contentId)
  .eq('is_deleted', false);

const count = data?.length || 0;
```

### Get reactions summary
```javascript
const { data } = await supabaseClient
  .from('content_reactions')
  .select('reaction_type')
  .eq('content_id', contentId);

const summary = {
  like: data?.filter(r => r.reaction_type === 'like').length || 0,
  // ... other types
};
```

### Get user's posts with most engagement
```javascript
const { data: posts } = await supabaseClient
  .from('content')
  .select(`
    id,
    title,
    content_comments(id),
    content_reactions(id)
  `)
  .eq('author_id', userId);
```

---

## 🔐 RLS Policies Summary

### Comments
- Public users: Read public content only
- Authenticated: Create/edit own, delete own
- County admin: Delete in their county
- Super admin: Full access

### Reactions
- Public users: Read only
- Authenticated: Create/update/delete own
- Super admin: Full access

---

## 📱 Mobile Considerations

Already included in CSS:
- Touch-friendly button sizes (44px minimum)
- Tap emoji picker instead of hover
- Mobile-optimized layout
- Reduced motion support

---

## 🚨 Common Issues

### Comments won't load
```javascript
// Check if user can read content
const { data } = await supabaseClient
  .from('content')
  .select('visibility, status')
  .eq('id', contentId)
  .single();

// Must be public or published
```

### Can't create comments
```javascript
// User must be authenticated
const user = await getCurrentUser();
if (!user) {
  redirectToAuth();
}
```

### Reactions not updating
```javascript
// Check unique constraint wasn't violated
// Database prevents duplicate user+content reactions
```

---

## 🎯 Common Customizations

### Change reaction types
Edit in `reaction-bar.js`:
```javascript
// Line: validReactions = [...]
// Add/remove as needed
const validReactions = ['like', 'love', 'celebrate', 'insightful', 'sad'];
```

### Change pagination size
```javascript
new CommentSystem({
  pageSize: 50,           // Load 50 at a time
  replyPageSize: 20       // Load 20 replies at a time
})
```

### Disable guest comments
```javascript
// Only show comment form if authenticated
if (!isAuthenticated) {
  hideCommentForm();
}
```

### Custom styling
Override in your CSS:
```css
.comment-item {
  background-color: your-color;
}

.reaction-bar {
  border-color: your-color;
}
```

---

## 📈 Performance Tips

1. **Paginate comments**: Don't load all at once
2. **Lazy load replies**: Load on expand
3. **Use subscriptions**: Real-time > polling
4. **Debounce updates**: 1 update per 100ms
5. **Unsubscribe on unmount**: Prevent memory leaks

---

## 🧪 Test Scenarios

### Scenario 1: First-time commenter
1. Not authenticated
2. Click "Sign in to comment"
3. Redirected to auth page
4. After login, comment form visible
5. Can post comment
6. Comment appears in real-time

### Scenario 2: Reaction flow
1. User sees content
2. Clicks like button
3. Like count increases
4. User clicks love
5. Like decreases, love increases
6. User clicks reaction again
7. Reaction removed

### Scenario 3: Comment threading
1. User posts comment
2. Another user replies
3. Reply appears indented
4. Reply count shown on parent
5. Can load more replies

---

## 📞 Support

For issues, check:
1. Browser console (F12)
2. Supabase dashboard logs
3. RLS policies
4. User authentication state
5. Content visibility settings

---

## 🔄 Updates & Maintenance

### Regular tasks
- Monitor Supabase usage
- Review moderation reports
- Archive old comments (optional)
- Backup database regularly

### Potential improvements
- Comment search
- Advanced filtering
- User mentions
- Rich text editor
- File attachments

---

**Last Updated: May 22, 2026**
