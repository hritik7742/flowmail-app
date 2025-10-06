-- Fix email_templates category constraint to allow all new categories
-- Run this in your Supabase SQL Editor

-- Drop the old constraint
ALTER TABLE email_templates DROP CONSTRAINT IF EXISTS email_templates_category_check;

-- Add new constraint with all the categories we're using
ALTER TABLE email_templates ADD CONSTRAINT email_templates_category_check 
CHECK (category IN (
    'welcome', 
    'newsletter', 
    'promo', 
    'promotion',
    'Welcome',
    'Newsletter', 
    'Promotion',
    'Event',
    'Engagement',
    'Educational',
    'Transactional',
    'Retention',
    'Seasonal',
    'Business',
    'Support'
));

-- Verification: Check that the constraint was updated
SELECT conname, consrc 
FROM pg_constraint 
WHERE conname = 'email_templates_category_check';