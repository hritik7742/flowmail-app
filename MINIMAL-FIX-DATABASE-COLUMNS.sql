-- MINIMAL FIX: Just add the missing columns to stop the error
-- Copy and paste this into your Supabase SQL Editor and run it

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

-- Add basic indexes
CREATE INDEX IF NOT EXISTS idx_users_custom_domain ON users(custom_domain);
CREATE INDEX IF NOT EXISTS idx_users_resend_domain_id ON users(resend_domain_id);

-- Update existing users with basic default values
UPDATE users 
SET display_name = COALESCE(company_name, 'FlowMail User')
WHERE display_name IS NULL;

UPDATE users 
SET reply_to_email = email
WHERE reply_to_email IS NULL AND email IS NOT NULL;

-- Set simple unique codes for existing users (basic approach)
UPDATE users 
SET unique_code = 'u' || id::TEXT
WHERE unique_code IS NULL;

UPDATE users 
SET username = 'user' || id::TEXT
WHERE username IS NULL;

-- Verification
SELECT 'Fix completed!' as status, COUNT(*) as total_users FROM users;