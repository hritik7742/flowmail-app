-- PROFESSIONAL SENDER EMAIL SOLUTION
-- This allows users to set professional sender names with conflict resolution

-- Step 1: Add custom sender name field
ALTER TABLE users ADD COLUMN IF NOT EXISTS custom_sender_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS sender_display_name TEXT;

-- Step 2: Update existing users with better default names
-- Extract a more professional name from their email or use their company name
UPDATE users 
SET 
  custom_sender_name = COALESCE(
    company_name,
    SPLIT_PART(email, '@', 1),
    'user_' || SUBSTRING(whop_user_id FROM 6 FOR 6)
  ),
  sender_display_name = COALESCE(company_name, 'FlowMail User'),
  sender_email_configured = TRUE
WHERE custom_sender_name IS NULL;

-- Step 3: Create function to generate unique sender names with conflict resolution
CREATE OR REPLACE FUNCTION ensure_unique_sender_name(desired_name TEXT, user_whop_id TEXT)
RETURNS TEXT AS $$
DECLARE
  final_name TEXT;
  counter INTEGER := 1;
  name_exists BOOLEAN;
BEGIN
  -- Clean the desired name (remove spaces, special chars, make lowercase)
  final_name := LOWER(REGEXP_REPLACE(desired_name, '[^a-zA-Z0-9]', '', 'g'));
  
  -- Ensure minimum length
  IF LENGTH(final_name) < 3 THEN
    final_name := final_name || 'mail';
  END IF;
  
  -- Ensure maximum length
  IF LENGTH(final_name) > 20 THEN
    final_name := SUBSTRING(final_name FROM 1 FOR 20);
  END IF;
  
  -- Check if name exists (excluding current user)
  SELECT EXISTS(
    SELECT 1 FROM users 
    WHERE custom_sender_name = final_name 
    AND whop_user_id != user_whop_id
  ) INTO name_exists;
  
  -- If name exists, add numbers until we find a unique one
  WHILE name_exists LOOP
    final_name := SUBSTRING(final_name FROM 1 FOR 17) || counter::TEXT;
    counter := counter + 1;
    
    SELECT EXISTS(
      SELECT 1 FROM users 
      WHERE custom_sender_name = final_name 
      AND whop_user_id != user_whop_id
    ) INTO name_exists;
  END LOOP;
  
  RETURN final_name;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_custom_sender_name ON users(custom_sender_name);
CREATE INDEX IF NOT EXISTS idx_users_sender_display_name ON users(sender_display_name);

-- Verification query
-- SELECT whop_user_id, custom_sender_name, sender_display_name, email FROM users LIMIT 5;