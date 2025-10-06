# Quick HTTPS Setup for Resend Webhooks

## ⚠️ Important: Resend Requires HTTPS

Resend webhooks **only work with HTTPS URLs**, not HTTP. Here's how to set it up:

## 🚀 Quick Solution (2 minutes)

### Step 1: Install ngrok
```bash
# Option 1: Download from website
# Go to https://ngrok.com/download

# Option 2: Install via npm
npm install -g ngrok

# Option 3: Install via brew (Mac)
brew install ngrok
```

### Step 2: Start Your App
```bash
npm run dev
# Your app runs on http://localhost:3000
```

### Step 3: Create HTTPS Tunnel
```bash
# In a new terminal window:
ngrok http 3000
```

You'll see output like:
```
Session Status    online
Web Interface     http://127.0.0.1:4040
Forwarding        https://abc123.ngrok.io -> http://localhost:3000
```

### Step 4: Copy the HTTPS URL
- Copy the HTTPS URL: `https://abc123.ngrok.io`
- Your webhook URL is: `https://abc123.ngrok.io/api/webhooks/resend`

### Step 5: Use in Resend
1. Go to [Resend Dashboard](https://resend.com/dashboard)
2. Click "Webhooks" → "Add Webhook"
3. Paste: `https://abc123.ngrok.io/api/webhooks/resend`
4. Select all events, set to Active
5. Save

## ✅ That's It!

Your webhook is now accessible via HTTPS and Resend can send events to it.

## 🔄 Alternative: Deploy to Production

If you don't want to use ngrok, deploy your app:

```bash
# Deploy to Vercel
vercel --prod

# Use the production URL
https://your-app.vercel.app/api/webhooks/resend
```

## 🐛 Troubleshooting

**"URL not reachable"**
- Make sure ngrok is running
- Check your app is running on localhost:3000
- Verify the HTTPS URL is correct

**ngrok URL changes**
- Free ngrok URLs change each restart
- Update webhook URL in Resend when it changes
- Consider ngrok paid plan for static URLs

## 📝 Quick Commands

```bash
# Terminal 1: Start your app
npm run dev

# Terminal 2: Start tunnel
ngrok http 3000

# Copy HTTPS URL and use in Resend webhook setup
```