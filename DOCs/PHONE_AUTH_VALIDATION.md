# Phone Authentication - Validation & Testing Guide

## Pre-Deployment Checklist

### Code Implementation
- [ ] Phone field added to Step 3 auth form
- [ ] Phone validation function implemented
- [ ] OTP verification functions implemented
- [ ] Step 5 HTML UI created
- [ ] Step indicator updated to show 5 steps
- [ ] All JavaScript syntax valid (no console errors)
- [ ] State variables added (selectedPhone, phoneVerified, etc)
- [ ] handleRegister() updated to send OTP
- [ ] completeRegistration() function created

### Database
- [ ] Migration file created: `20250514000000_add_phone_auth.sql`
- [ ] Migration run in Supabase
- [ ] Columns added: `phone`, `phone_verified`
- [ ] Indexes created: `idx_users_phone`, `idx_users_phone_verified`

### Documentation
- [ ] PHONE_AUTH_GUIDE.md created
- [ ] PHONE_AUTH_QUICKSTART.md created
- [ ] PHONE_AUTH_IMPLEMENTATION.md created
- [ ] phone-utils.js utility file created
- [ ] This validation guide created

### Supabase Configuration
- [ ] Phone auth provider enabled
- [ ] SMS provider configured (Twilio for production)
- [ ] Phone auth enabled in provider settings

## Functional Testing

### Test Case 1: Phone Field Validation
```
Steps:
1. Open auth-page/auth.html
2. Click "Create Account"
3. Fill Steps 1-2 (role, county, contributor type)
4. Reach Step 3 and look for phone field

Expected:
- Phone field visible with label "Phone Number (Liberia)"
- Placeholder shows: "077-123-4567 or 088-123-4567"
- Helper text shows: "Valid formats: 077xxx xxxx, 088xxx xxxx, or 055xxx xxxx"
- Phone icon (📱) visible next to field
```

### Test Case 2: Phone Format Validation
```
Test inputs and expected outcomes:

Valid Formats (should all pass):
✓ 077-123-4567     → +231771234567
✓ 077 123 4567     → +231771234567
✓ 0771234567       → +231771234567
✓ 771234567        → +231771234567
✓ +231771234567    → +231771234567
✓ 231771234567     → +231771234567

Valid Prefixes (all should work):
✓ 077XXXXXXX (MTN)
✓ 088XXXXXXX (Lonestar Cell)
✓ 055XXXXXXX (Libtelco)

Invalid Formats (should all fail):
✗ 070-123-4567     → "Phone must start with 077, 088, or 055"
✗ 077-123-45       → "Phone number must be 9 digits"
✗ 077-123-456789   → "Phone number must be 9 digits"
✗ invalid          → "Phone number must contain only digits"
✗ (empty)          → "Phone number is required"
```

### Test Case 3: Step Progression
```
Steps:
1. Create Account → Step 1
2. Select county → Click Continue → Step 2
3. Select contributor type → Click Continue → Step 3
4. Fill name & email, enter phone (077-123-4567) → Click Continue → Step 4
5. Fill password & agree terms → Click "Create My Account" → Step 5

Expected:
- Step indicator shows progress (dots)
- Each step validates before advancing
- Step 5 shows OTP verification screen
- Phone displays as masked: +231***4567
```

### Test Case 4: OTP Verification (Development)
```
Steps:
1. Reach Step 5 after filling Steps 1-4
2. Check Supabase logs for OTP code
3. Enter OTP code in form
4. Click "Verify Phone Number"

Expected:
- OTP input field accepts 6 digits
- Error message if invalid code entered
- Account creation on valid code
- Email verification screen after success
```

### Test Case 5: OTP Resend
```
Steps:
1. Reach Step 5 after filling Steps 1-4
2. Wait 60 seconds or click "Resend"
3. Check for new OTP code

Expected:
- "Resend Code" button hidden initially
- Timer shows: "Resend code in 60s", "Resend code in 59s", etc
- Button appears after 60 seconds
- Can click Resend to get new code
```

### Test Case 6: Database Storage
```
Steps:
1. Complete registration with phone (077-123-4567)
2. Query database after verification

Expected:
- User record has phone: +231771234567
- User record has phone_verified: true
- Phone stored in international format
```

## Performance Testing

### Response Times
```
Phone validation:       < 1ms
OTP send:              2-3 seconds
OTP verification:      2-3 seconds
Database insert:       < 100ms
```

### Load Testing
```
Concurrent users:      Test with 10, 100, 1000 simultaneous signups
OTP send rate:         Verify SMS provider can handle peak load
Database write speed:  Monitor for slowdowns
```

## Security Testing

### Input Validation
```
Test malicious inputs:
- Very long phone numbers (50+ digits)
- SQL injection attempts: "'; DROP TABLE users; --"
- XSS attempts: "<script>alert('xss')</script>"
- Special characters: !@#$%^&*()
```

### OTP Security
```
Test OTP security:
- OTP expires after 5 minutes
- Maximum 3 attempts before rate limiting
- OTP cannot be reused
- OTP is different each time (not predictable)
```

