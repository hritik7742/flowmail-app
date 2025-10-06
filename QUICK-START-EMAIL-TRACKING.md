# Quick Start: Email Open Tracking Setup

## 🚀 Quick Setup (5 minutes)

### Step 1: Update Database
Run this SQL in your Supabase SQL Editor:

```sql
-- Add missing columns to email_events table
ALTER TABLE email_events 
ADD COLUMN IF NOT EXISTS email_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS recipient_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS subject VARCHAR(500),
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Add tracking columns to campaigns table  
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS unique_opens INTEGER DEFAULT 0;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_email_events_email_id ON email_events(email_id);
CREATE INDEX IF NOT EXISTS idx_email_events_recipient ON email_events(recipient_email);
```

### Step 2: Configure Resend Webhook
1. Go to [Resend Dashboard](https://resend.com/dashboard) → Webhooks
2. Click "Add Webhook"
3. Set endpoint URL: `https://your-domain.com/api/webhooks/resend`
4. Select events: `email.opened`, `email.sent`, `email.delivered`
5. Save webhook

### Step 3: Test Setup
1. Visit: `https://your-domain.com/api/verify-tracking-setup`
2. Check that all items show ✅
3. Send a test campaign
4. Open the email
5. Check analytics dashboard for updated open rates

## 🔧 Environment Variables Required

```env
RESEND_API_KEY=re_your_api_key_here
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key
NEXTAUTH_URL=https://your-domain.com
```

## ✅ Verification Checklist

- [ ] Database schema updated
- [ ] Resend webhook configured  
- [ ] Environment variables set
- [ ] Verification endpoint shows all green
- [ ] Test email sent and opened
- [ ] Open rates updating in dashboard

## 🐛 Troubleshooting

**Webhook not receiving events?**
- Check webhook URL is publicly accessible
- Verify webhook is active in Resend dashboard
- Check application logs for errors

**Open rates not updating?**
- Ensure database schema is updated
- Check webhook endpoint is processing events
- Verify campaign IDs are being tracked

**Database errors?**
- Run the schema update SQL
- Check Supabase connection
- Verify table permissions

## 📊 Expected Results

After setup:
- ✅ Real-time email open tracking
- ✅ Accurate open rate calculations  
- ✅ Analytics dashboard updates
- ✅ Recent opens display
- ✅ Campaign statistics

## 🔗 Useful Endpoints

- **Verify Setup**: `/api/verify-tracking-setup`
- **Test Webhook**: `/api/test-resend-webhook`  
- **Recent Opens**: `/api/get-recent-opens`
- **Analytics**: `/api/analytics`

## 📞 Need Help?

If you encounter issues:
1. Check the verification endpoint first
2. Review application logs
3. Refer to the complete guide: `RESEND-WEBHOOK-SETUP-COMPLETE.md`