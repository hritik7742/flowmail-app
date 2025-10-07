# 🧪 **Whop Webhook Testing Guide**

## **Schema Compatibility: ✅ PERFECT**

Your Supabase schema is **100% compatible** with the Whop webhook system! Here's why:

### **✅ Key Schema Features:**

1. **Users Table** - Perfect for storing plan information
2. **Subscription Events** - Great for logging webhook events  
3. **Plan Changes** - Excellent for tracking plan transitions
4. **Email Usage Logs** - Perfect for plan-based limits

## **🔧 Enhanced Schema Setup**

### **Step 1: Run Schema Enhancements**
Execute the SQL in `whop-webhook-schema-enhancements.sql` in your Supabase SQL editor.

### **Step 2: Test Webhook Integration**

#### **Test 1: Check Webhook Endpoint**
```bash
curl https://flowmail-app-gamma.vercel.app/api/test-webhook-setup
```

#### **Test 2: Test Webhook with Mock Data**
```bash
curl -X POST https://flowmail-app-gamma.vercel.app/api/webhooks \
  -H "Content-Type: application/json" \
  -H "X-Whop-Signature: test" \
  -d '{
    "action": "payment.succeeded",
    "data": {
      "id": "test_payment_123",
      "user_id": "user_test123",
      "plan_id": "plan_8kwlWN9KRLgBz",
      "final_amount": 29.99,
      "currency": "usd"
    }
  }'
```

## **🎯 Plan Management Flow**

### **When Payment Succeeds:**
1. ✅ Webhook receives `payment.succeeded`
2. ✅ User plan updated to `starter`/`growth`/`pro`
3. ✅ Subscription status set to `active`
4. ✅ Plan change logged in `plan_changes` table
5. ✅ Event logged in `subscription_events` table

### **When Membership Changes:**
1. ✅ `membership.went_valid` → Upgrade plan
2. ✅ `membership.went_invalid` → Downgrade to free
3. ✅ All changes tracked and logged

## **📊 Database Queries for Testing**

### **Check User Plan Status:**
```sql
SELECT 
  whop_user_id,
  plan,
  subscription_status,
  emails_sent_today,
  emails_sent_this_month,
  plan_updated_at
FROM users 
WHERE whop_user_id = 'your_user_id';
```

### **Check Webhook Events:**
```sql
SELECT 
  event_type,
  plan_name,
  status,
  created_at,
  metadata
FROM subscription_events 
WHERE user_id = (SELECT id FROM users WHERE whop_user_id = 'your_user_id')
ORDER BY created_at DESC;
```

### **Check Plan Changes:**
```sql
SELECT 
  old_plan,
  new_plan,
  change_reason,
  created_at
FROM plan_changes 
WHERE user_id = (SELECT id FROM users WHERE whop_user_id = 'your_user_id')
ORDER BY created_at DESC;
```

## **🚀 Production Testing**

### **Step 1: Make Test Payment**
1. Go to your FlowMail app
2. Try to upgrade to a paid plan
3. Complete the payment process

### **Step 2: Check Vercel Logs**
1. Go to Vercel Dashboard → Functions
2. Click on `/api/webhooks` function
3. Look for logs:
   ```
   === WHOP WEBHOOK RECEIVED ===
   Action: payment.succeeded
   ✅ Successfully updated user to starter plan
   ```

### **Step 3: Verify Database**
1. Check if user plan updated
2. Verify subscription events logged
3. Confirm plan changes tracked

## **🔍 Troubleshooting**

### **If Webhook Doesn't Work:**
1. **Check Vercel Environment Variables** - Ensure `WHOP_WEBHOOK_SECRET` is set
2. **Verify Webhook URL** - Must be exactly `https://flowmail-app-gamma.vercel.app/api/webhooks`
3. **Check Whop Dashboard** - Ensure webhook is active and events are selected
4. **Check Vercel Logs** - Look for error messages

### **If Plan Doesn't Update:**
1. **Check Database Connection** - Verify Supabase credentials
2. **Check User Exists** - Webhook creates user if doesn't exist
3. **Check Plan IDs** - Ensure environment variables match Whop dashboard
4. **Check Webhook Events** - Verify correct events are selected

## **✅ Success Indicators**

When everything works correctly:
- ✅ Webhook logs show successful processing
- ✅ User plan updates in database
- ✅ Subscription events are logged
- ✅ Plan changes are tracked
- ✅ User sees correct plan in app

## **🎯 Plan Limits by Tier**

| Plan | Daily Emails | Monthly Emails | Custom Domain | Advanced Analytics |
|------|-------------|----------------|---------------|-------------------|
| Free | 100 | 1,000 | ❌ | ❌ |
| Starter | 1,000 | 10,000 | ❌ | ❌ |
| Growth | 5,000 | 50,000 | ✅ | ✅ |
| Pro | 50,000 | 500,000 | ✅ | ✅ |

Your schema is **perfectly designed** for this webhook system! 🚀