### Phone Number Privacy
```
Test privacy:
- Phone not visible in emails
- Phone not visible in API responses (except authenticated user)
- Phone masked in admin panels
- Phone deleted if user deletes account
```

## Browser Compatibility Testing

### Desktop Browsers
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Mobile Browsers
- [ ] Chrome Mobile
- [ ] Safari iOS
- [ ] Firefox Mobile
- [ ] Samsung Internet

### Specific Features to Test
- Phone input field on mobile (native keyboard)
- OTP input on mobile (number keypad)
- Responsive layout on small screens
- Touch interactions

## Error Scenario Testing

### Phone Validation Errors
```
Error: "Phone must start with 077, 088, or 055"
Trigger: Enter 070-123-4567
Expected: Field shows error, cannot advance

Error: "Phone number must be 9 digits"
Trigger: Enter 077-123-45 (8 digits)
Expected: Field shows error, cannot advance

Error: "Phone number must contain only digits"
Trigger: Enter 077-ABC-4567
Expected: Field shows error, cannot advance
```

### OTP Errors
```
Error: "Failed to send OTP"
Trigger: Twilio not configured, send OTP
Expected: Alert shown, can retry

Error: "Invalid code. Please try again."
Trigger: Enter wrong 6-digit code
Expected: Field error shown, can retry

Error: "Verification failed"
Trigger: Supabase error during verification
Expected: Alert shown, can retry
```

### Network Errors
```
Offline during OTP send:
Expected: "Failed to send OTP" error

Offline during OTP verify:
Expected: "Verification failed" error

Network timeout:
Expected: Appropriate error message, ability to retry
```

## Integration Testing

### Email + Phone Both Required
```
Test that BOTH are required:
- Phone without email: Should fail
- Email without phone: Should fail
- Both provided: Should succeed
```

### User Data Integrity
```
After registration, verify:
- Email in auth.users table
- Email in users.email column
- Phone in users.phone column
- phone_verified = true
- role = contributor (or selected role)
- county_id = selected county
- created_at = current timestamp
```

### Login After Registration
```
Test that user can login after phone+email signup:
- Login with email/password works
- User session established
- Redirects to dashboard correctly
- Phone available in user profile
```

## Analytics & Monitoring

### Metrics to Monitor
```
- Signup completion rate (with phone)
- Phone validation error rate
- OTP send success rate
- OTP verification success rate
- Average time to verify OTP
- Resend request rate
- Signup abandonment rate at phone step
```

### Alerts to Set Up
```
- OTP send failure rate > 5%
- SMS delivery delay > 30 seconds
- Database errors on phone insert
- High number of invalid phone attempts
- Rate limit hits on OTP verification
```

## Rollback Procedures

### If Issues Found
```
1. Disable phone auth in Supabase dashboard
2. Remove Step 5 from UI (hide via CSS if needed)
3. Revert handleRegister to email-only
4. Keep phone columns (non-destructive)
5. Monitor error logs
6. Plan fix for next deployment
```

### Full Rollback
```
1. Remove Step 5 UI
2. Remove phone field from Step 3
3. Restore original registration flow
4. Run down migration to remove phone columns
5. Clear any affected user records if needed
```

## Production Deployment Steps

### Pre-Deployment
1. [ ] All tests passed
2. [ ] Code reviewed
3. [ ] Documentation reviewed
4. [ ] Database migration tested in staging
5. [ ] Twilio credentials verified
6. [ ] Monitoring configured

### Deployment
1. [ ] Run database migration in production
2. [ ] Deploy updated auth.html
3. [ ] Deploy phone-utils.js
4. [ ] Enable phone auth in Supabase
5. [ ] Monitor logs and metrics

### Post-Deployment
1. [ ] Monitor signup completion rate
2. [ ] Monitor OTP success rate
3. [ ] Check error logs for issues
4. [ ] Verify SMS delivery
5. [ ] Spot-check user records for phone data
6. [ ] User feedback collection

## Verification Queries

Run these in Supabase to verify setup:

```sql
-- Check if columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('phone', 'phone_verified');

-- Count users with phone
SELECT COUNT(*) as total_with_phone 
FROM users 
WHERE phone IS NOT NULL;

-- Count verified phones
SELECT COUNT(*) as verified_phones 
FROM users 
WHERE phone_verified = true;

-- Find sample user with phone
SELECT id, email, phone, phone_verified, created_at 
FROM users 
WHERE phone IS NOT NULL 
LIMIT 1;

-- Check for duplicate phones (should be 0)
SELECT phone, COUNT(*) as count 
FROM users 
WHERE phone IS NOT NULL 
GROUP BY phone 
HAVING COUNT(*) > 1;
```

## Success Criteria

✅ All test cases pass
✅ No console errors in browser
✅ No database errors in logs
✅ SMS successfully delivered (production)
✅ User registration completes successfully
✅ Phone stored correctly in database
✅ Phone verification flag set to true
✅ Email verification still works
✅ User can login after signup
✅ Performance acceptable (< 5 seconds total signup time)

---

**Last Updated**: 2025-05-14
**Status**: Ready for testing
