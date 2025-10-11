-- OPTIMIZED FLOWMAIL DATABASE SCHEMA
-- This schema fixes all the issues mentioned:
-- 1. Proper user isolation
-- 2. Removes unused tables
-- 3. Optimizes database size
-- 4. Ensures each user has separate everything

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop unused tables first (if they exist)
DROP TABLE IF EXISTS email_templates CASCADE;
DROP TABLE IF EXISTS email_usage_logs CASCADE;
DROP TABLE IF EXISTS plan_changes CASCADE;
DROP TABLE IF EXISTS subscription_events CASCADE;

-- Users table (optimized - only essential fields)
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    whop_user_id TEXT UNIQUE NOT NULL,
    email TEXT,
    company_name TEXT,
    plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'growth', 'pro')),
    emails_sent_this_month INTEGER DEFAULT 0,
    emails_sent_today INTEGER DEFAULT 0,
    last_email_reset_date DATE DEFAULT CURRENT_DATE,
    sender_name TEXT DEFAULT 'noreply',
    sender_email TEXT,
    sender_email_configured BOOLEAN DEFAULT FALSE,
    display_name TEXT,
    username TEXT,
    unique_code TEXT UNIQUE,
    reply_to_email TEXT,
    custom_domain TEXT,
    domain_verified BOOLEAN DEFAULT FALSE,
    domain_verified_at TIMESTAMP WITH TIME ZONE,
    resend_domain_id TEXT,
    domain_dns_records JSONB,
    subscription_status TEXT DEFAULT 'free' CHECK (subscription_status IN ('free', 'active', 'cancelled', 'expired')),
    subscription_id TEXT,
    whop_subscription_id TEXT,
    whop_plan_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campaigns table (optimized)
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    preview_text TEXT,
    html_content TEXT NOT NULL,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent')),
    scheduled_for TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    total_recipients INTEGER DEFAULT 0,
    opens INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscribers table (optimized with proper user isolation)
CREATE TABLE IF NOT EXISTS subscribers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    whop_member_id TEXT, -- NULL for manual entries
    email TEXT NOT NULL,
    name TEXT,
    tier TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    source TEXT DEFAULT 'whop_sync' CHECK (source IN ('whop_sync', 'manual_add', 'manual_upload')),
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email events table (optimized for tracking)
CREATE TABLE IF NOT EXISTS email_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    subscriber_id UUID REFERENCES subscribers(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- Added for better user isolation
    event_type TEXT CHECK (event_type IN ('sent', 'delivered', 'open', 'click', 'bounced', 'complained')),
    email_id TEXT,
    recipient_email TEXT,
    subject TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create optimized indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_whop_user_id ON users(whop_user_id);
CREATE INDEX IF NOT EXISTS idx_users_unique_code ON users(unique_code);
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_subscribers_user_id ON subscribers(user_id);
CREATE INDEX IF NOT EXISTS idx_subscribers_email ON subscribers(user_id, email);
CREATE INDEX IF NOT EXISTS idx_subscribers_whop_member_id ON subscribers(user_id, whop_member_id) WHERE whop_member_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_subscribers_status ON subscribers(user_id, status);
CREATE INDEX IF NOT EXISTS idx_email_events_campaign_id ON email_events(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_events_subscriber_id ON email_events(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_email_events_user_id ON email_events(user_id);
CREATE INDEX IF NOT EXISTS idx_email_events_type ON email_events(event_type);

-- Create unique constraints for data integrity
-- Each user can only have one subscriber per email
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscribers_unique_email_per_user 
ON subscribers(user_id, email);

-- Each user can only have one subscriber per whop_member_id (when not null)
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscribers_unique_whop_member_per_user 
ON subscribers(user_id, whop_member_id) 
WHERE whop_member_id IS NOT NULL;

-- Add comments for documentation
COMMENT ON TABLE users IS 'User accounts with Whop integration';
COMMENT ON TABLE campaigns IS 'Email campaigns created by users';
COMMENT ON TABLE subscribers IS 'Email subscribers for each user (from Whop or manual)';
COMMENT ON TABLE email_events IS 'Email tracking events (opens, clicks, etc.)';

COMMENT ON COLUMN subscribers.whop_member_id IS 'Whop member ID - NULL for manual entries';
COMMENT ON COLUMN subscribers.source IS 'Source of subscriber: whop_sync, manual_add, manual_upload';
COMMENT ON COLUMN email_events.user_id IS 'Added for better user isolation and query performance';

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for users table
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to increment campaign opens
CREATE OR REPLACE FUNCTION increment_campaign_opens(campaign_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE campaigns 
    SET opens = opens + 1 
    WHERE id = campaign_id;
END;
$$ language 'plpgsql';

-- Create function to increment campaign clicks
CREATE OR REPLACE FUNCTION increment_campaign_clicks(campaign_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE campaigns 
    SET clicks = clicks + 1 
    WHERE id = campaign_id;
END;
$$ language 'plpgsql';

-- Create function to reset daily email count
CREATE OR REPLACE FUNCTION reset_daily_email_count()
RETURNS void AS $$
BEGIN
    UPDATE users 
    SET emails_sent_today = 0, 
        last_email_reset_date = CURRENT_DATE 
    WHERE last_email_reset_date < CURRENT_DATE;
END;
$$ language 'plpgsql';

-- Create function to get user's active subscribers count
CREATE OR REPLACE FUNCTION get_user_subscriber_count(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    subscriber_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO subscriber_count
    FROM subscribers 
    WHERE user_id = user_uuid AND status = 'active';
    
    RETURN subscriber_count;
END;
$$ language 'plpgsql';

-- Grant necessary permissions (adjust as needed for your setup)
-- GRANT ALL ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO your_app_user;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO your_app_user;
