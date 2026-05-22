-- ============================================================
--  PHONE AUTHENTICATION - ADD TO USERS TABLE
--  Adds phone number and verification fields for Liberian phone auth
-- ============================================================

-- Add phone and phone_verified columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS phone_verified boolean NOT NULL DEFAULT false;

-- Create unique index on phone number (nullable, only if present)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone ON users(phone)
WHERE phone IS NOT NULL;

-- Add index for phone verification queries
CREATE INDEX IF NOT EXISTS idx_users_phone_verified ON users(phone_verified);

-- Update updated_at trigger if needed (it should already exist)
-- The trigger from initial schema should apply to this new column automatically
