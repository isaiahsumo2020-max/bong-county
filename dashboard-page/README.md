# 📊 User Dashboard Page

## Overview
User dashboard where logged-in users can view their profile, bookmarks, submissions, and manage their account.

## Folder Structure
```
dashboard-page/
├── index.html           # Dashboard page
├── css/                 # Styles
│   ├── styles.css       # Global dashboard styles
│   ├── sidebar.css      # Sidebar layout
│   ├── cards.css        # Dashboard cards
│   ├── profile.css      # Profile section
│   ├── tables.css       # Data tables
│   └── responsive.css   # Mobile styles
├── js/                  # Logic
│   ├── app.js           # Vue initialization
│   ├── sidebar.js       # Sidebar navigation
│   ├── profile.js       # User profile
│   ├── bookmarks.js     # Saved content
│   ├── submissions.js   # User submissions
│   ├── settings.js      # Account settings
│   ├── api.js           # API calls
│   └── utils.js         # Utilities
└── README.md            # This file
```

## Sections

### 1. Sidebar Navigation
- Dashboard menu
- Profile link
- Bookmarks
- Submissions
- Settings
- Logout

### 2. Dashboard Overview
- Quick stats
- Recent activity
- Quick actions
- Welcome message

### 3. Profile Section
- User avatar
- Full name
- Email address
- County affiliation
- Bio/about
- Edit button

### 4. Bookmarks Section
- Saved content grid
- Bookmark date
- Remove bookmark
- Search/filter

### 5. Submissions Section
- Content submitted
- Status (draft, pending, published)
- Edit/delete actions
- Submission date
- View count

### 6. Settings Section
- Change password
- Update profile info
- Email preferences
- Privacy settings
- Delete account option

## Component Files

### app.js
```javascript
// Initialize Vue app
// Load user data
// Set up routing
// Handle authentication
// Manage state
```

### sidebar.js
```javascript
// Sidebar navigation logic
// Active section tracking
// Mobile menu toggle
// User menu
```

### profile.js
```javascript
// Load user profile
// Display profile info
// Edit profile form
// Upload avatar
// Save changes
```

### bookmarks.js
```javascript
// Load user bookmarks
// Display bookmarked content
// Remove bookmarks
// Filter by type
// Search bookmarks
```

### submissions.js
```javascript
// Load user submissions
// Display in table
// Show submission status
// Edit draft content
// Delete submissions
// View published content
```

### settings.js
```javascript
// Load user settings
// Change password form
// Update email
// Privacy settings
// Notification preferences
// Delete account
```

### api.js
```javascript
// Fetch user profile
// Get bookmarks
// Load submissions
// Save profile changes
// Update password
// Delete account
```

## Styling

### styles.css
- Page layout
- Colors and typography
- Buttons
- Common elements

### sidebar.css
- Sidebar container
- Navigation items
- Active states
- Mobile behavior

### cards.css
- Dashboard cards
- Stats display
- Activity cards
- Recent items

### profile.css
- Profile header
- Avatar styling
- Info display
- Edit form

### tables.css
- Data table layout
- Column styling
- Row styling
- Action buttons

### responsive.css
- Mobile layout
- Tablet layout
- Touch-friendly
- Collapsed sidebar

## How to Use

### View Dashboard
```
Open: dashboard-page/index.html
(After logging in)
```

### Modify Layout
```
Edit: dashboard-page/css/styles.css
```

### Change Logic
```
Edit: dashboard-page/js/[section].js
```

### Add New Section
```
1. Create: dashboard-page/js/modules/[section].js
2. Add HTML: dashboard-page/index.html
3. Add CSS: dashboard-page/css/[section].css
4. Import in: dashboard-page/js/app.js
```

## Database Tables

### Users
- ID, email, full_name
- Avatar URL, bio
- County ID, role
- Created at, updated at

### Bookmarks
- ID, user_id, content_id
- Created at

### Content (for submissions)
- ID, author_id, title
- Body, excerpt, status
- Created at, updated at

## Features

✅ User profile management
✅ Save bookmarks
✅ View submissions
✅ Edit drafts
✅ Account settings
✅ Password management
✅ Privacy controls
✅ Responsive design

## Testing

### Functionality
- [ ] Profile loads
- [ ] Can edit profile
- [ ] Bookmarks display
- [ ] Can add/remove bookmarks
- [ ] Submissions show
- [ ] Can edit drafts
- [ ] Settings work
- [ ] Can change password

### Responsive
- [ ] Mobile layout
- [ ] Tablet layout
- [ ] Desktop layout

### Security
- [ ] User authenticated
- [ ] Can only see own data
- [ ] Password protected
- [ ] HTTPS required

## Common Issues

### Profile not loading?
- Check authentication
- Verify user session
- Check API endpoint

### Bookmarks not showing?
- Check bookmarks table
- Verify user_id
- Check filtering logic

### Submissions not displaying?
- Check content table
- Verify author_id
- Check status filtering

---

**Status**: 🔧 Ready for implementation
**Lines of Code**: ~1,934 original → Split across modules
**Modules**: 7 main components
**Requires**: User authentication
