# Contributor Profile & Personalized Subscription System

## System Overview

The Liberia Counties Digital Platform now includes a comprehensive contributor profile system with personalized interest-based subscriptions. This enables:

- **Contributor Profiles:** Showcase user information, statistics, and contributions
- **Interest Subscriptions:** Users select topics of interest for personalized content
- **Settings Management:** Users can edit profile, manage subscriptions, and preferences
- **Future Scalability:** Foundation for AI recommendations and smart content discovery

---

## Architecture

### Database Schema

#### 1. `notification_topics` Table

Predefined interest categories users can subscribe to.

```sql
CREATE TABLE notification_topics (
  id              uuid PRIMARY KEY,
  slug            text UNIQUE NOT NULL,      -- e.g., "scholarships"
  name            text UNIQUE NOT NULL,      -- e.g., "Scholarships"
  description     text,                      -- Brief description
  icon_emoji      text,                      -- e.g., "🎓"
  color           text DEFAULT '#1B5E35',    -- UI theming color
  display_order   integer NOT NULL,          -- Sort order
  is_active       boolean DEFAULT true,
  created_at      timestamptz NOT NULL,
  updated_at      timestamptz NOT NULL
);
```

**Pre-populated Topics (14 total):**
1. Scholarships (🎓)
2. Internships (💼)
3. Fellowships (🤝)
4. Grants (💰)
5. Jobs (💻)
6. Trainings (📚)
7. Technology (🚀)
8. Education (🏫)
9. Agriculture (🌾)
10. Tourism (✈️)
11. Health (🏥)
12. Events (🎉)
13. Community Stories (📰)
14. Youth Programs (👥)

#### 2. `user_subscriptions` Table

Many-to-many junction table linking users to topics they're interested in.

```sql
CREATE TABLE user_subscriptions (
  id              uuid PRIMARY KEY,
  user_id         uuid NOT NULL REFERENCES users(id),
  topic_id        uuid NOT NULL REFERENCES notification_topics(id),
  subscribed_at   timestamptz NOT NULL,
  
  UNIQUE(user_id, topic_id)  -- Prevent duplicates
);
```

#### 3. `users` Table Additions

New columns added to support profiles:

```sql
ALTER TABLE users ADD COLUMN
  profile_image_url text,      -- User avatar/profile picture
  last_login_at timestamptz;   -- Activity tracking
```

---

## Components & Pages

### 1. Profile Page (`profile-page/index.html`)

**URL:** `/profile-page/index.html?id={user_id}`

**Features:**
- Display comprehensive user profile
- Show contributor type and category
- Display organization information (if applicable)
- Show contribution statistics (content count, views, subscriptions)
- Link to settings for own profile
- Responsive design (mobile, tablet, desktop)

**Profile Displays:**
- Full name and role badge
- Profile image/avatar
- County location
- Join date
- Contributor type (Individual/Organization/NGO/etc.)
- Individual category (if applicable)
- Bio
- Organization info (for non-individuals)
- Contribution statistics:
  - Content pieces created
  - Total views received
  - Number of subscriptions
  - Number of interests followed

**Navigation:**
- Back to home button
- Auth status indicator
- Settings link (for own profile only)

### 2. Settings Page (`settings-page/index.html`)

**URL:** `/settings-page/index.html`

**Access:** Authenticated contributors only

**Four Main Sections:**

#### A. Profile Tab
- Edit full name
- View email (read-only)
- Edit bio
- Upload profile image/avatar
- Edit organization info (for non-individuals):
  - Organization name
  - Institution type
  - Organization description
  - Website URL

#### B. Subscriptions Tab
- Visual grid of 14 interest topics
- Each topic shows:
  - Icon emoji
  - Topic name
  - Clickable checkbox for selection
- Visual feedback for selected topics
- Save changes button
- Displays subscription count

#### C. Notifications Tab
- Email notification preferences:
  - All updates
  - Subscriptions only
  - None
- Weekly digest toggle
- Preference persistence

#### D. Security Tab
- Change password functionality
- Danger zone for account deletion
- Current password verification

---

## Data Flow

### User Registration to Subscriptions

