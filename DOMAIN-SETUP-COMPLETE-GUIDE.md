# Complete Custom Domain Setup Guide

## Overview
This guide implements the correct custom domain flow using Resend API instead of manual DNS verification.

## What's Been Implemented

### 1. API Endpoints Created
- `app/api/register-custom-domain/route.js` - Registers domain with Resend API
- `app/api/verify-domain/route.js` - Verifies domain using Resend API (updated)
- `app/api/get-domain-settings/route.js` - Retrieves domain settings
- `app/api/setup-domain-columns/route.js` - Sets up database columns

### 2. Database Schema Updates
- Added `resend_domain_id` column to store Resend's domain ID
- Added `domain_dns_records` JSONB column to store actual DNS records from Resend
- Added indexes for better performance

### 3. Frontend Implementation
- Updated FlowMailApp.tsx with proper domain management page
- Implements the correct 2-step flow:
  1. Register domain with Resend to get unique DNS records
  2. Verify domain using Resend's verification API

## How It Works

### Step 1: Domain Registration
1. User enters their domain (e.g., `yourdomain.com`)
2. Click "Register Domain" button
3. System calls Resend API to register the domain
4. Resend returns unique DKIM keys and DNS records
5. Records are stored in database

### Step 2: DNS Configuration
1. User sees the actual DNS records from Resend
2. User adds these records to their domain provider
3. User clicks "Verify Domain"
4. System calls Resend's verification API
5. Domain is marked as verified if all records are correct

## Setup Instructions

### 1. Run Database Migration
First, set up the required database columns:

```bash
# Option 1: Use the API endpoint
curl -X POST http://localhost:3000/api/setup-domain-columns

# Option 2: Run SQL directly in Supabase
```

```sql
-- Add columns for Resend domain integration
ALTER TABLE users ADD COLUMN IF NOT EXISTS resend_domain_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS domain_dns_records JSONB;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_users_resend_domain_id ON users(resend_domain_id);
CREATE INDEX IF NOT EXISTS idx_users_custom_domain ON users(custom_domain);
```

### 2. Environment Variables
Make sure you have your Resend API key in `.env`:

```env
RESEND_API_KEY=re_your_api_key_here
```

### 3. Test the Implementation
1. Start your development server
2. Navigate to the Domains page in FlowMailApp
3. Enter a domain you own
4. Click "Register Domain"
5. Add the DNS records to your domain provider
6. Click "Verify Domain"

## Key Differences from Previous Implementation

### Before (Manual DNS Verification)
- Used hardcoded DNS records
- Manual DNS lookup verification
- Generic DKIM keys that wouldn't work

### After (Resend API Integration)
- Registers domain with Resend first
- Gets actual unique DNS records from Resend
- Uses Resend's verification API
- Proper DKIM keys that actually work

## DNS Records Explained

When you register a domain with Resend, you'll get records like:

```
Type: MX
Host: @
Value: feedback-smtp.us-east-1.amazonses.com
Priority: 10

Type: TXT
Host: @
Value: v=spf1 include:amazonses.com ~all

Type: CNAME
Host: [unique-key]._domainkey
Value: [unique-key]._domainkey.amazonses.com

Type: CNAME
Host: [another-unique-key]._domainkey
Value: [another-unique-key]._domainkey.amazonses.com
```

The DKIM keys (`[unique-key]`) are generated uniquely for each domain by Resend.

## Troubleshooting

### Domain Registration Fails
- Check your Resend API key
- Ensure the domain is valid
- Check if domain is already registered

### Verification Fails
- DNS changes can take up to 48 hours to propagate
- Double-check the DNS records in your domain provider
- Make sure you're adding records to the correct domain

### Common DNS Provider Instructions
- **Namecheap**: Advanced DNS → Add records
- **GoDaddy**: DNS Management → Add records
- **Cloudflare**: DNS → Add records
- **Route53**: Hosted zones → Add records

## Testing

Use the test script to verify everything works:

```bash
node test-domain-setup.js
```

This will test:
1. Database setup
2. Domain registration
3. Settings retrieval

## Next Steps

1. Run the database migration
2. Test with a domain you own
3. Add proper error handling for production
4. Consider adding email templates for domain verification
5. Add monitoring for domain verification status

## Security Notes

- Never expose your Resend API key in frontend code
- Validate domain inputs to prevent abuse
- Rate limit domain registration attempts
- Log domain registration attempts for monitoring