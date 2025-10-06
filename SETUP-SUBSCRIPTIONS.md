# FlowMail Subscription Setup Guide

## Issues Fixed

✅ **Pricing Display**: Fixed incorrect pricing showing $4,900 instead of $49  
✅ **Payment Type**: Changed from one-time payments to recurring subscriptions  
✅ **Webhook Handling**: Added proper subscription lifecycle management  

## Quick Setup (Automated)

### Option A: Automatic Plan Creation

1. **Run the setup API** (this will create plans for you):
   ```bash
   curl -X POST http://localhost:3000/api/setup-plans
   ```

2. **Copy the returned plan IDs** and update your `.env.development`:
   ```env
   WHOP_GROWTH_PLAN_ID=plan_actual_id_from_response
   WHOP_PRO_PLAN_ID=plan_actual_id_from_response
   ```

3. **Restart your dev server**:
   ```bash
   npm run dev
   ```

### Option B: Manual Plan Creation

1. Go to your [Whop App Dashboard](https://whop.com/dashboard/developer)
2. Select your FlowMail app
3. Go to the **Access Passes** tab
4. Create an access pass called "FlowMail Premium"
5. Add pricing plans:
   - **Growth Plan**: $49/month, 5,000 emails
   - **Pro Plan**: $99/month, 25,000 emails

### 2. Get Plan IDs

1. After creating the pricing plans, click the 3-dot menu on each plan
2. Copy the Plan ID for each plan
3. Update your `.env.development` file:

```env
# Replace with your actual plan IDs from Whop dashboard
WHOP_GROWTH_PLAN_ID=plan_your_actual_growth_plan_id
WHOP_PRO_PLAN_ID=plan_your_actual_pro_plan_id
```

### 3. Configure Webhooks

1. In your Whop app settings, add webhook endpoints:
   - URL: `https://yourdomain.com/api/webhook`
   - Events: `membership.created`, `membership.cancelled`, `membership.expired`, `payment.succeeded`
2. Copy the webhook secret and update your `.env.development`:

```env
WHOP_WEBHOOK_SECRET="your_actual_webhook_secret_here"
```

### 4. Test the Implementation

1. Start your development server: `npm run dev`
2. Go to Settings page in FlowMail
3. Try upgrading to Growth or Pro plan
4. The modal should now show:
   - Correct pricing ($49.00, not $4,900.00)
   - "Recurring payment" instead of "One-time payment"
   - Proper subscription flow

## What Changed

### Payment Flow
- **Before**: One-time charge using `chargeUser()`
- **After**: Subscription checkout using `createCheckoutSession()`

### Webhook Handling
- **Before**: Only handled `payment.succeeded`
- **After**: Handles `membership.created`, `membership.cancelled`, `membership.expired`

### User Experience
- **Before**: Confusing one-time payment messaging
- **After**: Clear subscription messaging with auto-renewal info

## Troubleshooting

### Current Error: "Failed to create checkout session"

This happens because you're using placeholder plan IDs. Here's how to fix it:

1. **Check your current config**:
   ```bash
   curl http://localhost:3000/api/test-subscription
   ```

2. **Create plans automatically**:
   ```bash
   curl -X POST http://localhost:3000/api/setup-plans
   ```

3. **Or list existing plans**:
   ```bash
   curl http://localhost:3000/api/list-plans
   ```

### If pricing still shows incorrectly:
1. Check that your plan IDs are correct in `.env.development`
2. Restart your development server
3. Clear browser cache

### If webhooks aren't working:
1. Verify webhook URL is accessible
2. Check webhook secret matches
3. Monitor webhook logs in Whop dashboard

### If subscriptions don't activate:
1. Check webhook events are configured
2. Verify database schema is up to date
3. Check server logs for webhook processing errors

### Debug Commands

```bash
# Check current environment
curl http://localhost:3000/api/test-subscription

# List existing plans
curl http://localhost:3000/api/list-plans

# Create plans automatically
curl -X POST http://localhost:3000/api/setup-plans

# Test specific plan
curl -X POST http://localhost:3000/api/test-subscription \
  -H "Content-Type: application/json" \
  -d '{"planType":"growth"}'
```