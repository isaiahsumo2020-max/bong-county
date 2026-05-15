# 🔐 Authentication Page

## Overview
Login and sign-up page for users to create accounts and access the platform.

## Folder Structure
```
auth-page/
├── index.html           # Auth page
├── css/                 # Styles
│   ├── styles.css       # Global auth styles
│   ├── forms.css        # Form styling
│   ├── inputs.css       # Input field styles
│   ├── validation.css   # Validation messages
│   └── responsive.css   # Mobile styles
├── js/                  # Logic
│   ├── app.js           # Vue initialization
│   ├── auth-forms.js    # Login/signup forms
│   ├── auth-service.js  # Supabase auth
│   ├── validation.js    # Form validation
│   ├── email.js         # Email verification
│   └── utils.js         # Utilities
└── README.md            # This file
```

## Pages

### 1. Login Page
- Email input
- Password input
- Remember me checkbox
- Forgot password link
- Sign-up link
- Social login (optional)

### 2. Sign-Up Page
- Full name input
- Email input
- Password input
- Confirm password input
- Terms checkbox
- Login link

### 3. Forgot Password
- Email input
- Reset link sent message
- Return to login link

### 4. Email Verification
- Email sent message
- Resend link
- Verification code input (optional)

## Component Files

### app.js
```javascript
// Initialize Vue app
// Set up form states
// Handle form switching
// Route to dashboard on success
```

### auth-forms.js
```javascript
// Login form component
// Sign-up form component
// Forgot password form
// Form data binding
// Form submission
```

### auth-service.js
```javascript
// Supabase signup
// Supabase login
// Password reset
// Email verification
// Token management
```

### validation.js
```javascript
// Email validation
// Password strength checking
// Confirm password matching
// Form validation rules
// Error message generation
```

### email.js
```javascript
// Send verification email
// Resend verification
// Handle verification callback
// Confirm email address
```

## Styling

### styles.css
- Page layout
- Background
- Container sizing
- Typography
- Link styles

### forms.css
- Form container
- Field layout
- Label styling
- Form transitions

### inputs.css
- Input fields
- Placeholders
- Focus states
- Disabled states
- Error states

### validation.css
- Error messages
- Success messages
- Warning styles
- Helper text

### responsive.css
- Mobile form layout
- Smaller inputs
- Single column
- Full-width buttons

## How to Use

### View Page
```
Open: auth-page/index.html
```

### Modify Form
```
Edit: auth-page/js/auth-forms.js
```

### Adjust Validation
```
Edit: auth-page/js/validation.js
```

### Customize Styles
```
Edit: auth-page/css/forms.css
```

## Form Validation

### Email
```
- Required
- Valid email format
- Not already registered
```

### Password
```
- Required
- Minimum 8 characters
- At least 1 uppercase
- At least 1 lowercase
- At least 1 number
- At least 1 special character
```

### Confirm Password
```
- Required
- Must match password
- Real-time validation
```

### Full Name
```
- Required
- Minimum 2 characters
- Maximum 100 characters
```

## APIs Used

### Supabase Authentication
- `auth.signUp()` - Create account
- `auth.signInWithPassword()` - Login
- `auth.resetPasswordForEmail()` - Password reset
- `auth.onAuthStateChange()` - Auth state listener

### Database
- `users` table - Store user profile
- Triggers to auto-create user profile

## Features

✅ Email/password authentication
✅ Input validation
✅ Error messages
✅ Loading states
✅ Password strength indicator
✅ Terms and conditions
✅ Email verification
✅ Forgot password

## Testing

### Functionality
- [ ] Can sign up
- [ ] Can log in
- [ ] Can reset password
- [ ] Can verify email
- [ ] Validation works
- [ ] Error messages show

### Responsive
- [ ] Mobile layout
- [ ] Tablet layout
- [ ] Desktop layout

### Security
- [ ] HTTPS required
- [ ] No passwords in logs
- [ ] Rate limiting on attempts
- [ ] CSRF protection

## Common Issues

### Email verification not sending?
- Check email service configuration
- Verify email address
- Check spam folder

### Password reset not working?
- Verify email in database
- Check reset link expiration
- Clear browser cache

### Validation too strict?
- Adjust requirements in `validation.js`
- Update regex patterns
- Modify error messages

---

**Status**: 🔧 Ready for implementation
**Lines of Code**: ~1,044 original → Split across multiple files
**Modules**: 6 main components
**Security**: ✅ Supabase handles authentication
