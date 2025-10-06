# Database Fix Instructions

## Issue
The `subscribers` table is missing the `source` column, causing the add member and upload CSV features to fail.

## Quick Fix

### Option 1: Run SQL Script (Recommended)
1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `fix-subscribers-table.sql`
4. Click **Run**

### Option 2: Manual SQL Commands
Run these commands in your Supabase SQL Editor:

```sql
-- Add source column to track where subscribers came from
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'whop_sync';

-- Make whop_member_id nullable since manual entries won't have it
ALTER TABLE subscribers ALTER COLUMN whop_member_id DROP NOT NULL;

-- Drop old unique constraint
ALTER TABLE subscribers DROP CONSTRAINT IF EXISTS subscribers_user_id_whop_member_id_key;

-- Add new unique constraint that allows NULL whop_member_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscribers_unique_whop 
ON subscribers(user_id, whop_member_id) 
WHERE whop_member_id IS NOT NULL;

-- Add unique constraint for email per user to prevent duplicate emails
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscribers_unique_email 
ON subscribers(user_id, email);

-- Update existing records to have source
UPDATE subscribers SET source = 'whop_sync' WHERE source IS NULL;
```

## After Running the Fix

1. **Restart your development server**:
   ```bash
   npm run dev
   ```

2. **Test the features**:
   - Try adding a member manually
   - Try uploading a CSV file

## What This Fix Does

- ✅ Adds `source` column to track subscriber origin
- ✅ Makes `whop_member_id` nullable for manual entries
- ✅ Prevents duplicate emails per user
- ✅ Maintains compatibility with existing Whop sync

## Expected Results

After the fix:
- ✅ "Add Member" should work without errors
- ✅ "Upload CSV" should work without errors
- ✅ Input focus should stay in form fields
- ✅ Existing Whop sync functionality preserved