-- COMPLETE SENDER EMAIL SOLUTION
-- Run this ONCE in your Supabase SQL Editor

-- Step 1: Add sender fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS sender_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS sender_email_configured BOOLEAN DEFAULT FALSE;

-- Step 2: Create unique sender names for existing users
-- This will create sender names like: user_abc123, user_def456, etc.
UPDATE users 
SET 
  sender_name = 'user_' || SUBSTRING(whop_user_id FROM 6 FOR 6),
  sender_email_configured = TRUE
WHERE sender_name IS NULL;

-- Step 3: Create function to auto-generate sender names for new users
CREATE OR REPLACE FUNCTION generate_unique_sender_name()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-generate unique sender name when user is created
  NEW.sender_name = 'user_' || SUBSTRING(NEW.whop_user_id FROM 6 FOR 6);
  NEW.sender_email_configured = TRUE;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create trigger to auto-generate sender names
DROP TRIGGER IF EXISTS auto_generate_sender_name ON users;
CREATE TRIGGER auto_generate_sender_name
  BEFORE INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION generate_unique_sender_name();

-- Step 5: Add index for performance
CREATE INDEX IF NOT EXISTS idx_users_sender_name ON users(sender_name);

-- Verification query (optional - run this to check it worked)
-- SELECT whop_user_id, sender_name, sender_email_configured FROM users LIMIT 5;