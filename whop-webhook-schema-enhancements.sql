-- Enhanced schema for perfect Whop webhook integration
-- Run these SQL commands in your Supabase SQL editor

-- 1. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_whop_user_id ON users(whop_user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_user_id ON subscription_events(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_created_at ON subscription_events(created_at);
CREATE INDEX IF NOT EXISTS idx_plan_changes_user_id ON plan_changes(user_id);

-- 2. Add function to automatically log plan changes
CREATE OR REPLACE FUNCTION log_plan_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if plan actually changed
  IF OLD.plan IS DISTINCT FROM NEW.plan THEN
    INSERT INTO plan_changes (
      user_id,
      old_plan,
      new_plan,
      change_reason,
      subscription_id,
      created_at
    ) VALUES (
      NEW.id,
      OLD.plan,
      NEW.plan,
      'webhook_update',
      NEW.whop_subscription_id,
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create trigger to automatically log plan changes
DROP TRIGGER IF EXISTS trigger_log_plan_change ON users;
CREATE TRIGGER trigger_log_plan_change
  AFTER UPDATE OF plan ON users
  FOR EACH ROW
  EXECUTE FUNCTION log_plan_change();

-- 4. Add function to get user plan limits
CREATE OR REPLACE FUNCTION get_user_plan_limits(user_whop_id TEXT)
RETURNS TABLE (
  plan_name TEXT,
  daily_email_limit INTEGER,
  monthly_email_limit INTEGER,
  can_use_custom_domain BOOLEAN,
  can_use_advanced_analytics BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.plan,
    CASE 
      WHEN u.plan = 'free' THEN 100
      WHEN u.plan = 'starter' THEN 1000
      WHEN u.plan = 'growth' THEN 5000
      WHEN u.plan = 'pro' THEN 50000
      ELSE 100
    END as daily_email_limit,
    CASE 
      WHEN u.plan = 'free' THEN 1000
      WHEN u.plan = 'starter' THEN 10000
      WHEN u.plan = 'growth' THEN 50000
      WHEN u.plan = 'pro' THEN 500000
      ELSE 1000
    END as monthly_email_limit,
    CASE 
      WHEN u.plan IN ('growth', 'pro') THEN true
      ELSE false
    END as can_use_custom_domain,
    CASE 
      WHEN u.plan IN ('growth', 'pro') THEN true
      ELSE false
    END as can_use_advanced_analytics
  FROM users u
  WHERE u.whop_user_id = user_whop_id;
END;
$$ LANGUAGE plpgsql;

-- 5. Add function to check if user can send emails
CREATE OR REPLACE FUNCTION can_user_send_emails(user_whop_id TEXT, email_count INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  user_plan TEXT;
  daily_limit INTEGER;
  monthly_limit INTEGER;
  emails_sent_today INTEGER;
  emails_sent_this_month INTEGER;
BEGIN
  -- Get user plan and limits
  SELECT 
    u.plan,
    CASE 
      WHEN u.plan = 'free' THEN 100
      WHEN u.plan = 'starter' THEN 1000
      WHEN u.plan = 'growth' THEN 5000
      WHEN u.plan = 'pro' THEN 50000
      ELSE 100
    END,
    CASE 
      WHEN u.plan = 'free' THEN 1000
      WHEN u.plan = 'starter' THEN 10000
      WHEN u.plan = 'growth' THEN 50000
      WHEN u.plan = 'pro' THEN 500000
      ELSE 1000
    END,
    u.emails_sent_today,
    u.emails_sent_this_month
  INTO user_plan, daily_limit, monthly_limit, emails_sent_today, emails_sent_this_month
  FROM users u
  WHERE u.whop_user_id = user_whop_id;
  
  -- Check if user exists
  IF user_plan IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check daily limit
  IF emails_sent_today + email_count > daily_limit THEN
    RETURN FALSE;
  END IF;
  
  -- Check monthly limit
  IF emails_sent_this_month + email_count > monthly_limit THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 6. Add function to update email usage
CREATE OR REPLACE FUNCTION update_email_usage(user_whop_id TEXT, emails_sent INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE users 
  SET 
    emails_sent_today = emails_sent_today + emails_sent,
    emails_sent_this_month = emails_sent_this_month + emails_sent,
    updated_at = NOW()
  WHERE whop_user_id = user_whop_id;
END;
$$ LANGUAGE plpgsql;

-- 7. Add function to reset daily email counts (run this daily)
CREATE OR REPLACE FUNCTION reset_daily_email_counts()
RETURNS VOID AS $$
BEGIN
  UPDATE users 
  SET 
    emails_sent_today = 0,
    last_email_reset_date = CURRENT_DATE
  WHERE last_email_reset_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- 8. Add function to get webhook event summary
CREATE OR REPLACE FUNCTION get_webhook_events_summary(days_back INTEGER DEFAULT 7)
RETURNS TABLE (
  event_type TEXT,
  event_count BIGINT,
  latest_event TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    se.event_type,
    COUNT(*) as event_count,
    MAX(se.created_at) as latest_event
  FROM subscription_events se
  WHERE se.created_at >= NOW() - INTERVAL '1 day' * days_back
  GROUP BY se.event_type
  ORDER BY event_count DESC;
END;
$$ LANGUAGE plpgsql;

-- 9. Create view for user subscription status
CREATE OR REPLACE VIEW user_subscription_status AS
SELECT 
  u.id,
  u.whop_user_id,
  u.email,
  u.plan,
  u.subscription_status,
  u.whop_subscription_id,
  u.whop_plan_id,
  u.plan_updated_at,
  u.subscription_updated_at,
  u.emails_sent_today,
  u.emails_sent_this_month,
  CASE 
    WHEN u.plan = 'free' THEN 100
    WHEN u.plan = 'starter' THEN 1000
    WHEN u.plan = 'growth' THEN 5000
    WHEN u.plan = 'pro' THEN 50000
    ELSE 100
  END as daily_email_limit,
  CASE 
    WHEN u.plan = 'free' THEN 1000
    WHEN u.plan = 'starter' THEN 10000
    WHEN u.plan = 'growth' THEN 50000
    WHEN u.plan = 'pro' THEN 500000
    ELSE 1000
  END as monthly_email_limit,
  CASE 
    WHEN u.emails_sent_today >= CASE 
      WHEN u.plan = 'free' THEN 100
      WHEN u.plan = 'starter' THEN 1000
      WHEN u.plan = 'growth' THEN 5000
      WHEN u.plan = 'pro' THEN 50000
      ELSE 100
    END THEN true
    ELSE false
  END as daily_limit_reached,
  CASE 
    WHEN u.emails_sent_this_month >= CASE 
      WHEN u.plan = 'free' THEN 1000
      WHEN u.plan = 'starter' THEN 10000
      WHEN u.plan = 'growth' THEN 50000
      WHEN u.plan = 'pro' THEN 500000
      ELSE 1000
    END THEN true
    ELSE false
  END as monthly_limit_reached
FROM users u;

-- 10. Add RLS policies for security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_changes ENABLE ROW LEVEL SECURITY;

-- Policy for users table
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (whop_user_id = current_setting('app.current_user_id', true));

-- Policy for subscription_events table
CREATE POLICY "Users can view their own subscription events" ON subscription_events
  FOR SELECT USING (user_id IN (
    SELECT id FROM users WHERE whop_user_id = current_setting('app.current_user_id', true)
  ));

-- Policy for plan_changes table
CREATE POLICY "Users can view their own plan changes" ON plan_changes
  FOR SELECT USING (user_id IN (
    SELECT id FROM users WHERE whop_user_id = current_setting('app.current_user_id', true)
  ));
