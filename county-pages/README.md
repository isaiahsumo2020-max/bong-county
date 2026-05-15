# 🏛️ County Pages

## Overview
Individual pages for each Liberia county (Bong, Lofa, etc.) showing stories, tourism sites, leaders, events, and opportunities.

## Folder Structure
```
county-pages/
├── bong.html            # Bong County page
├── lofa.html            # Lofa County page
├── [county].html        # Other county pages
├── css/                 # Shared styles
│   ├── styles.css       # Global county styles
│   ├── layout.css       # Page layout
│   ├── hero.css         # Hero section
│   ├── cards.css        # Content cards
│   ├── nav.css          # County nav
│   ├── sections.css     # Section styling
│   └── responsive.css   # Mobile styles
├── js/                  # Shared logic
│   ├── app.js           # Vue router setup
│   ├── router.js        # Route configuration
│   ├── county-nav.js    # County navbar
│   ├── county-info.js   # County overview
│   ├── content.js       # Stories/articles
│   ├── tourism.js       # Tourism sites
│   ├── leaders.js       # County leaders
│   ├── events.js        # Events list
│   ├── opportunities.js # Jobs/scholarships
│   ├── api.js           # API calls
│   └── utils.js         # Utilities
└── README.md            # This file
```

## County Page Sections

### 1. Navigation
- County logo/branding
- Main menu
- Auth buttons
- Mobile menu

### 2. Hero Section
- County banner
- County name
- Tagline
- Quick stats

### 3. Overview Tab
- County description
- Key statistics
- Map location
- Quick facts

### 4. Stories Tab
- Recent stories/articles
- Announcements
- County news
- Story detail pages

### 5. Tourism Tab
- Tourism sites grid
- Site descriptions
- Images
- Ratings/info

### 6. Leaders Tab
- Current leaders
- Past leaders
- Contact info
- Leadership structure

### 7. Events Tab
- Upcoming events
- Past events
- Event details
- Registration

### 8. Opportunities Tab
- Job listings
- Scholarships
- Training programs
- Application links

## Component Files

### app.js
```javascript
// Initialize Vue app
// Set up router
// Load county data
// Configure theme colors
// Handle page transitions
```

### router.js
```javascript
// Define routes for each tab
// Tab navigation
// History management
// Hash routing
```

### county-info.js
```javascript
// Load county data
// Display overview
// Show statistics
// Handle interactions
```

### content.js
```javascript
// Load stories/articles
// Display in grid
// Handle sorting/filtering
// Show story detail
```

### tourism.js
```javascript
// Load tourism sites
// Display in grid
// Show site details
// Handle filtering
```

### leaders.js
```javascript
// Load leaders data
// Display in tabs (current/past)
// Show leader profiles
// Contact information
```

### events.js
```javascript
// Load events
// Display upcoming/past
// Show event details
// Handle calendar view
```

### opportunities.js
```javascript
// Load opportunities
// Filter by type
// Display listings
// Show opportunity details
// Handle external links
```

### api.js
```javascript
// Fetch county data
// Load content
// Get tourism sites
// Fetch leaders
// Load events
// Get opportunities
// Error handling
```

## Styling

### styles.css
- Global colors and typography
- Button styles
- Link styles
- Common components

### layout.css
- Page layout structure
- Container widths
- Section spacing
- Flexbox/grid

### hero.css
- Hero banner
- Background image
- Text overlay
- Gradients

### cards.css
- Content cards
- Image containers
- Text styling
- Hover effects

### nav.css
- Navigation bar
- Tab navigation
- Mobile menu
- Active states

### sections.css
- Section containers
- Title styling
- Section spacing
- Grid layouts

### responsive.css
- Mobile (< 640px)
- Tablet (640px - 1024px)
- Desktop (1024px+)
- Touch interactions

## How to Use

### View a County Page
```
Open: county-pages/bong.html
Open: county-pages/lofa.html
```

### Modify County Styles
```
Edit: county-pages/css/styles.css
```

### Modify County Logic
```
Edit: county-pages/js/[feature].js
```

### Add New County Page
```
1. Create: county-pages/[county].html
2. Copy structure from existing page
3. Update county name and slug
4. Styles are shared, no changes needed
```

### Update County Information
```
Edit in database:
- counties table
- content table
- tourism_sites table
- leaders table
- events table
- opportunities table
```

## Database Tables

### Counties
- ID, name, slug, region, capital
- Description, population, area
- Primary color, images
- Status (live, draft)

### Content
- ID, title, body, excerpt
- County ID, author ID
- Type (story, article, announcement)
- Status (published, draft)
- Tags, view count

### Tourism Sites
- ID, name, location
- Description, category
- Images, entry fee
- Coordinates, contact info

### Leaders
- ID, name, role, era
- Category (current, historical)
- Photo, bio

### Events
- ID, title, description
- Date, location
- County ID, author
- Status (upcoming, past)

### Opportunities
- ID, title, type
- Description, deadline
- County ID, author
- Status (open, closed)
- Application URL

## Features

✅ Multi-tab navigation
✅ Responsive design
✅ Search and filtering
✅ Image galleries
✅ Social sharing
✅ Print friendly
✅ Accessibility
✅ SEO optimized

## Testing

### Functionality
- [ ] All tabs load
- [ ] Content displays
- [ ] Links work
- [ ] Search/filter works
- [ ] Images load

### Responsive
- [ ] Mobile layout
- [ ] Tablet layout
- [ ] Desktop layout

### Performance
- [ ] Page loads quickly
- [ ] Images optimized
- [ ] No console errors

## Common Issues

### County data not loading?
- Check API in `/shared/js/api.js`
- Verify database connection
- Check county ID

### Images not showing?
- Verify image URLs
- Check Supabase storage
- Check CORS settings

### Navigation not working?
- Check router configuration
- Verify tab names
- Check route paths

---

**Status**: 🔧 Ready for implementation
**Lines of Code**: ~1,500 per county → Split across modules
**Modules**: 9 main components
**Counties Included**: 15 (Bong, Lofa, etc.)
