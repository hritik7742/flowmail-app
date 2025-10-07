-- Updated schema for correct plan limits
-- Free: 10 emails per day (daily limit only)
-- Paid plans: Monthly limits only (no daily restriction)

-- 1. Update the plan limits function
CREATE OR REPLACE FUNCTION get_user_plan_limits(user_whop_id TEXT)
RETURNS TABLE (
  plan_name TEXT,
  daily_email_limit INTEGER,
  monthly_email_limit INTEGER,
  has_daily_limit BOOLEAN,
  has_monthly_limit BOOLEAN,
  can_use_custom_domain BOOLEAN,
  can_use_advanced_analytics BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.plan,
    CASE 
      WHEN u.plan = 'free' THEN 10
      ELSE NULL  -- No daily limit for paid plans
    END as daily_email_limit,
    CASE 
      WHEN u.plan = 'free' THEN NULL  -- No monthly limit for free
      WHEN u.plan = 'starter' THEN 3000
      WHEN u.plan = 'growth' THEN 5000
      WHEN u.plan = 'pro' THEN 10000
      ELSE NULL
    END as monthly_email_limit,
    CASE 
      WHEN u.plan = 'free' THEN true
      ELSE false
    END as has_daily_limit,
    CASE 
      WHEN u.plan = 'free' THEN false
      ELSE true
    END as has_monthly_limit,
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

-- 2. Update the email sending check function
CREATE OR REPLACE FUNCTION can_user_send_emails(user_whop_id TEXT, email_count INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  user_plan TEXT;
  emails_sent_today INTEGER;
  emails_sent_this_month INTEGER;
BEGIN
  -- Get user plan and current usage
  SELECT 
    u.plan,
    u.emails_sent_today,
    u.emails_sent_this_month
  INTO user_plan, emails_sent_today, emails_sent_this_month
  FROM users u
  WHERE u.whop_user_id = user_whop_id;
  
  -- Check if user exists
  IF user_plan IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Free plan: Check daily limit only
  IF user_plan = 'free' THEN
    IF emails_sent_today + email_count > 10 THEN
      RETURN FALSE;
    END IF;
  END IF;
  
  -- Paid plans: Check monthly limit only
  IF user_plan IN ('starter', 'growth', 'pro') THEN
    IF user_plan = 'starter' AND emails_sent_this_month + email_count > 3000 THEN
      RETURN FALSE;
    ELSIF user_plan = 'growth' AND emails_sent_this_month + email_count > 5000 THEN
      RETURN FALSE;
    ELSIF user_plan = 'pro' AND emails_sent_this_month + email_count > 10000 THEN
      RETURN FALSE;
    END IF;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 3. Update the user subscription status view
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
  -- Daily limits (only for free plan)
  CASE 
    WHEN u.plan = 'free' THEN 10
    ELSE NULL
  END as daily_email_limit,
  -- Monthly limits (only for paid plans)
  CASE 
    WHEN u.plan = 'free' THEN NULL
    WHEN u.plan = 'starter' THEN 3000
    WHEN u.plan = 'growth' THEN 5000
    WHEN u.plan = 'pro' THEN 10000
    ELSE NULL
  END as monthly_email_limit,
  -- Check if daily limit reached (free only)
  CASE 
    WHEN u.plan = 'free' AND u.emails_sent_today >= 10 THEN true
    ELSE false
  END as daily_limit_reached,
  -- Check if monthly limit reached (paid only)
  CASE 
    WHEN u.plan = 'starter' AND u.emails_sent_this_month >= 3000 THEN true
    WHEN u.plan = 'growth' AND u.emails_sent_this_month >= 5000 THEN true
    WHEN u.plan = 'pro' AND u.emails_sent_this_month >= 10000 THEN true
    ELSE false
  END as monthly_limit_reached,
  -- Plan features
  CASE 
    WHEN u.plan IN ('growth', 'pro') THEN true
    ELSE false
  END as can_use_custom_domain,
  CASE 
    WHEN u.plan IN ('growth', 'pro') THEN true
    ELSE false
  END as can_use_advanced_analytics
FROM users u;

-- 4. Add function to get plan summary
CREATE OR REPLACE FUNCTION get_plan_summary(user_whop_id TEXT)
RETURNS TABLE (
  plan_name TEXT,
  limit_type TEXT,
  limit_value INTEGER,
  used_emails INTEGER,
  remaining_emails INTEGER,
  limit_reached BOOLEAN
) AS $$
DECLARE
  user_plan TEXT;
  emails_sent_today INTEGER;
  emails_sent_this_month INTEGER;
BEGIN
  -- Get user data
  SELECT 
    u.plan,
    u.emails_sent_today,
    u.emails_sent_this_month
  INTO user_plan, emails_sent_today, emails_sent_this_month
  FROM users u
  WHERE u.whop_user_id = user_whop_id;
  
  -- Return appropriate limit based on plan
  IF user_plan = 'free' THEN
    RETURN QUERY SELECT 
      'free'::TEXT,
      'daily'::TEXT,
      10,
      emails_sent_today,
      10 - emails_sent_today,
      (emails_sent_today >= 10)::BOOLEAN;
  ELSIF user_plan = 'starter' THEN
    RETURN QUERY SELECT 
      'starter'::TEXT,
      'monthly'::TEXT,
      3000,
      emails_sent_this_month,
      3000 - emails_sent_this_month,
      (emails_sent_this_month >= 3000)::BOOLEAN;
  ELSIF user_plan = 'growth' THEN
    RETURN QUERY SELECT 
      'growth'::TEXT,
      'monthly'::TEXT,
      5000,
      emails_sent_this_month,
      5000 - emails_sent_this_month,
      (emails_sent_this_month >= 5000)::BOOLEAN;
  ELSIF user_plan = 'pro' THEN
    RETURN QUERY SELECT 
      'pro'::TEXT,
      'monthly'::TEXT,
      10000,
      emails_sent_this_month,
      10000 - emails_sent_this_month,
      (emails_sent_this_month >= 10000)::BOOLEAN;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 5. Add function to reset limits (run monthly for paid users)
CREATE OR REPLACE FUNCTION reset_monthly_email_limits()
RETURNS VOID AS $$
BEGIN
  -- Reset monthly limits for paid users only
  UPDATE users 
  SET 
    emails_sent_this_month = 0,
    subscription_updated_at = NOW()
  WHERE plan IN ('starter', 'growth', 'pro') 
    AND subscription_status = 'active';
END;
$$ LANGUAGE plpgsql;

-- 6. Add function to reset daily limits (run daily for free users)
CREATE OR REPLACE FUNCTION reset_daily_email_limits()
RETURNS VOID AS $$
BEGIN
  -- Reset daily limits for free users only
  UPDATE users 
  SET 
    emails_sent_today = 0,
    last_email_reset_date = CURRENT_DATE
  WHERE plan = 'free' 
    AND last_email_reset_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- 7. Add function to check if user can send emails (updated logic)
CREATE OR REPLACE FUNCTION check_email_sending_eligibility(user_whop_id TEXT, email_count INTEGER)
RETURNS TABLE (
  can_send BOOLEAN,
  reason TEXT,
  limit_type TEXT,
  current_usage INTEGER,
  limit_value INTEGER,
  remaining INTEGER
) AS $$
DECLARE
  user_plan TEXT;
  emails_sent_today INTEGER;
  emails_sent_this_month INTEGER;
BEGIN
  -- Get user data
  SELECT 
    u.plan,
    u.emails_sent_today,
    u.emails_sent_this_month
  INTO user_plan, emails_sent_today, emails_sent_this_month
  FROM users u
  WHERE u.whop_user_id = user_whop_id;
  
  -- Check if user exists
  IF user_plan IS NULL THEN
    RETURN QUERY SELECT FALSE, 'User not found', 'none', 0, 0, 0;
    RETURN;
  END IF;
  
  -- Free plan: Check daily limit
  IF user_plan = 'free' THEN
    IF emails_sent_today + email_count > 10 THEN
      RETURN QUERY SELECT 
        FALSE, 
        'Daily limit reached (10 emails per day)', 
        'daily',
        emails_sent_today,
        10,
        10 - emails_sent_today;
    ELSE
      RETURN QUERY SELECT 
        TRUE, 
        'Can send emails', 
        'daily',
        emails_sent_today,
        10,
        10 - emails_sent_today;
    END IF;
  END IF;
  
  -- Paid plans: Check monthly limit
  IF user_plan = 'starter' THEN
    IF emails_sent_this_month + email_count > 3000 THEN
      RETURN QUERY SELECT 
        FALSE, 
        'Monthly limit reached (3000 emails per month)', 
        'monthly',
        emails_sent_this_month,
        3000,
        3000 - emails_sent_this_month;
    ELSE
      RETURN QUERY SELECT 
        TRUE, 
        'Can send emails', 
        'monthly',
        emails_sent_this_month,
        3000,
        3000 - emails_sent_this_month;
    END IF;
  END IF;
  
  IF user_plan = 'growth' THEN
    IF emails_sent_this_month + email_count > 5000 THEN
      RETURN QUERY SELECT 
        FALSE, 
        'Monthly limit reached (5000 emails per month)', 
        'monthly',
        emails_sent_this_month,
        5000,
        5000 - emails_sent_this_month;
    ELSE
      RETURN QUERY SELECT 
        TRUE, 
        'Can send emails', 
        'monthly',
        emails_sent_this_month,
        5000,
        5000 - emails_sent_this_month;
    END IF;
  END IF;
  
  IF user_plan = 'pro' THEN
    IF emails_sent_this_month + email_count > 10000 THEN
      RETURN QUERY SELECT 
        FALSE, 
        'Monthly limit reached (10000 emails per month)', 
        'monthly',
        emails_sent_this_month,
        10000,
        10000 - emails_sent_this_month;
    ELSE
      RETURN QUERY SELECT 
        TRUE, 
        'Can send emails', 
        'monthly',
        emails_sent_this_month,
        10000,
        10000 - emails_sent_this_month;
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql;
