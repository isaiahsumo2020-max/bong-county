# Comments & Reactions System - Testing & Verification Guide

**Quality Assurance checklist and testing procedures**

---

## 🧪 Database Testing

### Test 1: Schema Verification

Run these SQL queries to verify tables exist:

```sql
-- Check content_comments table
SELECT * FROM information_schema.tables
WHERE table_name = 'content_comments';

-- Check content_reactions table
SELECT * FROM information_schema.tables
WHERE table_name = 'content_reactions';

-- Check comment_reports table
SELECT * FROM information_schema.tables
WHERE table_name = 'comment_reports';

-- Check comment_likes table
SELECT * FROM information_schema.tables
WHERE table_name = 'comment_likes';
```

**Expected Result**: All 4 tables should exist

---

### Test 2: Constraints Verification

```sql
-- Verify unique constraint on reactions
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'content_reactions'
AND constraint_type = 'UNIQUE';

-- Should return constraint on (content_id, user_id)
```

**Expected Result**: Unique constraint on (content_id, user_id)

---

### Test 3: Indexes Verification

```sql
-- Check all indexes
SELECT indexname
FROM pg_indexes
WHERE tablename IN ('content_comments', 'content_reactions', 'comment_reports', 'comment_likes');

-- Expected indexes:
-- - idx_content_comments_content_id
-- - idx_content_comments_user_id
-- - idx_content_comments_parent_id
-- - idx_content_comments_created_at
-- - idx_content_comments_not_deleted
-- - idx_content_reactions_content_id
-- - idx_content_reactions_user_id
-- - idx_content_reactions_type
-- - idx_comment_reports_status
-- - idx_comment_reports_created_at
-- - idx_comment_likes_comment_id
-- - idx_comment_likes_user_id
```

**Expected Result**: All indexes created

---

### Test 4: RLS Policies Verification

```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('content_comments', 'content_reactions', 'comment_reports', 'comment_likes');

-- Check policies exist
SELECT tablename, policyname, permissive
FROM pg_policies
WHERE tablename IN ('content_comments', 'content_reactions', 'comment_reports', 'comment_likes')
ORDER BY tablename;
```

**Expected Result**: RLS enabled = true, multiple policies per table

---

### Test 5: Triggers Verification

```sql
-- Check update triggers
SELECT trigger_name, event_manipulation
FROM information_schema.triggers
WHERE event_object_table IN ('content_comments', 'content_reactions');

-- Expected triggers:
-- - update_content_comments_updated_at
-- - update_content_reactions_updated_at
```

**Expected Result**: Triggers exist and set updated_at automatically

---

## 🔒 RLS Security Testing

### Test 6: Public Comment Read Access

```sql
-- Login as anon user, run:
SELECT COUNT(*) FROM content_comments
WHERE is_deleted = FALSE;

-- Check query shows comments from public content only
```

**Expected Result**: Can read comments, count > 0 if public content exists

---

### Test 7: Authenticated Create Comments

```sql
-- As authenticated user, insert:
INSERT INTO content_comments (
  content_id,
  user_id,
  body
) VALUES (
  'content-id',
  auth.uid(),  -- Must be current user
  'Test comment'
);

-- Should succeed
```

**Expected Result**: Insert succeeds

---

### Test 8: Prevent Comment Ownership Violation

```sql
-- As authenticated user, try to update someone else's comment:
UPDATE content_comments
SET body = 'Hacked'
WHERE user_id != auth.uid()
  AND is_deleted = FALSE;

-- Should fail with RLS violation
```

**Expected Result**: Error - policy violation

---

### Test 9: Reaction Ownership

```sql
-- As authenticated user:
INSERT INTO content_reactions (
  content_id,
  user_id,
  reaction_type
) VALUES (
  'content-id',
  auth.uid(),  -- Must be current user
  'like'
);

-- Then try to change to different type:
UPDATE content_reactions
SET reaction_type = 'love'
WHERE content_id = 'content-id'
  AND user_id = auth.uid();

-- Should succeed
```

**Expected Result**: Both insert and update succeed

---

### Test 10: Prevent Duplicate Reactions

