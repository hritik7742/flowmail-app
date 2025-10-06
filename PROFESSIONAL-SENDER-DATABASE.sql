-- PROFESSIONAL SENDER EMAIL SYSTEM
-- Run this in your Supabase SQL Editor to upgrade the sender system

-- Step 1: Add professional sender fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS custom_sender_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS sender_display_name TEXT;

-- Step 2: Update existing users with better default names
-- Extract a professional name from their email or company name
UPDATE users 
SET 
  custom_sender_name = COALESCE(
    -- Try to use company name if available
    LOWER(REGEXP_REPLACE(COALESCE(company_name, ''), '[^a-zA-Z0-9]', '', 'g')),
    -- Otherwise use email prefix
    LOWER(REGEXP_REPLACE(SPLIT_PART(email, '@', 1), '[^a-zA-Z0-9]', '', 'g')),
    -- Fallback to user ID
    'user' || SUBSTRING(whop_user_id FROM 6 FOR 6)
  ),
  sender_display_name = COALESCE(company_name, 'FlowMail User'),
  sender_email_configured = TRUE
WHERE custom_sender_name IS NULL;

-- Step 3: Ensure all sender names are unique
-- This function will add numbers to duplicate names
DO $$
DECLARE
    user_record RECORD;
    new_name TEXT;
    counter INTEGER;
BEGIN
    -- Loop through users with duplicate sender names
    FOR user_record IN 
        SELECT whop_user_id, custom_sender_name, 
               ROW_NUMBER() OVER (PARTITION BY custom_sender_name ORDER BY created_at) as rn
        FROM users 
        WHERE custom_sender_name IS NOT NULL
    LOOP
        -- If this is not the first user with this name, make it unique
        IF user_record.rn > 1 THEN
            counter := user_record.rn;
            new_name := user_record.custom_sender_name || counter::TEXT;
            
            -- Keep incrementing until we find a unique name
            WHILE EXISTS (SELECT 1 FROM users WHERE custom_sender_name = new_name) LOOP
                counter := counter + 1;
                new_name := user_record.custom_sender_name || counter::TEXT;
            END LOOP;
            
            -- Update the user with the unique name
            UPDATE users 
            SET custom_sender_name = new_name 
            WHERE whop_user_id = user_record.whop_user_id;
        END IF;
    END LOOP;
END $$;

-- Step 4: Create function for new user sender names
CREATE OR REPLACE FUNCTION generate_professional_sender_name()
RETURNS TRIGGER AS $$
DECLARE
    base_name TEXT;
    final_name TEXT;
    counter INTEGER := 1;
BEGIN
    -- Generate base name from email or company
    base_name := COALESCE(
        LOWER(REGEXP_REPLACE(COALESCE(NEW.company_name, ''), '[^a-zA-Z0-9]', '', 'g')),
        LOWER(REGEXP_REPLACE(SPLIT_PART(NEW.email, '@', 1), '[^a-zA-Z0-9]', '', 'g')),
        'user' || SUBSTRING(NEW.whop_user_id FROM 6 FOR 6)
    );
    
    -- Ensure minimum length
    IF LENGTH(base_name) < 3 THEN
        base_name := base_name || 'mail';
    END IF;
    
    -- Ensure maximum length
    IF LENGTH(base_name) > 15 THEN
        base_name := SUBSTRING(base_name FROM 1 FOR 15);
    END IF;
    
    final_name := base_name;
    
    -- Make sure it's unique
    WHILE EXISTS (SELECT 1 FROM users WHERE custom_sender_name = final_name) LOOP
        counter := counter + 1;
        final_name := base_name || counter::TEXT;
    END LOOP;
    
    NEW.custom_sender_name := final_name;
    NEW.sender_display_name := COALESCE(NEW.company_name, 'FlowMail User');
    NEW.sender_email_configured := TRUE;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create trigger for new users
DROP TRIGGER IF EXISTS auto_generate_professional_sender ON users;
CREATE TRIGGER auto_generate_professional_sender
    BEFORE INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION generate_professional_sender_name();

-- Step 6: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_custom_sender_name ON users(custom_sender_name);
CREATE INDEX IF NOT EXISTS idx_users_sender_display_name ON users(sender_display_name);

-- Step 7: Verification query
SELECT 
    whop_user_id,
    email,
    custom_sender_name,
    sender_display_name,
    custom_sender_name || '@flowmail.rovelin.com' as full_sender_email
FROM users 
ORDER BY created_at DESC 
LIMIT 10;