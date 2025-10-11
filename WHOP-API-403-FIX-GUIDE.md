# 🔧 Whop API 403 Error Fix Guide

## 🚨 The Problem
You're getting a **403 Forbidden** error when trying to sync members from Whop API. This means your app doesn't have the correct permissions to access Whop's membership data.

## 🔍 Root Causes

### 1. **API Key Permissions Issue**
Your `WHOP_API_KEY` doesn't have the required permissions to read memberships.

### 2. **App Configuration Issue**
Your Whop app isn't configured with the correct scopes/permissions.

### 3. **Company ID Issue**
The `NEXT_PUBLIC_WHOP_COMPANY_ID` might be incorrect.

## 🛠️ Step-by-Step Fix

### **Step 1: Check Your Whop App Permissions**

1. **Go to Whop Dashboard**:
   - Visit: https://whop.com/dashboard/developer
   - Select your FlowMail app

2. **Check App Permissions**:
   - Go to "Settings" → "Permissions"
   - Ensure these permissions are enabled:
     - ✅ **Read Memberships**
     - ✅ **Read Users**
     - ✅ **Read Companies**
     - ✅ **Read Access Passes**

3. **If permissions are missing**:
   - Click "Request Permissions"
   - Select the required permissions
   - Wait for approval (usually instant)

### **Step 2: Verify Your API Key**

1. **Go to API Keys Section**:
   - In your Whop app dashboard
   - Go to "Settings" → "API Keys"

2. **Check Your API Key**:
   - Copy your current API key
   - Verify it matches your environment variable

3. **Test API Key**:
   ```bash
   curl -H "Authorization: Bearer YOUR_API_KEY" \
        https://api.whop.com/api/v2/companies/YOUR_COMPANY_ID/memberships
   ```

### **Step 3: Verify Company ID**

1. **Get Correct Company ID**:
   - Go to your Whop community dashboard
   - The Company ID is in the URL: `https://whop.com/dashboard/company/biz_XXXXX`
   - Copy the `biz_XXXXX` part

2. **Update Environment Variable**:
   ```env
   NEXT_PUBLIC_WHOP_COMPANY_ID=biz_XXXXX
   ```

### **Step 4: Update Environment Variables**

Make sure these are set correctly in your `.env.local`:

```env
# Whop Configuration
NEXT_PUBLIC_WHOP_APP_ID=app_ERaTU0VPiLzli7
WHOP_API_KEY=uA_mRDSBxNRoyswhnIqqKEU5yIYZc0G-Y0ZDNOnswk0
NEXT_PUBLIC_WHOP_COMPANY_ID=biz_ONLFgl8n3DgP2y
NEXT_PUBLIC_WHOP_AGENT_USER_ID=user_J0VPNMgVJaYJD
```

### **Step 5: Test the Fix**

1. **Restart your development server**:
   ```bash
   npm run dev
   ```

2. **Test the sync**:
   - Go to your FlowMail app
   - Click "Sync Whop Members"
   - Check the console for detailed error messages

## 🔧 Alternative Solutions

### **Solution 1: Use the Fixed API**

I've created a new API endpoint that handles 403 errors better:

```javascript
// Use this instead of the old sync API
fetch('/api/sync-members-fixed', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userId, experienceId }),
})
```

### **Solution 2: Manual Member Addition**

If the API still doesn't work, you can add members manually:

1. **Add Individual Members**:
   - Use the "Add Member" button
   - Enter name, email, and tier manually

2. **Upload CSV**:
   - Use the "Upload CSV" feature
   - Upload a CSV with member data

### **Solution 3: Check Whop App Status**

1. **Verify App is Active**:
   - Go to your Whop app dashboard
   - Ensure the app status is "Active"

2. **Check App Version**:
   - Make sure you're using the latest version
   - Update if necessary

## 🧪 Testing Your Fix

### **Test 1: API Key Test**
```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
     https://api.whop.com/api/v2/companies/YOUR_COMPANY_ID/memberships
```

**Expected Response**: List of memberships (not 403 error)

### **Test 2: App Permissions Test**
```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
     https://api.whop.com/api/v2/companies/YOUR_COMPANY_ID
```

**Expected Response**: Company information (not 403 error)

### **Test 3: User Authentication Test**
- Access your app from within Whop
- Check if user authentication works
- Verify the user ID is correct

## 🚨 Common Issues & Solutions

### **Issue 1: "App not found"**
**Solution**: Check your `NEXT_PUBLIC_WHOP_APP_ID` is correct

### **Issue 2: "Company not found"**
**Solution**: Check your `NEXT_PUBLIC_WHOP_COMPANY_ID` is correct

### **Issue 3: "Invalid API key"**
**Solution**: Regenerate your API key in Whop dashboard

### **Issue 4: "Insufficient permissions"**
**Solution**: Request the required permissions in your app settings

## 📞 Getting Help

If you're still having issues:

1. **Check Whop Documentation**:
   - https://dev.whop.com/docs

2. **Contact Whop Support**:
   - Go to your Whop dashboard
   - Click "Support" → "Contact Us"

3. **Check App Logs**:
   - Look at your app's console logs
   - Check for detailed error messages

## ✅ Success Indicators

You'll know the fix worked when:

- ✅ No more 403 errors in console
- ✅ Members sync successfully from Whop
- ✅ Each user only sees their own subscribers
- ✅ User isolation is working perfectly

## 🎯 Final Checklist

- [ ] Whop app has correct permissions
- [ ] API key is valid and has correct permissions
- [ ] Company ID is correct
- [ ] Environment variables are set correctly
- [ ] App is restarted after changes
- [ ] User isolation is working
- [ ] No cross-user data access

Once all these are checked, your FlowMail app should work perfectly with proper user isolation! 🎉