```sql
-- As authenticated user, insert same reaction twice:
INSERT INTO content_reactions (content_id, user_id, reaction_type)
VALUES ('content-id', auth.uid(), 'like');

INSERT INTO content_reactions (content_id, user_id, reaction_type)
VALUES ('content-id', auth.uid(), 'like');

-- Second insert should fail
```

**Expected Result**: Second insert fails with unique constraint violation

---

## 📊 API Testing

### Test 11: Comment Creation

```javascript
// Browser console
const comment = await createComment(
  'your-content-id',
  'This is a test comment'
);
console.log(comment);

// Should return created comment object with id
```

**Expected Result**: Comment object with id, created_at, user_id

---

### Test 12: Comment Fetch

```javascript
const comments = await fetchComments('your-content-id', 20, 0);
console.log(comments);

// Should return array of comments
```

**Expected Result**: Array of comments with user data

---

### Test 13: Comment Update

```javascript
const updated = await updateComment('comment-id', 'Updated text');
console.log(updated);

// Should return updated comment with is_edited = true
```

**Expected Result**: Updated comment with is_edited: true

---

### Test 14: Comment Delete

```javascript
const result = await deleteComment('comment-id');
console.log(result);

// Should return true, comment marked deleted
```

**Expected Result**: true, comment.is_deleted = true

---

### Test 15: Reaction Management

```javascript
// Add reaction
const reaction = await addReaction('content-id', 'like');
console.log(reaction);

// Get user's reaction
const userReaction = await getUserReaction('content-id');
console.log(userReaction); // Should be 'like'

// Change reaction
await addReaction('content-id', 'love');
const newReaction = await getUserReaction('content-id');
console.log(newReaction); // Should be 'love'

// Remove reaction
await removeReaction('content-id');
const noReaction = await getUserReaction('content-id');
console.log(noReaction); // Should be null
```

**Expected Result**: All operations succeed, reactions change correctly

---

### Test 16: Engagement Stats

```javascript
const stats = await getEngagementStats('content-id');
console.log(stats);

// Should return object with:
// {
//   commentCount: number,
//   threadCount: number,
//   reactions: { like: n, love: n, ... },
//   totalReactions: number
// }
```

**Expected Result**: Complete stats object

---

## 🎨 Frontend Component Testing

### Test 17: Comment System Initialization

```javascript
const commentSystem = new CommentSystem({
  contentId: 'test-content-id',
  containerId: 'comments-container',
  isAuthenticated: true,
  currentUser: { id: 'user-id' }
});

await commentSystem.init();
```

**Expected Result**:
- [ ] Comments container populated
- [ ] Comment form visible
- [ ] Comments load with pagination
- [ ] Real-time subscription active

---

### Test 18: Reaction Bar Initialization

```javascript
const reactionBar = new ReactionBar({
  contentId: 'test-content-id',
  containerId: 'reaction-bar',
  isAuthenticated: true,
  currentUser: { id: 'user-id' }
});

await reactionBar.init();
```

**Expected Result**:
- [ ] Reaction bar visible
- [ ] Like button shows count
- [ ] Emoji picker available
- [ ] Real-time subscription active

---

### Test 19: Comment Form Submission

**Steps:**
1. In browser: Type comment in textarea
2. Click "Post Comment" button
3. Verify comment appears immediately (optimistic update)
4. Check other users see comment in real-time

**Expected Result**:
- [ ] Comment appears instantly
- [ ] Form clears
- [ ] Character counter resets
- [ ] Comment visible to other users within 1 second

---

### Test 20: Comment Editing

**Steps:**
1. Click edit button on own comment
2. Edit text
3. Click save
4. Verify "(edited)" badge appears
5. Check real-time update to other users

**Expected Result**:
- [ ] Edit form appears
- [ ] Text updates
- [ ] (edited) badge shows
- [ ] Others see update in real-time

---

### Test 21: Reply Threading

**Steps:**
1. Click "Reply" on a comment
2. Type reply
3. Click "Reply" button
4. Verify reply appears indented
5. Check reply count shows

**Expected Result**:
- [ ] Reply form appears
- [ ] Reply text indented
- [ ] Reply under parent comment
- [ ] Reply count increments
- [ ] "Load more replies" if > 5

---

### Test 22: Reaction Selection

