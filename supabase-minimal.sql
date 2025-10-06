-- Minimal SQL to add missing tables and data
-- Run this if you already have some tables created

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Only create tables that don't exist
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

CREATE TABLE IF NOT EXISTS email_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT CHECK (category IN ('welcome', 'newsletter', 'promo')),
    html_content TEXT NOT NULL,
    thumbnail_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS email_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    subscriber_id UUID REFERENCES subscribers(id) ON DELETE CASCADE,
    event_type TEXT CHECK (event_type IN ('open', 'click')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


$$ LANGUAGE plpgsql;

-- Insert default email templates (only if they don't exist)
INSERT INTO email_templates (name, category, html_content, thumbnail_url) 
SELECT * FROM (VALUES
    ('Welcome Email', 'welcome', '<div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;background:#fff;padding:40px"><div style="background:#6366f1;padding:30px;text-align:center;border-radius:10px 10px 0 0"><h1 style="color:#fff;margin:0;font-size:28px">Welcome to Our Community! 🎉</h1></div><div style="padding:40px;background:#f9fafb"><p style="font-size:18px;color:#1f2937">Hey {{name}},</p><p style="color:#4b5563;line-height:1.6">We''re so excited to have you here!</p></div></div>', null),
    ('Weekly Newsletter', 'newsletter', '<div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif"><div style="padding:40px;background:#fff"><h2 style="color:#1f2937;margin:0 0 10px 0">This Week''s Update 📰</h2><p style="color:#6b7280;margin:0 0 30px 0">Hey {{name}},</p></div></div>', null),
    ('Promotion Email', 'promo', '<div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:60px 40px;text-align:center;border-radius:15px"><h1 style="color:#fff;font-size:42px;margin:0 0 20px 0">🔥 Limited Time Offer!</h1></div>', null)
) AS t(name, category, html_content, thumbnail_url)
WHERE NOT EXISTS (SELECT 1 FROM email_templates WHERE name = t.name);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_subscribers_user_id ON subscribers(user_id);
CREATE INDEX IF NOT EXISTS idx_email_events_campaign_id ON email_events(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_events_subscriber_id ON email_events(subscriber_id);