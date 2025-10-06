# New Pricing Plans Setup Guide

## Updated Pricing Structure

### Plans Overview
- **Free Plan**: $0/month - 10 emails per day (300/month)
- **Starter Plan**: $29/month - 3,000 emails per month
- **Growth Plan**: $49/month - 5,000 emails per month  
- **Pro Plan**: $129/month - 10,000 emails per month

## Environment Variables Setup

Add these environment variables to your `.env.local` file:

```env
# Plan IDs (use the provided IDs or create new ones)
WHOP_STARTER_PLAN_ID=plan_8kwlWN9KRLgBz
WHOP_GROWTH_PLAN_ID=plan_5XSDwCIf1wjsI
WHOP_PRO_PLAN_ID=plan_YHLJsUruy51wy
```

## Database Updates

Run the database update script to add support for the new plan structure:

```sql
-- Run this in your Supabase SQL editor
-- File: update-pricing-plans.sql
```

## Key Features Implemented

### 1. Plan Expiration Handling
- Users can continue using their plan until it expires
- Cancelled subscriptions remain active until expiration date
- Expired subscriptions are blocked from sending emails

### 2. Email Limit Enforcement
- **Free Plan**: 10 emails per day (resets daily)
- **Starter Plan**: 3,000 emails per month (resets on billing cycle)
- **Growth Plan**: 5,000 emails per month (resets on billing cycle)
- **Pro Plan**: 10,000 emails per month (resets on billing cycle)

### 3. Abuse Prevention
- Users cannot exceed their plan limits
- Clear error messages when limits are reached
- Automatic plan validation on every email send

### 4. Subscription Management
- Webhook handling for plan changes
- Automatic plan updates via Whop webhooks
- Plan change history tracking

## Testing the Implementation

1. **Test Plan Limits**:
   - Try sending emails beyond your plan limit
   - Verify error messages are shown
   - Check that limits reset appropriately

2. **Test Plan Changes**:
   - Upgrade/downgrade plans
   - Verify webhook handling works
   - Check plan change history

3. **Test Expiration**:
   - Simulate expired subscriptions
   - Verify users are blocked from sending
   - Test renewal process

## API Endpoints Updated

- `/api/send-campaign` - Updated with new plan limits
- `/api/send-campaign-simple` - Updated with new plan limits  
- `/api/check-email-limits` - Updated with new plan limits
- `/api/charge` - Updated to handle starter plan
- `/api/webhook` - Updated to handle starter plan
- `/api/setup-plans` - Updated to create all three plans

## Settings Page Updates

- Added Starter plan option
- Updated pricing display
- Three-column layout for all plans
- Proper plan feature comparison

## Database Schema Changes

- Added `starter` to plan constraint
- Updated email limit functions
- Added subscription expiration handling
- Enhanced plan change tracking

## Security Features

- Plan validation on every email send
- Subscription status checking
- Abuse prevention measures
- Audit logging for email usage

## Next Steps

1. Update your environment variables
2. Run the database update script
3. Test the new plan structure
4. Deploy to production
5. Monitor plan usage and limits

## Support

If you encounter any issues:
1. Check the database update was successful
2. Verify environment variables are set correctly
3. Test webhook endpoints are working
4. Check plan IDs match your Whop dashboard
