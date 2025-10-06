-- FlowMail Database Schema for Supabase
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    whop_user_id TEXT UNIQUE NOT NULL,
    email TEXT,
    company_name TEXT,
    plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'growth', 'pro')),
    emails_sent_this_month INTEGER DEFAULT 0,
    stripe_customer_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    preview_text TEXT,
    html_content TEXT NOT NULL,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent')),
    scheduled_for TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    total_recipients INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscribers table
CREATE TABLE IF NOT EXISTS subscribers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    whop_member_id TEXT NOT NULL,
    email TEXT,
    name TEXT,
    tier TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, whop_member_id)
);

-- Email templates table
CREATE TABLE IF NOT EXISTS email_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT CHECK (category IN ('welcome', 'newsletter', 'promo')),
    html_content TEXT NOT NULL,
    thumbnail_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email events table (for tracking clicks and other events)
CREATE TABLE IF NOT EXISTS email_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    subscriber_id UUID REFERENCES subscribers(id) ON DELETE CASCADE,
    event_type TEXT CHECK (event_type IN ('open', 'click')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


$$ LANGUAGE plpgsql;

-- Insert default email templates
INSERT INTO email_templates (name, category, html_content, thumbnail_url) VALUES
(
    'Welcome Email',
    'welcome',
    '<div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;background:#fff;padding:40px"><div style="background:#6366f1;padding:30px;text-align:center;border-radius:10px 10px 0 0"><h1 style="color:#fff;margin:0;font-size:28px">Welcome to Our Community! 🎉</h1></div><div style="padding:40px;background:#f9fafb"><p style="font-size:18px;color:#1f2937">Hey {{name}},</p><p style="color:#4b5563;line-height:1.6">We''re so excited to have you here! You now have access to:</p><ul style="color:#4b5563;line-height:1.8"><li>✅ Exclusive content and resources</li><li>✅ Private community chat</li><li>✅ Weekly live sessions</li><li>✅ 1-on-1 coaching opportunities</li></ul><div style="text-align:center;margin:30px 0"><a href="#" style="background:#6366f1;color:#fff;padding:15px 40px;text-decoration:none;border-radius:8px;display:inline-block;font-weight:bold">Get Started Now</a></div><p style="color:#6b7280;font-size:14px;margin-top:30px">Questions? Just reply to this email!</p></div></div>',
    null
),
(
    'Weekly Newsletter',
    'newsletter',
    '<div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif"><div style="padding:40px;background:#fff"><h2 style="color:#1f2937;margin:0 0 10px 0">This Week''s Update 📰</h2><p style="color:#6b7280;margin:0 0 30px 0">Hey {{name}},</p><div style="background:#f3f4f6;padding:25px;border-radius:10px;margin:20px 0"><h3 style="color:#1f2937;margin:0 0 15px 0">🔥 Featured Content</h3><p style="color:#4b5563;line-height:1.6">Your main article or announcement goes here. Make it compelling!</p><a href="#" style="color:#6366f1;font-weight:bold;text-decoration:none">Read More →</a></div><div style="margin:30px 0"><h3 style="color:#1f2937">Quick Updates:</h3><ul style="color:#4b5563;line-height:1.8"><li>📌 Update or tip #1</li><li>📌 Update or tip #2</li><li>📌 Update or tip #3</li></ul></div><div style="background:#fef3c7;padding:20px;border-radius:10px;margin:30px 0"><p style="margin:0;color:#92400e"><strong>💡 Pro Tip:</strong> Share your best insight of the week here!</p></div></div></div>',
    null
),
(
    'Promotion Email',
    'promo',
    '<div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:60px 40px;text-align:center;border-radius:15px"><h1 style="color:#fff;font-size:42px;margin:0 0 20px 0">🔥 Limited Time Offer!</h1><p style="color:#fff;font-size:24px;margin:0 0 15px 0;opacity:0.95">Special Deal Just for You, {{name}}</p><div style="background:rgba(255,255,255,0.1);padding:30px;border-radius:15px;margin:30px 0"><p style="color:#fff;font-size:56px;font-weight:bold;margin:0;line-height:1">50% OFF</p><p style="color:#fff;font-size:20px;margin:10px 0 0 0;opacity:0.9">Your Next Purchase</p></div><a href="#" style="background:#fff;color:#667eea;padding:18px 50px;text-decoration:none;border-radius:50px;display:inline-block;font-weight:bold;font-size:18px;margin:20px 0">Claim Your Discount</a><p style="color:#fff;margin:30px 0 0 0;font-size:16px;opacity:0.8">⏰ Offer expires in 48 hours</p></div>',
    null
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_subscribers_user_id ON subscribers(user_id);
CREATE INDEX IF NOT EXISTS idx_email_events_campaign_id ON email_events(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_events_subscriber_id ON email_events(subscriber_id);