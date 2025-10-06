-- Test Username Data for FlowMail App
-- Run this in Supabase SQL Editor to insert test usernames
-- Based on your actual users table schema

-- First, delete any existing test users (optional - only if you want to clean up)
DELETE FROM users 
WHERE whop_user_id IN (
  'test_user_001', 'test_user_002', 'test_user_003', 'test_user_004',
  'test_user_005', 'test_user_006', 'test_user_007', 'test_user_008'
);

-- Insert test users with different usernames
-- Using the exact schema from your users table
INSERT INTO users (
  whop_user_id,
  email,
  company_name,
  plan,
  emails_sent_this_month,
  emails_sent_today,
  last_email_reset_date,
  unique_code,
  username,
  display_name,
  reply_to_email,
  sender_name,
  sender_email_configured,
  custom_domain,
  domain_verified,
  subscription_status,
  created_at
) VALUES 
(
  'test_user_001',
  'john@example.com',
  'John''s Company',
  'free',
  0,
  0,
  CURRENT_DATE,
  'abc123',
  'john',
  'John Doe',
  'john@example.com',
  'John Doe',
  true,
  null,
  false,
  'free',
  NOW()
),
(
  'test_user_002',
  'sarah@example.com',
  'Sarah''s Business',
  'free',
  0,
  0,
  CURRENT_DATE,
  'def456',
  'sarah',
  'Sarah Smith',
  'sarah@example.com',
  'Sarah Smith',
  true,
  null,
  false,
  'free',
  NOW()
),
(
  'test_user_003',
  'mike@example.com',
  'Mike''s Startup',
  'free',
  0,
  0,
  CURRENT_DATE,
  'ghi789',
  'mike',
  'Mike Johnson',
  'mike@example.com',
  'Mike Johnson',
  true,
  null,
  false,
  'free',
  NOW()
),
(
  'test_user_004',
  'lisa@example.com',
  'Lisa''s Agency',
  'free',
  0,
  0,
  CURRENT_DATE,
  'jkl012',
  'lisa',
  'Lisa Brown',
  'lisa@example.com',
  'Lisa Brown',
  true,
  null,
  false,
  'free',
  NOW()
),
(
  'test_user_005',
  'alex@example.com',
  'Alex''s Studio',
  'free',
  0,
  0,
  CURRENT_DATE,
  'mno345',
  'alex',
  'Alex Wilson',
  'alex@example.com',
  'Alex Wilson',
  true,
  null,
  false,
  'free',
  NOW()
),
(
  'test_user_006',
  'emma@example.com',
  'Emma''s Design',
  'free',
  0,
  0,
  CURRENT_DATE,
  'pqr678',
  'emma',
  'Emma Davis',
  'emma@example.com',
  'Emma Davis',
  true,
  null,
  false,
  'free',
  NOW()
),
(
  'test_user_007',
  'david@example.com',
  'David''s Tech',
  'free',
  0,
  0,
  CURRENT_DATE,
  'stu901',
  'david',
  'David Lee',
  'david@example.com',
  'David Lee',
  true,
  null,
  false,
  'free',
  NOW()
),
(
  'test_user_008',
  'sophia@example.com',
  'Sophia''s Marketing',
  'free',
  0,
  0,
  CURRENT_DATE,
  'vwx234',
  'sophia',
  'Sophia Garcia',
  'sophia@example.com',
  'Sophia Garcia',
  true,
  null,
  false,
  'free',
  NOW()
);

-- Verify the data was inserted
SELECT 
  username, 
  display_name, 
  email,
  whop_user_id,
  unique_code,
  plan,
  subscription_status
FROM users 
WHERE whop_user_id LIKE 'test_user_%'
ORDER BY username;

-- Test scenarios you can now try in the app:
-- ❌ Already taken: john, sarah, mike, lisa, alex, emma, david, sophia
-- ✅ Available: newuser, mycompany, test123, rahul, yourname, etc.

-- Clean up test data (run this when you're done testing):
-- DELETE FROM users WHERE whop_user_id LIKE 'test_user_%';
