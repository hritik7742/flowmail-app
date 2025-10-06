-- COMPLETE FLOWMAIL DATABASE SCHEMA - UPDATED VERSION
-- Fix database issues for FlowMail
-- Run this in your Supabase SQL Editor
-- Ensure all tables exist with correct structure
-- INCLUDES FIXES FOR MANUAL SUBSCRIBER MANAGEMENT

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
    sender_name TEXT DEFAULT 'noreply',
    sender_email_configured BOOLEAN DEFAULT FALSE,
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
    opens INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscribers table (UPDATED - allows manual entries)
CREATE TABLE IF NOT EXISTS subscribers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    whop_member_id TEXT, -- NULLABLE for manual entries
    email TEXT,
    name TEXT,
    tier TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    source TEXT DEFAULT 'whop_sync' -- Track subscriber origin
);

-- Email events table
CREATE TABLE IF NOT EXISTS email_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    subscriber_id UUID REFERENCES subscribers(id) ON DELETE CASCADE,
    event_type TEXT CHECK (event_type IN ('open', 'click')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- APPLY FIXES TO EXISTING TABLES (safe updates)

-- Fix subscribers table if it already exists with old structure
DO $$ 
BEGIN
    -- Make whop_member_id nullable if it's currently NOT NULL
    BEGIN
        ALTER TABLE subscribers ALTER COLUMN whop_member_id DROP NOT NULL;
    EXCEPTION
        WHEN OTHERS THEN NULL; -- Ignore if already nullable
    END;
    
    -- Add source column if it doesn't exist
    BEGIN
        ALTER TABLE subscribers ADD COLUMN source TEXT DEFAULT 'whop_sync';
    EXCEPTION
        WHEN duplicate_column THEN NULL; -- Ignore if column already exists
    END;
END $$;

-- Update existing records to have source
UPDATE subscribers SET source = 'whop_sync' WHERE source IS NULL;

-- Drop old constraints safely
ALTER TABLE subscribers DROP CONSTRAINT IF EXISTS subscribers_user_id_whop_member_id_key;

-- Create the increment function
CREATE OR REPLACE FUNCTION increment_campaign_opens(campaign_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE campaigns SET opens = opens + 1 WHERE id = campaign_id;
END;
$$ LANGUAGE plpgsql;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_subscribers_user_id ON subscribers(user_id);
CREATE INDEX IF NOT EXISTS idx_email_events_campaign_id ON email_events(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_events_subscriber_id ON email_events(subscriber_id);

-- NEW INDEXES FOR MANUAL SUBSCRIBER MANAGEMENT

-- Unique constraint for Whop members (allows NULL whop_member_id)
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscribers_unique_whop 
ON subscribers(user_id, whop_member_id) 
WHERE whop_member_id IS NOT NULL;

-- Unique constraint for email per user (prevents duplicate emails)
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscribers_unique_email 
ON subscribers(user_id, email);

-- Index for source column
CREATE INDEX IF NOT EXISTS idx_subscribers_source ON subscribers(source);

-- Add sender name fields to existing users table
DO $$ 
BEGIN
    -- Add sender_name column if it doesn't exist
    BEGIN
        ALTER TABLE users ADD COLUMN sender_name TEXT DEFAULT 'noreply';
    EXCEPTION
        WHEN duplicate_column THEN NULL; -- Ignore if column already exists
    END;
    
    -- Add sender_email_configured column if it doesn't exist
    BEGIN
        ALTER TABLE users ADD COLUMN sender_email_configured BOOLEAN DEFAULT FALSE;
    EXCEPTION
        WHEN duplicate_column THEN NULL; -- Ignore if column already exists
    END;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN subscribers.whop_member_id IS 'Whop member ID - NULL for manual entries';
COMMENT ON COLUMN subscribers.source IS 'Source of subscriber: whop_sync, manual_add, manual_upload';
COMMENT ON COLUMN users.sender_name IS 'Custom sender name for emails (e.g., "john" for john@flowmail.rovelin.com)';
COMMENT ON COLUMN users.sender_email_configured IS 'Whether user has configured their custom sender email';

-- Verification: Show updated table structure (optional)
-- Uncomment the next line to see the updated structure
-- SELECT column_name, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'subscribers' ORDER BY ordinal_position;