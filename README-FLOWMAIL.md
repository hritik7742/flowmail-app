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

Copy your `.env.development` file and add these values:

```bash
# Supabase (Database)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key

# Whop OAuth
WHOP_CLIENT_ID=your_whop_client_id
WHOP_CLIENT_SECRET=your_whop_client_secret
WHOP_REDIRECT_URI=http://localhost:3000/api/auth/callback/whop

# Resend (Email Service)
RESEND_API_KEY=your_resend_api_key

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_random_secret_string

# Stripe (Optional - for paid plans)
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
```

### 2. Setup Supabase Database

1. Go to [supabase.com](https://supabase.com) and create a new project
2. In the SQL Editor, run the contents of `supabase-schema.sql`
3. Copy your project URL and keys to `.env.development`

### 3. Setup Whop OAuth

1. Go to your [Whop Developer Portal](https://whop.com/dashboard)
2. Create a new app or use your existing one
3. Add OAuth redirect URL: `http://localhost:3000/api/auth/callback/whop`
4. Copy Client ID and Secret to `.env.development`

### 4. Setup Resend (Email Service)

1. Go to [resend.com](https://resend.com) and create an account
2. Verify your domain (or use their testing domain for development)
3. Get your API key and add it to `.env.development`

### 5. Run the App

```bash
npm run dev
```

Visit `http://localhost:3000` and sign in with your Whop account!

## 📁 Project Structure

```
whop-app/
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
│       ├── auth/[...nextauth]/  # NextAuth config
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

1. **Authentication**: Users sign in with their Whop account using OAuth
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

- **Free**: 100 emails/month
- **Growth**: $49/month - 5,000 emails/month
- **Pro**: $99/month - 25,000 emails/month

## 🚀 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Connect your repo to Vercel
3. Add all environment variables in Vercel dashboard
4. Deploy!

### Production Checklist

- [ ] Set up custom domain for email sending in Resend
- [ ] Configure Stripe webhooks for subscription management
- [ ] Set up proper error monitoring (Sentry)
- [ ] Add rate limiting to API routes
- [ ] Set up database backups in Supabase

## 🛠 Tech Stack

- **Frontend**: Next.js 14 (App Router) + Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: NextAuth.js with Whop OAuth
- **Email Service**: Resend.com
- **Payments**: Stripe (for subscriptions)
- **Deployment**: Vercel

## 📝 Development Notes

- Keep it simple - no over-engineering
- Use Server Components by default
- Add "use client" only when needed
- All API routes include proper error handling
- Email templates are mobile-responsive
- Tracking pixels work across all email clients

## 🐛 Troubleshooting

**"Whop user token not found"**
- Make sure you're accessing the app through Whop, not directly via localhost
- Check that your Whop OAuth credentials are correct

**Email sending fails**
- Verify your Resend API key is correct
- Make sure your domain is verified in Resend
- Check that you haven't exceeded your email limits

**Database connection issues**
- Verify your Supabase credentials
- Make sure you've run the SQL schema
- Check that RLS policies allow your operations

## 📞 Support

Need help? Check the [Whop Documentation](https://dev.whop.com) or create an issue in this repository.

---

Built with ❤️ for Whop creators