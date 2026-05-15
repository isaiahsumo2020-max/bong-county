# Deployment & Implementation Guide

## Overview

This guide walks through deploying both upgrade phases:
1. **Contributor Type & Onboarding System**
2. **Contributor Profiles & Subscriptions System**

---

## Prerequisites

Before starting, ensure you have:
- [ ] Access to Supabase dashboard
- [ ] FTP/SSH access to your server
- [ ] Supabase API credentials
- [ ] Test user accounts for testing
- [ ] ~2 hours for complete deployment

---

## Phase 1: Contributor Type System Deployment

### Step 1: Database Setup (5 minutes)

1. **Login to Supabase Dashboard**
   - Go to: https://app.supabase.com
   - Select your project

2. **Run Migration 1**
   - Go to: SQL Editor → New Query
   - Copy contents of: `20250513000001_add_contributor_fields.sql`
   - Click: "Run"
   - **Expected Result:** ✅ No errors

3. **Verify Migration**
   ```sql
   -- In SQL editor, run:
   SELECT * FROM pg_type WHERE typname IN ('contributor_kind', 'individual_category', 'profile_visibility');
   ```
   Should show 3 rows.

### Step 2: Frontend Deployment (10 minutes)

1. **Backup Original File**
   ```bash
   cp auth-page/index.html auth-page/index.html.backup
   ```

2. **Deploy Updated Auth Page**
   - Replace: `auth-page/index.html`
   - With: Updated version from Phase 1

3. **Test in Browser**
   - Navigate to: `/auth-page/index.html`
   - Click: "Create Account"
   - Verify: 4-step flow with visual indicators
   - Verify: Step 2 shows contributor type dropdown
   - Verify: Conditional fields appear/disappear

### Step 3: Testing (20 minutes)

#### Test Case 1: Individual Signup
```
1. Create Account
2. Step 1: Select "Contributor" + County → Continue
3. Step 2: Select "Individual"
4. Verify: Category dropdown appears
5. Select: Any category
6. Verify: Organization fields hidden
7. Continue through Steps 3 & 4
8. Verify: Account created
```

#### Test Case 2: Organization Signup
```
1. Create Account
2. Step 1: Select "Contributor" + County → Continue
3. Step 2: Select "NGO"
4. Verify: Category dropdown hidden
5. Verify: Organization fields appear
6. Fill: All org fields
7. Continue through Steps 3 & 4
8. Verify: Account created with org data
```

#### Test Case 3: Form Validation
```
1. Try to skip required fields
2. Verify: Error messages appear
3. Try switching between types
4. Verify: Fields clear appropriately
```

### Step 4: Production Monitoring (ongoing)

```bash
# Monitor database for new users
SELECT count(*), contributor_kind 
FROM users 
WHERE created_at > now() - interval '1 day'
GROUP BY contributor_kind;
```

---

## Phase 2: Profiles & Subscriptions Deployment

### Step 1: Database Setup (5 minutes)

1. **Run Migration 2**
   - Go to: Supabase SQL Editor → New Query
   - Copy contents of: `20250513000002_add_profiles_subscriptions.sql`
   - Click: "Run"
   - **Expected Result:** ✅ No errors, 14 topics inserted

2. **Verify Migration**
   ```sql
   -- Verify topics created
   SELECT count(*), is_active FROM notification_topics GROUP BY is_active;
   -- Should return: 14, true
   
   -- Verify user_subscriptions table exists
   \d user_subscriptions
   
   -- Verify new columns in users
   \d users
   -- Should show: profile_image_url, last_login_at
   ```

### Step 2: Frontend Deployment (10 minutes)

1. **Deploy Profile Page**
   - Upload: `profile-page/index.html`
   - Verify: No errors in console

2. **Deploy Settings Page**
   - Upload: `settings-page/index.html`
   - Verify: No errors in console

3. **Update Navigation**
   Add to main page header/menu:
   ```html
   <!-- User Menu -->
   <button id="userMenu">👤 Account</button>
   <div id="userMenuDropdown">
     <a href="/profile-page/index.html?id={USER_ID}">👤 My Profile</a>
     <a href="/settings-page/index.html">⚙️ Settings</a>
     <a href="#" onclick="logout()">🚪 Logout</a>
   </div>
   ```

### Step 3: Testing (30 minutes)

#### Test Case 1: View Profile
```
1. Login with test account
2. Navigate to: /profile-page/index.html?id={your_id}
3. Verify: Profile info displays correctly
4. Verify: All fields populated
5. Verify: "Settings" button visible
6. Verify: Mobile layout works
```

