-- Fix subscribers table to add missing columns for manual subscriber management

-- Add source column to track where subscribers came from
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'whop_sync';

-- Update the unique constraint to allow multiple entries per user (since we now have manual entries)
-- First drop the old constraint
ALTER TABLE subscribers DROP CONSTRAINT IF EXISTS subscribers_user_id_whop_member_id_key;

-- Make whop_member_id nullable since manual entries won't have it
ALTER TABLE subscribers ALTER COLUMN whop_member_id DROP NOT NULL;

-- Add new unique constraint that allows NULL whop_member_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscribers_unique_whop 
ON subscribers(user_id, whop_member_id) 
WHERE whop_member_id IS NOT NULL;

-- Add unique constraint for email per user to prevent duplicate emails
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscribers_unique_email 
ON subscribers(user_id, email);

-- Update existing records to have source
UPDATE subscribers SET source = 'whop_sync' WHERE source IS NULL;

-- Add comment for clarity
COMMENT ON COLUMN subscribers.source IS 'Source of subscriber: whop_sync, manual_add, manual_upload';