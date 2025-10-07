# 🔧 Webhook Fix Guide

## 🚨 **IMMEDIATE FIX FOR YOUR PAYMENT**

Your payment was successful but the webhook didn't update your plan. Here's how to fix it:

### **Step 1: Manual Fix (Immediate)**
```bash
# Test the manual fix endpoint
curl -X POST https://flowmail-app-gamma.vercel.app/api/manual-payment-fix \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user_J0VPNMgVJaYJD",
    "payment_id": "pay_BEUj1H1297fKue",
    "amount": 50,
    "plan_type": "starter"
  }'
```

### **Step 2: Check Your Current Status**
```bash
# Check if you're in the database
curl -s https://flowmail-app-gamma.vercel.app/api/debug-webhook
```

## 🔍 **Webhook Debugging Steps**

### **1. Check Environment Variables**
Visit: `https://flowmail-app-gamma.vercel.app/api/debug-webhook`

This will show you:
- ✅ Which environment variables are set
- ❌ Which ones are missing
- 🔗 Your webhook URLs

### **2. Test Webhook Endpoint**
```bash
# Test if webhook is reachable
curl -X POST https://flowmail-app-gamma.vercel.app/api/webhooks \
  -H "Content-Type: application/json" \
  -d '{
    "action": "payment.succeeded",
    "data": {
      "id": "test_payment_123",
      "user_id": "user_J0VPNMgVJaYJD",
      "final_amount": 50,
      "currency": "USD",
      "plan_id": "plan_8kwlWN9KRLgBz"
    }
  }'
```

### **3. Check Vercel Function Logs**
1. Go to your Vercel dashboard
2. Click on your project
3. Go to "Functions" tab
4. Click on the webhook function
5. Check the logs for any errors

## 🛠️ **Common Issues & Fixes**

### **Issue 1: Webhook Not Receiving Data**
**Symptoms:** No logs in Vercel functions
**Fix:** 
1. Check webhook URL in Whop dashboard
2. Ensure it's: `https://flowmail-app-gamma.vercel.app/api/webhooks`
3. Verify webhook secret is set

### **Issue 2: User Not Found in Database**
**Symptoms:** "User not found" errors
**Fix:**
1. Check if user exists in Supabase
2. Use manual fix endpoint
3. Verify user_id format

### **Issue 3: Plan Not Updating**
**Symptoms:** Payment succeeds but plan stays "free"
**Fix:**
1. Check plan_id matching
2. Verify environment variables
3. Use manual fix endpoint

## 📋 **Environment Variables Checklist**

Make sure these are set in Vercel:

```bash
# Whop Configuration
WHOP_API_KEY=uA_mRDSBxNRoyswhnIqqKEU5yIYZc0G-Y0ZDNOnswk0
WHOP_WEBHOOK_SECRET=your_webhook_secret_here
NEXT_PUBLIC_WHOP_APP_ID=app_ERaTU0VPiLzli7
NEXT_PUBLIC_WHOP_COMPANY_ID=biz_ONLFgl8n3DgP2y
NEXT_PUBLIC_WHOP_AGENT_USER_ID=user_J0VPNMgVJaYJD

# Plan IDs
WHOP_STARTER_PLAN_ID=plan_8kwlWN9KRLgBz
WHOP_GROWTH_PLAN_ID=plan_5XSDwCIf1wjsI
WHOP_PRO_PLAN_ID=plan_YHLJsUruy51wy

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://cyeqnbqwbnodnscuweiz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🧪 **Testing Your Fix**

### **1. Test Manual Fix**
```bash
curl -X POST https://flowmail-app-gamma.vercel.app/api/manual-payment-fix \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user_J0VPNMgVJaYJD",
    "payment_id": "pay_BEUj1H1297fKue",
    "amount": 50,
    "plan_type": "starter"
  }'
```

### **2. Verify in Database**
Check your Supabase dashboard to see if:
- User exists in `users` table
- Plan is updated to "starter"
- Subscription status is "active"

### **3. Test in App**
1. Go to your FlowMail app
2. Check if your plan shows as "Starter"
3. Verify email limits are updated

## 🚀 **Prevention for Future Payments**

### **1. Set Up Webhook in Whop Dashboard**
1. Go to your Whop app settings
2. Add webhook URL: `https://flowmail-app-gamma.vercel.app/api/webhooks`
3. Select events: `payment.succeeded`, `membership.went_valid`, `membership.went_invalid`
4. Copy the webhook secret to Vercel

### **2. Test Webhook**
```bash
# Test with a small payment
# Check Vercel logs
# Verify database updates
```

## 📞 **Need Help?**

If the manual fix doesn't work:

1. **Check Vercel Logs**: Look for error messages
2. **Check Supabase**: Verify database connection
3. **Check Environment Variables**: Ensure all are set correctly
4. **Test Webhook**: Use the debug endpoint

## 🎯 **Quick Commands**

```bash
# Check webhook status
curl -s https://flowmail-app-gamma.vercel.app/api/debug-webhook

# Manual fix for your payment
curl -X POST https://flowmail-app-gamma.vercel.app/api/manual-payment-fix \
  -H "Content-Type: application/json" \
  -d '{"user_id": "user_J0VPNMgVJaYJD", "payment_id": "pay_BEUj1H1297fKue", "amount": 50, "plan_type": "starter"}'

# Test webhook
curl -X POST https://flowmail-app-gamma.vercel.app/api/webhooks \
  -H "Content-Type: application/json" \
  -d '{"action": "payment.succeeded", "data": {"id": "test", "user_id": "user_J0VPNMgVJaYJD", "final_amount": 50, "currency": "USD"}}'
```
