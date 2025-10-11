-- MIGRATION SCRIPT: MIGRATE TO OPTIMIZED SCHEMA
-- This script safely migrates your existing database to the optimized schema
-- Run this in your Supabase SQL Editor

-- Step 1: Backup existing data (optional but recommended)
-- You can export your data first if needed

-- Step 2: Drop unused tables (if they exist)
DROP TABLE IF EXISTS email_templates CASCADE;
DROP TABLE IF EXISTS email_usage_logs CASCADE;
DROP TABLE IF EXISTS plan_changes CASCADE;
DROP TABLE IF EXISTS subscription_events CASCADE;

-- Step 3: Add missing columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS emails_sent_today INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_email_reset_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS sender_name TEXT DEFAULT 'noreply';
ALTER TABLE users ADD COLUMN IF NOT EXISTS sender_email TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS sender_email_configured BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS unique_code TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS reply_to_email TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS custom_domain TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS domain_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS domain_verified_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS resend_domain_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS domain_dns_records JSONB;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free' CHECK (subscription_status IN ('free', 'active', 'cancelled', 'expired'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS whop_subscription_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS whop_plan_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Step 4: Add missing columns to campaigns table
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS opens INTEGER DEFAULT 0;

-- Step 5: Add missing columns to subscribers table
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'whop_sync' CHECK (source IN ('whop_sync', 'manual_add', 'manual_upload'));
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Step 6: Make whop_member_id nullable in subscribers table
ALTER TABLE subscribers ALTER COLUMN whop_member_id DROP NOT NULL;

-- Step 7: Add user_id to email_events table for better isolation
ALTER TABLE email_events ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- Step 8: Drop old constraints that might cause issues
ALTER TABLE subscribers DROP CONSTRAINT IF EXISTS subscribers_user_id_whop_member_id_key;
ALTER TABLE subscribers DROP CONSTRAINT IF EXISTS subscribers_whop_member_id_key;

-- Step 9: Create optimized indexes
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

-- Step 10: Create unique constraints for data integrity
-- Each user can only have one subscriber per email
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscribers_unique_email_per_user 
ON subscribers(user_id, email);

-- Each user can only have one subscriber per whop_member_id (when not null)
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscribers_unique_whop_member_per_user 
ON subscribers(user_id, whop_member_id) 
WHERE whop_member_id IS NOT NULL;

-- Step 11: Create unique constraint for users.unique_code
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_unique_code ON users(unique_code);

-- Step 12: Add comments for documentation
COMMENT ON TABLE users IS 'User accounts with Whop integration';
COMMENT ON TABLE campaigns IS 'Email campaigns created by users';
COMMENT ON TABLE subscribers IS 'Email subscribers for each user (from Whop or manual)';
COMMENT ON TABLE email_events IS 'Email tracking events (opens, clicks, etc.)';

COMMENT ON COLUMN subscribers.whop_member_id IS 'Whop member ID - NULL for manual entries';
COMMENT ON COLUMN subscribers.source IS 'Source of subscriber: whop_sync, manual_add, manual_upload';
COMMENT ON COLUMN email_events.user_id IS 'Added for better user isolation and query performance';

-- Step 13: Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 14: Create trigger for users table
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Step 15: Create utility functions
CREATE OR REPLACE FUNCTION increment_campaign_opens(campaign_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE campaigns 
    SET opens = opens + 1 
    WHERE id = campaign_id;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION increment_campaign_clicks(campaign_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE campaigns 
    SET clicks = clicks + 1 
    WHERE id = campaign_id;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION reset_daily_email_count()
RETURNS void AS $$
BEGIN
    UPDATE users 
    SET emails_sent_today = 0, 
        last_email_reset_date = CURRENT_DATE 
    WHERE last_email_reset_date < CURRENT_DATE;
END;
$$ language 'plpgsql';

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

-- Step 16: Update existing data
-- Set source for existing subscribers
UPDATE subscribers SET source = 'whop_sync' WHERE source IS NULL;

-- Set created_at for existing subscribers
UPDATE subscribers SET created_at = synced_at WHERE created_at IS NULL;

-- Set updated_at for existing users
UPDATE users SET updated_at = created_at WHERE updated_at IS NULL;

-- Step 17: Generate unique codes for existing users who don't have them
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

-- Step 18: Verify migration
SELECT 
    'Migration completed successfully!' as status,
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(*) FROM subscribers) as total_subscribers,
    (SELECT COUNT(*) FROM campaigns) as total_campaigns,
    (SELECT COUNT(*) FROM email_events) as total_events;

-- Step 19: Show table sizes (optional)
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'subscribers', 'campaigns', 'email_events')
ORDER BY tablename, attname;
