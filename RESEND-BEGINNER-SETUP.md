# Complete Beginner's Guide to Resend Webhooks

## What are Webhooks?
Webhooks are like notifications that Resend sends to your app when something happens (like when someone opens your email). Think of it as Resend calling your app to say "Hey, someone just opened that email you sent!"

## Step-by-Step Setup

### Step 1: Access Resend Dashboard
1. Go to [https://resend.com](https://resend.com)
2. Sign in to your account
3. You should see your dashboard

### Step 2: Navigate to Webhooks
1. In the left sidebar, look for **"Webhooks"**
2. Click on **"Webhooks"**
3. You'll see a page that says "Webhooks" at the top

### Step 3: Create Your First Webhook
1. Click the **"Add Webhook"** button (usually blue/purple button)
2. You'll see a form with several fields

### Step 4: Fill Out the Webhook Form

#### **Endpoint URL** (Most Important!)
This is where Resend will send the notifications. You need to enter:

**For Development (Local Testing):**
```
https://your-ngrok-url.ngrok.io/api/webhooks/resend
```
⚠️ **Important**: You need HTTPS! Use ngrok to create a secure tunnel:
1. Install ngrok from [ngrok.com](https://ngrok.com)
2. Run: `ngrok http 3000`
3. Copy the HTTPS URL (like `https://abc123.ngrok.io`)

**For Production (Live Website):**
```
https://your-domain.com/api/webhooks/resend
```

Replace `your-domain.com` with your actual website domain.

#### **Events to Subscribe To**
Check these boxes (these are the events you want to track):
- ✅ **email.sent** - When email is sent
- ✅ **email.delivered** - When email reaches inbox
- ✅ **email.opened** - When someone opens your email (MOST IMPORTANT!)
- ✅ **email.clicked** - When someone clicks a link
- ✅ **email.bounced** - When email bounces back
- ✅ **email.complained** - When someone marks as spam

#### **Status**
- Select **"Active"** (this means the webhook will work)

### Step 5: Save the Webhook
1. Click **"Create Webhook"** or **"Save"** button
2. You should see your webhook in the list
3. **Important**: Copy the webhook ID or secret if shown (save it somewhere safe)

## Visual Guide

Here's what you'll see in the Resend dashboard:

```
┌─────────────────────────────────────────┐
│ Resend Dashboard                        │
├─────────────────────────────────────────┤
│ 📧 Emails                              │
│ 📊 Analytics                           │
│ 🔗 Webhooks  ← Click here             │
│ ⚙️  Settings                           │
└─────────────────────────────────────────┘

Then you'll see:

┌─────────────────────────────────────────┐
│ Webhooks                                │
├─────────────────────────────────────────┤
│ [+ Add Webhook] ← Click this button     │
│                                         │
│ Your webhooks will appear here          │
└─────────────────────────────────────────┘

Fill out the form:

┌─────────────────────────────────────────┐
│ Create Webhook                          │
├─────────────────────────────────────────┤
│ Endpoint URL: [your-url-here]           │
│                                         │
│ Events:                                 │
│ ☑️ email.sent                          │
│ ☑️ email.delivered                     │
│ ☑️ email.opened                        │
│ ☑️ email.clicked                       │
│ ☑️ email.bounced                       │
│ ☑️ email.complained                    │
│                                         │
│ Status: Active                          │
│                                         │
│ [Create Webhook]                        │
└─────────────────────────────────────────┘
```

## Common Mistakes to Avoid

❌ **Wrong URL**: Make sure your URL ends with `/api/webhooks/resend`
❌ **HTTP instead of HTTPS**: Use HTTPS for production
❌ **Inactive Status**: Make sure status is "Active"
❌ **Missing Events**: Don't forget to check the email.opened event

## Testing Your Webhook

### Method 1: Use Our Test Endpoint
Visit this URL in your browser:
```
https://your-domain.com/api/test-resend-webhook
```

### Method 2: Send a Real Email
1. Send a test campaign from your FlowMail app
2. Open the email in your inbox
3. Check your app logs to see if webhook was received

## Troubleshooting

### "Webhook URL not reachable"
- Make sure your app is running
- For local development, use ngrok or similar tool to expose localhost
- For production, make sure your domain is accessible

### "No events received"
- Check that webhook status is "Active"
- Verify you selected the right events
- Check your app logs for errors

### "Database errors"
- Make sure you ran the database schema update first
- Check your Supabase connection

## What Happens Next?

Once set up correctly:
1. 📧 You send an email through FlowMail
2. 📬 Someone opens the email
3. 🔔 Resend sends a notification to your webhook
4. 💾 Your app saves the open event to database
5. 📊 Your analytics dashboard updates with new open rate

## Need Help?

If you get stuck:
1. Check the webhook is "Active" in Resend dashboard
2. Verify your endpoint URL is correct
3. Test the endpoint: `/api/verify-tracking-setup`
4. Check your application logs for errors

## Next Steps

After webhook is created:
1. Run the database update: `fix-email-tracking-schema.sql`
2. Test the setup: `/api/verify-tracking-setup`
3. Send a test email and open it
4. Check your analytics dashboard for updated open rates