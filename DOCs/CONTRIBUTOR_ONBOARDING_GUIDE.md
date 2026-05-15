# Contributor Type & Onboarding System - Implementation Guide

## ✅ What Has Been Implemented

### 1. Database Schema (Migration: `20250513000001_add_contributor_fields.sql`)

Added new ENUM types and fields to support the contributor classification system:

**New Enum Types:**
- `contributor_kind` - 12 types of contributors (individual, organization, ngo, university, etc.)
- `individual_category` - 15 categories for individual contributors
- `profile_visibility` - public, contributors_only, private

**New User Table Columns:**
```sql
- contributor_kind (enum)           -- Type of contributor
- individual_category (enum)        -- For individuals only
- organization_name (text)          -- For organizations/institutions
- organization_description (text)   -- Organization/institution description
- institution_type (text)           -- Type of institution
- website_url (text)                -- Organization website
- logo_url (text)                   -- Organization logo
- profile_visibility (enum)         -- Profile visibility setting
```

### 2. Frontend - Enhanced Signup Flow

**New 4-Step Registration Process:**

1. **Step 1: Platform Role Selection**
   - Choose: Contributor or County Admin
   - Select County

2. **Step 2: Contributor Type Classification** ✨ NEW
   - Dropdown with 12 contributor types
   - **Conditional Field A:** If "Individual" → Show individual category dropdown (15 options)
   - **Conditional Field B:** If NOT "Individual" → Show organization fields:
     - Organization Name (required)
     - Institution Type (required)
     - Organization Description (optional)
     - Website URL (optional)

3. **Step 3: Personal Information**
   - Full Name
   - Email Address
   - Bio (optional)

4. **Step 4: Security**
   - Password (with strength meter)
   - Confirm Password
   - Terms Agreement
   - Submit

### 3. Validation Logic

**Step 2 Validation:**
- ✓ Contributor type is required
- ✓ If Individual: individual_category is required
- ✓ If Organization: organization_name and institution_type are required

**Data Integrity:**
- Organization fields are automatically cleared if user switches from organization to individual
- Individual category is cleared if user switches from individual to organization
- All form errors are properly displayed and cleared

## 🚀 Deployment Steps

### Step 1: Apply Database Migration

Run this SQL in your Supabase SQL Editor:
1. Go to Supabase Dashboard → SQL Editor
2. Create New Query
3. Copy and paste contents of `supabase/migrations/20250513000001_add_contributor_fields.sql`
4. Click "Run"

✓ The migration will:
- Create 3 new enum types
- Add 8 new columns to users table
- Create 3 indexes for optimal query performance

### Step 2: Deploy Updated Frontend

Replace your current `auth-page/index.html` with the updated version. No changes needed to any other files.

### Step 3: Test the Flow

See "Testing Checklist" below.

## 🧪 Testing Checklist

### Test Case 1: Individual Contributor Signup
1. Click "Create Account"
2. Step 1: Select "Contributor" role and a county → Click Continue
3. Step 2: 
   - Select "Individual" from dropdown
   - Verify that "What's Your Background?" dropdown appears
   - Select any category (e.g., "Student")
   - Verify organization fields DON'T appear
   - Click Continue
4. Step 3: Fill in name, email, bio → Click Continue
5. Step 4: Set password and accept terms → Click Create Account
6. ✓ Verify user record in Supabase includes:
   - `contributor_kind: 'individual'`
   - `individual_category: 'student'`
   - `organization_name: null`
   - `organization_description: null`

**SQL to Check:**
```sql
select id, email, contributor_kind, individual_category, organization_name 
from users 
where email = 'test.individual@example.com';
```

### Test Case 2: Organization Contributor Signup
1. Click "Create Account"
2. Step 1: Select "Contributor" role and a county → Click Continue
3. Step 2:
   - Select "NGO" from dropdown
   - Verify that individual category field does NOT appear
   - Verify organization fields appear with all 4 fields:
     - Organization Name (required)
     - Institution Type (required)
     - Organization Description (optional)
     - Website URL (optional)
   - Fill in organization name and institution type
   - Fill in description and website (optional)
   - Click Continue
4. Step 3: Fill in name, email, bio → Click Continue
5. Step 4: Set password and accept terms → Click Create Account
6. ✓ Verify user record in Supabase includes:
   - `contributor_kind: 'ngo'`
   - `individual_category: null`
   - `organization_name: [your org name]`
   - `institution_type: [type]`
   - `organization_description: [description]`
   - `website_url: [url]`

**SQL to Check:**
```sql
select id, email, contributor_kind, organization_name, institution_type 
from users 
where email = 'test.org@example.com';
```

