-- QUICK FIX: Add missing domain columns to fix the database error
-- Copy and paste this entire script into your Supabase SQL Editor and run it

-- Add all missing domain-related columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS unique_code TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS reply_to_email TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS custom_domain TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS domain_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS domain_verified_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS resend_domain_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS domain_dns_records JSONB;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_unique_code ON users(unique_code);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_custom_domain ON users(custom_domain);
CREATE INDEX IF NOT EXISTS idx_users_resend_domain_id ON users(resend_domain_id);

-- Update existing users with default values
UPDATE users 
SET 
    display_name = COALESCE(display_name, company_name, 'FlowMail User'),
    reply_to_email = COALESCE(reply_to_email, email)
WHERE display_name IS NULL OR reply_to_email IS NULL;

-- Generate unique codes for existing users (using a subquery approach)
WITH numbered_users AS (
    SELECT id, 
           'u' || (1000 + ROW_NUMBER() OVER (ORDER BY created_at))::TEXT as new_unique_code,
           COALESCE(
               LOWER(REGEXP_REPLACE(COALESCE(company_name, ''), '[^a-zA-Z0-9]', '', 'g')),
               LOWER(REGEXP_REPLACE(SPLIT_PART(email, '@', 1), '[^a-zA-Z0-9]', '', 'g')),
               'user'
           ) as new_username
    FROM users 
    WHERE unique_code IS NULL
)
UPDATE users 
SET unique_code = numbered_users.new_unique_code,
    username = numbered_users.new_username
FROM numbered_users 
WHERE users.id = numbered_users.id;

-- Add unique constraint for unique_code (after populating)
ALTER TABLE users ADD CONSTRAINT users_unique_code_key UNIQUE (unique_code);

-- Verification: Check that columns were added successfully
SELECT 
    'Columns added successfully!' as status,
    COUNT(*) as total_users,
    COUNT(resend_domain_id) as users_with_resend_domain,
    COUNT(unique_code) as users_with_unique_code
FROM users;