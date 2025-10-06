# HTTPS Tunnel Setup for Resend Webhooks

## Problem
Resend webhooks require HTTPS endpoints, but localhost uses HTTP. We need to create a secure tunnel.

## Solution Options

### Option 1: ngrok (Recommended)
1. **Install ngrok**: Download from [ngrok.com](https://ngrok.com)
2. **Run your app**: `npm run dev` (localhost:3000)
3. **Create tunnel**: `ngrok http 3000`
4. **Copy HTTPS URL**: You'll get something like `https://abc123.ngrok.io`
5. **Use in Resend**: `https://abc123.ngrok.io/api/webhooks/resend`

### Option 2: Cloudflare Tunnel
1. **Install**: `npm install -g cloudflared`
2. **Run tunnel**: `cloudflared tunnel --url http://localhost:3000`
3. **Copy HTTPS URL**: You'll get a secure URL
4. **Use in Resend**: `https://your-url.trycloudflare.com/api/webhooks/resend`

### Option 3: Deploy to Vercel (Production-like)
1. **Deploy**: `vercel --prod`
2. **Get URL**: `https://your-app.vercel.app`
3. **Use in Resend**: `https://your-app.vercel.app/api/webhooks/resend`

## Quick Setup with ngrok

```bash
# 1. Download and install ngrok from ngrok.com
# 2. Start your app
npm run dev

# 3. In another terminal, create tunnel
ngrok http 3000

# 4. Copy the HTTPS URL (looks like https://abc123.ngrok.io)
# 5. Use this URL in Resend webhook setup
```

## Updated Webhook URL
Instead of: `http://localhost:3000/api/webhooks/resend`
Use: `https://your-tunnel-url.ngrok.io/api/webhooks/resend`