#### Test Case 2: Settings - Profile Tab
```
1. Navigate to: /settings-page/index.html
2. Verify: Page loads without errors
3. Edit: Full name, bio
4. Upload: Avatar image
5. Click: Save Changes
6. Verify: Success message
7. Verify: Changes persist on reload
```

#### Test Case 3: Settings - Subscriptions Tab
```
1. Click: Subscriptions tab
2. Verify: 14 topics display with icons
3. Select: 3-5 topics
4. Verify: Selection highlights
5. Click: Save Subscriptions
6. Verify: Success message with count
7. Reload page
8. Verify: Selections persist
```

#### Test Case 4: Settings - Other Tabs
```
1. Notifications: Test preferences
2. Security: Test password change form
3. Verify: All buttons work
4. Verify: Mobile layout
```

#### Test Case 5: Organization Profile
```
1. Signup as NGO in Phase 1
2. View profile: /profile-page/index.html?id={org_user_id}
3. Verify: Organization section shows
4. Go to settings
5. Edit: All organization fields
6. Save: Changes
7. Reload profile page
8. Verify: All org info displays
```

### Step 4: Cross-Browser Testing (10 minutes)

Test in:
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (if available)
- [ ] Mobile Chrome
- [ ] Mobile Safari

---

## Complete Deployment Timeline

### Day 1: Early Deployment

```
09:00 - Phase 1 Migration (5 min)
09:05 - Phase 1 Frontend (10 min)
09:15 - Phase 1 Testing (30 min)
09:45 - PHASE 1 COMPLETE ✅

10:00 - Phase 2 Migration (5 min)
10:05 - Phase 2 Frontend (15 min)
10:20 - Phase 2 Basic Testing (20 min)
10:40 - Update Navigation (5 min)
10:45 - Phase 2 Full Testing (30 min)
11:15 - Cross-browser Testing (15 min)
11:30 - PHASE 2 COMPLETE ✅

11:30 - Production Monitoring Start
```

### Day 1-2: Monitoring Period

Monitor for:
- ✅ Users successfully creating accounts
- ✅ Profile pages loading correctly
- ✅ Settings updates working
- ✅ No database errors
- ✅ No JavaScript errors in console

---

## Rollback Procedure

If critical issues occur:

### Phase 1 Rollback (Contributor System)

```sql
-- Revert migration 1
ALTER TABLE users DROP COLUMN contributor_kind;
ALTER TABLE users DROP COLUMN individual_category;
ALTER TABLE users DROP COLUMN organization_name;
ALTER TABLE users DROP COLUMN organization_description;
ALTER TABLE users DROP COLUMN institution_type;
ALTER TABLE users DROP COLUMN website_url;
ALTER TABLE users DROP COLUMN logo_url;
ALTER TABLE users DROP COLUMN profile_visibility;

DROP TYPE contributor_kind;
DROP TYPE individual_category;
DROP TYPE profile_visibility;
```

**Frontend:** Replace `auth-page/index.html` with backup file

### Phase 2 Rollback (Profiles System)

```sql
-- Revert migration 2
DROP TABLE user_subscriptions;
DROP TABLE notification_topics;
ALTER TABLE users DROP COLUMN profile_image_url;
ALTER TABLE users DROP COLUMN last_login_at;
```

**Frontend:** Remove `profile-page/index.html` and `settings-page/index.html`

---

## Verification Checklist

### Database Verification

```bash
# 1. Check enums exist (Phase 1)
SELECT * FROM pg_enum WHERE enumtypid::regtype::text LIKE '%contributor%';

# 2. Check tables exist (Phase 2)
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE '%subscription%';

# 3. Check data seeded (Phase 2)
SELECT COUNT(*) FROM notification_topics;
-- Should return: 14

# 4. Check indexes
SELECT indexname FROM pg_indexes WHERE tablename = 'user_subscriptions';
-- Should have idx_user_subscriptions_user_id, idx_user_subscriptions_topic_id
```

### Frontend Verification

```javascript
// In browser console on each page
// 1. Auth page
console.log('Auth page loaded');
// Verify 4 step dots visible

// 2. Profile page
console.log('Profile loaded');
// Load: /profile-page/index.html?id=test-user-id
// Verify all sections display

// 3. Settings page
console.log('Settings loaded');
// Load: /settings-page/index.html
// Verify all tabs work
```

---

## Performance Baseline

After deployment, check:

