# Environment Variables Setup Guide

## Quick Fix for Build Errors

The build is failing because environment variables are missing. Here's how to fix it:

### Step 1: Create .env.local file

Create a file named `.env.local` in your project root with these variables:

```env
# Whop Configuration (Get these from your Whop app dashboard)
NEXT_PUBLIC_WHOP_APP_ID=your_whop_app_id_here
WHOP_API_KEY=your_whop_api_key_here
NEXT_PUBLIC_WHOP_COMPANY_ID=your_whop_company_id_here
WHOP_AGENT_USER_ID=your_whop_agent_user_id_here

# Supabase Configuration (Get these from your Supabase project)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
SUPABASE_SERVICE_KEY=your_supabase_service_key_here

# Resend Configuration (Get this from your Resend dashboard)
RESEND_API_KEY=your_resend_api_key_here
FROM_EMAIL=noreply@flowmail.rovelin.com

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here

# Subscription Plans (Set these after creating plans in Whop dashboard)
WHOP_GROWTH_PLAN_ID=plan_growth_id_here
WHOP_PRO_PLAN_ID=plan_pro_id_here

# Webhook Configuration
WHOP_WEBHOOK_SECRET=your_whop_webhook_secret_here
```

### Step 2: Get Your Credentials

#### From Whop Dashboard:
1. Go to [https://whop.com/dashboard/developer](https://whop.com/dashboard/developer)
2. Select your app
3. Go to "Settings" → "API Keys"
4. Copy the App ID and App Secret

#### From Supabase:
1. Go to your Supabase project
2. Go to "Settings" → "API"
3. Copy the Project URL and Service Role Key

#### From Resend:
1. Go to [https://resend.com/dashboard](https://resend.com/dashboard)
2. Go to "API Keys"
3. Create a new API key and copy it

### Step 3: Test the Build

After setting up the environment variables, run:

```bash
npm run build
```

The build should now complete successfully!

## For Development Only

If you just want to test the build without setting up all services, you can use placeholder values:

```env
# Placeholder values for development
NEXT_PUBLIC_WHOP_APP_ID=dev_app_id
WHOP_API_KEY=dev_api_key
NEXT_PUBLIC_WHOP_COMPANY_ID=dev_company_id
WHOP_AGENT_USER_ID=dev_agent_id
NEXT_PUBLIC_SUPABASE_URL=https://dev.supabase.co
SUPABASE_SERVICE_KEY=dev_service_key
RESEND_API_KEY=dev_resend_key
FROM_EMAIL=noreply@flowmail.rovelin.com
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=dev_secret
WHOP_GROWTH_PLAN_ID=dev_growth_plan
WHOP_PRO_PLAN_ID=dev_pro_plan
WHOP_WEBHOOK_SECRET=dev_webhook_secret
```

**Note**: These placeholder values will only work for building. You'll need real credentials for the app to function properly.
