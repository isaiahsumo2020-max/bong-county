# 🚀 Liberia CountySphere - Developer Quick Start Guide

**Get up and running with the Liberia CountySphere frontend in 30 minutes**

---

## 📥 1. Project Setup (5 minutes)

### Prerequisites
- Basic HTML, CSS, JavaScript knowledge
- Text editor or IDE (VS Code recommended)
- Web browser
- Git (optional, for version control)

### Step 1: Get the Source Code

```bash
# Clone or download the project
git clone [your-repo-url]
cd components/

# Or if downloading as ZIP, extract and navigate to components/
```

### Step 2: Get Supabase Credentials

1. Go to [supabase.com](https://supabase.com)
2. Log in to your project dashboard
3. Click **Settings** → **API**
4. Copy:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **Anon Key** (starts with `eyJ...`)

### Step 3: Update Configuration

Open `supabaseClient.js`:

```javascript
// Find these lines and update with your credentials:
const SUPABASE_URL = 'https://choagncxtmsewzvxoncx.supabase.co';  // ← REPLACE
const SUPABASE_ANON_KEY = 'eyJhbGc...';  // ← REPLACE
```

### Step 4: Start Local Server

**Using Python 3:**
```bash
python -m http.server 8000
```

**Using Node.js:**
```bash
npx http-server
```

**Using VS Code:**
- Install "Live Server" extension
- Right-click `index.html` → "Open with Live Server"

Then open: **http://localhost:8000**

---

## 🗺️ 2. Project Structure (5 minutes)

```
components/
├── index.html                    ← Home page (start here)
├── supabaseClient.js             ← Backend config (update credentials here)
├── auth-guard.js                 ← Authentication logic
│
├── index-page/                   ← Public home page
├── auth-page/                    ← Login/registration
├── county-pages/                 ← County detail pages
├── dashboard-page/               ← User dashboard (protected)
├── contribute-page/              ← Content submission (protected)
├── superadmin/                   ← Admin panel (protected)
│
├── shared/js/                    ← Shared utilities
│   ├── route-guard.js            ← Route protection
│   ├── visibility.js             ← Content visibility
│   └── role-manager.js           ← Role checking
│
├── DOCs/                         ← Full documentation
└── FRONTEND_DEVELOPER_GUIDE.md   ← This guide's parent
```

---

## 👤 3. Test the Flows (5 minutes)

### Test 1: Browse as Visitor

1. Open http://localhost:8000
2. Explore the home page
3. Click on a county (e.g., Bong)
4. See public content

### Test 2: Register New User

1. Click "Contribute" or "Join" button
2. Go through registration:
   - **Step 1**: Select county, choose "Contributor"
   - **Step 2**: Select contributor type (e.g., Individual/Journalist)
   - **Step 3**: Enter name & email
   - **Step 4**: Set password, accept terms
3. Account is created and you're logged in

### Test 3: Submit Content

1. Go to Dashboard (auto-redirected after signup)
2. Click "Submit New Content"
3. Fill form:
   - Type: Tourism Attraction
   - Title: "Test Lake"
   - Description: "A beautiful lake..."
   - Visibility: "Public"
4. Click "Submit for Review"

### Test 4: Approve in Admin (Requires test data setup)

1. Log in as super_admin user (setup in database)
2. Navigate to Admin Dashboard
3. See submissions queue
4. Approve the content

---

## 🔌 4. Key Files to Understand (10 minutes)

### Backend Integration (`supabaseClient.js`)
```javascript
// This initializes the connection to Supabase
// Used by: All pages
// Contains: Supabase URL and API key

// You'll reference it like:
const { data, error } = await supabaseClient
  .from('counties')
  .select('*');
```

### Authentication Guard (`auth-guard.js`)
```javascript
// This protects pages and checks user roles
// Used by: Protected pages (dashboard, admin, etc.)
// Contains: AuthGuard class with methods like:
// - checkAuth() → Is user logged in?
// - checkRole() → Does user have required role?
// - protectPage() → Redirect if not authorized

// Usage in a protected page:
const authGuard = new AuthGuard(window.supabaseClient);
await authGuard.init();
const result = await authGuard.protectPage({
  requiredAuth: true,
  requiredRoles: ['contributor']
});
```

### Route Configuration (`shared/js/route-config.js`)
```javascript
// Defines all routes and their requirements
// Used by: Route guard and navigation
// Contains: All routes with metadata (title, role requirements, etc.)

// Example:
export const ROUTE_CONFIG = {
  DASHBOARD: {
    path: '/dashboard',
    requiresAuth: true,
    minRole: 'contributor'
  }
}
```

### Visibility Control (`shared/js/visibility.js`)
```javascript
// Controls what content each user can see
// Used by: All content displays
// Contains: Functions to filter content based on visibility level

// Visibility levels:
// - public: Everyone sees it
// - authenticated_only: Only logged-in users
// - county_only: Only county members
// - admin_only: Only admins
// - private: Only author + admin
```

---

## 🏗️ 5. Common Development Tasks

### Task 1: Add a New Page

1. **Create folder:**
   ```
   new-feature-page/
   ├── index.html
   ├── css/
   │   └── styles.css
   └── js/
       └── app.js
   ```

2. **Create `index.html`:**
   ```html
   <!DOCTYPE html>
   <html>
   <head>
     <title>New Feature</title>
     <link rel="stylesheet" href="css/styles.css">
   </head>
   <body>
     <div id="app">Loading...</div>
     
     <script src="../supabaseClient.js"></script>
     <script src="./js/app.js"></script>
   </body>
   </html>
   ```

3. **Create `js/app.js`:**
   ```javascript
   async function init() {
     console.log('Page initialized');
     // Your code here
   }

   document.addEventListener('DOMContentLoaded', init);
   ```

### Task 2: Add a Form Field

1. **HTML** (`index.html`):
   ```html
   <input type="text" id="new-field" placeholder="Enter value">
   ```

2. **Validation** (`js/validation.js`):
   ```javascript
   function validateNewField(value) {
     if (!value || value.length < 3) {
       return { error: 'Field required (min 3 chars)' };
     }
     return { valid: true };
   }
   ```

3. **Processing** (`js/app.js`):
   ```javascript
   const input = document.getElementById('new-field');
   const validation = validateNewField(input.value);
   if (!validation.valid) {
     showError(validation.error);
     return;
   }
   // Process field
   ```

### Task 3: Fetch Data from Backend

```javascript
// Step 1: Import Supabase client
// (Already loaded as window.supabaseClient)

// Step 2: Write query
const { data, error } = await window.supabaseClient
  .from('counties')
  .select('*')
  .order('name');

// Step 3: Check for errors
if (error) {
  console.error('Error:', error);
  return;
}

// Step 4: Process data
console.log('Counties:', data);
data.forEach(county => {
  console.log(county.name);
});
```

### Task 4: Protect a Page (Require Login)

Add this to the `<head>` of your protected page:

```html
<!-- 1. Load Supabase -->
<script src="../supabaseClient.js"></script>

<!-- 2. Load Auth Guard -->
<script src="../auth-guard.js"></script>

<!-- 3. Load Protection FIRST (before other JS) -->
<script src="./js/page-protection.js"></script>

<!-- 4. Then load your app -->
<script src="./js/app.js"></script>
```

Create `js/page-protection.js`:

```javascript
(async function() {
  // Wait for Supabase to load
  while (!window.supabaseClient) {
    await new Promise(r => setTimeout(r, 100));
  }

  // Initialize auth guard
  const authGuard = new AuthGuard(window.supabaseClient);
  await authGuard.init();

  // Protect page
  const result = await authGuard.protectPage({
    requiredAuth: true,                    // Must be logged in
    requiredRoles: ['contributor'],        // Must be contributor or higher
    redirectTo: '../auth-page/auth.html'  // Redirect here if not authorized
  });

  if (!result.allowed) return;  // Stop if not authorized

  // Page is protected - safe to initialize
  window.authProtectionComplete = true;
  if (typeof init === 'function') {
    await init();
  }
})();
```

### Task 5: Create an Admin-Only Page

```javascript
// In page-protection.js:
const result = await authGuard.protectPage({
  requiredAuth: true,
  requiredRoles: ['super_admin', 'county_admin'],  // Only admins
  redirectTo: '../auth-page/auth.html'
});
```

---

## 🐛 6. Debugging Tips

### Issue: Page loads blank
**Solution**: 
- Open browser console (F12)
- Look for red errors
- Check that supabaseClient.js is loaded
- Verify credentials are correct

### Issue: "Unauthorized" error
**Solution**:
- User is not logged in
- Redirect to login page is working correctly
- Check user's role in database

### Issue: Content not appearing
**Solution**:
```javascript
// Open console and test:
const { data } = await window.supabaseClient
  .from('content')
  .select('*')
  .limit(1);
console.log(data);
```

### Issue: Form submission fails silently
**Solution**:
```javascript
// Add error logging:
const { data, error } = await supabaseClient
  .from('content')
  .insert([formData]);

if (error) {
  console.error('Submission error:', error);
  console.error('Error code:', error.code);
  console.error('Error message:', error.message);
}
```

---

## 📚 7. Documentation Files

| File | Purpose |
|------|---------|
| **FRONTEND_DEVELOPER_GUIDE.md** | Complete guide (100+ pages) |
| **API_REFERENCE.md** | API endpoints & code examples |
| **PROJECT_STRUCTURE.md** | Detailed folder structure |
| **QUICK_START.md** | Setup instructions |
| **SHARED_RESOURCES.md** | Utility functions documentation |

**Location**: All files in `/DOCs/` folder

---

## 🎯 8. Next Steps

### For First Developers:
1. ✅ Complete all 5 test flows above
2. ✅ Read **FRONTEND_DEVELOPER_GUIDE.md** (comprehensive)
3. ✅ Try modifying a page (change text, colors, etc.)
4. ✅ Test a complete flow end-to-end

### For Building New Features:
1. Read the feature requirements
2. Check **API_REFERENCE.md** for backend endpoints
3. Copy an existing similar page as template
4. Implement following the patterns used in current pages
5. Test with all permission levels (visitor, contributor, admin)

### For Scaling the Project:
1. Consider a framework (React, Vue, Svelte) later if needed
2. Add automated testing
3. Set up CI/CD pipeline
4. Implement performance monitoring
5. Add multi-language support

---

## 💡 9. Code Examples

### Example 1: Display a List of Counties

```javascript
async function loadCounties() {
  // Fetch
  const { data, error } = await window.supabaseClient
    .from('counties')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error:', error);
    return;
  }

  // Render
  const html = data.map(county => `
    <div class="county-card">
      <h2>${county.name}</h2>
      <p>${county.description}</p>
      <a href="../county-pages/${county.slug}.html">Learn More</a>
    </div>
  `).join('');

  document.getElementById('counties-container').innerHTML = html;
}

// Call on page load
document.addEventListener('DOMContentLoaded', loadCounties);
```

### Example 2: Handle Form Submission

```javascript
const form = document.getElementById('contact-form');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  // Get form data
  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const message = document.getElementById('message').value;

  // Validate
  if (!name || !email || !message) {
    alert('Please fill all fields');
    return;
  }

  // Show loading
  form.disabled = true;
  showSpinner(true);

  // Submit
  const { data, error } = await window.supabaseClient
    .from('messages')
    .insert([{ name, email, message }]);

  // Hide loading
  showSpinner(false);
  form.disabled = false;

  // Handle response
  if (error) {
    alert('Error: ' + error.message);
    return;
  }

  alert('Message sent!');
  form.reset();
});
```

### Example 3: Check User Authentication

```javascript
async function checkAuth() {
  const { data: { user } } = await window.supabaseClient.auth.getUser();
  
  if (user) {
    console.log('User logged in:', user.email);
    
    // Get user profile
    const { data: profile } = await window.supabaseClient
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
    
    console.log('User role:', profile.role);
    console.log('County:', profile.county_id);
  } else {
    console.log('Not logged in');
  }
}

// Call it
checkAuth();
```

---

## ✅ 10. Verification Checklist

Before considering the frontend "complete", verify:

- [ ] Home page displays 15 counties
- [ ] User can register with 4-step form
- [ ] User can login with credentials
- [ ] Dashboard loads for authenticated users
- [ ] Contributor can submit content
- [ ] Content appears in database
- [ ] Admin can see submissions
- [ ] Admin can approve/reject
- [ ] Approved content appears publicly
- [ ] Visibility filtering works
- [ ] Mobile responsive design works
- [ ] All links work
- [ ] No console errors
- [ ] Forms have proper validation
- [ ] Error messages are helpful

---

## 🆘 Getting Help

### Questions About:
- **Architecture/Design** → Read `FRONTEND_DEVELOPER_GUIDE.md`
- **API Endpoints** → Check `API_REFERENCE.md`
- **Specific Features** → See `DOCs/[FEATURE_NAME].md`
- **Code Patterns** → Look at similar implemented feature

### Common Issues:
- See **Debugging Tips** section above (Section 6)
- Check browser console for error messages
- Verify Supabase credentials are correct
- Make sure page protection is working

---

## 📞 Contact & Support

For issues not covered here:
1. Check the `/DOCs/` folder for feature-specific documentation
2. Search existing code for similar implementations
3. Review the API Reference for database queries
4. Check browser console for error messages

---

**Last Updated**: May 2026  
**Target Audience**: Frontend Developers (all experience levels)  
**Time to Get Running**: ~30 minutes
