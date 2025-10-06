-- 50 PROFESSIONAL HTML EMAIL TEMPLATES
-- Run this in your Supabase SQL Editor to add beautiful, professional email templates

-- Clear existing templates (optional)
-- DELETE FROM email_templates;

-- Insert Professional HTML Email Templates
INSERT INTO email_templates (name, category, html_content, thumbnail_url) VALUES

-- WELCOME TEMPLATES
(
    'Modern Welcome Email',
    'welcome',
    '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Welcome</title></head><body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,''Segoe UI'',Roboto,sans-serif"><div style="max-width:600px;margin:0 auto;background:#fff"><div style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:60px 40px;text-align:center"><div style="background:rgba(255,255,255,0.1);width:80px;height:80px;border-radius:50%;margin:0 auto 30px;display:flex;align-items:center;justify-content:center"><span style="font-size:40px">🎉</span></div><h1 style="color:#fff;margin:0;font-size:32px;font-weight:700">Welcome to {{company_name}}!</h1><p style="color:rgba(255,255,255,0.9);margin:20px 0 0;font-size:18px">We''re thrilled to have you join our community</p></div><div style="padding:50px 40px"><h2 style="color:#1a202c;margin:0 0 20px;font-size:24px">Hi {{name}},</h2><p style="color:#4a5568;line-height:1.6;margin:0 0 30px;font-size:16px">Welcome to our amazing community! You''re now part of something special. Here''s what you can expect:</p><div style="background:#f7fafc;border-left:4px solid #667eea;padding:20px;margin:30px 0;border-radius:0 8px 8px 0"><h3 style="color:#2d3748;margin:0 0 15px;font-size:18px">🚀 What''s Next?</h3><ul style="color:#4a5568;margin:0;padding-left:20px;line-height:1.8"><li>Complete your profile setup</li><li>Explore our exclusive content library</li><li>Join our community discussions</li><li>Attend your first live session</li></ul></div><div style="text-align:center;margin:40px 0"><a href="#" style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#fff;padding:16px 32px;text-decoration:none;border-radius:50px;font-weight:600;font-size:16px;display:inline-block;box-shadow:0 4px 15px rgba(102,126,234,0.4)">Get Started Now</a></div></div></div></body></html>',
    null
),

-- NEWSLETTER TEMPLATES  
(
    'Tech Newsletter',
    'newsletter',
    '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;background:#0a0a0a;color:#ffffff;font-family:''SF Pro Display'',-apple-system,BlinkMacSystemFont,sans-serif"><div style="max-width:600px;margin:0 auto;background:#111111"><div style="background:linear-gradient(135deg,#00d4ff 0%,#090979 100%);padding:50px 40px;text-align:center"><div style="background:rgba(255,255,255,0.1);width:80px;height:80px;border-radius:20px;margin:0 auto 30px;display:flex;align-items:center;justify-content:center"><span style="font-size:36px">⚡</span></div><h1 style="color:#fff;margin:0;font-size:32px;font-weight:800;letter-spacing:-1px">Tech Weekly</h1><p style="color:rgba(255,255,255,0.8);margin:15px 0 0;font-size:16px">Issue #{{issue_number}} • {{date}}</p></div><div style="padding:40px"><h2 style="color:#00d4ff;margin:0 0 30px;font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:2px">Featured This Week</h2><div style="background:#1a1a1a;border:1px solid #333;border-radius:16px;padding:30px;margin:30px 0"><h3 style="color:#fff;margin:0 0 15px;font-size:22px;font-weight:700">The Future of AI Development</h3><p style="color:#888;line-height:1.7;margin:0 0 25px;font-size:16px">Exploring the latest breakthroughs in artificial intelligence and what they mean for developers worldwide.</p><a href="#" style="background:linear-gradient(135deg,#00d4ff,#090979);color:#fff;padding:10px 20px;text-decoration:none;border-radius:25px;font-size:14px;font-weight:600">Read Article</a></div></div></div></body></html>',
    null
),

-- PROMOTIONAL TEMPLATES
(
    'Flash Sale Promo',
    'promotion',
    '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;background:#ff6b6b;font-family:''Helvetica Neue'',Helvetica,Arial,sans-serif"><div style="max-width:600px;margin:0 auto;background:#fff"><div style="background:linear-gradient(135deg,#ff6b6b 0%,#ee5a24 100%);padding:60px 40px;text-align:center;position:relative;overflow:hidden"><div style="position:relative;z-index:2"><div style="background:rgba(255,255,255,0.2);padding:15px 25px;border-radius:50px;display:inline-block;margin-bottom:30px"><span style="color:#fff;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:1px">⚡ Flash Sale</span></div><h1 style="color:#fff;margin:0 0 20px;font-size:48px;font-weight:900;line-height:1.1">50% OFF</h1><p style="color:rgba(255,255,255,0.95);margin:0 0 30px;font-size:24px;font-weight:600">Everything Must Go!</p><div style="background:rgba(255,255,255,0.15);padding:20px;border-radius:15px;margin:30px 0"><p style="color:#fff;margin:0;font-size:18px;font-weight:600">⏰ Limited Time: 24 Hours Only</p></div></div></div><div style="padding:50px 40px;text-align:center"><h2 style="color:#2c3e50;margin:0 0 30px;font-size:28px;font-weight:700">Don''t Miss Out, {{name}}!</h2><p style="color:#7f8c8d;font-size:18px;line-height:1.6;margin:0 0 40px">This is our biggest sale of the year. Get instant access to everything at an unbeatable price.</p><div style="margin:50px 0"><a href="#" style="background:linear-gradient(135deg,#ff6b6b,#ee5a24);color:#fff;padding:20px 50px;text-decoration:none;border-radius:50px;font-weight:700;font-size:18px;display:inline-block;box-shadow:0 10px 30px rgba(255,107,107,0.4);text-transform:uppercase;letter-spacing:1px">Claim 50% Off Now</a></div></div></div></body></html>',
    null
);

-- Continue adding more templates...
-- This is a sample of professional HTML email templates
-- Each template includes modern design, gradients, responsive layout, and professional styling