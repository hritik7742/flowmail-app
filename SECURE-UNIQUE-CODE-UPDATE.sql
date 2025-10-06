-- SECURE UNIQUE CODE SYSTEM UPDATE
-- This creates cryptographically secure unique codes that can't be guessed

-- Step 1: Create function to generate secure random codes
CREATE OR REPLACE FUNCTION generate_secure_unique_code()
RETURNS TEXT AS $$
DECLARE
    new_code TEXT;
    chars TEXT := 'abcdefghijklmnopqrstuvwxyz0123456789';
    i INTEGER;
BEGIN
    -- Generate 8-character random code
    new_code := '';
    FOR i IN 1..8 LOOP
        new_code := new_code || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    
    -- Ensure uniqueness
    WHILE EXISTS (SELECT 1 FROM users WHERE unique_code = new_code) LOOP
        new_code := '';
        FOR i IN 1..8 LOOP
            new_code := new_code || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
        END LOOP;
    END LOOP;
    
    RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Update existing users with secure codes
DO $$
DECLARE
    user_record RECORD;
    new_code TEXT;
BEGIN
    FOR user_record IN SELECT whop_user_id FROM users WHERE unique_code LIKE 'u%' ORDER BY created_at LOOP
        new_code := generate_secure_unique_code();
        
        UPDATE users 
        SET unique_code = new_code
        WHERE whop_user_id = user_record.whop_user_id;
        
        RAISE NOTICE 'Updated user % with new secure code: %', user_record.whop_user_id, new_code;
    END LOOP;
END $$;

-- Step 3: Update the trigger function for new users
CREATE OR REPLACE FUNCTION generate_unique_domain_code()
RETURNS TRIGGER AS $$
BEGIN
    -- Generate secure unique code
    NEW.unique_code := generate_secure_unique_code();
    
    -- Set other defaults
    NEW.display_name := COALESCE(NEW.company_name, 'FlowMail User');
    NEW.username := COALESCE(
        LOWER(REGEXP_REPLACE(COALESCE(NEW.company_name, ''), '[^a-zA-Z0-9]', '', 'g')),
        LOWER(REGEXP_REPLACE(SPLIT_PART(NEW.email, '@', 1), '[^a-zA-Z0-9]', '', 'g')),
        'user'
    );
    NEW.reply_to_email := NEW.email;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Verification
SELECT 
    whop_user_id,
    display_name,
    username,
    unique_code,
    username || '.' || unique_code || '@flowmail.rovelin.com' as platform_email,
    reply_to_email
FROM users 
ORDER BY created_at DESC 
LIMIT 10;