```sql
-- User creation volume
SELECT DATE(created_at), COUNT(*) 
FROM users 
WHERE created_at > now() - interval '7 days'
GROUP BY DATE(created_at);

-- Subscription distribution
SELECT t.name, COUNT(s.id) as subscribers
FROM notification_topics t
LEFT JOIN user_subscriptions s ON t.id = s.topic_id
GROUP BY t.id, t.name
ORDER BY subscribers DESC;

-- Contributor type distribution
SELECT contributor_kind, COUNT(*) as count
FROM users
WHERE created_at > now() - interval '7 days'
GROUP BY contributor_kind;
```

---

## Support & Documentation Files

### For Quick Reference
- [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - Contributor types
- [PROFILES_SUBSCRIPTIONS_QUICK_REFERENCE.md](PROFILES_SUBSCRIPTIONS_QUICK_REFERENCE.md) - Profile system

### For Complete Details
- [CONTRIBUTOR_ONBOARDING_GUIDE.md](CONTRIBUTOR_ONBOARDING_GUIDE.md) - Full contributor guide
- [PROFILES_SUBSCRIPTIONS_GUIDE.md](PROFILES_SUBSCRIPTIONS_GUIDE.md) - Full profile guide
- [TECHNICAL_CHANGES.md](TECHNICAL_CHANGES.md) - Technical details

### For System Overview
- [SYSTEM_UPGRADE_COMPLETE.md](SYSTEM_UPGRADE_COMPLETE.md) - Complete overview

---

## Common Issues & Solutions

### Issue: Migration fails with "type already exists"
**Solution:** Types already existed from partial deployment. Drop and retry:
```sql
DROP TYPE IF EXISTS contributor_kind CASCADE;
DROP TYPE IF EXISTS individual_category CASCADE;
```

### Issue: Profile page shows "Unable to load profile"
**Solution:** 
1. Check URL has `?id=` parameter
2. Verify user ID exists
3. Check browser console for auth errors

### Issue: Subscriptions not saving
**Solution:**
1. Verify user is authenticated
2. Check notification_topics table has data
3. Verify user_subscriptions table exists

### Issue: Avatar upload fails
**Solution:**
1. File must be < 5MB
2. File must be image type (JPG, PNG, GIF)
3. Check browser has file input permission

---

## Post-Deployment Tasks

### Immediate (Day 1)
- [ ] Monitor error logs for 24 hours
- [ ] Get feedback from 5+ test users
- [ ] Verify database growth normal
- [ ] Document any issues

### Week 1
- [ ] Get user feedback on UX
- [ ] Monitor performance metrics
- [ ] Fix any reported bugs
- [ ] Update documentation if needed

### Week 2
- [ ] Plan Phase 3 features
- [ ] Begin personalization features
- [ ] Add feed integration
- [ ] Implement notifications

---

## Contact & Support

For deployment help:
1. Review relevant guide
2. Check troubleshooting section
3. Review browser console errors
4. Check Supabase logs
5. Review migration logs

---

## Deployment Sign-Off

Use this checklist to confirm successful deployment:

```
PHASE 1 DEPLOYMENT
- [ ] Migration 1 completed without errors
- [ ] Auth page updated and tested
- [ ] Individual signup works
- [ ] Organization signup works
- [ ] Form validation works

PHASE 2 DEPLOYMENT
- [ ] Migration 2 completed without errors
- [ ] Profile page deployed and tested
- [ ] Settings page deployed and tested
- [ ] Navigation links added
- [ ] All 14 topics seeded
- [ ] Subscriptions save/load correctly

TESTING COMPLETE
- [ ] Desktop browsers tested
- [ ] Mobile browsers tested
- [ ] All core features working
- [ ] Error handling confirmed

MONITORING STARTED
- [ ] Error logs monitored
- [ ] User feedback collected
- [ ] Performance monitored
- [ ] No critical issues
```

---

**Estimated Total Deployment Time:** 2-3 hours  
**Recommended Deployment Window:** Off-peak time  
**Rollback Time:** 30 minutes if needed  
**Status:** Ready for Deployment  
**Last Updated:** May 13, 2026

---

## Quick Start Summary

```bash
# 1. Deploy migrations (Supabase SQL Editor)
# 2. Deploy HTML files (server upload)
# 3. Update navigation (one file edit)
# 4. Test signup flow (browser test)
# 5. Test profile & settings (browser test)
# 6. Monitor first 24 hours
```

**Total effort:** 2-3 hours  
**Total features added:** 50+  
**User experience improvement:** Significant  
**Status:** ✅ READY

---

END OF DEPLOYMENT GUIDE
