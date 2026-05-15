# ✍️ Contribute Page

## Overview
Page where users can submit content (stories, announcements, articles) to their county's page.

## Folder Structure
```
contribute-page/
├── index.html           # Submission form
├── css/                 # Styles
│   ├── styles.css       # Global styles
│   ├── editor.css       # Rich editor styling
│   ├── forms.css        # Form fields
│   ├── preview.css      # Preview panel
│   └── responsive.css   # Mobile styles
├── js/                  # Logic
│   ├── app.js           # Vue initialization
│   ├── editor.js        # Rich text editor
│   ├── forms.js         # Form handling
│   ├── validation.js    # Form validation
│   ├── preview.js       # Live preview
│   ├── upload.js        # File uploads
│   ├── api.js           # API submission
│   └── utils.js         # Utilities
└── README.md            # This file
```

## Sections

### 1. Form Header
- Page title
- Instructions
- Help link
- Estimated time

### 2. Content Form
- Title field
- County selector
- Content type (story, article, announcement)
- Rich text editor
- Excerpt/summary
- Image upload
- Tags

### 3. Rich Text Editor
- Text formatting (bold, italic, etc.)
- List formatting
- Link insertion
- Image embedding
- Code blocks
- Undo/redo

### 4. Image Upload
- Drag and drop
- File selector
- Image preview
- Alt text input
- Upload progress

### 5. Live Preview
- Real-time preview
- Formatting display
- Mobile preview
- Full screen preview

### 6. Submit Section
- Save as draft button
- Submit for review button
- Preview button
- Cancel button

### 7. Validation Messages
- Required field errors
- Format errors
- Length warnings
- Character count

## Component Files

### app.js
```javascript
// Initialize Vue app
// Check authentication
// Load counties
// Handle navigation
// Manage form state
```

### editor.js
```javascript
// Initialize rich text editor
// Handle formatting
// Insert images/links
// Manage content
// Serialize HTML
```

### forms.js
```javascript
// Form input handling
// Data binding
// Field state management
// Dirty state tracking
```

### validation.js
```javascript
// Title validation
// Content length check
// Required fields check
// Image validation
// Tag validation
// Error message generation
```

### preview.js
```javascript
// Live preview render
// Update on content change
// Mobile preview
// Full screen toggle
// Export preview
```

### upload.js
```javascript
// Handle file drops
// File selection
// Image preview
// Upload progress
// Error handling
// File size checking
```

### api.js
```javascript
// Submit content
// Save draft
// Upload image
// Get counties
// Create user profile
// Handle responses
```

## Styling

### styles.css
- Page layout
- Colors and typography
- Buttons
- Common components

### editor.css
- Editor container
- Toolbar styling
- Button styles
- Content area

### forms.css
- Form layout
- Field styling
- Labels
- Help text
- Error messages

### preview.css
- Preview panel
- Preview styling
- Mobile view
- Responsive display

### responsive.css
- Mobile form layout
- Stacked layout
- Single column
- Full-width editor

## Form Fields

### Required Fields
```
- Title (3-200 characters)
- County (must select)
- Content Type (story/article/announcement)
- Body (minimum 100 characters)
```

### Optional Fields
```
- Cover Image (JPG/PNG, < 5MB)
- Excerpt (0-300 characters)
- Tags (comma-separated)
- External Links
```

## Validation Rules

### Title
```
- Required
- Minimum 3 characters
- Maximum 200 characters
- No special characters
```

### Content Body
```
- Required
- Minimum 100 characters
- Maximum 10,000 characters
- HTML allowed (sanitized)
```

### Image
```
- Optional
- JPG, PNG, WebP only
- Maximum 5MB
- Minimum 400x300px
```

### Tags
```
- Optional
- Maximum 5 tags
- Alphanumeric only
- Maximum 50 characters each
```

## How to Use

### View Page
```
Open: contribute-page/index.html
(After logging in)
```

### Submit Content
```
1. Fill in form fields
2. Write content in editor
3. Add cover image
4. Add tags
5. Preview
6. Submit for review
```

### Save Draft
```
1. Fill in required fields
2. Click "Save as Draft"
3. Continue editing later
```

## Database Tables

### Content
- ID, title, body, excerpt
- County ID, author ID
- Type, status
- Cover image URL
- Tags, view count
- Created at, updated at

### Media
- ID, file URL, file type
- County ID, uploader ID
- Content ID, alt text
- Uploaded at

## Features

✅ Rich text editor
✅ Image upload
✅ Live preview
✅ Save as draft
✅ Content validation
✅ Form auto-save
✅ Tags/categories
✅ Submission workflow

## Workflow

```
1. User logs in
2. Opens contribute page
3. Fills in form
4. Writes content
5. Uploads image
6. Previews content
7. Submits for review
8. Admin approves/rejects
9. Content published
```

## Permissions

```
- Visitors: Can view contribute page
- Authenticated Users: Can submit content
- County Admins: Can approve/reject
- Super Admin: Can override any content
```

## Testing

### Functionality
- [ ] Form loads
- [ ] Fields validate
- [ ] Editor works
- [ ] Image upload works
- [ ] Preview updates
- [ ] Can save draft
- [ ] Can submit
- [ ] Confirmation message

### Responsive
- [ ] Mobile layout
- [ ] Tablet layout
- [ ] Desktop layout

### Validation
- [ ] Required fields check
- [ ] Length validation
- [ ] Format validation
- [ ] Image size check

## Common Issues

### Editor not working?
- Check editor library
- Verify content area
- Check JavaScript errors

### Image upload failing?
- Check file size
- Verify format
- Check storage bucket
- Check permissions

### Form not submitting?
- Check authentication
- Verify form validation
- Check API endpoint
- Check network

---

**Status**: 🔧 Ready for implementation
**Lines of Code**: ~1,137 original → Split across modules
**Modules**: 8 main components
**Requires**: User authentication
