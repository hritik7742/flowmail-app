# 🚀 Vercel Environment Variables Setup

## Copy and Paste These Variables into Vercel

### **Step 1: Go to Your Vercel Project Settings**
1. Go to your Vercel dashboard
2. Select your FlowMail project
3. Go to **Settings** → **Environment Variables**
4. Click **"Create new"** for each variable below

### **Step 2: Add These Environment Variables**

**Copy each variable one by one and add them to Vercel:**

#### **Whop Configuration:**
```
Name: NEXT_PUBLIC_WHOP_APP_ID
Value: app_ERaTU0VPiLzli7
Environment: Production, Preview, Development

Name: WHOP_API_KEY
Value: uA_mRDSBxNRoyswhnIqqKEU5yIYZc0G-Y0ZDNOnswk0
Environment: Production, Preview, Development

Name: NEXT_PUBLIC_WHOP_COMPANY_ID
Value: biz_ONLFgl8n3DgP2y
Environment: Production, Preview, Development

Name: NEXT_PUBLIC_WHOP_AGENT_USER_ID
Value: user_J0VPNMgVJaYJD
Environment: Production, Preview, Development

Name: WHOP_WEBHOOK_SECRET
Value: get_this_after_creating_a_webhook_in_the_app_settings_screen
Environment: Production, Preview, Development
```

#### **Supabase Configuration:**
```
Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://cyeqnbqwbnodnscuweiz.supabase.co
Environment: Production, Preview, Development

Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5ZXFuYnF3Ym5vZG5zY3V3ZWl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyOTg1OTUsImV4cCI6MjA3NDg3NDU5NX0.FqwkBPOvQjUjz6jbWluK5oFCsZ5scrTDV8FyWcTrBYk
Environment: Production, Preview, Development

Name: SUPABASE_SERVICE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5ZXFuYnF3Ym5vZG5zY3V3ZWl6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTI5ODU5NSwiZXhwIjoyMDc0ODc0NTk1fQ.R-dlgNXb4Mf3G00_b5PuU7LSpZuqzFV9pgHj2O4SJz0
Environment: Production, Preview, Development
```

#### **Resend Configuration:**
```
Name: RESEND_API_KEY
Value: re_a3XQvygC_4J5HGTPCiEpQaXkxkkGe7XtF
Environment: Production, Preview, Development

Name: FROM_EMAIL
Value: noreply@flowmail.rovelin.com
Environment: Production, Preview, Development

Name: FROM_NAME
Value: FlowMail
Environment: Production, Preview, Development
```

#### **NextAuth Configuration:**
```
Name: NEXTAUTH_URL
Value: https://your-app-name.vercel.app
Environment: Production, Preview, Development
(Replace "your-app-name" with your actual Vercel app URL)

Name: NEXTAUTH_SECRET
Value: flowmail-secret-key-2024-production-ready
Environment: Production, Preview, Development
```

#### **Subscription Plans:**
```
Name: WHOP_STARTER_PLAN_ID
Value: plan_8kwlWN9KRLgBz
Environment: Production, Preview, Development

Name: WHOP_GROWTH_PLAN_ID
Value: plan_5XSDwCIf1wjsI
Environment: Production, Preview, Development

Name: WHOP_PRO_PLAN_ID
Value: plan_YHLJsUruy51wy
Environment: Production, Preview, Development
```

#### **Additional Configuration:**
```
Name: WHOP_CLIENT_ID
Value: app_ERaTU0VPiLzli7
Environment: Production, Preview, Development

Name: WHOP_CLIENT_SECRET
Value: uA_mRDSBxNRoyswhnIqqKEU5yIYZc0G-Y0ZDNOnswk0
Environment: Production, Preview, Development

Name: WHOP_REDIRECT_URI
Value: https://your-app-name.vercel.app/api/auth/callback/whop
Environment: Production, Preview, Development
(Replace "your-app-name" with your actual Vercel app URL)
```

### **Step 3: Important Notes**

1. **Update NEXTAUTH_URL**: Replace `your-app-name` with your actual Vercel app URL
2. **Update WHOP_REDIRECT_URI**: Replace `your-app-name` with your actual Vercel app URL
3. **Set Environment**: Make sure to select "Production", "Preview", and "Development" for each variable
4. **Sensitive Data**: Mark sensitive variables like API keys as "Sensitive" if you want

### **Step 4: After Adding Variables**

1. **Redeploy your app** - Vercel will automatically redeploy when you add environment variables
2. **Test your app** - Visit your deployed URL to make sure everything works
3. **Check logs** - If there are issues, check the Vercel function logs

### **Step 5: Verify Setup**

After deployment, test these endpoints:
- `https://your-app.vercel.app/api/verify-tracking-setup`
- `https://your-app.vercel.app/api/test-whop-auth`

All should return success messages if configured correctly!

## 🎯 **Quick Copy-Paste Format**

If you want to copy all at once, here's the format:

```
NEXT_PUBLIC_WHOP_APP_ID=app_ERaTU0VPiLzli7
WHOP_API_KEY=uA_mRDSBxNRoyswhnIqqKEU5yIYZc0G-Y0ZDNOnswk0
NEXT_PUBLIC_WHOP_COMPANY_ID=biz_ONLFgl8n3DgP2y
NEXT_PUBLIC_WHOP_AGENT_USER_ID=user_J0VPNMgVJaYJD
WHOP_WEBHOOK_SECRET=get_this_after_creating_a_webhook_in_the_app_settings_screen
NEXT_PUBLIC_SUPABASE_URL=https://cyeqnbqwbnodnscuweiz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5ZXFuYnF3Ym5vZG5zY3V3ZWl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyOTg1OTUsImV4cCI6MjA3NDg3NDU5NX0.FqwkBPOvQjUjz6jbWluK5oFCsZ5scrTDV8FyWcTrBYk
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5ZXFuYnF3Ym5vZG5zY3V3ZWl6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTI5ODU5NSwiZXhwIjoyMDc0ODc0NTk1fQ.R-dlgNXb4Mf3G00_b5PuU7LSpZuqzFV9pgHj2O4SJz0
RESEND_API_KEY=re_a3XQvygC_4J5HGTPCiEpQaXkxkkGe7XtF
FROM_EMAIL=noreply@flowmail.rovelin.com
FROM_NAME=FlowMail
NEXTAUTH_URL=https://your-app-name.vercel.app
NEXTAUTH_SECRET=flowmail-secret-key-2024-production-ready
WHOP_STARTER_PLAN_ID=plan_8kwlWN9KRLgBz
WHOP_GROWTH_PLAN_ID=plan_5XSDwCIf1wjsI
WHOP_PRO_PLAN_ID=plan_YHLJsUruy51wy
WHOP_CLIENT_ID=app_ERaTU0VPiLzli7
WHOP_CLIENT_SECRET=uA_mRDSBxNRoyswhnIqqKEU5yIYZc0G-Y0ZDNOnswk0
WHOP_REDIRECT_URI=https://your-app-name.vercel.app/api/auth/callback/whop
```

**Remember to replace `your-app-name` with your actual Vercel app URL!**
