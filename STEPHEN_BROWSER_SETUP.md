# 🌐 Stephen User Creation - Browser Method

Since environment variables aren't set up, here's the easiest way to create Stephen's account using your existing admin access:

## 🔧 **BROWSER CONSOLE METHOD** (2 minutes)

### **Step 1: Open Admin Page**
1. Go to your Interline Asia website
2. Log in as admin (`admin@telenational.com.au` or `rodney@telenational.com.au`)
3. Navigate to any admin page (like `/admin.html` or `/admin-verifications.html`)

### **Step 2: Open Browser Console**
1. Press **F12** (or right-click → Inspect)
2. Go to the **Console** tab
3. Copy and paste this code:

```javascript
// Stephen user creation script
console.log('🔧 Creating Stephen Williams user account...');

const stephenUser = {
  email: 'stephenw@interlinetravel.com.au',
  password: 'stephenw2025$',
  fullName: 'Stephen Williams'
};

async function createStephenAccount() {
  try {
    console.log('📧 Creating user:', stephenUser.email);
    
    if (typeof window.supabaseClient === 'undefined') {
      throw new Error('Supabase client not available. Please run this on an admin page.');
    }
    
    // Sign up the user
    const signupResult = await window.supabaseClient.signUp({
      email: stephenUser.email,
      password: stephenUser.password,
      fullName: stephenUser.fullName
    });
    
    console.log('✅ Signup result:', signupResult);
    
    if (signupResult.user) {
      console.log('👤 User created with ID:', signupResult.user.id);
      
      // Update the user to be verified
      const updateResult = await window.supabaseClient.updateUserStatus(
        signupResult.user.id,
        'verified',
        'Created for Stephen Williams - Interline Travel staff member'
      );
      
      console.log('✅ User verified:', updateResult);
      
      console.log('\n🎉 Stephen account created successfully!');
      console.log('📋 Login Details:');
      console.log('   📧 Email:', stephenUser.email);
      console.log('   🔑 Password:', stephenUser.password);
      console.log('   🔐 Access: User (not admin)');
      console.log('   ✅ Status: Verified');
      
      return signupResult;
    }
    
  } catch (error) {
    console.error('❌ Error creating Stephen account:', error);
    
    if (error.message.includes('already registered')) {
      console.log('⚠️ User already exists. Attempting to verify...');
      
      try {
        const users = await window.supabaseClient.getAllUsers();
        const existingUser = users.find(u => u.email === stephenUser.email);
        
        if (existingUser) {
          const updateResult = await window.supabaseClient.updateUserStatus(
            existingUser.id,
            'verified',
            'Updated for Stephen Williams - Interline Travel staff member'
          );
          
          console.log('✅ Existing user verified:', updateResult);
          console.log('📧 Stephen can now log in with:', stephenUser.email);
        }
      } catch (verifyError) {
        console.error('❌ Could not verify existing user:', verifyError);
      }
    }
  }
}

// Run the creation
createStephenAccount();
```

### **Step 3: Press Enter**
The script will run and create Stephen's account automatically.

---

## 📋 **ALTERNATIVE: Manual Supabase Dashboard**

If the browser method doesn't work:

### **Step 1: Supabase Auth**
1. Go to your Supabase Dashboard
2. Authentication → Users → Add User
3. Email: `stephenw@interlinetravel.com.au`
4. Password: `stephenw2025$`
5. Auto Confirm: ✅ YES

### **Step 2: Update Profile**
1. Go to Table Editor → profiles
2. Find Stephen's user (by email)
3. Edit the row:
   - `verification_status`: `verified`
   - `is_admin`: `false`
   - `verified`: `true`
   - `role`: `user`

---

## ✅ **VERIFICATION**

After creation, Stephen should be able to:
- ✅ Log in at `/login.html`
- ✅ Access member dashboard
- ✅ Browse cruise deals
- ✅ Submit booking requests
- ❌ **Cannot** access admin features

---

## 🔐 **Stephen's Login Details**
- **Email**: `stephenw@interlinetravel.com.au`
- **Password**: `stephenw2025$`
- **Access Level**: User (not admin)
- **Status**: Verified

**Try the browser console method first - it's the quickest!**