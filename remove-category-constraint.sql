-- Remove category constraint entirely for maximum flexibility
-- Run this in your Supabase SQL Editor

-- Drop the category constraint
ALTER TABLE email_templates DROP CONSTRAINT IF EXISTS email_templates_category_check;

-- Verification: Check that the constraint was removed
SELECT conname 
FROM pg_constraint 
WHERE conname = 'email_templates_category_check';