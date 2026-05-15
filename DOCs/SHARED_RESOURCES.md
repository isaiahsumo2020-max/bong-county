# 🔧 Shared Resources Guide

## Overview

The `/shared/` folder contains resources used across all pages. This prevents code duplication and ensures consistency.

## Folder Structure

```
shared/
├── css/                    # Global styles
│   ├── reset.css          # CSS reset
│   ├── fonts.css          # Font imports
│   ├── variables.css      # CSS custom properties
│   └── tailwind.config.js # Tailwind configuration
├── js/                    # Shared utilities
│   ├── supabase.js        # Supabase client initialization
│   ├── auth.js            # Authentication utilities
│   ├── api.js             # API client wrapper
│   ├── helpers.js         # Common helper functions
│   ├── validation.js      # Form validation utilities
│   ├── notifications.js   # Toast notifications
│   └── storage.js         # Local storage utilities
└── images/                # Shared assets
    ├── logo.svg
    ├── icons/
    └── patterns/
```

---

## CSS Files

### reset.css
Normalize browser defaults and provide a clean slate.

```css
/* reset.css */

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  font-size: 16px;
  scroll-behavior: smooth;
}

body {
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

h1, h2, h3, h4, h5, h6 {
  margin: 0;
  padding: 0;
}

p {
  margin: 0;
}

a {
  color: inherit;
  text-decoration: none;
}

button {
  border: none;
  background: none;
  cursor: pointer;
  font-family: inherit;
}

input, textarea, select {
  font-family: inherit;
}

img {
  max-width: 100%;
  height: auto;
  display: block;
}

table {
  border-collapse: collapse;
  border-spacing: 0;
}
```

### fonts.css
Import and define font families.

```css
/* fonts.css */

@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;500;700&display=swap');

:root {
  --font-display: 'Playfair Display', serif;
  --font-body: 'DM Sans', sans-serif;
}

body {
  font-family: var(--font-body);
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-display);
  font-weight: 700;
}
```

### variables.css
Define CSS custom properties used across pages.

```css
/* variables.css */

:root {
  /* Colors */
  --color-primary: #C2410C;
  --color-primary-light: #EA580C;
  --color-primary-dark: #A03407;
  
  --color-secondary: #2D5016;
  --color-secondary-light: #4A7C2B;
  
  --color-accent: #D4A574;
  --color-accent-dark: #C2A476;
  
  --color-text: #1a1a1a;
  --color-text-light: #666;
  --color-text-muted: #999;
  
  --color-background: #FAFAF8;
  --color-background-light: #FFFFFF;
  --color-background-dark: #F5F5F5;
  
  --color-border: #EEEEEE;
  --color-border-dark: #DDDDDD;
  
  --color-success: #22C55E;
  --color-warning: #F59E0B;
  --color-error: #EF4444;
  --color-info: #3B82F6;
  
  /* Spacing */
  --space-xs: 0.25rem;
  --space-sm: 0.5rem;
  --space-md: 1rem;
  --space-lg: 1.5rem;
  --space-xl: 2rem;
  --space-2xl: 3rem;
  --space-3xl: 4rem;
  
  /* Typography */
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  --text-3xl: 1.875rem;
  --text-4xl: 2.25rem;
  --text-5xl: 3rem;
  
  --line-height-tight: 1.25;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.75;
  
  --letter-spacing-tight: -0.02em;
  --letter-spacing-normal: 0;
  --letter-spacing-wide: 0.05em;
  
  /* Border Radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 1rem;
  --radius-xl: 1.5rem;
  --radius-full: 9999px;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.1);
  
  /* Transitions */
  --transition-fast: 150ms ease-out;
  --transition-base: 250ms ease-out;
  --transition-slow: 350ms ease-out;
  
  /* Z-Index */
  --z-dropdown: 1000;
  --z-sticky: 1020;
  --z-fixed: 1030;
  --z-modal-backdrop: 1040;
  --z-modal: 1050;
  --z-popover: 1060;
  --z-tooltip: 1070;
}
```

### tailwind.config.js
Configure Tailwind CSS if used.

```javascript
// tailwind.config.js

module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#C2410C',
          light: '#EA580C',
          dark: '#A03407',
        },
        secondary: {
          DEFAULT: '#2D5016',
          light: '#4A7C2B',
        },
        accent: {
          DEFAULT: '#D4A574',
          dark: '#C2A476',
        },
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        body: ['DM Sans', 'sans-serif'],
      },
    },
  },
};
```

---

## JavaScript Files

### supabase.js
Initialize and export Supabase client.

```javascript
// supabase.js

// Initialize Supabase
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_KEY = 'your-public-key';

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Export for global use
window.supabase = supabase;
```

