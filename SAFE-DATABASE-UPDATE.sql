-- SAFE DATABASE UPDATE FOR FLOWMAIL
-- This script ONLY adds what's needed for manual subscriber management
-- It will NOT delete or break any existing data
-- Safe to run multiple times

-- Step 1: Make whop_member_id nullable (allows manual entries)
-- This is safe - it only removes the NOT NULL constraint
ALTER TABLE subscribers ALTER COLUMN whop_member_id DROP NOT NULL;

-- Step 2: Add source column to track subscriber origin
-- This is safe - it only adds a new column with a default value
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'whop_sync';

-- Step 3: Update existing records to have source (safe update)
-- This only updates records that don't have a source value
UPDATE subscribers SET source = 'whop_sync' WHERE source IS NULL;

-- Step 4: Drop old unique constraint (safe - we'll replace it with a better one)
ALTER TABLE subscribers DROP CONSTRAINT IF EXISTS subscribers_user_id_whop_member_id_key;

-- Step 5: Add new unique constraint that allows NULL whop_member_id
-- This prevents duplicate Whop members while allowing manual entries
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscribers_unique_whop 
ON subscribers(user_id, whop_member_id) 
WHERE whop_member_id IS NOT NULL;

-- Step 6: Add unique constraint for email per user
-- This prevents duplicate emails for the same user
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscribers_unique_email 
ON subscribers(user_id, email);

-- Step 7: Add comment for documentation
COMMENT ON COLUMN subscribers.source IS 'Source of subscriber: whop_sync, manual_add, manual_upload';

-- Verification query (optional - you can run this to check everything worked)
-- SELECT 
--   column_name, 
--   is_nullable, 
--   column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'subscribers' 
-- ORDER BY ordinal_position;