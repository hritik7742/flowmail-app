# 📧 **Plan Limits Testing Guide**

## **📋 Plan Structure Summary**

### **Free Plan:**
- ✅ **10 emails per day** (daily limit only)
- ✅ **No monthly limit** (just daily restriction)
- ✅ **Reset daily** at midnight

### **Paid Plans (Monthly Limits Only):**
- **Starter:** 3,000 emails per month
- **Growth:** 5,000 emails per month  
- **Pro:** 10,000 emails per month
- ✅ **No daily limit** (use monthly allowance as needed)
- ✅ **Reset monthly** on subscription renewal

## **🧪 Testing Scenarios**

### **Test 1: Free Plan Daily Limit**
```sql
-- Check free user can send 10 emails today
SELECT * FROM check_email_sending_eligibility('free_user_id', 10);
-- Should return: can_send = true

-- Check free user cannot send 11th email today
SELECT * FROM check_email_sending_eligibility('free_user_id', 1);
-- Should return: can_send = false, reason = 'Daily limit reached'
```

### **Test 2: Starter Plan Monthly Limit**
```sql
-- Check starter user can send 3000 emails this month
SELECT * FROM check_email_sending_eligibility('starter_user_id', 3000);
-- Should return: can_send = true

-- Check starter user cannot send 3001st email this month
SELECT * FROM check_email_sending_eligibility('starter_user_id', 1);
-- Should return: can_send = false, reason = 'Monthly limit reached'
```

### **Test 3: Growth Plan Monthly Limit**
```sql
-- Check growth user can send 5000 emails this month
SELECT * FROM check_email_sending_eligibility('growth_user_id', 5000);
-- Should return: can_send = true

-- Check growth user cannot send 5001st email this month
SELECT * FROM check_email_sending_eligibility('growth_user_id', 1);
-- Should return: can_send = false, reason = 'Monthly limit reached'
```

### **Test 4: Pro Plan Monthly Limit**
```sql
-- Check pro user can send 10000 emails this month
SELECT * FROM check_email_sending_eligibility('pro_user_id', 10000);
-- Should return: can_send = true

-- Check pro user cannot send 10001st email this month
SELECT * FROM check_email_sending_eligibility('pro_user_id', 1);
-- Should return: can_send = false, reason = 'Monthly limit reached'
```

## **🔄 Reset Functions**

### **Daily Reset (for Free Users):**
```sql
-- Run this daily at midnight
SELECT reset_daily_email_limits();
```

### **Monthly Reset (for Paid Users):**
```sql
-- Run this monthly on subscription renewal
SELECT reset_monthly_email_limits();
```

## **📊 Monitoring Queries**

### **Check User Plan Status:**
```sql
SELECT 
  whop_user_id,
  plan,
  emails_sent_today,
  emails_sent_this_month,
  CASE 
    WHEN plan = 'free' THEN 10
    ELSE NULL
  END as daily_limit,
  CASE 
    WHEN plan = 'starter' THEN 3000
    WHEN plan = 'growth' THEN 5000
    WHEN plan = 'pro' THEN 10000
    ELSE NULL
  END as monthly_limit
FROM users 
WHERE whop_user_id = 'your_user_id';
```

### **Check Plan Summary:**
```sql
SELECT * FROM get_plan_summary('your_user_id');
```

### **Check Email Sending Eligibility:**
```sql
SELECT * FROM check_email_sending_eligibility('your_user_id', 100);
```

## **🎯 Webhook Integration**

### **When Payment Succeeds:**
1. ✅ User plan updated to `starter`/`growth`/`pro`
2. ✅ `emails_sent_this_month` reset to 0
3. ✅ `emails_sent_today` reset to 0
4. ✅ User can now send up to monthly limit

### **When Subscription Renews:**
1. ✅ `emails_sent_this_month` reset to 0
2. ✅ User gets fresh monthly allowance

### **When Subscription Cancels:**
1. ✅ User downgraded to `free` plan
2. ✅ Now limited to 10 emails per day
3. ✅ `emails_sent_today` reset to 0

## **🚨 Edge Cases**

### **Free User Sends 10 Emails:**
- ✅ Can send 10th email
- ❌ Cannot send 11th email
- ✅ Can send 1 email tomorrow (after daily reset)

### **Paid User Sends Monthly Limit:**
- ✅ Can send up to monthly limit
- ❌ Cannot send more until next month
- ✅ Can upgrade plan for more emails

### **User Upgrades Plan:**
- ✅ Plan updated immediately
- ✅ New monthly limit applied
- ✅ `emails_sent_this_month` reset to 0

## **✅ Success Indicators**

### **Free Plan Working:**
- ✅ User can send 10 emails per day
- ✅ Cannot send 11th email same day
- ✅ Can send 1 email next day (after reset)

### **Paid Plan Working:**
- ✅ User can send up to monthly limit
- ✅ No daily restriction
- ✅ Cannot send more than monthly limit
- ✅ Fresh allowance on subscription renewal

## **🔧 API Integration**

### **Check Before Sending:**
```javascript
// Check if user can send emails
const eligibility = await supabase
  .rpc('check_email_sending_eligibility', {
    user_whop_id: userId,
    email_count: emailCount
  });

if (!eligibility.data[0].can_send) {
  throw new Error(eligibility.data[0].reason);
}
```

### **Update Usage After Sending:**
```javascript
// Update email usage
await supabase
  .rpc('update_email_usage', {
    user_whop_id: userId,
    emails_sent: emailCount
  });
```

Your plan structure is now **perfectly implemented**! 🚀