### Test Case 3: Form Navigation & Validation
1. Click "Create Account"
2. Step 1: Try to continue without selecting county → Should show error
3. Fill county and continue to Step 2
4. Step 2: Try to continue without selecting contributor type → Should show error
5. Select Individual type
6. Try to continue without selecting individual category → Should show error
7. Select category and continue
8. Step 3: Try to continue without name → Should show error
9. Fill in name and continue
10. Step 4: Try to submit with password < 8 chars → Should show error
11. Try to submit without accepting terms → Should show error
12. Complete signup successfully

### Test Case 4: Switching Between Contributor Types
1. Step 2: Select "Individual"
2. Select an individual category
3. Change dropdown to "Organization"
4. ✓ Verify:
   - Individual category field disappears AND clears
   - Organization fields appear
   - Individual category value is reset
5. Fill organization fields
6. Change dropdown back to "Individual"
7. ✓ Verify:
   - Organization fields disappear AND clear
   - Individual category field reappears
   - Organization field values are reset

### Test Case 5: University Signup
1. Step 2: Select "University"
2. ✓ Verify organization fields appear (not individual category)
3. Fill in:
   - Organization Name: "University of Monrovia"
   - Institution Type: "University"
   - Description: "Leading institution..."
   - Website: "https://www.unm.edu.lr"
4. Continue and complete signup
5. ✓ Verify data saved correctly

### Test Case 6: All 12 Contributor Types
Test that all contributor types work and show/hide fields correctly:
- Individual → Shows individual category
- Organization → Shows org fields
- NGO → Shows org fields
- University → Shows org fields
- Vocational Training Center → Shows org fields
- High School → Shows org fields
- Media Institution → Shows org fields
- Government Institution → Shows org fields
- Healthcare Institution → Shows org fields
- Community Group → Shows org fields
- Business → Shows org fields
- Other → Shows org fields

## 📊 Data Collection Summary

### For Individual Contributors:
```json
{
  "contributor_kind": "individual",
  "individual_category": "journalist",
  "organization_name": null,
  "organization_description": null,
  "institution_type": null,
  "website_url": null,
  "logo_url": null,
  "profile_visibility": "public"
}
```

### For Organization Contributors:
```json
{
  "contributor_kind": "ngo",
  "individual_category": null,
  "organization_name": "Community Development Agency",
  "organization_description": "Working to improve communities...",
  "institution_type": "NGO",
  "website_url": "https://cda.lr",
  "logo_url": null,
  "profile_visibility": "public"
}
```

## 🔗 API Integration Points

### Creating/Updating User Profile:
```javascript
// After signup, the system now captures:
await sb.from('users').upsert({
  id: user.id,
  email: email,
  full_name: name,
  bio: bio,
  role: selectedRole,
  county_id: selectedCounty,
  contributor_kind: selectedContributorKind,      // NEW
  individual_category: selectedIndividualCategory, // NEW (if individual)
  organization_name: orgName,                      // NEW (if org)
  organization_description: orgDesc,               // NEW (if org)
  institution_type: instType,                      // NEW (if org)
  website_url: websiteUrl,                         // NEW (if org)
  profile_visibility: 'public'                     // NEW
});
```

## 💡 Key Features

✓ **Responsive Design:** Works perfectly on mobile, tablet, and desktop
✓ **Conditional Rendering:** Smart show/hide based on selection
✓ **Form Validation:** All required fields validated before moving to next step
✓ **Data Integrity:** Fields automatically cleared when no longer relevant
✓ **User Feedback:** Clear error messages and visual feedback
✓ **Accessibility:** Proper labels, error states, and keyboard navigation
✓ **Database Optimization:** Indexes added for efficient queries

## 🔐 Security Notes

- Platform role (`super_admin`, `county_admin`, `contributor`) is SEPARATE from contributor type
- Contributor type is self-reported and can be updated later in user profile
- `profile_visibility` setting allows users to control profile privacy
- All data is validated on both frontend and backend (via Supabase)

## 🎯 Next Steps (Future Enhancement)

1. **Admin Dashboard:** Display contributor type in user management
2. **Profile Page:** Allow users to edit contributor type and organization details
3. **Discovery:** Filter contributors by type (find all journalists, universities, etc.)
4. **Analytics:** Track contributor types for platform insights
5. **Logo Upload:** Add file upload for organization logos
6. **Verification:** Implement organization verification process

## 📞 Support

If issues occur:
1. Check browser console for errors (F12)
2. Verify database migration was applied successfully
3. Check Supabase logs for API errors
4. Ensure auth credentials in HTML are correct

---

**Status:** ✅ Complete - Ready for Testing & Deployment  
**Last Updated:** May 13, 2026  
**Version:** 1.0
