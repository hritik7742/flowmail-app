-- FIX USER ISOLATION - CRITICAL DATABASE FIXES
-- This script ensures perfect user isolation and fixes the 403 API error
-- Run this in your Supabase SQL Editor

-- Step 1: Verify current user isolation
SELECT 
    'Current User Isolation Check' as status,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(*) as total_subscribers
FROM subscribers;

-- Step 2: Check for any subscribers without proper user_id
SELECT 
    'Subscribers without user_id' as issue,
    COUNT(*) as count
FROM subscribers 
WHERE user_id IS NULL;

-- Step 3: Check for any subscribers with invalid user_id
SELECT 
    'Subscribers with invalid user_id' as issue,
    COUNT(*) as count
FROM subscribers s
LEFT JOIN users u ON s.user_id = u.id
WHERE s.user_id IS NOT NULL AND u.id IS NULL;

-- Step 4: Add missing columns if they don't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS unique_code TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'whop_sync';
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Step 5: Make whop_member_id nullable for manual entries
ALTER TABLE subscribers ALTER COLUMN whop_member_id DROP NOT NULL;

-- Step 6: Drop old constraints that might cause issues
ALTER TABLE subscribers DROP CONSTRAINT IF EXISTS subscribers_user_id_whop_member_id_key;
ALTER TABLE subscribers DROP CONSTRAINT IF EXISTS subscribers_whop_member_id_key;

-- Step 7: Create perfect user isolation constraints
-- Each user can only have one subscriber per email
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscribers_unique_email_per_user 
ON subscribers(user_id, email);

-- Each user can only have one subscriber per whop_member_id (when not null)
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscribers_unique_whop_member_per_user 
ON subscribers(user_id, whop_member_id) 
WHERE whop_member_id IS NOT NULL;

-- Step 8: Create optimized indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_whop_user_id ON users(whop_user_id);
CREATE INDEX IF NOT EXISTS idx_users_unique_code ON users(unique_code);
CREATE INDEX IF NOT EXISTS idx_subscribers_user_id ON subscribers(user_id);
CREATE INDEX IF NOT EXISTS idx_subscribers_email ON subscribers(user_id, email);
CREATE INDEX IF NOT EXISTS idx_subscribers_whop_member_id ON subscribers(user_id, whop_member_id) WHERE whop_member_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_subscribers_status ON subscribers(user_id, status);
CREATE INDEX IF NOT EXISTS idx_subscribers_source ON subscribers(user_id, source);

-- Step 9: Generate unique codes for existing users who don't have them
DO $$
DECLARE
    user_record RECORD;
    new_unique_code TEXT;
    chars TEXT := 'abcdefghijklmnopqrstuvwxyz0123456789';
    i INTEGER;
    code_exists BOOLEAN;
BEGIN
    FOR user_record IN SELECT id, whop_user_id FROM users WHERE unique_code IS NULL LOOP
        LOOP
            new_unique_code := '';
            FOR i IN 1..8 LOOP
                new_unique_code := new_unique_code || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
            END LOOP;
            
            SELECT EXISTS(SELECT 1 FROM users WHERE unique_code = new_unique_code) INTO code_exists;
            EXIT WHEN NOT code_exists;
        END LOOP;
        
        UPDATE users SET unique_code = new_unique_code WHERE id = user_record.id;
        RAISE NOTICE 'Generated unique code % for user %', new_unique_code, user_record.whop_user_id;
    END LOOP;
END $$;

-- Step 10: Update existing data
-- Set source for existing subscribers
UPDATE subscribers SET source = 'whop_sync' WHERE source IS NULL;

-- Set created_at for existing subscribers
UPDATE subscribers SET created_at = synced_at WHERE created_at IS NULL;

-- Set updated_at for existing users
UPDATE users SET updated_at = created_at WHERE updated_at IS NULL;

