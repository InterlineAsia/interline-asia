// Update Stephen's profile after auth user creation
const { createClient } = require('@supabase/supabase-js');

async function updateStephenProfile() {
  try {
    console.log('🔧 Updating Stephen W profile...');
    
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
    const userId = 'c43c5e5b-01e2-4870-89be-2d3b925cf2e4'; // From previous creation
    const fullName = 'Stephen Williams';
    
    console.log(`📧 Updating profile for: ${userEmail}`);
    console.log(`👤 User ID: ${userId}`);
    
    // First, let's check what columns exist in the profiles table
    const { data: tableInfo, error: tableError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.log('⚠️ Could not query profiles table:', tableError.message);
    } else {
      console.log('📋 Available columns:', Object.keys(tableInfo[0] || {}));
    }
    
    // Try a simple insert/update with basic fields
    const profileData = {
      id: userId,
      full_name: fullName,
      email: userEmail,
      verification_status: 'verified',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      notes: 'Created for Stephen Williams - Interline Travel staff member'
    };
    
    // Try to add is_admin if it exists
    try {
      profileData.is_admin = false;
    } catch (e) {
      console.log('⚠️ is_admin column may not exist, skipping...');
    }
    
    console.log('📝 Inserting profile data:', profileData);
    
    const { data: profileResult, error: profileError } = await supabase
      .from('profiles')
      .upsert(profileData, {
        onConflict: 'id'
      });
    
    if (profileError) {
      console.error('❌ Profile update error:', profileError.message);
      
      // Try with minimal data
      console.log('🔄 Trying with minimal profile data...');
      const minimalData = {
        id: userId,
        full_name: fullName,
        email: userEmail
      };
      
      const { data: minimalResult, error: minimalError } = await supabase
        .from('profiles')
        .upsert(minimalData, {
          onConflict: 'id'
        });
      
      if (minimalError) {
        throw minimalError;
      } else {
        console.log('✅ Minimal profile created successfully');
      }
    } else {
      console.log('✅ Full profile created successfully');
    }
    
    // Verify the user profile
    const { data: verifyData, error: verifyError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', userEmail)
      .single();
    
    if (verifyError) {
      console.error('⚠️ Could not verify profile:', verifyError.message);
    } else {
      console.log('🔍 Profile verification:');
      console.log(`   📧 Email: ${verifyData.email}`);
      console.log(`   👤 Name: ${verifyData.full_name}`);
      console.log(`   🆔 ID: ${verifyData.id}`);
      if (verifyData.is_admin !== undefined) {
        console.log(`   🔐 Admin: ${verifyData.is_admin}`);
      }
      if (verifyData.verification_status) {
        console.log(`   📊 Status: ${verifyData.verification_status}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error updating Stephen profile:', error.message);
    throw error;
  }
}

// Run the script
if (require.main === module) {
  updateStephenProfile()
    .then(() => {
      console.log('\n🎉 Stephen profile update completed!');
      console.log('\n📋 Login Details:');
      console.log('   📧 Email: stephenw@interlinetravel.com.au');
      console.log('   🔑 Password: stephenw2025$');
      console.log('   🔐 Access Level: User');
      console.log('\n🌐 Stephen can now log in at: /login.html');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Failed to update Stephen profile:', error.message);
      process.exit(1);
    });
}

module.exports = { updateStephenProfile };