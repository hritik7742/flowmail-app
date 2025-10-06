# FlowMail Production Deployment Guide

## 🎯 Overview
This guide will help you deploy FlowMail to production on Vercel with proper security and Whop integration.

## 📋 Prerequisites
- [ ] Vercel account (free tier works)
- [ ] Whop developer account
- [ ] Supabase account
- [ ] Resend account
- [ ] GitHub account (for code repository)

## 🚀 Step 1: Prepare Your Code for Production

### 1.1 Create Production Environment File
Create `.env.production` file (DO NOT commit this to git):

```env
# Production Environment Variables
# ================================

# Database (Supabase Production)
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_supabase_service_role_key

# Whop App (Production)
NEXT_PUBLIC_WHOP_COMPANY_ID=your_production_whop_company_id
WHOP_API_KEY=your_production_whop_api_key
WHOP_WEBHOOK_SECRET=your_production_webhook_secret

# Plan IDs (Production)
WHOP_STARTER_PLAN_ID=plan_8kwlWN9KRLgBz
WHOP_GROWTH_PLAN_ID=plan_5XSDwCIf1wjsI
WHOP_PRO_PLAN_ID=plan_YHLJsUruy51wy

# Email Service (Resend Production)
RESEND_API_KEY=your_production_resend_api_key

# NextAuth (Production)
NEXTAUTH_URL=https://your-app-name.vercel.app
NEXTAUTH_SECRET=your_secure_nextauth_secret_here

# Optional: Custom Domain
CUSTOM_DOMAIN=your_custom_domain.com
```

### 1.2 Update .gitignore
Ensure these files are in your `.gitignore`:
```
.env.local
.env.production
.env.development
.env
*.log
.DS_Store
node_modules/
.next/
.vercel/
```

## 🏗️ Step 2: Set Up Supabase Production Database

### 2.1 Create Production Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project for production
3. Note down your production URL and keys

### 2.2 Run Database Migration
1. Go to your production Supabase SQL Editor
2. Run the `update-pricing-plans-safe.sql` script
3. Verify all tables and functions are created

### 2.3 Set Up Row Level Security (RLS)
```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_changes ENABLE ROW LEVEL SECURITY;

-- Create policies (users can only access their own data)
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid()::text = whop_user_id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid()::text = whop_user_id);

-- Similar policies for other tables...
```

## 🔐 Step 3: Set Up Whop Production App

