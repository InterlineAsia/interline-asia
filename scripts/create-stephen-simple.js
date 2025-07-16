// Simple Stephen user creation using existing Supabase client
// Run this in the browser console on your admin page

console.log('🔧 Creating Stephen Williams user account...');

// User details
const stephenUser = {
  email: 'stephenw@interlinetravel.com.au',
  password: 'stephenw2025$',
  fullName: 'Stephen Williams'
};

// Function to create Stephen's account
async function createStephenAccount() {
  try {
    console.log('📧 Creating user:', stephenUser.email);
    
    // Check if supabaseClient is available (should be on admin pages)
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
      
      // Try to find and verify existing user
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
    
    throw error;
  }
}

// Run the creation
createStephenAccount();