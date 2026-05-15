# 🏠 Index Page (Home)

## Overview
The main landing page for your CountySphere Liberia platform.

## Folder Structure
```
index-page/
├── index.html           # Homepage
├── css/                 # Styles
│   ├── styles.css       # Global homepage styles
│   ├── hero.css         # Hero section
│   ├── counties.css     # County grid
│   ├── features.css     # Feature highlights
│   └── responsive.css   # Mobile styles
├── js/                  # Logic
│   ├── app.js           # Vue initialization
│   ├── navigation.js    # Navigation logic
│   ├── hero.js          # Hero section
│   ├── counties.js      # County grid
│   ├── features.js      # Feature sections
│   ├── api.js           # API calls
│   └── utils.js         # Utilities
└── README.md            # This file
```

## Sections

### 1. Navigation
- Logo/branding
- Navigation menu
- Auth buttons
- Mobile menu

### 2. Hero Section
- Large banner
- Main headline
- CTA buttons
- Background image

### 3. Counties Grid
- County cards
- County stats
- Links to county pages
- Filtering/search

### 4. Features
- Platform highlights
- Why visit
- Key benefits
- Statistics

### 5. Footer
- Links
- Contact info
- Social media
- Copyright

## Component Files

### app.js
```javascript
// Initialize Vue app
// Set up router
// Configure theme
// Load initial data
```

### navigation.js
```javascript
// Navigation menu logic
// Active state tracking
// Mobile menu toggle
// Auth dropdown
```

### hero.js
```javascript
// Hero banner content
// Background image loading
// CTA button handling
// Animation effects
```

### counties.js
```javascript
// Load counties from database
// Display county grid
// Handle county selection
// Filter/search logic
```

### api.js
```javascript
// Fetch counties
// Get statistics
// Load featured content
// API error handling
```

## Styling

### styles.css
- Colors and typography
- Layout and spacing
- Button styles
- Form styles
- Global elements

### hero.css
- Hero container
- Image backgrounds
- Text styling
- Animation effects

### counties.css
- Grid layout
- County cards
- Hover effects
- Image styling

### responsive.css
- Mobile layout (< 640px)
- Tablet layout (640px - 1024px)
- Touch-friendly buttons
- Stack layout

## How to Use

### View Page
```
Open: index-page/index.html
```

### Modify Styles
```
Edit: index-page/css/styles.css
```

### Add New Section
```
1. Create: index-page/js/modules/[section].js
2. Add HTML: index-page/index.html
3. Add CSS: index-page/css/[section].css
4. Import in: index-page/js/app.js
```

### Update Content
```
Edit content values in:
- index-page/js/[module].js
- index-page/index.html
```

## APIs Used

### Supabase
- `counties` table - County information
- `analytics` table - View tracking
- `content` table - Featured stories

## Performance Tips

✅ Lazy load county images
✅ Use image optimization
✅ Minify CSS/JS
✅ Cache API responses
✅ Preload critical fonts

## Testing

### Functionality
- [ ] Navigation works
- [ ] Links go to correct pages
- [ ] Buttons trigger correct actions
- [ ] Forms submit data
- [ ] Auth buttons work

### Responsive
- [ ] Mobile (320px+)
- [ ] Tablet (640px+)
- [ ] Desktop (1024px+)

### Performance
- [ ] Page loads quickly
- [ ] Images load properly
- [ ] No console errors
- [ ] No layout shifts

## Common Issues

### Counties not loading?
- Check API in `/shared/js/api.js`
- Verify database connection
- Check browser console

### Styles not applying?
- Check CSS file paths
- Verify Tailwind is loaded
- Check CSS specificity

### Navigation not working?
- Check router configuration
- Verify links point to correct pages
- Check mobile menu logic

---

**Status**: 🔧 Ready for implementation
**Lines of Code**: ~775 original → Split across multiple files
**Modules**: 6 main components
