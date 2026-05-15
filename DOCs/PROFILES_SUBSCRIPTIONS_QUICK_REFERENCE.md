# Quick Start - Profiles & Subscriptions System

## 🎯 What's New

### Three New Components
1. **Profile Page** - View any contributor's profile
2. **Settings Page** - Edit your profile and subscriptions
3. **Notification Topics System** - 14 predefined interest categories

### Database Changes
- `notification_topics` table - 14 pre-seeded interest categories
- `user_subscriptions` table - many-to-many relationships
- New columns: `profile_image_url`, `last_login_at` in users table

---

## 🚀 Quick Deployment

### Step 1: Apply Database Migration
```
Supabase Dashboard → SQL Editor → New Query
Copy & paste: 20250513000002_add_profiles_subscriptions.sql
Click "Run"
```

### Step 2: Deploy Frontend Files
```
Upload to your server:
- /profile-page/index.html
- /settings-page/index.html
```

### Step 3: Update Navigation Links
Add to your main page:
```html
<!-- Link to user profile -->
<a href="/profile-page/index.html?id={current_user_id}">👤 My Profile</a>

<!-- Link to settings -->
<a href="/settings-page/index.html">⚙️ Settings</a>
```

### Step 4: Test
- Visit `/profile-page/index.html?id={test_user_id}`
- Login and visit `/settings-page/index.html`
- Try subscribing to topics

---

## 📋 14 Interest Categories

| Icon | Category | Use Case |
|------|----------|----------|
| 🎓 | Scholarships | Educational funding |
| 💼 | Internships | Work experience |
| 🤝 | Fellowships | Professional development |
| 💰 | Grants | Project funding |
| 💻 | Jobs | Employment |
| 📚 | Trainings | Skills development |
| 🚀 | Technology | Tech news & updates |
| 🏫 | Education | Education content |
| 🌾 | Agriculture | Ag opportunities |
| ✈️ | Tourism | Travel & tourism |
| 🏥 | Health | Health information |
| 🎉 | Events | Community events |
| 📰 | Community Stories | User-generated content |
| 👥 | Youth Programs | Youth development |

---

## 🔧 API Usage Quick Reference

### Get User Profile
```javascript
const profile = await sb
  .from('users')
  .select('id, full_name, bio, profile_image_url, contributor_kind')
  .eq('id', userId)
  .single();
```

### Get User Subscriptions
```javascript
const subs = await sb
  .from('user_subscriptions')
  .select('topic_id')
  .eq('user_id', userId);
```

### Add Subscription
```javascript
await sb.from('user_subscriptions').insert({
  user_id: userId,
  topic_id: topicId
});
```

### Remove Subscription
```javascript
await sb
  .from('user_subscriptions')
  .delete()
  .eq('user_id', userId)
  .eq('topic_id', topicId);
```

### Update Profile
```javascript
await sb.from('users').update({
  full_name: 'New Name',
  bio: 'New bio',
  profile_image_url: 'url'
}).eq('id', userId);
```

---

## 📱 Page URLs

| Page | URL | Access |
|------|-----|--------|
| View Profile | `/profile-page/index.html?id={user_id}` | Public |
| Edit Profile | `/settings-page/index.html` | Authenticated |
| Account Settings | `/settings-page/index.html` | Authenticated |

---

## 🧪 Quick Test Checklist

- [ ] Database migration runs without errors
- [ ] 14 topics appear in subscriptions UI
- [ ] Can select and save subscriptions
- [ ] Profile page displays user info
- [ ] Settings page loads with auth
- [ ] Avatar preview shows default image
- [ ] Organization fields show for non-individual types
- [ ] Can navigate between settings tabs
- [ ] Mobile layout is responsive

---

## 📊 Data Examples

### User Profile Record
```json
{
  "id": "uuid-123",
  "full_name": "John Smith",
  "email": "john@example.com",
  "bio": "Tech enthusiast from Monrovia",
  "role": "contributor",
  "contributor_kind": "individual",
  "individual_category": "software_developer",
  "profile_image_url": "https://...",
  "created_at": "2026-05-13T10:00:00Z"
}
```

### Subscription Record
```json
{
  "id": "uuid-456",
  "user_id": "uuid-123",
  "topic_id": "uuid-topic-scholarships",
  "subscribed_at": "2026-05-13T10:15:00Z"
}
```

### Notification Topic Record
```json
{
  "id": "uuid-topic-scholarships",
  "slug": "scholarships",
  "name": "Scholarships",
  "description": "Scholarship opportunities and awards",
  "icon_emoji": "🎓",
  "color": "#4F46E5",
  "display_order": 1,
  "is_active": true
}
```

---

## 🔗 Integration Points

### In Auth Page (Future)
Add subscription preferences during signup Step 2 or after account creation.

### In Dashboard
Show "Your Interests: [topics]" widget
Show "Recommended for you" based on subscriptions

### In Content Pages
Filter/show content matching user subscriptions

### In Admin Panel
View subscriber counts by topic
Analyze content distribution

---

## 🎯 Feature Highlights

✅ **Profile Showcase**
- Display expertise and background
- Show contribution statistics
- Organize by contributor type

✅ **Subscription System**
- Select from 14 predefined topics
- Visual topic selection UI
- Persistent storage

✅ **Settings Management**
- Edit profile information
- Upload profile picture
- Manage subscriptions
- Change password
- Notification preferences

✅ **Responsive Design**
- Works on desktop, tablet, mobile
- Touch-friendly on mobile
- Optimized layouts

✅ **Data-Driven**
- Contribution statistics
- Subscription tracking
- Activity analytics

---

## 🚨 Important Notes

1. **Profile Visibility:** Currently all profiles are public. Add privacy controls in future versions.

2. **Avatar Storage:** Currently uses URL field. For file uploads, integrate Supabase Storage.

3. **Subscriptions:** Currently used for future personalization. Implement in Feed/Dashboard phase.

4. **Email Notifications:** Preference fields exist but not integrated with email system yet.

5. **Password Reset:** Integrates with Supabase Auth.

---

## 📞 Support Files

- `PROFILES_SUBSCRIPTIONS_GUIDE.md` - Complete guide
- `CONTRIBUTOR_ONBOARDING_GUIDE.md` - Contributor system
- `TECHNICAL_CHANGES.md` - Detailed technical docs
- `QUICK_REFERENCE.md` - Contributor type reference

---

## ⚡ Performance Tips

1. **Cache Topics:** Load once, use everywhere
2. **Batch Subscriptions:** Update multiple at once
3. **Index on user_id:** Already added for fast queries
4. **Lazy Load:** Profile content loads on demand

---

## 🔐 Security

- Settings page requires authentication
- Users can only edit own profile
- Email is read-only
- Password reset via auth system
- File size validation on uploads

---

**Version:** 1.0  
**Status:** ✅ Ready  
**Updated:** May 13, 2026
