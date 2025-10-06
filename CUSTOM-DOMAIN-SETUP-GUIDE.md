# Custom Domain Setup Guide for FlowMail

## 🎯 Overview
This guide shows you how to set up a custom domain for professional email sending in FlowMail.

## 📋 Prerequisites
- A domain name (e.g., yourdomain.com)
- Access to your domain's DNS settings
- Resend account (already configured in FlowMail)

## 🌐 Step 1: Choose Your Domain Provider

### Recommended Providers:
- **Hostinger** - Cheap, good for testing ($1-5/year)
- **Namecheap** - Popular, reliable ($8-15/year)
- **Cloudflare** - Advanced features ($8-10/year)
- **GoDaddy** - Widely used ($10-20/year)

### Domain Suggestions for Testing:
- `yourname-flowmail.com`
- `myemail-test.com` 
- `flowmail-demo.org`

## ⚙️ Step 2: DNS Configuration

### Required DNS Records:

#### 1. **MX Record (Mail Exchange)**
```
Type: MX
Name: @ (or leave blank)
Value: feedback-smtp.us-east-1.amazonses.com
Priority: 10
TTL: 3600
```

#### 2. **TXT Record (SPF - Sender Policy Framework)**
```
Type: TXT
Name: @ (or leave blank)
Value: v=spf1 include:_spf.resend.com ~all
TTL: 3600
```

#### 3. **CNAME Record (DKIM - Domain Keys)**
```
Type: CNAME
Name: resend._domainkey
Value: resend._domainkey.resend.com
TTL: 3600
```

#### 4. **TXT Record (DMARC - Optional but Recommended)**
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com
TTL: 3600
```

## 🔧 Step 3: Provider-Specific Instructions

### **Hostinger DNS Setup:**
1. Login to Hostinger control panel
2. Go to **Domains** → **Manage**
3. Click **DNS Zone**
4. Add the records above
5. Wait 24-48 hours for propagation

### **Namecheap DNS Setup:**
1. Login to Namecheap account
2. Go to **Domain List** → **Manage**
3. Click **Advanced DNS**
4. Add the records above
5. Wait 24-48 hours for propagation

### **Cloudflare DNS Setup:**
1. Login to Cloudflare dashboard
2. Select your domain
3. Go to **DNS** → **Records**
4. Add the records above
5. Set proxy status to **DNS only** (gray cloud)
6. Wait 24-48 hours for propagation

### **GoDaddy DNS Setup:**
1. Login to GoDaddy account
2. Go to **My Products** → **DNS**
3. Click **Manage DNS**
4. Add the records above
5. Wait 24-48 hours for propagation

## 🧪 Step 4: Test Your Setup

### **DNS Propagation Check:**
Use these tools to verify your DNS records:
- https://dnschecker.org/
- https://mxtoolbox.com/
- https://whatsmydns.net/

### **Email Authentication Check:**
- https://mxtoolbox.com/spf.aspx
- https://mxtoolbox.com/dkim.aspx
- https://dmarcian.com/dmarc-inspector/

## 📧 Step 5: Configure in FlowMail

1. **Go to Settings** → **Domain Setup**
2. **Enter your domain** (e.g., yourdomain.com)
3. **Update your settings:**
   - Display Name: "Your Business Name"
   - Username: "hello" (will become hello@yourdomain.com)
   - Reply-To: your-personal@gmail.com
   - Custom Domain: yourdomain.com

4. **Click "Update Professional Email Settings"**

## ⏰ Step 6: Verification Process

### **Automatic Verification (Future Feature):**
FlowMail will automatically verify your domain setup.

### **Manual Verification (Current):**
1. **Wait 24-48 hours** for DNS propagation
2. **Contact support** at support@flowmail.com
3. **Include your domain name** in the email
4. **We'll verify and activate** your custom domain

## 🎉 Step 7: Start Sending!

Once verified, your emails will be sent from:
```
From: "Your Business Name" <hello@yourdomain.com>
Reply-To: your-personal@gmail.com
```

## 🔍 Troubleshooting

### **Common Issues:**

#### **DNS Not Propagating:**
- Wait 24-48 hours
- Clear your DNS cache: `ipconfig /flushdns` (Windows)
- Check multiple DNS checkers

#### **SPF Record Issues:**
- Make sure there's only ONE SPF record
- Don't include multiple `v=spf1` records
- Use `~all` not `-all` for testing

#### **DKIM Not Working:**
- Ensure CNAME points to `resend._domainkey.resend.com`
- Don't add quotes around the value
- Wait for full propagation

#### **Emails Going to Spam:**
- Verify all DNS records are correct
- Start with small test sends
- Warm up your domain gradually
- Ensure proper reply-to address

## 💡 Pro Tips

### **For Testing:**
1. **Use a subdomain** first: `mail.yourdomain.com`
2. **Start with small volumes** (1-10 emails)
3. **Test with multiple email providers** (Gmail, Outlook, Yahoo)
4. **Check spam folders** initially

### **For Production:**
1. **Use your main domain** for better deliverability
2. **Set up proper DMARC policy**
3. **Monitor bounce rates**
4. **Maintain good sender reputation**

## 📞 Support

Need help? Contact us:
- **Email:** support@flowmail.com
- **Include:** Your domain name and any error messages
- **Response time:** 24-48 hours

## 🔗 Useful Links

- [Resend Domain Setup](https://resend.com/docs/dashboard/domains/introduction)
- [SPF Record Generator](https://www.spfwizard.net/)
- [DMARC Generator](https://dmarc.org/dmarc-setup/)
- [DNS Propagation Checker](https://dnschecker.org/)

---

**Happy emailing! 🚀**