-- PROFESSIONAL DOMAIN MANAGEMENT SYSTEM
-- Run this in your Supabase SQL Editor

-- Step 1: Add domain management fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS unique_code TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS reply_to_email TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS custom_domain TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS domain_verified BOOLEAN DEFAULT FALSE;

-- Step 2: Generate unique codes for existing users
-- This creates unique 4-character codes like u1001, u1002, etc.
DO $$
DECLARE
    user_record RECORD;
    new_code TEXT;
    counter INTEGER := 1001;
BEGIN
    FOR user_record IN SELECT whop_user_id FROM users WHERE unique_code IS NULL ORDER BY created_at LOOP
        -- Generate unique code
        LOOP
            new_code := 'u' || counter::TEXT;
            
            -- Check if code exists
            IF NOT EXISTS (SELECT 1 FROM users WHERE unique_code = new_code) THEN
                -- Update user with unique code
                UPDATE users 
                SET unique_code = new_code,
                    display_name = COALESCE(company_name, 'FlowMail User'),
                    username = COALESCE(
                        LOWER(REGEXP_REPLACE(COALESCE(company_name, ''), '[^a-zA-Z0-9]', '', 'g')),
                        LOWER(REGEXP_REPLACE(SPLIT_PART(email, '@', 1), '[^a-zA-Z0-9]', '', 'g')),
                        'user'
                    ),
                    reply_to_email = email
                WHERE whop_user_id = user_record.whop_user_id;
                EXIT;
            END IF;
            
            counter := counter + 1;
        END LOOP;
    END LOOP;
END $$;

-- Step 3: Create function to generate unique codes for new users
CREATE OR REPLACE FUNCTION generate_unique_domain_code()
RETURNS TRIGGER AS $$
DECLARE
    new_code TEXT;
    counter INTEGER;
BEGIN
    -- Find the highest existing code number
    SELECT COALESCE(MAX(CAST(SUBSTRING(unique_code FROM 2) AS INTEGER)), 1000) + 1
    INTO counter
    FROM users 
    WHERE unique_code ~ '^u[0-9]+$';
    
    -- Generate unique code
    LOOP
        new_code := 'u' || counter::TEXT;
        
        -- Check if code exists
        IF NOT EXISTS (SELECT 1 FROM users WHERE unique_code = new_code) THEN
            NEW.unique_code := new_code;
            NEW.display_name := COALESCE(NEW.company_name, 'FlowMail User');
            NEW.username := COALESCE(
                LOWER(REGEXP_REPLACE(COALESCE(NEW.company_name, ''), '[^a-zA-Z0-9]', '', 'g')),
                LOWER(REGEXP_REPLACE(SPLIT_PART(NEW.email, '@', 1), '[^a-zA-Z0-9]', '', 'g')),
                'user'
            );
            NEW.reply_to_email := NEW.email;
            EXIT;
        END IF;
        
        counter := counter + 1;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create trigger for new users
DROP TRIGGER IF EXISTS auto_generate_domain_code ON users;
CREATE TRIGGER auto_generate_domain_code
    BEFORE INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION generate_unique_domain_code();

-- Step 5: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_unique_code ON users(unique_code);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_custom_domain ON users(custom_domain);

-- Step 6: Verification query
SELECT 
    whop_user_id,
    display_name,
    username,
    unique_code,
    username || '.' || unique_code || '@flowmail.rovelin.com' as platform_email,
    CASE 
        WHEN custom_domain IS NOT NULL THEN username || '.' || unique_code || '@' || custom_domain
        ELSE username || '.' || unique_code || '@flowmail.rovelin.com'
    END as final_email,
    reply_to_email,
    custom_domain,
    domain_verified
FROM users 
ORDER BY created_at DESC 
LIMIT 10;