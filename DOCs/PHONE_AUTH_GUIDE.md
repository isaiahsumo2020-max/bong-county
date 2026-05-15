# Phone Authentication Implementation Guide

## Overview

Phone authentication has been integrated into the ExploreLiberia signup flow with the following features:

- **Liberian-Only Phone Numbers**: Accepts only valid Liberian numbers starting with 077, 088, or 055
- **International Format Conversion**: Automatically converts to +231 international format
- **OTP/SMS Verification**: Uses Supabase Phone Auth with Twilio for SMS delivery
- **Multi-Step Integration**: Phone verification happens before account creation (Step 5 of 5)
- **Dual Authentication**: Both email and phone verification are required

## Architecture

### Registration Flow

```
Step 1: Role & County Selection
   ↓
Step 2: Contributor Type
   ↓
Step 3: Personal Info (Name, Email, Phone, Bio)
   ↓
Step 4: Password & Terms Agreement
   ↓
Step 5: Phone OTP Verification
   ↓
Account Created & Email Verification Sent
```

### Key Changes

#### 1. **Phone Field Added to Step 3**
- Location: `auth-page/auth.html` - Step 3 (Personal Details)
- Input accepts flexible formats:
  - `077-123-4567` (with dashes)
  - `077 123 4567` (with spaces)
  - `0771234567` (no separator)
  - `771234567` (without country code)
  - `+231771234567` (international)

#### 2. **New Step 5: Phone OTP Verification**
- Shows after user enters password and agrees to terms
- Displays masked phone number: `+231***7890`
- Provides 6-digit OTP input field
- Includes resend functionality (60-second cooldown)

#### 3. **Validation Functions**

**`validateLiberianPhone(phone)`**
- Validates phone format and prefix (077, 088, 055)
- Converts to international format (+231XXXXXXXXX)
- Returns: `{ valid: boolean, international: string, error: string }`

**`sendPhoneOtp()`**
- Triggers Supabase phone auth OTP send
- Displays masked phone in UI
- Starts 60-second resend timer

**`verifyPhoneOtp()`**
- Validates 6-digit OTP code
- Calls `completeRegistration()` on success
- Allows retry on failure

**`resendPhoneOtp()`**
- Resends OTP within 60-second window
- Resets timer on successful resend

#### 4. **Modified Registration Flow**

**Original `handleRegister()`** → Now handles Step 4 completion
- Validates password and terms
- Stores password temporarily
- Sends OTP via `sendPhoneOtp()`
- Transitions to Step 5

**New `completeRegistration()`** → Called after OTP verification
- Creates user account via email/password signup
- Upserts user profile with phone data
- Marks `phone_verified = true` in database
- Shows email verification screen

### Database Schema

#### New Fields in `users` Table

```sql
phone text UNIQUE NULLABLE
  -- Stores verified phone number in international format (+231XXXXXXXXX)
  -- Only set after OTP verification passes

phone_verified boolean NOT NULL DEFAULT false
  -- Tracks whether phone number has been verified
  -- Set to true only after successful OTP verification
```

#### Migration

Run: `supabase/migrations/20250514000000_add_phone_auth.sql`

This migration:
- Adds `phone` and `phone_verified` columns
- Creates unique index on phone (nullable)
- Creates index for phone_verified lookups

## Supabase Configuration

### 1. Enable Phone Auth Provider

In **Supabase Dashboard → Authentication → Providers**:
1. Find "Phone"
2. Click to expand
3. Set **"Enable phone provider"** to ON
4. Note: Free tier only supports test phone numbers

### 2. Configure SMS Provider (Twilio)

**Required for production:**

1. Get Twilio credentials:
   - Account SID
   - Auth Token
   - Twilio Phone Number (sender ID)

2. In Supabase Dashboard:
   - Go to **Project Settings → Auth**
   - Scroll to "SMS Provider"
   - Select "Twilio"
   - Paste Account SID and Auth Token
   - Enter Twilio Phone Number

3. Optional: Configure default SMS template

### 3. Test Mode (Development)

For local development without Twilio:
- Supabase provides test phone numbers: `+1234567890`
- OTP will be printed to Supabase logs
- Use any 6-digit code for testing

## Usage in Frontend

### Workflow

1. **User enters phone in Step 3**
   ```javascript
   // Validation happens automatically when advancing to Step 4
   const validation = validateLiberianPhone(document.getElementById('reg-phone').value);
   if (!validation.valid) {
     // Error shown to user
   } else {
     selectedPhone = validation.international; // +231...
   }
   ```

2. **User confirms password in Step 4 and clicks "Create My Account"**
   ```javascript
   // handleRegister() is called
   await sendPhoneOtp(); // Sends SMS to user
   showStep(5); // Shows OTP verification form
   ```

3. **User enters OTP code in Step 5**
   ```javascript
   // verifyPhoneOtp() is called when user clicks "Verify Phone Number"
   await sb.auth.verifyOtp({
     phone: selectedPhone,
     token: otpCode,
     type: 'sms'
   });
   ```

