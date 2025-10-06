# 📧 Email Open Tracking Setup - Complete Guide

## 🎯 What This Does
Tracks when people open your emails and shows accurate open rates in your FlowMail dashboard.

## ⚡ Quick Setup (12 minutes total)

### Step 1: Test Current Setup (2 minutes)
```bash
node test-current-setup.js
```
Make sure your app is running first: `npm run dev`

### Step 2: Update Database (2 minutes)
1. Open [Supabase SQL Editor](https://supabase.com/dashboard)
2. Copy contents of `fix-email-tracking-schema.sql`
3. Paste and click "Run"

### Step 3: Create HTTPS Tunnel (2 minutes)
Since Resend requires HTTPS, create a secure tunnel:
```bash
# Install ngrok from ngrok.com, then:
ngrok http 3000
# Copy the HTTPS URL (like https://abc123.ngrok.io)
```

### Step 4: Create Resend Webhook (3 minutes)
1. Go to [Resend Dashboard](https://resend.com/dashboard)
2. Click "Webhooks" → "Add Webhook"
3. Fill in:
   - **URL**: `https://your-ngrok-url.ngrok.io/api/webhooks/resend`
   - **Events**: Check all boxes (especially `email.opened`)
   - **Status**: Active
4. Click "Create Webhook"

### Step 5: Test Everything (3 minutes)
1. Visit: `http://localhost:3000/api/verify-tracking-setup`
2. Should show all ✅ green checkmarks
3. Send a test email and open it
4. Check analytics dashboard for updated open rates

## 📚 Detailed Guides

- **New to Resend?** → Read `RESEND-BEGINNER-SETUP.md`
- **Step-by-step checklist** → Use `WEBHOOK-SETUP-CHECKLIST.md`
- **Visual guide** → See `RESEND-DASHBOARD-GUIDE.md`
- **Complete documentation** → Check `RESEND-WEBHOOK-SETUP-COMPLETE.md`

## 🔧 Files You Need

| File | Purpose |
|------|---------|
| `fix-email-tracking-schema.sql` | Database updates |
| `WEBHOOK-SETUP-CHECKLIST.md` | Step-by-step checklist |
| `RESEND-BEGINNER-SETUP.md` | Beginner-friendly guide |
| `test-current-setup.js` | Test your setup |

## 🚀 For Production

When ready to go live:
1. Update webhook URL to: `https://yourdomain.com/api/webhooks/resend`
2. Test again with production URL
3. Monitor logs for webhook events

## ❓ Need Help?

**App not running?**
```bash
npm run dev
```

**Database errors?**
- Run the SQL file in Supabase first
- Check your database connection

**Webhook not working?**
- Make sure URL is correct
- Check webhook is "Active" in Resend
- Verify app is accessible

**Still stuck?**
- Check: `http://localhost:3000/api/verify-tracking-setup`
- Review your app logs for errors
- Make sure all environment variables are set

## ✅ Success Indicators

You'll know it's working when:
- ✅ Verification endpoint shows all green
- ✅ Email opens appear in analytics
- ✅ Open rates update in real-time
- ✅ Recent opens show in dashboard
- ✅ Webhook events appear in logs

## 🎉 What You Get

After setup:
- **Real-time tracking** - See opens as they happen
- **Accurate analytics** - Proper open rate calculations
- **Better insights** - Know which emails perform best
- **Professional dashboard** - Impress your users

---

**Ready to start?** Run `node test-current-setup.js` and follow the checklist!