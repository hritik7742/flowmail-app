-- Fix missing domain-related columns in users table
-- Run this in your Supabase SQL Editor to fix the database error

-- Add all missing domain-related columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS unique_code TEXT UNIQUE;
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

-- Update existing users with default values where needed
UPDATE users 
SET 
    display_name = COALESCE(display_name, company_name, 'FlowMail User'),
    reply_to_email = COALESCE(reply_to_email, email)
WHERE display_name IS NULL OR reply_to_email IS NULL;

-- Generate unique codes for existing users without them
DO $
DECLARE
    user_record RECORD;
    new_code TEXT;
    counter INTEGER := 1001;
BEGIN
    FOR user_record IN SELECT id, whop_user_id, company_name, email FROM users WHERE unique_code IS NULL ORDER BY created_at LOOP
        -- Generate unique code
        LOOP
            new_code := 'u' || counter::TEXT;
            
            -- Check if code exists
            IF NOT EXISTS (SELECT 1 FROM users WHERE unique_code = new_code) THEN
                -- Update user with unique code and username
                UPDATE users 
                SET 
                    unique_code = new_code,
                    username = COALESCE(
                        LOWER(REGEXP_REPLACE(COALESCE(user_record.company_name, ''), '[^a-zA-Z0-9]', '', 'g')),
                        LOWER(REGEXP_REPLACE(SPLIT_PART(user_record.email, '@', 1), '[^a-zA-Z0-9]', '', 'g')),
                        'user'
                    )
                WHERE id = user_record.id;
                EXIT;
            END IF;
            
            counter := counter + 1;
        END LOOP;
    END LOOP;
END $;

-- Verification query to check the fix
SELECT 
    whop_user_id,
    display_name,
    username,
    unique_code,
    custom_domain,
    domain_verified,
    resend_domain_id IS NOT NULL as has_resend_domain
FROM users 
ORDER BY created_at DESC 
LIMIT 5;