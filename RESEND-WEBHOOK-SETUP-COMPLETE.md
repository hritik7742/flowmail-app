# Complete Resend Webhook Setup for Email Open Tracking

## Overview
This guide will help you set up Resend webhooks to track email opens and calculate accurate open rates in your FlowMail app.

## Step 1: Update Database Schema

First, we need to update the email_events table to properly track Resend webhook data:

```sql
-- Update email_events table structure
ALTER TABLE email_events 
ADD COLUMN IF NOT EXISTS email_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS recipient_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS subject VARCHAR(500),
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_email_events_email_id ON email_events(email_id);
CREATE INDEX IF NOT EXISTS idx_email_events_recipient ON email_events(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_events_type ON email_events(event_type);

-- Add campaign tracking columns to campaigns table
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS resend_batch_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS unique_opens INTEGER DEFAULT 0;
```

## Step 2: Configure Resend Webhook

1. **Login to Resend Dashboard**: Go to https://resend.com/dashboard
2. **Navigate to Webhooks**: Click on "Webhooks" in the sidebar
3. **Create New Webhook**: Click "Add Webhook"
4. **Configure Webhook**:
   - **Endpoint URL**: `https://your-domain.com/api/webhooks/resend`
   - **Events to Subscribe**:
     - ✅ `email.sent`
     - ✅ `email.delivered` 
     - ✅ `email.opened` (Most important for tracking)
     - ✅ `email.clicked`
     - ✅ `email.bounced`
     - ✅ `email.complained`
   - **Status**: Active

5. **Save Webhook**: Click "Create Webhook"
6. **Copy Webhook Secret**: Save the webhook signing secret for verification (optional but recommended)

## Step 3: Environment Variables

Add to your `.env.development` file:

```env
# Resend Configuration
RESEND_API_KEY=your_resend_api_key_here
RESEND_WEBHOOK_SECRET=your_webhook_secret_here  # Optional but recommended
```

## Step 4: Test the Setup

1. **Send a Test Campaign**: Use the FlowMail interface to send a test campaign
2. **Open the Email**: Open the test email in your inbox
3. **Check Webhook Logs**: Monitor your application logs for webhook events
4. **Verify Database**: Check the `email_events` table for recorded opens
5. **Check Analytics**: Verify that open rates are updating in the dashboard

## Step 5: Webhook URL Examples

### Development (Local)
```
http://localhost:3000/api/webhooks/resend
```

### Production (Vercel)
```
https://your-app.vercel.app/api/webhooks/resend
```

### Production (Custom Domain)
```
https://your-domain.com/api/webhooks/resend
```

## Troubleshooting

### Common Issues:

1. **Webhook Not Receiving Events**:
   - Check that your webhook URL is publicly accessible
   - Verify the webhook is active in Resend dashboard
   - Check application logs for errors

2. **Database Errors**:
   - Run the database schema updates
   - Check Supabase connection
   - Verify table permissions

3. **Open Tracking Not Working**:
   - Ensure emails are sent with proper tracking metadata
   - Check that webhook endpoint is processing `email.opened` events
   - Verify campaign IDs are being stored correctly

### Debug Commands:

```bash
# Check webhook endpoint
curl -X POST https://your-domain.com/api/webhooks/resend \
  -H "Content-Type: application/json" \
  -d '{"type":"email.opened","data":{"email_id":"test","to":["test@example.com"]}}'

# Check database
SELECT * FROM email_events WHERE event_type = 'opened' ORDER BY created_at DESC LIMIT 10;
```

## Expected Results

After successful setup:
- ✅ Email opens are tracked in real-time
- ✅ Open rates are calculated accurately
- ✅ Analytics dashboard shows updated metrics
- ✅ Recent opens appear in the dashboard
- ✅ Campaign statistics are updated automatically

## Security Notes

- Always use HTTPS for webhook endpoints in production
- Consider implementing webhook signature verification
- Monitor webhook logs for suspicious activity
- Rate limit webhook endpoints if necessary

## Next Steps

Once webhooks are working:
1. Set up click tracking for links in emails
2. Implement bounce handling for better deliverability
3. Add unsubscribe tracking
4. Create detailed analytics reports