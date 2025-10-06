-- Update Pricing Plans and Email Limits
-- This script updates the database to support the new pricing structure:
-- Starter: $29/month - 3,000 emails
-- Growth: $49/month - 5,000 emails  
-- Pro: $129/month - 10,000 emails

-- Update the plan constraint to include 'starter' plan
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_plan_check;
ALTER TABLE users ADD CONSTRAINT users_plan_check 
  CHECK (plan = ANY (ARRAY['free'::text, 'starter'::text, 'growth'::text, 'pro'::text]));

-- Update subscription status constraint if needed
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_subscription_status_check;
ALTER TABLE users ADD CONSTRAINT users_subscription_status_check 
  CHECK (subscription_status = ANY (ARRAY['free'::text, 'active'::text, 'cancelled'::text, 'expired'::text]));

-- Drop existing functions if they exist (with proper signatures)
DROP FUNCTION IF EXISTS get_email_limit(TEXT, TEXT);
DROP FUNCTION IF EXISTS get_email_limit(TEXT);

-- Add function to get email limits based on plan
CREATE OR REPLACE FUNCTION get_email_limit(plan_name TEXT, limit_type TEXT DEFAULT 'monthly')
RETURNS INTEGER AS $$
BEGIN
  CASE plan_name
    WHEN 'free' THEN
      IF limit_type = 'daily' THEN RETURN 10;
      ELSE RETURN 300; -- 10 * 30 days
      END IF;
    WHEN 'starter' THEN
      IF limit_type = 'daily' THEN RETURN 100; -- 3000/30
      ELSE RETURN 3000;
      END IF;
    WHEN 'growth' THEN
      IF limit_type = 'daily' THEN RETURN 167; -- 5000/30
      ELSE RETURN 5000;
      END IF;
    WHEN 'pro' THEN
      IF limit_type = 'daily' THEN RETURN 334; -- 10000/30
      ELSE RETURN 10000;
      END IF;
    ELSE
      -- Default to free plan limits
      IF limit_type = 'daily' THEN RETURN 10;
      ELSE RETURN 300;
      END IF;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS can_send_emails(UUID, INTEGER);
DROP FUNCTION IF EXISTS increment_email_count(UUID, INTEGER, UUID);

-- Add function to check if user can send emails (with plan expiration check)
CREATE OR REPLACE FUNCTION can_send_emails(
    user_id UUID, 
    email_count INTEGER DEFAULT 1
)
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
    
    -- Check if subscription is expired (for paid plans)
    IF user_record.plan != 'free' AND user_record.subscription_status = 'expired' THEN
        RETURN jsonb_build_object(
            'can_send', false,
            'error', 'Subscription expired. Please renew your plan to continue sending emails.',
            'plan', user_record.plan,
            'subscription_status', user_record.subscription_status,
            'action_required', 'renew_subscription'
        );
    END IF;
    
    -- Check if subscription is cancelled but not expired (allow until expiration)
    IF user_record.plan != 'free' AND user_record.subscription_status = 'cancelled' THEN
        -- User can still use their plan until it expires
        -- This is handled by the subscription_status check above
    END IF;
    
    -- Reset daily count if needed (for free plan)
    IF user_record.last_email_reset_date < CURRENT_DATE AND user_record.plan = 'free' THEN
        UPDATE users 
        SET emails_sent_today = 0, last_email_reset_date = CURRENT_DATE 
        WHERE id = user_id;
        user_record.emails_sent_today := 0;
    END IF;
    
    -- Check limits based on plan
    IF user_record.plan = 'free' THEN
        daily_limit := get_email_limit(user_record.plan, 'daily');
        IF user_record.emails_sent_today + email_count > daily_limit THEN
            RETURN jsonb_build_object(
                'can_send', false,
                'error', 'Daily limit exceeded',
                'limit_type', 'daily',
                'current_usage', user_record.emails_sent_today,
                'limit', daily_limit,
                'plan', user_record.plan,
                'action_required', 'upgrade_plan'
            );
        END IF;
    ELSE
        -- Check monthly limits for paid plans
        monthly_limit := get_email_limit(user_record.plan, 'monthly');
        IF user_record.emails_sent_this_month + email_count > monthly_limit THEN
            RETURN jsonb_build_object(
                'can_send', false,
                'error', 'Monthly limit exceeded. Your limit will reset on your next billing cycle.',
                'limit_type', 'monthly',
                'current_usage', user_record.emails_sent_this_month,
                'limit', monthly_limit,
                'plan', user_record.plan,
                'action_required', 'wait_for_reset'
            );
        END IF;
    END IF;
    
    RETURN jsonb_build_object(
        'can_send', true,
        'plan', user_record.plan,
        'subscription_status', user_record.subscription_status,
        'daily_usage', user_record.emails_sent_today,
        'monthly_usage', user_record.emails_sent_this_month,
        'daily_limit', get_email_limit(user_record.plan, 'daily'),
        'monthly_limit', get_email_limit(user_record.plan, 'monthly')
    );
END;
$$ LANGUAGE plpgsql;

-- Add function to safely increment email counts (with abuse prevention)
CREATE OR REPLACE FUNCTION increment_email_count(
    user_id UUID,
    email_count INTEGER DEFAULT 1,
    campaign_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    user_record RECORD;
    result JSONB;
BEGIN
    -- First check if user can send emails
    result := can_send_emails(user_id, email_count);
    
    IF NOT (result->>'can_send')::boolean THEN
        RETURN result;
    END IF;
    
    -- Get current user data
    SELECT * INTO user_record FROM users WHERE id = user_id;
    
    -- Update email counts based on plan
    IF user_record.plan = 'free' THEN
        UPDATE users 
        SET emails_sent_today = emails_sent_today + email_count,
            updated_at = NOW()
        WHERE id = user_id;
    ELSE
        UPDATE users 
        SET emails_sent_this_month = emails_sent_this_month + email_count,
            updated_at = NOW()
        WHERE id = user_id;
    END IF;
    
    -- Log the usage
    PERFORM log_email_usage(user_id, campaign_id, email_count);
    
    RETURN jsonb_build_object(
        'success', true,
        'emails_sent', email_count,
        'plan', user_record.plan
    );
END;
$$ LANGUAGE plpgsql;

-- Create index for better performance on plan checks
CREATE INDEX IF NOT EXISTS idx_users_plan_subscription ON users(plan, subscription_status);
CREATE INDEX IF NOT EXISTS idx_users_email_limits ON users(emails_sent_today, emails_sent_this_month);

-- Update any existing users to have proper subscription status
UPDATE users 
SET subscription_status = CASE 
    WHEN plan = 'free' THEN 'free'
    WHEN plan IN ('starter', 'growth', 'pro') THEN 'active'
    ELSE 'free'
END
WHERE subscription_status IS NULL;

COMMENT ON FUNCTION get_email_limit(TEXT, TEXT) IS 'Returns email limits based on plan type (daily/monthly)';
COMMENT ON FUNCTION can_send_emails(UUID, INTEGER) IS 'Checks if user can send emails with plan expiration and limit checks';
COMMENT ON FUNCTION increment_email_count(UUID, INTEGER, UUID) IS 'Safely increments email count with validation';