**Desktop:**
1. Hover over reaction bar
2. Click "+" button
3. Emoji picker appears
4. Click an emoji
5. Reaction updates

**Mobile:**
1. Tap "+" button
2. Emoji picker appears
3. Tap an emoji
4. Reaction updates
5. Picker closes

**Expected Result**: Picker responsive, emoji buttons work, counts update

---

## 📱 Mobile Responsiveness Testing

### Test 23: Mobile Layout

**Device: iPhone 12 (390x844)**

- [ ] Comment form fits screen
- [ ] Buttons are 44px+ (touch-friendly)
- [ ] Text readable without zoom
- [ ] No horizontal scrolling
- [ ] Emoji picker fits

**Device: iPad (768x1024)**

- [ ] Comment form centered
- [ ] Proper spacing
- [ ] Touch-friendly layout
- [ ] Emoji picker positioned correctly

---

### Test 24: Touch Interactions

**Steps:**
1. Open on mobile device
2. Tap comment form
3. Tap emoji picker
4. Tap reaction buttons
5. Scroll through comments

**Expected Result**: All interactions responsive, no lag

---

## 🔔 Notification Testing

### Test 25: Comment Notification

**Setup:**
- User A creates post
- User B comments on A's post

**Expected:**
- Notification created in notifications table
- User A receives notification
- User B doesn't receive self-notification

**Verify:**
```javascript
// Check as User A:
const notifications = await supabaseClient
  .from('notifications')
  .select('*')
  .eq('user_id', userA.id)
  .eq('type', 'comment')
  .order('created_at', { ascending: false })
  .limit(1);

console.log(notifications.data[0]);
// Should show User B's comment notification
```

---

### Test 26: Reply Notification

**Setup:**
- User A creates comment
- User B replies to A's comment

**Expected:**
- Notification created for User A
- Not for User B

**Verify:**
```javascript
// Check as User A:
const notifications = await supabaseClient
  .from('notifications')
  .select('*')
  .eq('type', 'comment_reply')
  .limit(1);

console.log(notifications.data[0]);
```

---

### Test 27: Reaction Notification

**Setup:**
- User A creates post
- User B reacts to A's post

**Expected:**
- Notification created for User A
- Shows reaction type

**Verify:**
```javascript
// Check as User A:
const { data } = await supabaseClient
  .from('notifications')
  .select('*')
  .eq('type', 'reaction')
  .single();

console.log(data.metadata.reaction_type); // Should be 'like', 'love', etc
```

---

## ⚡ Performance Testing

### Test 28: Comment Loading Speed

**Measure:** Time to load 20 comments

```javascript
console.time('fetch-comments');
await fetchComments(contentId, 20, 0);
console.timeEnd('fetch-comments');

// Target: < 500ms
```

**Expected Result**: < 500ms

---

### Test 29: Real-time Update Speed

**Measure:** Time from user posting to seeing update

```javascript
// User A: Post comment
const before = Date.now();
await createComment(contentId, 'test');

// User B: Should see within 1000ms
// Measure in browser network tab
```

**Expected Result**: < 1000ms

---

### Test 30: Subscription Cleanup

**Check:** Memory leaks on component destroy

```javascript
// Create and destroy multiple times
for (let i = 0; i < 10; i++) {
  const cs = new CommentSystem({ contentId, containerId: 'test' });
  await cs.init();
  cs.destroy();
}

// Monitor memory in DevTools
// Should not grow significantly
```

**Expected Result**: No memory leaks, stable heap

---

## 🔐 Security Testing

### Test 31: XSS Prevention

**Test:** Comment with HTML/JS

```javascript
const malicious = '<img src=x onerror="alert(1)">';
await createComment(contentId, malicious);

// Should display as escaped text, not execute
```

**Expected Result**: HTML escaped, no execution

---

### Test 32: SQL Injection Prevention

**Test:** Comment with SQL

```javascript
const sql = "'; DROP TABLE content_comments; --";
await createComment(contentId, sql);

// Should store as text, not execute
```

**Expected Result**: Stored safely as text

---

### Test 33: CSRF Prevention

**Test:** Cross-origin requests