### 3.1 Create Production Whop App
1. Go to [Whop Developer Dashboard](https://whop.com/dashboard/developer)
2. Create a new app for production
3. Configure app settings:
   - **App Name**: FlowMail
   - **Description**: Email Marketing for Whop Creators
   - **Redirect URL**: `https://your-app-name.vercel.app/api/auth/callback/whop`
   - **Webhook URL**: `https://your-app-name.vercel.app/api/webhook`

### 3.2 Get Production Credentials
1. Copy your production:
   - Company ID
   - API Key
   - Webhook Secret

### 3.3 Create Production Plans
1. In your Whop dashboard, create the three pricing plans:
   - **Starter Plan**: $29/month
   - **Growth Plan**: $49/month  
   - **Pro Plan**: $129/month
2. Copy the plan IDs for your environment variables

## 📧 Step 4: Set Up Resend for Production

### 4.1 Create Resend Account
1. Go to [resend.com](https://resend.com)
2. Create account and verify domain
3. Get your production API key

### 4.2 Configure Domain
1. Add your custom domain to Resend
2. Set up DNS records
3. Verify domain ownership

## 🚀 Step 5: Deploy to Vercel

### 5.1 Connect GitHub Repository
1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your GitHub repository

### 5.2 Configure Vercel Environment Variables
In Vercel dashboard, add all environment variables from your `.env.production` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_supabase_service_role_key
NEXT_PUBLIC_WHOP_COMPANY_ID=your_production_whop_company_id
WHOP_API_KEY=your_production_whop_api_key
WHOP_WEBHOOK_SECRET=your_production_webhook_secret
WHOP_STARTER_PLAN_ID=plan_8kwlWN9KRLgBz
WHOP_GROWTH_PLAN_ID=plan_5XSDwCIf1wjsI
WHOP_PRO_PLAN_ID=plan_YHLJsUruy51wy
RESEND_API_KEY=your_production_resend_api_key
NEXTAUTH_URL=https://your-app-name.vercel.app
NEXTAUTH_SECRET=your_secure_nextauth_secret_here
```

### 5.3 Configure Vercel Settings
1. **Framework Preset**: Next.js
2. **Build Command**: `npm run build`
3. **Output Directory**: `.next`
4. **Install Command**: `npm install`

## 🔒 Step 6: Security Configuration

### 6.1 Generate Secure Secrets
```bash
# Generate NextAuth secret
openssl rand -base64 32

# Generate webhook secret
openssl rand -base64 32
```

### 6.2 Set Up HTTPS
- Vercel automatically provides HTTPS
- Update `NEXTAUTH_URL` to use HTTPS

### 6.3 Configure CORS
Update your API routes to handle production domains:

```javascript
// In your API routes, add CORS headers
const allowedOrigins = [
  'https://your-app-name.vercel.app',
  'https://whop.com',
  // Add other allowed origins
]
```

## 🧪 Step 7: Testing Production

### 7.1 Test Checklist
- [ ] App loads correctly on Vercel URL
- [ ] Whop authentication works
- [ ] Database connections work
- [ ] Email sending works
- [ ] Webhook endpoints respond
- [ ] Plan upgrades work
- [ ] Email limits are enforced

### 7.2 Test Webhooks
1. Use Whop's webhook testing tool
2. Verify webhook endpoints respond correctly
3. Check database updates

## 📊 Step 8: Monitoring and Logging

### 8.1 Set Up Vercel Analytics
1. Enable Vercel Analytics in dashboard
2. Monitor performance and errors

### 8.2 Set Up Error Tracking
Consider adding Sentry or similar for error tracking:

```bash
npm install @sentry/nextjs
```

### 8.3 Database Monitoring
1. Set up Supabase monitoring
2. Monitor database performance
3. Set up alerts for issues

## 🔄 Step 9: CI/CD Pipeline

### 9.1 Automatic Deployments
- Vercel automatically deploys on push to main branch
- Set up staging environment for testing

### 9.2 Environment Management
- Use Vercel's environment variables for different stages
- Keep production secrets secure

## 🚨 Step 10: Security Checklist

### 10.1 Environment Security
- [ ] All secrets are in environment variables
- [ ] No hardcoded credentials in code
- [ ] Database has RLS enabled
- [ ] API routes are protected

### 10.2 Whop Security
- [ ] Webhook signature verification enabled
- [ ] Proper CORS configuration
- [ ] Rate limiting on API endpoints

### 10.3 Data Security
- [ ] User data is properly isolated
- [ ] Email content is sanitized
- [ ] No sensitive data in logs

## 🎯 Final Steps

1. **Update Whop App Settings** with production URL
2. **Test complete user flow** from signup to email sending
3. **Monitor for 24 hours** to ensure stability
4. **Set up backups** for critical data
5. **Document any custom configurations**

## 🆘 Troubleshooting

### Common Issues:
1. **Environment variables not loading**: Check Vercel dashboard
2. **Database connection issues**: Verify Supabase credentials
3. **Whop authentication failing**: Check redirect URLs
4. **Webhook not working**: Verify webhook URL and secret

### Support Resources:
- [Vercel Documentation](https://vercel.com/docs)
- [Whop Developer Docs](https://docs.whop.com)
- [Supabase Documentation](https://supabase.com/docs)
- [NextAuth.js Documentation](https://next-auth.js.org)

---

## 🎉 Congratulations!
Your FlowMail app is now production-ready and deployed securely on Vercel!
