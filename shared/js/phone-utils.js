/**
 * Phone Authentication Utilities for ExploreLiberia
 * Provides helper functions for phone number validation and verification
 */

// ============================================================
//  PHONE VALIDATION & FORMATTING UTILITIES
// ============================================================

/**
 * Check if a phone number is a valid Liberian number
 * @param {string} phone - Phone number to validate
 * @returns {object} { valid: boolean, error: string, international: string }
 */
function isValidLiberianPhone(phone) {
  if (!phone || !phone.trim()) {
    return { valid: false, error: 'Phone number is required', international: null };
  }

  // Remove all non-digit characters except leading +
  let cleaned = phone.replace(/[\s\-()]/g, '');
  
  // Handle if user includes +231
  if (cleaned.startsWith('+231')) {
    cleaned = cleaned.substring(4);
  } else if (cleaned.startsWith('231')) {
    cleaned = cleaned.substring(3);
  }

  // Remove leading 0 if present
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }

  // Validate length (should be 9 digits after country code)
  if (cleaned.length !== 9) {
    return { valid: false, error: 'Phone number must be 9 digits', international: null };
  }

  // Validate it's all digits
  if (!/^\d+$/.test(cleaned)) {
    return { valid: false, error: 'Phone number must contain only digits', international: null };
  }

  // Validate Liberian prefix (077, 088, 055)
  const prefix = cleaned.substring(0, 3);
  const validPrefixes = ['077', '088', '055'];
  if (!validPrefixes.includes(prefix)) {
    return { valid: false, error: 'Phone must start with 077, 088, or 055', international: null };
  }

  // Convert to international format: +231XXXXXXXXX
  const international = '+231' + cleaned;

  return { valid: true, international, error: null };
}

/**
 * Format a phone number for display
 * @param {string} phone - Phone number to format
 * @returns {string} Formatted phone number for display
 */
function formatPhoneForDisplay(phone) {
  if (!phone) return '';
  
  // If already international, just format it nicely
  if (phone.startsWith('+231')) {
    // +231 77 123 4567
    return phone.substring(0, 4) + ' ' + phone.substring(4, 6) + ' ' + phone.substring(6, 9) + ' ' + phone.substring(9);
  }
  
  return phone;
}

/**
 * Mask a phone number for display (show only last 4 digits)
 * @param {string} phone - Phone number to mask
 * @returns {string} Masked phone number
 */
function maskPhoneNumber(phone) {
  if (!phone || phone.length < 4) return phone;
  
  // If international format: +231***7890
  if (phone.startsWith('+231')) {
    return phone.substring(0, 7) + '***' + phone.slice(-4);
  }
  
  // Otherwise: ***7890
  return '***' + phone.slice(-4);
}

/**
 * Get the carrier of a Liberian phone number based on prefix
 * @param {string} phone - Phone number (in any format)
 * @returns {string} Carrier name
 */
function getLiberiahPhoneCarrier(phone) {
  if (!phone) return '';
  
  // Extract prefix (first 3 digits after country code)
  let cleaned = phone.replace(/[\s\-()]+/g, '');
  if (cleaned.startsWith('+231')) {
    cleaned = cleaned.substring(4);
  } else if (cleaned.startsWith('231')) {
    cleaned = cleaned.substring(3);
  }
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }
  
  const prefix = cleaned.substring(0, 3);
  
  const carriers = {
    '077': 'MTN Liberia',
    '088': 'Lonestar Cell',
    '055': 'Libtelco'
  };
  
  return carriers[prefix] || 'Unknown Carrier';
}

/**
 * Check if a phone number matches user's country (Liberia)
 * @param {string} phone - Phone number to check
 * @returns {boolean} True if it's a Liberian number
 */
function isLiberianNumber(phone) {
  const validation = isValidLiberianPhone(phone);
  return validation.valid;
}

/**
 * Convert any phone format to international format
 * @param {string} phone - Phone number in any format
 * @returns {string|null} International format or null if invalid
 */
function toInternationalFormat(phone) {
  const validation = isValidLiberianPhone(phone);
  return validation.valid ? validation.international : null;
}

/**
 * Parse phone components
 * @param {string} phone - Phone number in any format
 * @returns {object} { valid: boolean, prefix: string, carrier: string, international: string }
 */
function parsePhoneNumber(phone) {
  const validation = isValidLiberianPhone(phone);
  
  if (!validation.valid) {
    return { valid: false, prefix: null, carrier: null, international: null };
  }
  
  let cleaned = validation.international.substring(4); // Remove +231
  const prefix = cleaned.substring(0, 3);
  
  return {
    valid: true,
    prefix,
    carrier: getLiberiahPhoneCarrier(validation.international),
    international: validation.international
  };
}

