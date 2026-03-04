# 📧 FlowMail - Email Marketing for Whop Creators

A simple, production-ready email marketing SaaS built specifically for Whop creators. Send beautiful campaigns, track performance, and grow your community.

## ✨ Features

- 🔐 **Whop OAuth Integration** - Sign in with your Whop account
- 👥 **Auto-sync Members** - Import your community members automatically
- 📧 **Campaign Management** - Create and send email campaigns
- 🎨 **Pre-made Templates** - Welcome emails, newsletters, and promotions
- 📊 **Email Tracking** - Track opens and clicks with pixel tracking
- 💳 **Subscription Plans** - Free, Growth, and Pro tiers
- 📱 **Mobile Responsive** - Works perfectly on all devices

## 🚀 Quick Setup

### 1. Environment Variables

Copy `env.example` to `.env.local` and fill in your values:

```bash
# Supabase (Database)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Whop App Configuration
NEXT_PUBLIC_WHOP_COMPANY_ID=your_whop_company_id
WHOP_API_KEY=your_whop_api_key
WHOP_WEBHOOK_SECRET=your_whop_webhook_secret

# Resend (Email Service)
RESEND_API_KEY=your_resend_api_key

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here
```

### 2. Setup Supabase Database

1. Go to [supabase.com](https://supabase.com) and create a new project
2. In the SQL Editor, run the contents of `supabase-schema.sql`
3. Copy your project URL and keys to `.env.local`

### 3. Setup Whop App

1. Go to your [Whop Developer Portal](https://whop.com/dashboard)
2. Create a new app or use your existing one
3. Copy your Company ID and API key to `.env.local`

### 4. Setup Resend (Email Service)

1. Go to [resend.com](https://resend.com) and create an account
2. Verify your domain (or use their testing domain for development)
3. Get your API key and add it to `.env.local`

### 5. Run the App

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` to get started!

## 📁 Project Structure

```
flowmail-app/
├── app/
│   ├── page.tsx                 # Landing/Login page
│   ├── dashboard/page.js        # Main dashboard
│   ├── campaigns/
│   │   ├── page.js             # Campaigns list
│   │   └── new/page.js         # Create campaign
│   ├── subscribers/page.js      # Members management
│   ├── templates/page.js        # Email templates
│   ├── settings/page.js         # Account settings
│   └── api/
│       ├── sync-members/        # Sync Whop members
│       ├── send-campaign/       # Send emails
│       └── track/open/          # Email tracking
├── components/
│   ├── Navbar.js               # Navigation
│   ├── StatCard.js             # Dashboard stats
│   └── Providers.tsx           # Auth provider
└── lib/
    ├── supabase.js             # Database client
    ├── resend.js               # Email service
    └── whop-client.js          # Whop API client
```

## 🎯 How It Works

1. **Authentication**: Users sign in via the Whop platform
2. **Member Sync**: Import community members from Whop API into local database
3. **Campaign Creation**: Choose templates or create custom HTML emails
4. **Email Sending**: Send personalized emails via Resend API
5. **Tracking**: Track opens with invisible pixel tracking
6. **Analytics**: View campaign performance and subscriber stats

## 📊 Database Schema

- **users** - Whop creators using the app
- **campaigns** - Email campaigns with stats
- **subscribers** - Community members synced from Whop
- **email_templates** - Pre-made email templates
- **email_events** - Tracking data for opens/clicks

## 🔧 API Endpoints

- `POST /api/sync-members` - Sync members from Whop
- `POST /api/send-campaign` - Send email campaign
- `GET /api/track/open/[campaignId]/[subscriberId]` - Track email opens

## 💳 Subscription Plans

- **Free**: Basic email sending
- **Growth**: $49/month - 5,000 emails/month
- **Pro**: $99/month - 25,000 emails/month

## 🚀 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Connect your repo to Vercel
3. Add all environment variables in the Vercel dashboard
4. Deploy!

### Production Checklist

- [ ] Set up custom domain for email sending in Resend
- [ ] Configure Whop webhooks for subscription management
- [ ] Add rate limiting to API routes
- [ ] Set up database backups in Supabase

## 🛠 Tech Stack

- **Frontend**: Next.js 15 (App Router) + Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Whop OAuth via `@whop/react`
- **Email Service**: Resend.com
- **Payments**: Whop subscriptions
- **Deployment**: Vercel

## 🐛 Troubleshooting

**Email sending fails**
- Verify your Resend API key is correct
- Make sure your domain is verified in Resend
- Check that you haven't exceeded your email limits

**Database connection issues**
- Verify your Supabase credentials
- Make sure you've run the SQL schema
- Check that RLS policies allow your operations

**Member sync not working**
- Verify your `WHOP_API_KEY` is set correctly
- Ensure your Whop Company ID is correct

## 📞 Support

Need help? Check the [Whop Documentation](https://dev.whop.com) or create an issue in this repository.

---

Built with ❤️ for Whop creators