**Usage in other files**:
```javascript
// Any other file can use:
const { data, error } = await supabase
  .from('counties')
  .select('*');
```

### auth.js
Authentication utilities.

```javascript
// auth.js

const Auth = {
  /**
   * Check if user is authenticated
   * @returns {Promise<Object|null>} User object or null
   */
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },

  /**
   * Get user profile from database
   * @returns {Promise<Object>} User profile
   */
  async getUserProfile() {
    const user = await this.getCurrentUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Check if user has specific role
   * @param {string} role - Role to check
   * @returns {Promise<boolean>} Whether user has role
   */
  async hasRole(role) {
    const profile = await this.getUserProfile();
    return profile?.role === role;
  },

  /**
   * Logout user
   */
  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    window.location.href = '/index.html';
  },

  /**
   * Get auth state change listener
   * @param {Function} callback - Called when auth state changes
   * @returns {Function} Unsubscribe function
   */
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback);
  }
};

// Export for global use
window.Auth = Auth;
```

### api.js
API client wrapper.

```javascript
// api.js

const API = {
  /**
   * Fetch counties
   */
  async getCounties(filters = {}) {
    let query = supabase.from('counties').select('*');
    
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  /**
   * Fetch county by ID
   */
  async getCounty(countyId) {
    const { data, error } = await supabase
      .from('counties')
      .select('*')
      .eq('id', countyId)
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * Fetch content
   */
  async getContent(filters = {}) {
    let query = supabase
      .from('content')
      .select('*, counties(name), users(full_name)');
    
    if (filters.countyId) {
      query = query.eq('county_id', filters.countyId);
    }
    
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    
    if (filters.type) {
      query = query.eq('type', filters.type);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  /**
   * Create content
   */
  async createContent(content) {
    const { data, error } = await supabase
      .from('content')
      .insert([content])
      .select();
    
    if (error) throw error;
    return data[0];
  },

  /**
   * Update content
   */
  async updateContent(contentId, updates) {
    const { data, error } = await supabase
      .from('content')
      .update(updates)
      .eq('id', contentId)
      .select();
    
    if (error) throw error;
    return data[0];
  },

  /**
   * Delete content
   */
  async deleteContent(contentId) {
    const { error } = await supabase
      .from('content')
      .delete()
      .eq('id', contentId);
    
    if (error) throw error;
  }
};

window.API = API;
```

### helpers.js
Common helper functions.

```javascript
// helpers.js

const Helpers = {
  /**
   * Format date to readable string
   */
  formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  },

  /**
   * Format date and time
   */
  formatDateTime(date) {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  /**
   * Truncate text
   */
  truncate(text, length = 100) {
    return text.length > length ? text.slice(0, length) + '...' : text;
  },

  /**
   * Format number with comma separators
   */
  formatNumber(num) {
    return new Intl.NumberFormat().format(num);
  },

  /**
   * Show success toast
   */
  showSuccess(message) {
    // Implementation depends on notification library
    console.log('✓', message);
  },

  /**
   * Show error toast
   */
  showError(message) {
    // Implementation depends on notification library
    console.error('✗', message);
  },

  /**
   * Show confirmation dialog
   */
  async confirm(message) {
    return new Promise((resolve) => {
      const result = window.confirm(message);
      resolve(result);
    });
  },

  /**
   * Generate unique ID
   */
  generateId() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  },

  /**
   * Escape HTML special characters
   */
  escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  },

  /**
   * Debounce function
   */
  debounce(fn, delay) {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn(...args), delay);
    };
  },

  /**
   * Throttle function
   */
  throttle(fn, delay) {
    let lastCall = 0;
    return (...args) => {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        return fn(...args);
      }
    };
  }
};

window.Helpers = Helpers;
```

### validation.js
Form validation utilities.

```javascript
// validation.js

const Validation = {
  /**
   * Validate email format
   */
  isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  },

  /**
   * Validate password strength
   */
  isStrongPassword(password) {
    return (
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /\d/.test(password) &&
      /[!@#$%^&*]/.test(password)
    );
  },

  /**
   * Validate URL format
   */
  isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  },

  /**
   * Validate required field
   */
  isRequired(value) {
    return value !== null && value !== undefined && value.toString().trim() !== '';
  },

  /**
   * Validate minimum length
   */
  minLength(value, length) {
    return value.toString().trim().length >= length;
  },

  /**
   * Validate maximum length
   */
  maxLength(value, length) {
    return value.toString().trim().length <= length;
  },

  /**
   * Validate form object
   */
  validateForm(formData, rules) {
    const errors = {};
    
    for (const [field, value] of Object.entries(formData)) {
      const fieldRules = rules[field];
      if (!fieldRules) continue;
      
      for (const rule of fieldRules) {
        const isValid = rule.validator(value);
        if (!isValid) {
          errors[field] = rule.message;
          break;
        }
      }
    }
    
    return errors;
  }
};

window.Validation = Validation;
```

