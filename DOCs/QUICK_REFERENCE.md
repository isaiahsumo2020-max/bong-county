# Quick Reference - Contributor Type System

## 🎯 At a Glance

**What Changed?**
- Added Step 2 to signup: "What type of contributor are you?"
- Conditional fields based on contributor type
- 4-step signup flow (was 3)

**Why?**
- Better user categorization
- Organization vs individual support
- Improved personalization

**What's Collected?**
- `contributor_kind` - Type of contributor (12 options)
- `individual_category` - Category if individual (15 options)
- Organization details if not individual

---

## 🗂️ Database Schema at a Glance

```
USERS TABLE
├── id (uuid, PK)
├── email (text)
├── role (enum: super_admin | county_admin | contributor)
├── contributor_kind ⭐ NEW
│   ├─ individual
│   ├─ organization
│   ├─ ngo
│   ├─ university
│   ├─ vocational_training_center
│   ├─ high_school
│   ├─ media_institution
│   ├─ government_institution
│   ├─ healthcare_institution
│   ├─ community_group
│   ├─ business
│   └─ other
├── individual_category ⭐ NEW (if individual)
│   ├─ student
│   ├─ journalist
│   ├─ writer
│   ├─ teacher
│   ├─ doctor
│   ├─ researcher
│   ├─ software_developer
│   ├─ youth_advocate
│   ├─ photographer
│   ├─ designer
│   ├─ entrepreneur
│   ├─ volunteer
│   ├─ activist
│   ├─ farmer
│   └─ content_creator
├── organization_name ⭐ NEW (if not individual)
├── organization_description ⭐ NEW
├── institution_type ⭐ NEW
├── website_url ⭐ NEW
├── logo_url ⭐ NEW
├── profile_visibility ⭐ NEW (public | contributors_only | private)
└── ... (other existing fields)
```

---

## 📝 Form Flow at a Glance

```
START SIGNUP
    ↓
┌─────────────────────────────────────┐
│ STEP 1: ROLE SELECTION              │
│ - Choose: Contributor / County Admin │
│ - Select County                      │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ STEP 2: CONTRIBUTOR TYPE ⭐ NEW    │
│                                     │
│ Select Type from Dropdown (12 opts) │
│    ↓                                │
│ IF INDIVIDUAL:                      │
│   → Show Category dropdown (15 opt) │
│   → Hide Organization fields        │
│                                     │
│ IF NOT INDIVIDUAL:                  │
│   → Hide Category dropdown          │
│   → Show Organization fields:       │
│     • Organization Name (required)  │
│     • Institution Type (required)   │
│     • Description (optional)        │
│     • Website URL (optional)        │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ STEP 3: PERSONAL DETAILS            │
│ - Full Name                         │
│ - Email Address                     │
│ - Bio (optional)                    │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ STEP 4: PASSWORD & TERMS            │
│ - Password (8+ chars)               │
│ - Confirm Password                  │
│ - Accept Terms Checkbox             │
│ [CREATE ACCOUNT BUTTON]             │
└─────────────────────────────────────┘
    ↓
USER CREATED ✓
    ↓
DATABASE RECORD with all contributor info
```

---

## 🔧 Implementation Checklist

- [ ] Run database migration: `20250513000001_add_contributor_fields.sql`
- [ ] Deploy updated `auth-page/index.html`
- [ ] Test individual contributor signup
- [ ] Test organization contributor signup
- [ ] Test conditional field showing/hiding
- [ ] Test validation (missing required fields)
- [ ] Verify database records
- [ ] Test all 12 contributor types
- [ ] Test switching between types
- [ ] Test mobile responsiveness

---

## 🧪 Quick Test Queries

```sql
-- Find all individuals
SELECT id, email, contributor_kind, individual_category 
FROM users 
WHERE contributor_kind = 'individual';

-- Find all organizations
SELECT id, email, organization_name, institution_type, website_url 
FROM users 
WHERE contributor_kind IN ('organization', 'ngo', 'university', ...);

-- Find journalists
SELECT id, email, full_name 
FROM users 
WHERE contributor_kind = 'individual' AND individual_category = 'journalist';

-- Count by type
SELECT contributor_kind, COUNT(*) 
FROM users 
GROUP BY contributor_kind;

-- Public profiles only
SELECT id, email, contributor_kind, full_name 
FROM users 
WHERE profile_visibility = 'public';
```

---

## 📱 UI Components Summary

### New Dropdown
```html
<select id="reg-contributor-kind" onchange="onContributorKindChange()">
  <!-- 12 options -->
</select>
```

### Conditional Section 1 (Individual Category)
```html
<div id="individual-category-group" style="display:none">
  <select id="reg-individual-category">
    <!-- 15 options -->
  </select>
</div>
```

### Conditional Section 2 (Organization)
```html
<div id="organization-fields-group" style="display:none">
  <input id="reg-organization-name"> 
  <input id="reg-institution-type">
  <textarea id="reg-organization-description">
  <input id="reg-website-url">
</div>
```

---

## 🔐 Key Security Points

✓ Contributor type is separate from platform role
✓ All fields validated on frontend AND backend
✓ Profile visibility controls data exposure
✓ Organization verification can be added later

---

## 💾 Data Saved (Examples)

### Individual Case
```json
{
  "id": "uuid-123",
  "email": "jane@example.com",
  "full_name": "Jane Smith",
  "role": "contributor",
  "contributor_kind": "individual",
  "individual_category": "journalist",
  "organization_name": null,
  "organization_description": null,
  "institution_type": null,
  "website_url": null,
  "profile_visibility": "public"
}
```

### Organization Case
```json
{
  "id": "uuid-456",
  "email": "info@ngo.org",
  "full_name": "Organization Contact",
  "role": "contributor",
  "contributor_kind": "ngo",
  "individual_category": null,
  "organization_name": "Community Action NGO",
  "organization_description": "Empowering communities in Liberia",
  "institution_type": "NGO",
  "website_url": "https://ngo.example.com",
  "profile_visibility": "public"
}
```

---

## 🚀 Deployment Command

1. Apply database migration:
   ```
   Supabase Dashboard → SQL Editor → Run migration file
   ```

2. Deploy frontend:
   ```
   Replace auth-page/index.html with updated version
   ```

3. Test:
   ```
   Go to /auth-page/index.html
   Click "Create Account"
   Complete signup flow
   ```

---

## 📚 Documentation Files

- `CONTRIBUTOR_ONBOARDING_GUIDE.md` - Complete implementation guide
- `TECHNICAL_CHANGES.md` - Detailed technical documentation
- This file - Quick reference

---

**Version:** 1.0  
**Status:** ✅ Ready for Deployment  
**Last Updated:** May 13, 2026
