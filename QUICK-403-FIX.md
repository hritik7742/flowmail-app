# 🚨 QUICK FIX: 403 Forbidden Error

## 🔍 **Step 1: Run Diagnostic Tool**

First, let's see exactly what's wrong:

1. **Go to your app**: `http://localhost:3000/api/diagnose-whop-api`
2. **Check the results** - it will tell you exactly what's missing

## 🔧 **Step 2: Fix Whop App Permissions**

The 403 error means your Whop app doesn't have the right permissions. Here's how to fix it:

### **2.1 Go to Whop Dashboard**
1. Visit: https://whop.com/dashboard/developer
2. Select your **FlowMail app**
3. Go to **"Settings"** → **"Permissions"**

### **2.2 Enable Required Permissions**
Make sure these permissions are **ENABLED**:
- ✅ **Read Companies**
- ✅ **Read Memberships** 
- ✅ **Read Users**
- ✅ **Read Access Passes**

### **2.3 If Permissions are Missing**
1. Click **"Request Permissions"**
2. Select all the required permissions above
3. Submit the request
4. Wait for approval (usually instant)

## 🔑 **Step 3: Check Your API Key**

### **3.1 Get Your API Key**
1. In your Whop app dashboard
2. Go to **"Settings"** → **"API Keys"**
3. Copy your **App Secret** (this is your API key)

### **3.2 Update Environment Variables**
Make sure your `.env.local` file has:
```env
WHOP_API_KEY=your_actual_api_key_here
NEXT_PUBLIC_WHOP_COMPANY_ID=biz_XXXXX
NEXT_PUBLIC_WHOP_APP_ID=app_XXXXX
```

## 🏢 **Step 4: Verify Company ID**

### **4.1 Get Correct Company ID**
1. Go to your **Whop community dashboard**
2. Look at the URL: `https://whop.com/dashboard/company/biz_XXXXX`
3. Copy the `biz_XXXXX` part

### **4.2 Update Environment Variable**
```env
NEXT_PUBLIC_WHOP_COMPANY_ID=biz_XXXXX
```

## 🧪 **Step 5: Test the Fix**

### **5.1 Restart Your Server**
```bash
npm run dev
```

### **5.2 Test API Access**
Go to: `http://localhost:3000/api/diagnose-whop-api`

**Expected Result**: All tests should pass ✅

### **5.3 Test Member Sync**
1. Go to your FlowMail app
2. Click **"Sync Whop Members"**
3. Should work without 403 error ✅

## 🚨 **Common Issues & Quick Fixes**

### **Issue 1: "App not found"**
**Fix**: Check your `NEXT_PUBLIC_WHOP_APP_ID` is correct

### **Issue 2: "Company not found"** 
**Fix**: Check your `NEXT_PUBLIC_WHOP_COMPANY_ID` is correct

### **Issue 3: "Invalid API key"**
**Fix**: Generate a new API key in Whop dashboard

### **Issue 4: "Insufficient permissions"**
**Fix**: Enable the required permissions in your app settings

## 📞 **Still Having Issues?**

If you're still getting 403 errors:

1. **Check the diagnostic tool results** at `/api/diagnose-whop-api`
2. **Verify all environment variables** are set correctly
3. **Make sure your Whop app is active** in the dashboard
4. **Try generating a new API key** if the current one doesn't work

## ✅ **Success Checklist**

- [ ] Whop app has all required permissions enabled
- [ ] API key is correct and has proper permissions
- [ ] Company ID is correct
- [ ] Environment variables are set correctly
- [ ] Server restarted after changes
- [ ] Diagnostic tool shows all tests passing
- [ ] Member sync works without 403 error

Once all these are checked, your 403 error should be fixed! 🎉