```
User Signs Up
    ↓
[Step 2: Contributor Type]
    ↓
User Profile Created
    ↓
User Redirected to Dashboard
    ↓
User Goes to Settings
    ↓
[Subscriptions Tab]
    ↓
Select Topics of Interest
    ↓
Subscriptions Saved to Database
    ↓
[In Future] Personalized Feed Built
```

### Profile Viewing

```
User A Visits User B's Profile
    ↓
/profile-page/index.html?id={user_b_id}
    ↓
System Loads User B's Data:
    • Profile info
    • Contribution statistics
    • Subscriptions count
    ↓
[If User A = User B]
    Show Settings Button
    ↓
User Can Edit Profile/Subscriptions
```

### Subscription Management

```
User Selects Topics in Settings
    ↓
Frontend Detects Changes
    ↓
Compare Current vs Selected
    ↓
Add New Subscriptions
    ↓
Remove Unselected Subscriptions
    ↓
Update UI with Confirmation
    ↓
[Future] Update Personalized Feed
```

---

## Implementation Checklist

### Database Setup
- [ ] Run migration: `20250513000002_add_profiles_subscriptions.sql`
- [ ] Verify 14 topics are seeded
- [ ] Verify user_subscriptions table is created
- [ ] Verify profile_image_url column added to users

### Frontend Deployment
- [ ] Deploy profile-page/index.html
- [ ] Deploy settings-page/index.html
- [ ] Add navigation links from index page
- [ ] Add profile link to user menu

### Testing
- [ ] Test profile page with test user
- [ ] Test settings page - all tabs
- [ ] Test subscription selection and saving
- [ ] Test avatar upload
- [ ] Test profile update
- [ ] Test responsive design (mobile)
- [ ] Test authentication redirects

---

## API Integration Reference

### Query: Load User Profile

```javascript
const { data: profile } = await sb
  .from('users')
  .select(`
    id, full_name, email, bio, profile_image_url,
    contributor_kind, individual_category,
    organization_name, organization_description, 
    institution_type, website_url,
    created_at, county:counties(name)
  `)
  .eq('id', userId)
  .single();
```

### Query: Get User Subscriptions

```javascript
const { data: subscriptions } = await sb
  .from('user_subscriptions')
  .select('topic_id')
  .eq('user_id', userId);
```

### Query: Get All Topics

```javascript
const { data: topics } = await sb
  .from('notification_topics')
  .select('*')
  .eq('is_active', true)
  .order('display_order');
```

### Mutation: Add Subscription

```javascript
await sb.from('user_subscriptions').insert({
  user_id: currentUserId,
  topic_id: topicId
});
```

### Mutation: Remove Subscription

```javascript
await sb
  .from('user_subscriptions')
  .delete()
  .eq('user_id', currentUserId)
  .eq('topic_id', topicId);
```

### Mutation: Update Profile

```javascript
await sb.from('users').update({
  full_name: name,
  bio: bio,
  profile_image_url: imageUrl,
  organization_name: orgName,
  organization_description: orgDesc,
  institution_type: instType,
  website_url: website
}).eq('id', currentUserId);
```

---

## Features & Benefits

### For Users
✓ **Complete Profile:** Showcase their expertise and background
✓ **Personalization:** Follow topics relevant to their interests
✓ **Visibility Control:** Show/hide profile information
✓ **Easy Management:** Simple settings interface
✓ **Avatar Uploads:** Personalize their presence

### For Platform
✓ **User Segmentation:** Categorize contributors by type
✓ **Content Targeting:** Send relevant notifications
✓ **Engagement:** Personalized feeds drive activity
✓ **Analytics:** Understand user interests
✓ **Scalability:** Foundation for ML/AI systems

---

## Future Enhancements

### Phase 2: Content Personalization
- **Personalized Feeds:** Show content matching user subscriptions
- **Smart Recommendations:** Algorithm-based suggestions
- **Trending by Category:** Show trending topics in user interests
- **Notification System:** Send notifications on new content in subscribed topics

### Phase 3: Advanced Features
- **Recommendation Engine:** ML-based content suggestions
- **User Networks:** Follow other contributors
- **Social Features:** Comment, react, bookmark content
- **Expert Profiles:** Verify and badge expert contributors
- **Analytics Dashboard:** User contribution analytics

