-- Complete FlowMail Production Database Schema
-- Run this in your Supabase SQL Editor for production setup

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Add daily email limits and tracking to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS emails_sent_today INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_email_reset_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free' CHECK (subscription_status IN ('free', 'active', 'cancelled', 'expired'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_last_email_reset_date ON users(last_email_reset_date);
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(subscription_status);
CREATE INDEX IF NOT EXISTS idx_users_subscription_id ON users(subscription_id);
CREATE INDEX IF NOT EXISTS idx_users_plan ON users(plan);

-- Function to reset daily email counts
CREATE OR REPLACE FUNCTION reset_daily_email_counts()
RETURNS void AS $$
BEGIN
    UPDATE users 
    SET 
        emails_sent_today = 0,
        last_email_reset_date = CURRENT_DATE
    WHERE last_email_reset_date < CURRENT_DATE 
    AND plan = 'free'; -- Only reset for free users
END;
$$ LANGUAGE plpgsql;

-- Function to get user's email limit based on plan and type
CREATE OR REPLACE FUNCTION get_email_limit(user_plan TEXT, limit_type TEXT DEFAULT 'daily')
RETURNS INTEGER AS $$
BEGIN
    IF limit_type = 'daily' THEN
        CASE user_plan
            WHEN 'free' THEN RETURN 10;
            ELSE RETURN -1; -- Unlimited daily for paid plans
        END CASE;
    ELSIF limit_type = 'monthly' THEN
        CASE user_plan
            WHEN 'free' THEN RETURN 300; -- 10/day * 30 days
            WHEN 'growth' THEN RETURN 5000;
            WHEN 'pro' THEN RETURN 10000;
            ELSE RETURN 300;
        END CASE;
    END IF;
    
    RETURN 10; -- Default fallback
END;
$$ LANGUAGE plpgsql;

-- Function to check if user can send emails (abuse prevention)
CREATE OR REPLACE FUNCTION can_user_send_emails(user_id UUID, email_count INTEGER DEFAULT 1)
RETURNS JSONB AS $$
DECLARE
    user_record RECORD;
    daily_limit INTEGER;
    monthly_limit INTEGER;
    result JSONB;
BEGIN
    -- Get user data
    SELECT * INTO user_record FROM users WHERE id = user_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'can_send', false,
            'error', 'User not found'
        );
    END IF;
    
    -- Reset daily count if needed
    IF user_record.last_email_reset_date < CURRENT_DATE AND user_record.plan = 'free' THEN
        UPDATE users 
        SET emails_sent_today = 0, last_email_reset_date = CURRENT_DATE 
        WHERE id = user_id;
        user_record.emails_sent_today := 0;
    END IF;
    
    -- Check limits based on plan
    IF user_record.plan = 'free' THEN
        daily_limit := 10;
        IF user_record.emails_sent_today + email_count > daily_limit THEN
            RETURN jsonb_build_object(
                'can_send', false,
                'error', 'Daily limit exceeded',
                'limit_type', 'daily',
                'current_usage', user_record.emails_sent_today,
                'limit', daily_limit,
                'plan', user_record.plan
            );
        END IF;
    ELSE
        -- Check monthly limits for paid plans
        monthly_limit := get_email_limit(user_record.plan, 'monthly');
        IF user_record.emails_sent_this_month + email_count > monthly_limit THEN
            RETURN jsonb_build_object(
                'can_send', false,
                'error', 'Monthly limit exceeded',
                'limit_type', 'monthly',
                'current_usage', user_record.emails_sent_this_month,
                'limit', monthly_limit,
                'plan', user_record.plan
            );
        END IF;
    END IF;
    
    RETURN jsonb_build_object(
        'can_send', true,
        'plan', user_record.plan,
        'daily_usage', user_record.emails_sent_today,
        'monthly_usage', user_record.emails_sent_this_month
    );
END;
$$ LANGUAGE plpgsql;

-- Function to safely increment email counts (with abuse prevention)
CREATE OR REPLACE FUNCTION increment_email_count(user_id UUID, email_count INTEGER DEFAULT 1)
RETURNS JSONB AS $$
DECLARE
    user_record RECORD;
    check_result JSONB;
