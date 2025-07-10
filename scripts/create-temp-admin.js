const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in environment');
  process.exit(1);
}

(async () => {
  try {
    console.log('Creating Admin user...');
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    
    const { data, error } = await supabase.auth.admin.createUser({
      email: 'edvin.lovic@povio.com', // Convert to lowercase for consistency
      email_confirm: true,
      password: 'edvin2025%$',
      user_metadata: { },
      app_metadata: { role: 'admin' }
    });
    
    console.log('Admin user creation response:', {
      success: !!data && !error,
      userData: data ? {
        id: data.user?.id,
        email: data.user?.email,
        emailConfirm: data.user?.email_confirm,
        app_metadata: data.user?.app_metadata,
      } : null,
      error: error ? JSON.stringify(error) : null
    });

    if (error) throw error;
    
    // After user creation, directly modify the profiles table to ensure admin flags are set
    const userId = data.user.id;
    const timestamp = new Date().toISOString();
    
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        updated_at: timestamp,
        is_admin: true,
        role: 'admin'
      });
      
    if (profileError) {
      console.error('❌ Error setting profile data:', profileError);
    } else {
      console.log('✅ Profile data set successfully');
    }
        
    console.log('✅ Temporary admin created successfully!');
    console.log(`- Email: Edvin.lovic@povio.com`);
    console.log(`- Password: edvin2025%$`);
    console.log('- Access level: Full admin');

  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();