```javascript
// From different domain
fetch('https://yoursite.com/api/comment', {
  method: 'POST',
  body: JSON.stringify({ ... })
});

// Should fail due to CORS/RLS
```

**Expected Result**: Request blocked or fails with RLS error

---

## 📋 Moderation Testing

### Test 34: Admin Delete Comment

**As County Admin:**
```javascript
// County admin should be able to delete comments in their county
const { error } = await supabaseClient
  .from('content_comments')
  .delete()
  .eq('id', 'comment-id');

// Should succeed if content is in admin's county
```

**Expected Result**: Comment deleted (or soft-deleted)

---

### Test 35: Super Admin Full Access

**As Super Admin:**
```javascript
// Super admin can delete any comment anywhere
const { error } = await supabaseClient
  .from('content_comments')
  .delete()
  .eq('id', 'any-comment-id');

// Should always succeed
```

**Expected Result**: Always succeeds

---

### Test 36: Report System

**Create Report:**
```javascript
const { error } = await supabaseClient
  .from('comment_reports')
  .insert([{
    comment_id: 'comment-id',
    reported_by: auth.uid(),
    reason: 'Inappropriate language'
  }]);

// Should succeed if user is authenticated
```

**Expected Result**: Report created, admin can review

---

## ✅ Final Acceptance Testing

### Test 37: End-to-End Flow

**Scenario:** Two users interact

**Steps:**
1. User A (Logged in) visits post
2. User A posts comment
3. User B (Guest) sees comment
4. User B logs in
5. User B replies to User A
6. User B reacts with emoji
7. User A sees notification
8. User A sees reaction/reply in real-time
9. Admin reviews and approves content

**Expected Result**: All interactions work seamlessly

---

### Test 38: Cross-Content Integrity

**Test:** Comments don't leak between contents

```javascript
// Get comments for content A
const commentA = await fetchComments('content-a-id', 10, 0);

// Get comments for content B
const commentB = await fetchComments('content-b-id', 10, 0);

// They should be different
console.assert(commentA[0].content_id !== commentB[0].content_id);
```

**Expected Result**: No data leakage

---

### Test 39: Soft Delete Integrity

**Test:** Deleted comments don't show but history preserved

```javascript
// Create comment
const comment = await createComment(contentId, 'test');
const id = comment.id;

// Delete comment
await deleteComment(id);

// Should not appear in normal queries
const comments = await fetchComments(contentId);
const found = comments.find(c => c.id === id);
console.assert(!found);

// But can query deleted records if needed
const { data: deleted } = await supabaseClient
  .from('content_comments')
  .select('*')
  .eq('id', id)
  .single();

console.assert(deleted.is_deleted === true);
```

**Expected Result**: Hidden from users, preserved for admins

---

### Test 40: Concurrent User Operations

**Test:** Multiple users interacting simultaneously

**Setup:**
- User A and B both have post open
- User A posts comment
- User B adds reaction
- User C replies all simultaneously

**Expected Result:**
- No conflicts
- All operations succeed
- Real-time updates for all
- Correct counts

---

## 📊 Test Result Summary

Create a test spreadsheet:

| Test | Status | Notes |
|------|--------|-------|
| Schema Verification | ✅/❌ | |
| Constraints | ✅/❌ | |
| Indexes | ✅/❌ | |
| RLS Policies | ✅/❌ | |
| Comment CRUD | ✅/❌ | |
| Reactions | ✅/❌ | |
| Real-time | ✅/❌ | |
| Mobile | ✅/❌ | |
| Notifications | ✅/❌ | |
| Security | ✅/❌ | |
| Performance | ✅/❌ | |
| Moderation | ✅/❌ | |
| E2E | ✅/❌ | |

---

## 🚀 Go/No-Go Decision

**Ready for production if:**
- [ ] All database tests pass
- [ ] All API tests pass
- [ ] All component tests pass
- [ ] Mobile tests pass
- [ ] Security tests pass
- [ ] Performance meets targets
- [ ] No critical bugs found

**Hold for fixes if:**
- Any security test fails
- Performance < targets
- Data integrity compromised

---

**Test Date:** ___________
**Tester:** ___________
**Status:** ✅ PASS / ❌ FAIL

---

**Last Updated: May 22, 2026**