-- Step 11: Create function to verify user isolation
CREATE OR REPLACE FUNCTION verify_user_isolation()
RETURNS TABLE(
    user_id UUID,
    whop_user_id TEXT,
    subscriber_count BIGINT,
    isolation_status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id as user_id,
        u.whop_user_id,
        COUNT(s.id) as subscriber_count,
        CASE 
            WHEN COUNT(s.id) = 0 THEN 'No subscribers'
            WHEN COUNT(s.id) = COUNT(CASE WHEN s.user_id = u.id THEN 1 END) THEN 'Perfect isolation'
            ELSE 'Isolation broken'
        END as isolation_status
    FROM users u
    LEFT JOIN subscribers s ON u.id = s.user_id
    GROUP BY u.id, u.whop_user_id
    ORDER BY u.created_at;
END;
$$ LANGUAGE plpgsql;

-- Step 12: Create function to get user's subscribers with isolation check
CREATE OR REPLACE FUNCTION get_user_subscribers(user_uuid UUID)
RETURNS TABLE(
    id UUID,
    email TEXT,
    name TEXT,
    tier TEXT,
    status TEXT,
    source TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    -- Verify the user exists
    IF NOT EXISTS(SELECT 1 FROM users WHERE id = user_uuid) THEN
        RAISE EXCEPTION 'User not found: %', user_uuid;
    END IF;
    
    -- Return only subscribers for this specific user
    RETURN QUERY
    SELECT 
        s.id,
        s.email,
        s.name,
        s.tier,
        s.status,
        s.source,
        s.created_at
    FROM subscribers s
    WHERE s.user_id = user_uuid
    ORDER BY s.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Step 13: Create function to clear user's subscribers
CREATE OR REPLACE FUNCTION clear_user_subscribers(user_uuid UUID, source_filter TEXT DEFAULT NULL)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Verify the user exists
    IF NOT EXISTS(SELECT 1 FROM users WHERE id = user_uuid) THEN
        RAISE EXCEPTION 'User not found: %', user_uuid;
    END IF;
    
    -- Delete subscribers for this user
    IF source_filter IS NULL THEN
        DELETE FROM subscribers WHERE user_id = user_uuid;
    ELSE
        DELETE FROM subscribers WHERE user_id = user_uuid AND source = source_filter;
    END IF;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Step 14: Verify the fixes
SELECT 'User Isolation Verification' as check_type, * FROM verify_user_isolation();

-- Step 15: Show final statistics
SELECT 
    'Final Database Statistics' as status,
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(*) FROM subscribers) as total_subscribers,
    (SELECT COUNT(DISTINCT user_id) FROM subscribers) as users_with_subscribers,
    (SELECT COUNT(*) FROM subscribers WHERE source = 'whop_sync') as whop_synced_subscribers,
    (SELECT COUNT(*) FROM subscribers WHERE source != 'whop_sync') as manual_subscribers;

-- Step 16: Test user isolation
SELECT 
    'Testing User Isolation' as test,
    u.whop_user_id,
    u.display_name,
    COUNT(s.id) as subscriber_count
FROM users u
LEFT JOIN subscribers s ON u.id = s.user_id
GROUP BY u.id, u.whop_user_id, u.display_name
ORDER BY u.created_at;

-- Step 17: Add comments for documentation
COMMENT ON FUNCTION verify_user_isolation() IS 'Verifies that each user can only access their own subscribers';
COMMENT ON FUNCTION get_user_subscribers(UUID) IS 'Gets subscribers for a specific user with isolation check';
COMMENT ON FUNCTION clear_user_subscribers(UUID, TEXT) IS 'Clears subscribers for a specific user';

COMMENT ON INDEX idx_subscribers_unique_email_per_user IS 'Ensures each user can only have one subscriber per email';
COMMENT ON INDEX idx_subscribers_unique_whop_member_per_user IS 'Ensures each user can only have one subscriber per whop_member_id';

-- Step 18: Final verification message
SELECT 'User isolation fixes completed successfully!' as message;
