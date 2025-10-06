-- Add daily email limits and tracking to users table
-- Run this in your Supabase SQL Editor

-- Add columns for daily email tracking
ALTER TABLE users ADD COLUMN IF NOT EXISTS emails_sent_today INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_email_reset_date DATE DEFAULT CURRENT_DATE;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_users_last_email_reset_date ON users(last_email_reset_date);

-- Function to reset daily email counts
CREATE OR REPLACE FUNCTION reset_daily_email_counts()
RETURNS void AS $$
BEGIN
    UPDATE users 
    SET 
        emails_sent_today = 0,
        last_email_reset_date = CURRENT_DATE
    WHERE last_email_reset_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Function to increment daily email count
CREATE OR REPLACE FUNCTION increment_daily_email_count(user_id UUID, email_count INTEGER DEFAULT 1)
RETURNS void AS $$
BEGIN
    -- First reset counts if needed
    PERFORM reset_daily_email_counts();
    
    -- Then increment the user's count
    UPDATE users 
    SET emails_sent_today = emails_sent_today + email_count
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's daily email limit based on plan
CREATE OR REPLACE FUNCTION get_daily_email_limit(user_plan TEXT)
RETURNS INTEGER AS $$
BEGIN
    CASE user_plan
        WHEN 'free' THEN RETURN 10;
        WHEN 'growth' THEN RETURN 167; -- 5000/30 days
        WHEN 'pro' THEN RETURN 334; -- 10000/30 days (updated from 25000)
        ELSE RETURN 10; -- default to free plan limit
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Verification query
SELECT 'Daily email limits setup completed!' as status, COUNT(*) as total_users FROM users;
