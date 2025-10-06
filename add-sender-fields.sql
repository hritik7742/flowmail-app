-- Add sender fields to users table for personalized email sending

-- Add sender_name column to store user's preferred sender name
ALTER TABLE users ADD COLUMN IF NOT EXISTS sender_name TEXT;

-- Add sender_email_configured column to track if user has set up their sender email
ALTER TABLE users ADD COLUMN IF NOT EXISTS sender_email_configured BOOLEAN DEFAULT FALSE;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_users_sender_name ON users(sender_name);

-- Add comment for documentation
COMMENT ON COLUMN users.sender_name IS 'User preferred sender name for email sending (e.g., "john" for john@flowmail.rovelin.com)';
COMMENT ON COLUMN users.sender_email_configured IS 'Whether user has configured their sender email address';