# Visual Guide: Resend Dashboard Webhook Setup

## What You'll See in Resend Dashboard

### 1. Login and Main Dashboard
When you first login to Resend, you'll see something like this:

```
┌─────────────────────────────────────────────────────────┐
│ 🔄 Resend                                    [Profile] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ 📧 Emails        📊 Analytics        🔗 Webhooks       │
│                                                         │
│ Recent Activity:                                        │
│ • Email sent to user@example.com                       │
│ • Email delivered to test@domain.com                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 2. Click on "Webhooks"
Look for the "Webhooks" section and click it. You'll see:

```
┌─────────────────────────────────────────────────────────┐
│ Webhooks                                                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Webhooks allow you to receive real-time notifications  │
│ when events occur.                                      │
│                                                         │
│ [+ Add Webhook]  ← CLICK THIS BUTTON                   │
│                                                         │
│ No webhooks configured yet.                             │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 3. Add Webhook Form
After clicking "Add Webhook", you'll see a form:

```
┌─────────────────────────────────────────────────────────┐
│ Create Webhook                                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Endpoint URL *                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ https://abc123.ngrok.io/api/webhooks/resend         │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ Events *                                                │
│ ☑️ email.sent        ☑️ email.delivered                │
│ ☑️ email.opened      ☑️ email.clicked                  │
│ ☑️ email.bounced     ☑️ email.complained               │
│                                                         │
│ Status                                                  │
│ ● Active  ○ Inactive                                   │
│                                                         │
│ [Cancel]  [Create Webhook]                             │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 4. After Creating Webhook
Once created, you'll see your webhook listed:

```
┌─────────────────────────────────────────────────────────┐
│ Webhooks                                                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ [+ Add Webhook]                                         │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 🟢 Active                                           │ │
│ │ https://abc123.ngrok.io/api/webhooks/resend         │ │
│ │                                                     │ │
│ │ Events: email.sent, email.opened, email.delivered  │ │
│ │ Created: Just now                                   │ │
│ │                                                     │ │
│ │ [Edit] [Delete] [Test]                              │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Step-by-Step Instructions

### Step 1: Find the Webhooks Section
- Look for a menu item called "Webhooks" (usually in left sidebar)
- It might have a 🔗 icon next to it
- Click on it

### Step 2: Add New Webhook
- Look for a button that says "Add Webhook" or "+ Add Webhook"
- It's usually blue or purple colored
- Click this button

### Step 3: Fill Out the Form

**Endpoint URL Field:**
- This is where you type your webhook URL
- For development: `https://your-ngrok-url.ngrok.io/api/webhooks/resend`
- For production: `https://yourdomain.com/api/webhooks/resend`

⚠️ **Important**: Must be HTTPS! For local development:
1. Install ngrok: https://ngrok.com
2. Run: `ngrok http 3000`
3. Copy the HTTPS URL

**Events Section:**
- You'll see checkboxes for different events
- Check ALL of these boxes:
  - ✅ email.sent
  - ✅ email.delivered
  - ✅ email.opened (MOST IMPORTANT!)
  - ✅ email.clicked
  - ✅ email.bounced
  - ✅ email.complained

**Status:**
- Select "Active" (not "Inactive")
- This means the webhook will actually work

### Step 4: Save
- Click "Create Webhook" or "Save"
- You should see a success message
- Your webhook will appear in the list

## What Each Event Means

- **email.sent**: Email left Resend's servers
- **email.delivered**: Email reached the recipient's inbox
- **email.opened**: Someone opened your email (this tracks open rates!)
- **email.clicked**: Someone clicked a link in your email
- **email.bounced**: Email couldn't be delivered (bad email address)
- **email.complained**: Someone marked your email as spam

## Common Issues

### "Endpoint URL is not reachable"
- Make sure your app is running
- For localhost, your computer must be on and app running
- For production, make sure your website is live

### "Invalid URL format"
- Make sure URL starts with `http://` or `https://`
- Make sure URL ends with `/api/webhooks/resend`
- No spaces or special characters

### "Webhook not receiving events"
- Check that status is "Active"
- Verify you selected the events you want
- Test your endpoint URL in browser

## Testing Your Webhook

After creating the webhook, test it:

1. **Quick Test**: Visit `http://localhost:3000/api/test-resend-webhook`
2. **Real Test**: Send an email and open it
3. **Check Logs**: Look at your app's console for webhook events

You should see messages like:
```
=== RESEND WEBHOOK RECEIVED ===
Event type: email.opened
Event data: { email_id: "...", to: ["user@example.com"] }
```

That's it! Your webhook is now set up and ready to track email opens.