### notifications.js
Toast notification system.

```javascript
// notifications.js

const Notifications = {
  create(message, type = 'info', duration = 3000) {
    const container = document.getElementById('notification-container') 
      || this.createContainer();
    
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.textContent = message;
    
    container.appendChild(toast);
    
    if (duration) {
      setTimeout(() => toast.remove(), duration);
    }
    
    return toast;
  },

  createContainer() {
    const container = document.createElement('div');
    container.id = 'notification-container';
    container.className = 'notification-container';
    document.body.appendChild(container);
    return container;
  },

  success(message, duration) {
    return this.create(message, 'success', duration);
  },

  error(message, duration) {
    return this.create(message, 'error', duration);
  },

  warning(message, duration) {
    return this.create(message, 'warning', duration);
  },

  info(message, duration) {
    return this.create(message, 'info', duration);
  }
};

window.Notifications = Notifications;
```

### storage.js
Local storage utilities.

```javascript
// storage.js

const Storage = {
  /**
   * Set item in local storage
   */
  setItem(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },

  /**
   * Get item from local storage
   */
  getItem(key) {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  },

  /**
   * Remove item from local storage
   */
  removeItem(key) {
    localStorage.removeItem(key);
  },

  /**
   * Clear all items
   */
  clear() {
    localStorage.clear();
  },

  /**
   * Store user preferences
   */
  savePreferences(prefs) {
    this.setItem('userPreferences', prefs);
  },

  /**
   * Get user preferences
   */
  getPreferences() {
    return this.getItem('userPreferences') || {};
  },

  /**
   * Store form draft
   */
  saveDraft(formKey, data) {
    this.setItem(`draft_${formKey}`, data);
  },

  /**
   * Get form draft
   */
  getDraft(formKey) {
    return this.getItem(`draft_${formKey}`);
  },

  /**
   * Delete form draft
   */
  deleteDraft(formKey) {
    this.removeItem(`draft_${formKey}`);
  }
};

window.Storage = Storage;
```

---

## How to Use Shared Resources

### In HTML
```html
<!-- Load in correct order -->
<script src="/shared/js/supabase.js"></script>
<script src="/shared/js/auth.js"></script>
<script src="/shared/js/helpers.js"></script>
<script src="/shared/js/api.js"></script>
<script src="/shared/js/validation.js"></script>
<script src="./js/app.js"></script>
```

### In JavaScript
```javascript
// Use global objects
const user = await Auth.getCurrentUser();
const counties = await API.getCounties();
Helpers.showSuccess('Success!');
Validation.isValidEmail('test@example.com');
```

### In CSS
```css
/* Import in main CSS file */
@import url('/shared/css/reset.css');
@import url('/shared/css/fonts.css');
@import url('/shared/css/variables.css');

/* Use variables */
color: var(--color-primary);
padding: var(--space-md);
font-size: var(--text-base);
```

---

## Best Practices

✅ **Keep Shared Code Generic** - No page-specific logic
✅ **Use Consistent Naming** - Predictable function names
✅ **Add Documentation** - JSDoc comments
✅ **Handle Errors** - Always check for errors
✅ **Use Exports** - Make functions available globally
✅ **Test Thoroughly** - Verify all utilities work
✅ **Update Together** - Change all usages together
✅ **Version Control** - Track changes carefully

---

## Common Patterns

### Using API with Error Handling
```javascript
async function loadData() {
  try {
    const data = await API.getCounties();
    this.render(data);
  } catch (error) {
    Helpers.showError('Failed to load: ' + error.message);
  }
}
```

### Authentication Check
```javascript
async function init() {
  const user = await Auth.getCurrentUser();
  if (!user) {
    window.location.href = '/auth.html';
    return;
  }
  // Continue with page logic
}
```

### Form Validation
```javascript
const errors = Validation.validateForm(
  formData,
  {
    email: [
      {
        validator: (v) => Validation.isRequired(v),
        message: 'Email is required'
      },
      {
        validator: (v) => Validation.isValidEmail(v),
        message: 'Invalid email format'
      }
    ]
  }
);
```

---

## Troubleshooting

### Function not defined?
- Check script is loaded in HTML
- Verify function name is correct
- Check window object has function

### API calls failing?
- Check Supabase credentials
- Verify database connection
- Check RLS policies
- Check network tab

### Styles not applying?
- Check CSS is imported
- Verify variable syntax
- Check CSS specificity

---

## Summary

✨ Shared resources provide:
- Centralized API communication
- Consistent authentication
- Reusable utilities
- Global styling
- Better maintainability
- Easier debugging
- Code reuse

**Use these utilities across all pages for consistency and maintainability!**
