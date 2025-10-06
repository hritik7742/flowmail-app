# Resend Webhook Setup Checklist

## Before You Start
- [ ] You have a Resend account and API key
- [ ] Your FlowMail app is running
- [ ] You know your app's URL (localhost:3000 for development)

## Step 1: Database Setup (5 minutes)
- [ ] Open Supabase SQL Editor
- [ ] Copy and paste the contents of `fix-email-tracking-schema.sql`
- [ ] Click "Run" to execute the SQL
- [ ] Verify no errors occurred

## Step 2: Create HTTPS Tunnel (2 minutes)
- [ ] Install ngrok from [ngrok.com](https://ngrok.com)
- [ ] Run your app: `npm run dev`
- [ ] In another terminal: `ngrok http 3000`
- [ ] Copy the HTTPS URL (like `https://abc123.ngrok.io`)

## Step 3: Resend Dashboard Setup (3 minutes)
- [ ] Go to [resend.com](https://resend.com) and login
- [ ] Click "Webhooks" in the left sidebar
- [ ] Click "Add Webhook" button
- [ ] Fill in the form:
  - **Endpoint URL**: `https://your-ngrok-url.ngrok.io/api/webhooks/resend`
  - **Events**: Check all these boxes:
    - [ ] email.sent
    - [ ] email.delivered  
    - [ ] email.opened (MOST IMPORTANT!)
    - [ ] email.clicked
    - [ ] email.bounced
    - [ ] email.complained
  - **Status**: Active
- [ ] Click "Create Webhook"
- [ ] Webhook appears in your list

## Step 4: Test the Setup (2 minutes)
- [ ] Visit: `http://localhost:3000/api/verify-tracking-setup`
- [ ] Check that all items show ✅ (green checkmarks)
- [ ] If any show ❌, fix those issues first

## Step 5: Test with Real Email (5 minutes)
- [ ] Go to your FlowMail app
- [ ] Send a test campaign to your own email
- [ ] Check your inbox and open the email
- [ ] Go back to FlowMail analytics dashboard
- [ ] Verify open rate increased

## Step 6: Production Setup (when ready)
- [ ] Update webhook URL to your production domain
- [ ] Test again with production URL
- [ ] Monitor logs for webhook events

## Quick URLs for Testing

**Development:**
- Verify Setup: `http://localhost:3000/api/verify-tracking-setup`
- Test Webhook: `http://localhost:3000/api/test-resend-webhook`

**Production:**
- Verify Setup: `https://your-domain.com/api/verify-tracking-setup`
- Test Webhook: `https://your-domain.com/api/test-resend-webhook`

## Expected Results ✅

After successful setup:
- Email opens are tracked in real-time
- Analytics dashboard shows accurate open rates
- Recent opens appear in dashboard
- Webhook events appear in your app logs

## If Something Goes Wrong ❌

**Webhook not receiving events:**
1. Check webhook is "Active" in Resend dashboard
2. Verify endpoint URL is correct and accessible
3. Check your app logs for errors

**Database errors:**
1. Make sure you ran the SQL schema update
2. Check Supabase connection in your app
3. Verify table permissions

**Open rates not updating:**
1. Check webhook events are being received
2. Verify database is being updated
3. Check campaign IDs are being tracked correctly

## Need More Help?

- Read: `RESEND-BEGINNER-SETUP.md` for detailed explanations
- Check: `/api/verify-tracking-setup` endpoint for diagnostics
- Review: Application logs for error messages