### Phase 4: Discovery & Growth
- **Search by Category:** Find contributors by type/interest
- **Category Pages:** Browse all content in a category
- **Trending Lists:** Weekly/monthly trending contributors
- **Topic Feeds:** Public feeds for each topic
- **Community Curation:** Community-curated content lists

---

## Testing Guide

### Test Case 1: Create Profile & Subscribe

1. Sign up as new user
2. Go to /settings-page/index.html
3. Edit profile:
   - Change full name
   - Add bio
   - Upload avatar
4. Go to Subscriptions tab
5. Select 5 topics:
   - Scholarships
   - Technology
   - Jobs
   - Education
   - Youth Programs
6. Click Save Subscriptions
7. Verify: "Subscriptions updated! (5 topics)" message

### Test Case 2: View Own Profile

1. After signup, navigate to /profile-page/index.html?id={your_user_id}
2. Verify all profile info displays correctly
3. Verify "Settings" and "Manage Subscriptions" buttons appear
4. Verify subscription count shows "5"

### Test Case 3: View Another User's Profile

1. Get another user's ID
2. Navigate to /profile-page/index.html?id={other_user_id}
3. Verify profile displays correctly
4. Verify Settings buttons do NOT appear (read-only)
5. Verify subscription count displays

### Test Case 4: Subscription Persistence

1. Select 3 topics and save
2. Refresh page
3. Topics should still be checked
4. Select different topics and save
5. Previously selected should be unchecked
6. New selections should be saved

### Test Case 5: Organization Profile

1. Signup as NGO contributor type
2. Go to settings
3. Verify organization fields appear
4. Fill in:
   - Organization Name: "Test NGO"
   - Institution Type: "NGO"
   - Description: "Test description"
   - Website: "https://testngo.org"
5. Save
6. View own profile
7. Verify organization info displays correctly

### Test Case 6: Responsive Design

1. View profile page on:
   - Desktop (1920px)
   - Tablet (768px)
   - Mobile (375px)
2. Verify layout adapts correctly
3. Verify all buttons are clickable
4. Verify text is readable

---

## Security Considerations

### Authentication
- Profile page allows public viewing
- Settings page requires authentication
- User can only edit their own profile
- Logout clears session

### Data Privacy
- Email is read-only in settings
- Password changes require authentication
- Subscriptions are private user data
- Profile visibility preference respected (future)

### Validation
- Avatar file size limited to 5MB
- Email format validated
- URL format validated for website field
- Duplicate subscriptions prevented

---

## Performance Optimizations

### Indexes
```sql
CREATE INDEX idx_user_subscriptions_user_id 
  ON user_subscriptions(user_id);

CREATE INDEX idx_user_subscriptions_topic_id 
  ON user_subscriptions(topic_id);

CREATE INDEX idx_notification_topics_slug 
  ON notification_topics(slug);
```

### Queries
- User subscriptions loaded with single query
- Topics cached in frontend
- Diff-based updates minimize DB writes

---

## File Structure

```
components/
├── supabase/
│   └── migrations/
│       └── 20250513000002_add_profiles_subscriptions.sql
├── profile-page/
│   └── index.html
├── settings-page/
│   └── index.html
└── [other pages...]
```

---

## Troubleshooting

### Issue: Profile page shows "Unable to load profile"
**Solution:**
1. Check URL has `?id=` parameter
2. Verify user ID exists in database
3. Check browser console for errors
4. Verify Supabase credentials

### Issue: Subscriptions not saving
**Solution:**
1. Verify user is authenticated
2. Check browser console for errors
3. Verify notification_topics table has data
4. Check user_subscriptions table for data

### Issue: Avatar upload fails
**Solution:**
1. Verify file size < 5MB
2. Verify file is image (JPG, PNG, GIF)
3. Check browser file upload permissions
4. Check Supabase storage bucket exists

---

## Support & Documentation

For detailed setup instructions, see:
- [CONTRIBUTOR_ONBOARDING_GUIDE.md](../CONTRIBUTOR_ONBOARDING_GUIDE.md)
- [QUICK_REFERENCE.md](../QUICK_REFERENCE.md)
- [TECHNICAL_CHANGES.md](../TECHNICAL_CHANGES.md)

---

**Version:** 1.0  
**Status:** ✅ Ready for Deployment  
**Last Updated:** May 13, 2026
