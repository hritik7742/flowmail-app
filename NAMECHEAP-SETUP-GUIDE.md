# Namecheap Setup Guide for flowmailwhop.online

## 🎯 **Step-by-Step Instructions**

### **Step 1: Add DNS Records in Namecheap**

You're already in the right place! In your Namecheap Advanced DNS page, add these 3 records:

#### **🔸 Record 1: MX Record**
1. Click **"Add New Record"**
2. Select **"MX Record"**
3. Fill in:
   - **Type**: MX Record
   - **Host**: `@`
   - **Value**: `feedback-smtp.us-east-1.amazonses.com`
   - **Priority**: `10`
   - **TTL**: Automatic
4. Click **"Save Changes"**

#### **🔸 Record 2: Update TXT Record (SPF)**
You already have a TXT record. Update it:
1. Find the existing TXT record (shows `v=spf1 include:spf.efwd.registrar-servers.com ~all`)
2. Click **"Edit"** (pencil icon)
3. Change the **Value** to: `v=spf1 include:amazonses.com ~all`
4. Click **"Save Changes"**

#### **🔸 Record 3: CNAME Record (DKIM)**
1. Click **"Add New Record"**
2. Select **"CNAME Record"**
3. Fill in:
   - **Type**: CNAME Record
   - **Host**: `resend._domainkey`
   - **Value**: `resend._domainkey.resend.com`
   - **TTL**: Automatic
4. Click **"Save Changes"**

### **Step 2: Configure in FlowMail**

1. **Go to FlowMail Settings** → **Domain Setup**
2. **Fill in:**
   - **Display Name**: `FlowMail Whop` (or your business name)
   - **Username**: `hello` (becomes hello@flowmailwhop.online)
   - **Reply-To Email**: `your-personal@gmail.com`
   - **Custom Domain**: `flowmailwhop.online`
3. **Click "Update Professional Email Settings"**

### **Step 3: Wait & Verify**

1. **Wait 2-24 hours** for DNS propagation
2. **Click "Verify Domain Automatically"** in FlowMail
3. **System will check all DNS records automatically**
4. **Domain gets activated instantly if all records are correct**

## 🎉 **Final Result:**

Your emails will be sent from:
```
From: "FlowMail Whop" <hello@flowmailwhop.online>
Reply-To: your-personal@gmail.com
```

## ✅ **What Your Namecheap DNS Should Look Like:**

```
┌─────────────────────────────────────────────────────────────────┐
│ Type    │ Host              │ Value                             │
├─────────────────────────────────────────────────────────────────┤
│ CNAME   │ www               │ parkingpage.namecheap.com.       │
│ URL     │ @                 │ http://www.flowmailwhop.online/  │
│ MX      │ @                 │ feedback-smtp.us-east-1.amazon...│
│ TXT     │ @                 │ v=spf1 include:amazonses.com ~all│
│ CNAME   │ resend._domainkey │ resend._domainkey.resend.com     │
└─────────────────────────────────────────────────────────────────┘
```

## 🔍 **Verification Process:**

The automatic verification will check:
- ✅ **MX Record**: Points to Amazon SES
- ✅ **SPF Record**: Includes amazonses.com
- ✅ **DKIM Record**: Points to Resend DKIM

If any record is missing or incorrect, you'll get specific feedback on what to fix!

## 🚀 **No More Manual Verification Needed!**

The system now handles everything automatically - no need to contact support! 🎉