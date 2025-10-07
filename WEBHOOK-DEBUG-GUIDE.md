# 🔧 Webhook Debug Guide

## Issue: User Plan Not Updating After Payment

### Problem
After a successful payment, the user's plan remains "free" instead of updating to their purchased plan.

### Solution Steps

## 1. Check Webhook Configuration in Whop

### In Whop Dashboard:
1. Go to your app settings
2. Navigate to "Webhooks" section
3. Add webhook URL: `https://your-vercel-domain.vercel.app/api/webhooks`
4. Select these events:
   - ✅ `payment.succeeded`
   - ✅ `membership.went_valid`
   - ✅ `membership.went_invalid`
   - ✅ `membership.cancelled`
   - ✅ `membership.expired`

### Get Webhook Secret:
1. After creating webhook, copy the webhook secret
2. Add to Vercel environment variables: `WHOP_WEBHOOK_SECRET`

## 2. Test Webhook Endpoint

### Test if webhook is reachable:
```bash
# Test GET request
curl https://your-vercel-domain.vercel.app/api/test-webhook

# Test POST request
curl -X POST https://your-vercel-domain.vercel.app/api/test-webhook \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

## 3. Check Vercel Environment Variables

Make sure these are set in Vercel:
```
WHOP_WEBHOOK_SECRET=your_webhook_secret_here
WHOP_STARTER_PLAN_ID=plan_8kwlWN9KRLgBz
WHOP_GROWTH_PLAN_ID=plan_5XSDwCIf1wjsI
WHOP_PRO_PLAN_ID=plan_YHLJsUruy51wy
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
```

## 4. Debug Webhook Logs

### Check Vercel Function Logs:
1. Go to Vercel Dashboard
2. Navigate to your project
3. Go to "Functions" tab
4. Click on `/api/webhooks` function
5. Check logs for webhook events

### Look for these log messages:
```
=== WHOP WEBHOOK RECEIVED ===
Action: payment.succeeded
Data: {...}
=== HANDLING PAYMENT SUCCESS ===
✅ Successfully updated user {user_id} to {plan_type} plan
```

## 5. Database Check

### Verify user exists in database:
```sql
SELECT * FROM users WHERE whop_user_id = 'your_user_id';
```

### Check subscription events:
```sql
SELECT * FROM subscription_events 
WHERE user_id = 'your_user_id' 
ORDER BY created_at DESC;
```

## 6. Common Issues & Solutions

### Issue 1: Webhook not receiving data
**Solution**: Check webhook URL in Whop dashboard

### Issue 2: User not found in database
**Solution**: Webhook now creates user if doesn't exist

### Issue 3: Plan ID mismatch
**Solution**: Verify plan IDs in environment variables match Whop dashboard

### Issue 4: Supabase connection issues
**Solution**: Check SUPABASE_SERVICE_KEY in Vercel

## 7. Manual Plan Update (Emergency)

If webhook fails, manually update user plan:

```sql
UPDATE users 
SET plan = 'starter', 
    subscription_status = 'active',
    plan_updated_at = NOW()
WHERE whop_user_id = 'your_user_id';
```

## 8. Test Payment Flow

1. Make a test payment in your app
2. Check Vercel function logs immediately
3. Verify user plan updated in database
4. Check if user sees correct plan in app

## 9. Webhook Events Explained

- `payment.succeeded`: Payment completed successfully
- `membership.went_valid`: User's membership became active
- `membership.went_invalid`: User's membership became inactive
- `membership.cancelled`: User cancelled their subscription
- `membership.expired`: User's subscription expired

## 10. Debugging Commands

### Check webhook endpoint:
```bash
curl -X POST https://your-domain.vercel.app/api/webhooks \
  -H "Content-Type: application/json" \
  -H "X-Whop-Signature: test" \
  -d '{"action": "payment.succeeded", "data": {"user_id": "test"}}'
```

### Check environment variables:
```bash
curl https://your-domain.vercel.app/api/test-webhook
```

## ✅ Success Indicators

When working correctly, you should see:
1. Webhook logs in Vercel showing payment received
2. User plan updated in database
3. User sees correct plan in app
4. Subscription events logged in database

## 🚨 Emergency Fix

If webhook is completely broken:
1. Manually update user plan in database
2. Check webhook configuration in Whop
3. Verify all environment variables
4. Test with simple webhook first
