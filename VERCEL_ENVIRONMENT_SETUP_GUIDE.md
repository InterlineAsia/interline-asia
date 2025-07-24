# 🔧 VERCEL ENVIRONMENT VARIABLES SETUP GUIDE

## 🚨 **CRITICAL: Environment Variables Required**

The FUNCTION_INVOCATION_FAILED errors are most likely caused by missing environment variables. Here's how to fix this:

## 📋 **STEP-BY-STEP VERCEL DASHBOARD SETUP**

### **Step 1: Access Vercel Dashboard**
1. **Go to**: https://vercel.com/dashboard
2. **Login**: Use your Vercel account credentials
3. **Select Project**: Click on "interline-asia" project

### **Step 2: Navigate to Environment Variables**
1. **Click Settings**: In the project dashboard
2. **Click Environment Variables**: In the left sidebar
3. **Review Current Variables**: Check what's already configured

### **Step 3: Add Required Variables**

**Click "Add New" for each missing variable:**

#### **Variable 1: NEXT_PUBLIC_SUPABASE_URL**
```
Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://your-project-id.supabase.co
Environment: Production, Preview, Development
```

#### **Variable 2: SUPABASE_SERVICE_ROLE_KEY**
```
Name: SUPABASE_SERVICE_ROLE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (your service role key)
Environment: Production, Preview, Development
```

#### **Variable 3: BREVO_API_KEY**
```
Name: BREVO_API_KEY
Value: xkeysib-your-api-key-here
Environment: Production, Preview, Development
```

### **Step 4: Trigger Redeploy**
1. **Save Variables**: Click "Save" for each variable
2. **Trigger Deployment**: 
   - Option A: Push any small change to GitHub
   - Option B: Use Vercel dashboard "Redeploy" button
3. **Wait for Deployment**: 3-5 minutes for complete deployment

## 🔍 **HOW TO GET THE CORRECT VALUES**

### **Supabase Values:**
1. **Login to Supabase**: https://supabase.com/dashboard
2. **Select Project**: Choose your interline-asia project
3. **Go to Settings**: Settings → API
4. **Copy Values**:
   - **URL**: Project URL (starts with https://)
   - **Service Role Key**: service_role key (long JWT token)

### **Brevo API Key:**
1. **Login to Brevo**: https://app.brevo.com/
2. **Go to API Keys**: Account → SMTP & API → API Keys
3. **Copy Key**: Should start with "xkeysib-"

## 🧪 **TESTING AFTER SETUP**

### **Test Environment Variables:**
```bash
# Check if variables are accessible
curl https://interline-asia.vercel.app/api/env-check

# Expected success response:
{
  "success": true,
  "variables": {
    "NEXT_PUBLIC_SUPABASE_URL": { "exists": true, "preview": "https://abc..." },
    "SUPABASE_SERVICE_ROLE_KEY": { "exists": true, "preview": "eyJhbGci..." },
    "BREVO_API_KEY": { "exists": true, "preview": "xkeysib-..." }
  }
}
```

### **Test Enhanced Waitlist API:**
```bash
# Test full waitlist functionality
curl -X POST https://interline-asia.vercel.app/api/enhanced-waitlist \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "firstName": "Test",
    "lastName": "User",
    "company": "Test Company",
    "source": "environment_test"
  }'

# Expected success response:
{
  "success": true,
  "message": "Successfully joined the waitlist! Check your email for confirmation.",
  "environmentStatus": {
    "NEXT_PUBLIC_SUPABASE_URL": "PRESENT",
    "SUPABASE_SERVICE_ROLE_KEY": "PRESENT", 
    "BREVO_API_KEY": "PRESENT"
  }
}
```

## ⚠️ **COMMON ISSUES & SOLUTIONS**

### **Issue 1: Variables Not Taking Effect**
**Solution**: 
- Ensure variables are set for "Production" environment
- Trigger a new deployment after adding variables
- Wait 5-10 minutes for full propagation

### **Issue 2: Invalid Supabase URL**
**Solution**:
- URL must start with "https://"
- URL should end with ".supabase.co"
- Check for typos in project ID

### **Issue 3: Invalid Service Role Key**
**Solution**:
- Key should be a long JWT token (starts with "eyJ")
- Use "service_role" key, not "anon" key
- Ensure key has proper permissions

### **Issue 4: Invalid Brevo Key**
**Solution**:
- Key should start with "xkeysib-"
- Ensure key is active and not expired
- Check API key permissions in Brevo dashboard

## 📊 **VERIFICATION CHECKLIST**

### **Before Adding Variables:**
- [ ] FUNCTION_INVOCATION_FAILED errors on all APIs
- [ ] Environment check shows missing variables
- [ ] All APIs return 500 errors

### **After Adding Variables:**
- [ ] Environment check shows all variables present
- [ ] Enhanced waitlist API returns 200 OK
- [ ] Database entries are created
- [ ] Welcome emails are sent
- [ ] Original waitlist API works

## 🎯 **EXPECTED TIMELINE**

### **Environment Variable Fix:**
- **Setup Time**: 10 minutes (add variables in Vercel)
- **Deployment**: 5 minutes (automatic redeploy)
- **Testing**: 10 minutes (validate complete flow)
- **Total**: **25 minutes to full restoration**

---

**CRITICAL**: This is the most likely fix for the FUNCTION_INVOCATION_FAILED errors. Environment variables are essential for the APIs to access Supabase and Brevo services.