4. **On successful verification**
   ```javascript
   // completeRegistration() creates account
   // Sets phone_verified = true
   // Shows email verification screen
   ```

### Error Handling

- **Invalid phone format**: Shows field error with correction hints
- **OTP send failure**: Shows alert with retry button
- **Invalid OTP**: Shows field error, allows 3 retries before resend button appears
- **Network errors**: Caught and displayed with user-friendly messages

## Security Considerations

### Phone Validation

✅ **Client-Side**
- Format validation (077/088/055 prefixes)
- Length validation (9 digits)
- International format conversion

⚠️ **Server-Side (Required)**
- Duplicate phone check before insertion
- Rate limiting on OTP requests
- Rate limiting on OTP verification attempts

### OTP Security

✅ **Supabase Handles**
- OTP generation (cryptographically secure)
- OTP storage (hashed, not plaintext)
- OTP expiration (5 minutes default)
- Rate limiting on verification attempts

⚠️ **Recommended**
- Add RLS policy to prevent users from updating `phone_verified` field
- Add constraint to prevent phone changes after verification without new OTP

### Sample RLS Policy

```sql
CREATE POLICY "Users cannot modify phone_verified" ON users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id 
    AND phone_verified = (SELECT phone_verified FROM users WHERE id = auth.uid())
  );
```

## Testing Phone Authentication

### With Real Twilio (Production)

1. Use real Liberian phone number: `+231770123456`
2. User receives SMS with 6-digit code
3. Enter code in OTP field
4. Account created with verified phone

### In Development (Without Twilio)

#### Option 1: Test Phone Numbers
- Supabase allows designated test numbers
- OTP appears in Supabase logs
- No real SMS sent

#### Option 2: Local Debugging
```javascript
// In browser console during development
// Mock OTP sending for testing
window.testOtpCode = '123456'; // Check Supabase logs for actual code
```

### Test Cases

```javascript
// Valid Liberian numbers (should all work)
validateLiberianPhone('077-123-4567')      // ✓ +231771234567
validateLiberianPhone('088 234 5678')      // ✓ +231882345678
validateLiberianPhone('0551122334')        // ✓ +231551122334
validateLiberianPhone('+231770000000')     // ✓ +231770000000

// Invalid numbers (should all fail)
validateLiberianPhone('070-123-4567')      // ✗ Wrong prefix
validateLiberianPhone('077-123-45')        // ✗ Too short
validateLiberianPhone('077-123-456789')    // ✗ Too long
validateLiberianPhone('invalid')           // ✗ Not numeric
validateLiberianPhone('')                  // ✗ Empty
```

## Troubleshooting

### "OTP not received"

**Cause**: Twilio not configured or SMS sending failed

**Solutions**:
1. Check Supabase settings have valid Twilio credentials
2. Verify Twilio account has SMS balance
3. Check phone number format is correct (+231...)
4. Check Supabase logs for SMS sending errors

### "Invalid code" on every attempt

**Cause**: OTP expired (5 minute window) or wrong code

**Solutions**:
1. Click "Resend" to get new OTP
2. Enter code within 5 minutes of sending
3. Check SMS for correct code (not previous attempt)

### Phone number won't validate

**Cause**: Incorrect format or non-Liberian number

**Solutions**:
1. Use one of: 077, 088, or 055 prefix
2. Use format: `077-123-4567` or `0771234567`
3. Don't include +231 when entering (auto-converted)

## Future Enhancements

1. **Phone-only signup** option (without email)
2. **Phone number changes** with re-verification
3. **Two-factor authentication** using existing verified phone
4. **SMS notifications** using verified phone
5. **Liberian phone number validation** API integration for additional checks

## Database Queries

### Find users by phone

```sql
SELECT * FROM users WHERE phone = '+231771234567';
```

### Find unverified phone numbers

```sql
SELECT id, email, phone FROM users WHERE phone IS NOT NULL AND phone_verified = false;
```

### Count verified phone users

```sql
SELECT COUNT(*) FROM users WHERE phone_verified = true;
```

## Files Modified

- `auth-page/auth.html` - Added phone field to Step 3, created Step 5 OTP screen
- `supabase/migrations/20250514000000_add_phone_auth.sql` - Added phone columns to users table

## Rollback Instructions

If needed to remove phone authentication:

1. **Revert UI**: Remove Step 5 HTML and phone field from Step 3
2. **Revert Functions**: Remove phone validation and OTP functions
3. **Revert Migration**: Drop phone columns (down migration):

```sql
ALTER TABLE users
DROP COLUMN IF EXISTS phone,
DROP COLUMN IF EXISTS phone_verified;

DROP INDEX IF EXISTS idx_users_phone;
DROP INDEX IF EXISTS idx_users_phone_verified;
```

4. **Remove from handleRegister**: Restore original registration flow