BEGIN
    -- First check if user can send
    check_result := can_user_send_emails(user_id, email_count);
    
    IF NOT (check_result->>'can_send')::boolean THEN
        RETURN check_result;
    END IF;
    
    -- Get fresh user data
    SELECT * INTO user_record FROM users WHERE id = user_id;
    
    -- Update counts based on plan
    IF user_record.plan = 'free' THEN
        UPDATE users 
        SET emails_sent_today = emails_sent_today + email_count,
            last_email_reset_date = CURRENT_DATE
        WHERE id = user_id;
    ELSE
        UPDATE users 
        SET emails_sent_this_month = emails_sent_this_month + email_count
        WHERE id = user_id;
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'emails_added', email_count,
        'plan', user_record.plan
    );
END;
$$ LANGUAGE plpgsql;

-- Create audit log table for tracking email usage (abuse prevention)
CREATE TABLE IF NOT EXISTS email_usage_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
    emails_sent INTEGER NOT NULL,
    plan_at_time TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for audit logs
CREATE INDEX IF NOT EXISTS idx_email_usage_logs_user_id ON email_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_usage_logs_created_at ON email_usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_email_usage_logs_plan ON email_usage_logs(plan_at_time);

-- Function to log email usage (for audit trail)
CREATE OR REPLACE FUNCTION log_email_usage(
    user_id UUID, 
    campaign_id UUID DEFAULT NULL,
    emails_sent INTEGER DEFAULT 1,
    ip_address INET DEFAULT NULL,
    user_agent TEXT DEFAULT NULL
)
RETURNS void AS $$
DECLARE
    user_plan TEXT;
BEGIN
    -- Get user's current plan
    SELECT plan INTO user_plan FROM users WHERE id = user_id;
    
    -- Insert audit log
    INSERT INTO email_usage_logs (
        user_id, 
        campaign_id, 
        emails_sent, 
        plan_at_time, 
        ip_address, 
        user_agent
    ) VALUES (
        user_id, 
        campaign_id, 
        emails_sent, 
        user_plan, 
        ip_address, 
        user_agent
    );
END;
$$ LANGUAGE plpgsql;

-- Create plan change history table (track upgrades/downgrades)
CREATE TABLE IF NOT EXISTS plan_changes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    old_plan TEXT,
    new_plan TEXT NOT NULL,
    change_reason TEXT, -- 'upgrade', 'downgrade', 'cancellation', 'payment_failed'
    subscription_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for plan changes
CREATE INDEX IF NOT EXISTS idx_plan_changes_user_id ON plan_changes(user_id);
CREATE INDEX IF NOT EXISTS idx_plan_changes_created_at ON plan_changes(created_at);

-- Trigger to log plan changes automatically
CREATE OR REPLACE FUNCTION log_plan_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.plan IS DISTINCT FROM NEW.plan THEN
        INSERT INTO plan_changes (user_id, old_plan, new_plan, change_reason)
        VALUES (NEW.id, OLD.plan, NEW.plan, 'system_update');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for plan changes
DROP TRIGGER IF EXISTS trigger_log_plan_change ON users;
CREATE TRIGGER trigger_log_plan_change
    AFTER UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION log_plan_change();

-- Security: Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_changes ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own data
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (whop_user_id = current_setting('app.current_user_id', true));

CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (whop_user_id = current_setting('app.current_user_id', true));

-- RLS Policy: Users can only access their own campaigns
CREATE POLICY "Users can access own campaigns" ON campaigns
    FOR ALL USING (user_id IN (
        SELECT id FROM users WHERE whop_user_id = current_setting('app.current_user_id', true)
    ));

-- RLS Policy: Users can only access their own subscribers
CREATE POLICY "Users can access own subscribers" ON subscribers
    FOR ALL USING (user_id IN (
        SELECT id FROM users WHERE whop_user_id = current_setting('app.current_user_id', true)
    ));

-- Final verification and cleanup
SELECT 'FlowMail Production Database Setup Complete!' as status, 
       COUNT(*) as total_users,
       COUNT(CASE WHEN plan = 'free' THEN 1 END) as free_users,
       COUNT(CASE WHEN plan = 'growth' THEN 1 END) as growth_users,
       COUNT(CASE WHEN plan = 'pro' THEN 1 END) as pro_users
FROM users;
