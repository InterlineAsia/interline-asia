# 👤 Stephen Williams User Account Setup

**Email**: `stephenw@interlinetravel.com.au`  
**Password**: `stephenw2025$`  
**Access Level**: User (not admin)  
**Status**: Ready to create

---

## 🔧 SETUP INSTRUCTIONS

### **Method 1: Supabase Dashboard (Recommended)**

#### Step 1: Create Auth User
1. Go to your **Supabase Dashboard**
2. Navigate to **Authentication > Users**
3. Click **"Add User"**
4. Fill in:
   - **Email**: `stephenw@interlinetravel.com.au`
   - **Password**: `stephenw2025$`
   - **Auto Confirm User**: ✅ **YES** (check this box)
5. Click **"Create User"**
6. **Copy the User ID** (UUID) that appears

#### Step 2: Create Profile
1. Go to **SQL Editor** in Supabase
2. Run this SQL (replace `USER_ID_HERE` with the actual UUID):

```sql
INSERT INTO public.profiles (
    id,
    full_name,
    email,
    verification_status,
    is_admin,
    verified,
    role,
    created_at,
    updated_at,
    notes
) VALUES (
    'USER_ID_HERE', -- Replace with actual user ID
    'Stephen Williams',
    'stephenw@interlinetravel.com.au',
    'verified',
    false, -- User-only access
    true,
    'user',
    NOW(),
    NOW(),
    'Created for Stephen Williams - Interline Travel staff member'
)
ON CONFLICT (id) 
DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    verification_status = EXCLUDED.verification_status,
    is_admin = EXCLUDED.is_admin,
    verified = EXCLUDED.verified,
    role = EXCLUDED.role,
    updated_at = NOW(),
    notes = EXCLUDED.notes;
```

#### Step 3: Verify Creation
Run this SQL to confirm the user was created correctly:

```sql
SELECT 
    id,
    full_name,
    email,
    verification_status,
    is_admin,
    verified,
    role,
    created_at,
    notes
FROM public.profiles 
WHERE email = 'stephenw@interlinetravel.com.au';
```

---

### **Method 2: Command Line (If you have service key)**

If you have the `SUPABASE_SERVICE_ROLE_KEY` environment variable set:

```bash
cd /path/to/interline-asia-dev
node scripts/create-stephen-user.cjs
```

---

## ✅ **VERIFICATION CHECKLIST**

After setup, verify Stephen's account:

- [ ] **Auth User Created**: Email `stephenw@interlinetravel.com.au` exists in Authentication > Users
- [ ] **Email Confirmed**: User shows as "Confirmed" (not pending)
- [ ] **Profile Created**: User appears in profiles table
- [ ] **User Access**: `is_admin = false` (not admin)
- [ ] **Verified Status**: `verified = true` and `verification_status = 'verified'`
- [ ] **Login Test**: Stephen can log in at `/login.html`

---

## 🔐 **ACCESS PERMISSIONS**

Stephen will have:

### ✅ **User Access**:
- ✅ Login to member dashboard
- ✅ View cruise deals
- ✅ Submit booking requests
- ✅ Upload verification documents
- ✅ Use support chat bot

### ❌ **No Admin Access**:
- ❌ Cannot access admin dashboard
- ❌ Cannot view other users' data
- ❌ Cannot approve/reject verifications
- ❌ Cannot manage cruise deals
- ❌ Cannot access admin tools

---

## 🌐 **LOGIN DETAILS FOR STEPHEN**

**Website**: Your Interline Asia domain  
**Login URL**: `/login.html`  
**Email**: `stephenw@interlinetravel.com.au`  
**Password**: `stephenw2025$`  

After login, Stephen will be redirected to the member dashboard where he can:
- Browse exclusive cruise deals
- Submit booking requests
- Access member-only features

---

## 🛠 **TROUBLESHOOTING**

### **If Stephen can't log in**:
1. Check email is confirmed in Authentication > Users
2. Verify profile exists in profiles table
3. Ensure `verified = true` in profile
4. Test password reset if needed

### **If Stephen sees admin features**:
1. Check `is_admin = false` in profiles table
2. Verify email is not in admin whitelist in code
3. Clear browser cache and re-login

### **If Stephen can't access member features**:
1. Check `verification_status = 'verified'`
2. Verify `verified = true` in profile
3. Check member gate logic in frontend

---

**🎉 Stephen's account is ready to be created! Follow Method 1 for the easiest setup.**