// ============================================================
//  INTEGRATION WITH SUPABASE
// ============================================================

/**
 * Check if a user has a verified phone number
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} True if phone is verified
 */
async function isPhoneVerified(userId) {
  try {
    const { data, error } = await sb.from('users')
      .select('phone_verified')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error checking phone verification:', error);
      return false;
    }
    
    return data?.phone_verified || false;
  } catch (err) {
    console.error('Error checking phone verification:', err);
    return false;
  }
}

/**
 * Get user's phone number (only if verified)
 * @param {string} userId - User ID
 * @returns {Promise<string|null>} Phone number or null
 */
async function getUserPhoneNumber(userId) {
  try {
    const { data, error } = await sb.from('users')
      .select('phone, phone_verified')
      .eq('id', userId)
      .single();
    
    if (error || !data?.phone_verified) {
      return null;
    }
    
    return data.phone;
  } catch (err) {
    console.error('Error getting phone number:', err);
    return null;
  }
}

/**
 * Find user by phone number
 * @param {string} phone - Phone number (in any format)
 * @returns {Promise<object|null>} User object or null
 */
async function findUserByPhone(phone) {
  try {
    const validation = isValidLiberianPhone(phone);
    if (!validation.valid) {
      return null;
    }
    
    const { data, error } = await sb.from('users')
      .select('*')
      .eq('phone', validation.international)
      .eq('phone_verified', true)
      .single();
    
    if (error) {
      return null; // User not found
    }
    
    return data;
  } catch (err) {
    console.error('Error finding user by phone:', err);
    return null;
  }
}

/**
 * Update user's phone number (requires new OTP verification)
 * @param {string} userId - User ID
 * @param {string} newPhone - New phone number
 * @returns {Promise<object>} { success: boolean, message: string }
 */
async function updateUserPhone(userId, newPhone) {
  try {
    const validation = isValidLiberianPhone(newPhone);
    if (!validation.valid) {
      return { success: false, message: validation.error };
    }
    
    // Set phone_verified to false to require new verification
    const { error } = await sb.from('users')
      .update({
        phone: validation.international,
        phone_verified: false
      })
      .eq('id', userId);
    
    if (error) {
      return { success: false, message: 'Failed to update phone: ' + error.message };
    }
    
    // TODO: Trigger OTP send for new phone
    
    return { success: true, message: 'Phone number updated. Please verify with OTP.' };
  } catch (err) {
    console.error('Error updating phone:', err);
    return { success: false, message: 'Error updating phone number' };
  }
}

// ============================================================
//  STATISTICS & ANALYTICS
// ============================================================

/**
 * Get phone verification statistics
 * @returns {Promise<object>} Stats object
 */
async function getPhoneVerificationStats() {
  try {
    // Total users with verified phone
    const { count: verifiedCount } = await sb.from('users')
      .select('id', { count: 'exact' })
      .eq('phone_verified', true);
    
    // Total users with unverified phone
    const { count: unverifiedCount } = await sb.from('users')
      .select('id', { count: 'exact' })
      .not('phone', 'is', null)
      .eq('phone_verified', false);
    
    // Total users with phone (any status)
    const { count: phoneCount } = await sb.from('users')
      .select('id', { count: 'exact' })
      .not('phone', 'is', null);
    
    return {
      verified: verifiedCount || 0,
      unverified: unverifiedCount || 0,
      total: phoneCount || 0,
      percentageVerified: phoneCount > 0 ? Math.round(((verifiedCount || 0) / phoneCount) * 100) : 0
    };
  } catch (err) {
    console.error('Error getting phone stats:', err);
    return { verified: 0, unverified: 0, total: 0, percentageVerified: 0 };
  }
}

/**
 * Get users by carrier
 * @returns {Promise<object>} Breakdown by carrier
 */
async function getUsersByCarrier() {
  try {
    const { data, error } = await sb.from('users')
      .select('phone')
      .eq('phone_verified', true)
      .not('phone', 'is', null);
    
    if (error || !data) {
      return {};
    }
    
    const carriers = {
      'MTN Liberia': 0,
      'Lonestar Cell': 0,
      'Libtelco': 0,
      'Unknown': 0
    };
    
    data.forEach(user => {
      const carrier = getLiberiahPhoneCarrier(user.phone);
      carriers[carrier] = (carriers[carrier] || 0) + 1;
    });
    
    return carriers;
  } catch (err) {
    console.error('Error getting users by carrier:', err);
    return {};
  }
}

// ============================================================
//  EXPORT FOR USE IN OTHER MODULES
// ============================================================

// If using ES modules, export these functions:
// export { isValidLiberianPhone, formatPhoneForDisplay, maskPhoneNumber, ... }

// For inline use in HTML, these are available globally on window object
