# Phone Auth Quick Start

## What Was Added

✅ Liberian phone number validation (077, 088, 055)
✅ OTP/SMS verification step in signup
✅ Phone stored in users table after verification
✅ International format conversion (+231...)

## For Developers

### 1. Run Database Migration

```bash
# In Supabase Dashboard → SQL Editor
# Copy and run this file:
supabase/migrations/20250514000000_add_phone_auth.sql
```

This adds:
- `phone` column (stores +231XXXXXXXXX)
- `phone_verified` column (boolean)

### 2. Configure Supabase Phone Auth

**In Supabase Dashboard:**
1. Go to `Authentication → Providers`
2. Find "Phone" → Toggle ON
3. For production: Add Twilio credentials in `Project Settings → Auth`

**For Development (Free Tier):**
- Phone auth is enabled by default
- Use test phone numbers: +1234567890
- OTP appears in Supabase logs (no real SMS sent)

### 3. Test the Flow

**Steps:**
1. Open `auth-page/auth.html` → Click "Create Account"
2. Fill Steps 1-3 (role, county, personal info)
3. Enter phone: `0771234567` or `077-123-4567` → Click Continue
4. Fill password & agree terms → Click "Create My Account"
5. Enter 6-digit OTP code (check Supabase logs for test code)
6. Click "Verify Phone Number"
7. See confirmation email verification screen

**Valid Test Formats:**
- 0771234567 (no separator)
- 077-123-4567 (dashes)
- 077 123 4567 (spaces)
- +231771234567 (international)

**Valid Prefixes:**
- 077 (MTN)
- 088 (Lonestar)
- 055 (Libtelco)

### 4. Production Deployment

**Prerequisites:**
1. Twilio account with SMS enabled
2. Twilio credentials: Account SID, Auth Token, Phone Number
3. Supabase phone auth provider enabled

**Steps:**
1. Add Twilio credentials to Supabase → Project Settings
2. Update SUPABASE_URL and SUPABASE_ANON_KEY if changed
3. Test with real phone number
4. Deploy `auth-page/auth.html` updates
5. Monitor Supabase logs for SMS delivery

## API Integration Points

### Phone Validation
```javascript
validateLiberianPhone('0771234567')
// Returns: { valid: true, international: '+231771234567' }
```

### Send OTP
```javascript
await sendPhoneOtp()
// Calls: sb.auth.signInWithOtp({ phone: '+231771234567' })
```

### Verify OTP
```javascript
await verifyPhoneOtp()
// Calls: sb.auth.verifyOtp({ phone, token, type: 'sms' })
```

## Error Scenarios

| Error | Cause | Fix |
|-------|-------|-----|
| "Phone must start with 077, 088, or 055" | Wrong prefix | Use valid Liberian prefix |
| "Phone number must be 9 digits" | Wrong length | Check format |
| "Failed to send OTP" | Twilio not configured | Add credentials to Supabase |
| "Invalid code" | Wrong OTP or expired | Click Resend for new code |
| "Signup failed" | Email already exists | Use new email |

## Database Queries

### Check registered phones
```sql
SELECT email, phone, phone_verified FROM users WHERE phone IS NOT NULL;
```

### Find a user by phone
```sql
SELECT * FROM users WHERE phone = '+231771234567';
```

## Files Modified

1. **auth-page/auth.html**
   - Added phone field to Step 3
   - Added Step 5: Phone OTP verification UI
   - Added validation and OTP functions
   - Updated registration flow

2. **supabase/migrations/20250514000000_add_phone_auth.sql**
   - Added phone and phone_verified columns

## Testing Checklist

- [ ] Phone validation accepts all valid formats
- [ ] Phone validation rejects invalid prefixes
- [ ] OTP sends after Step 4 completion
- [ ] OTP verification creates account
- [ ] Phone stored in users table
- [ ] Phone verification flag set correctly
- [ ] Resend works within 60 seconds
- [ ] Email verification still works
- [ ] User can login after signup

## Support

For issues or questions, check:
- `DOCs/PHONE_AUTH_GUIDE.md` - Full documentation
- Supabase dashboard logs - For SMS delivery status
- Browser console - For JavaScript errors
