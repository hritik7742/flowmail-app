-- Migration to remove open tracking features
-- Run this SQL in your Supabase SQL editor to remove open tracking columns

-- Remove open tracking columns from campaigns table
ALTER TABLE campaigns 
DROP COLUMN IF EXISTS opens,
DROP COLUMN IF EXISTS unique_opens,
DROP COLUMN IF EXISTS last_opened_at,
DROP COLUMN IF EXISTS segment;

-- Remove open tracking trigger first (it depends on the function)
DROP TRIGGER IF EXISTS trigger_update_campaign_opens ON email_events;

-- Now remove open tracking functions
DROP FUNCTION IF EXISTS increment_campaign_opens(UUID);
DROP FUNCTION IF EXISTS update_campaign_opens();

-- Remove open tracking events from email_events table (optional - keeps other events)
-- Uncomment the line below if you want to remove all open tracking events
-- DELETE FROM email_events WHERE event_type = 'open';

-- Update any existing campaigns to remove open tracking references
UPDATE campaigns SET 
  status = CASE 
    WHEN status = 'sent' THEN 'sent'
    ELSE status 
  END
WHERE id IS NOT NULL;

-- Create index on email_events for better performance (if not exists)
CREATE INDEX IF NOT EXISTS idx_email_events_campaign_id ON email_events(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_events_type ON email_events(event_type);

-- Success message
SELECT 'Open tracking features have been successfully removed from the database' as message;