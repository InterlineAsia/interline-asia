// Create Stephen W user account - Interline Asia
// User-only access (not admin) for stephenw@interlinetravel.com.au

const { createClient } = require('@supabase/supabase-js');

async function createStephenUser() {
  try {
    console.log('🔧 Creating Stephen W user account...');
    
    // Initialize Supabase with service role key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nxreyyxbuwxjfmtvdkji.supabase.co';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseServiceKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is required');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    const userEmail = 'stephenw@interlinetravel.com.au';
    const userPassword = 'stephenw2025$';
    const fullName = 'Stephen Williams';
    
    console.log(`📧 Creating user: ${userEmail}`);
    
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userEmail,
      password: userPassword,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: fullName
      }
    });
    
    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log('⚠️ User already exists, updating profile...');
        
        // Get existing user
        const { data: existingUsers } = await supabase.auth.admin.listUsers();
        const existingUser = existingUsers.users.find(u => u.email === userEmail);
        
        if (existingUser) {
          // Update password
          const { error: updateError } = await supabase.auth.admin.updateUserById(
            existingUser.id,
            { password: userPassword }
          );
          
          if (updateError) {
            console.error('❌ Failed to update password:', updateError.message);
          } else {
            console.log('✅ Password updated successfully');
          }
          
          // Update profile
          await updateUserProfile(supabase, existingUser.id, userEmail, fullName);
          return;
        }
      } else {
        throw authError;
      }
    }
    
    if (authData.user) {
      console.log('✅ Auth user created successfully');
      console.log(`👤 User ID: ${authData.user.id}`);
      
      // Create/update profile
      await updateUserProfile(supabase, authData.user.id, userEmail, fullName);
    }
    
  } catch (error) {
    console.error('❌ Error creating Stephen user:', error.message);
    throw error;
  }
}

async function updateUserProfile(supabase, userId, email, fullName) {
  try {
    console.log('📝 Creating/updating user profile...');
    
    // Insert or update profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        full_name: fullName,
        email: email,
        verification_status: 'verified', // Pre-verified for Stephen
        is_admin: false, // User-only access
        verified: true,
        role: 'user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        notes: 'Created for Stephen Williams - Interline Travel staff member'
      }, {
        onConflict: 'id'
      });
    
    if (profileError) {
      console.error('❌ Profile creation error:', profileError.message);
      throw profileError;
    }
    
    console.log('✅ User profile created/updated successfully');
    
    // Verify the user was created correctly
    const { data: verifyData, error: verifyError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();
    
    if (verifyError) {
      console.error('⚠️ Could not verify user creation:', verifyError.message);
    } else {
      console.log('🔍 User verification:');
      console.log(`   📧 Email: ${verifyData.email}`);
      console.log(`   👤 Name: ${verifyData.full_name}`);
      console.log(`   🔐 Admin: ${verifyData.is_admin}`);
      console.log(`   ✅ Verified: ${verifyData.verified}`);
      console.log(`   📊 Status: ${verifyData.verification_status}`);
    }
    
  } catch (error) {
    console.error('❌ Error updating profile:', error.message);
    throw error;
  }
}

// Run the script
if (require.main === module) {
  createStephenUser()
    .then(() => {
      console.log('\n🎉 Stephen user creation completed successfully!');
      console.log('\n📋 Login Details:');
      console.log('   📧 Email: stephenw@interlinetravel.com.au');
      console.log('   🔑 Password: stephenw2025$');
      console.log('   🔐 Access Level: User (not admin)');
      console.log('   ✅ Status: Verified');
      console.log('\n🌐 Stephen can now log in at: /login.html');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Failed to create Stephen user:', error.message);
      process.exit(1);
    });
}

module.exports = { createStephenUser };