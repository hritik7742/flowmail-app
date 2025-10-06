-- Create email_events table for webhook tracking
CREATE TABLE IF NOT EXISTS email_events (
  id SERIAL PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL,
  email_id VARCHAR(255) NOT NULL,
  recipient_email VARCHAR(255) NOT NULL,
  subject VARCHAR(500),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_email_events_email_id ON email_events(email_id);
CREATE INDEX IF NOT EXISTS idx_email_events_recipient ON email_events(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_events_type ON email_events(event_type);
CREATE INDEX IF NOT EXISTS idx_email_events_created_at ON email_events(created_at);

-- Add RLS (Row Level Security) if needed
ALTER TABLE email_events ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (adjust as needed for your security requirements)
CREATE POLICY "Allow all operations on email_events" ON email_events
  FOR ALL USING (true);