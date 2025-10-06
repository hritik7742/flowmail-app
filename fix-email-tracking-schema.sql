-- Fix email_events table for proper Resend webhook tracking
-- Run this in your Supabase SQL Editor

-- First, let's check if the table exists and what columns it has
-- If you get errors, it means some columns already exist (which is fine)

-- Update email_events table structure
ALTER TABLE email_events 
ADD COLUMN IF NOT EXISTS email_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS recipient_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS subject VARCHAR(500),
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Update campaigns table for better tracking
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS resend_batch_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS click_count INTEGER DEFAULT 0;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_email_events_email_id ON email_events(email_id);
CREATE INDEX IF NOT EXISTS idx_email_events_recipient ON email_events(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_events_type ON email_events(event_type);
CREATE INDEX IF NOT EXISTS idx_email_events_created_at ON email_events(created_at);

-- Create index for campaign tracking
CREATE INDEX IF NOT EXISTS idx_campaigns_resend_batch_id ON campaigns(resend_batch_id);


  AFTER INSERT ON email_events
  FOR EACH ROW
  EXECUTE FUNCTION update_campaign_opens();

-- Enable RLS if not already enabled
ALTER TABLE email_events ENABLE ROW LEVEL SECURITY;

-- Create or update policy for email_events
DROP POLICY IF EXISTS "Allow all operations on email_events" ON email_events;
CREATE POLICY "Allow all operations on email_events" ON email_events
  FOR ALL USING (true);

-- Test the schema by inserting a sample event (optional)
-- INSERT INTO email_events (campaign_id, event_type, email_id, recipient_email, subject)
-- VALUES (
--   (SELECT id FROM campaigns LIMIT 1),
--   'opened',
--   'test_email_id_123',
--   'test@example.com',
--   'Test Email Subject'
-- );

-- Verify the schema
SELECT 
  column_name, 
  data_type, 
  is_nullable 
FROM information_schema.columns 
WHERE table_name = 'email_events' 
ORDER BY ordinal_position;