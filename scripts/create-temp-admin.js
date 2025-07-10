const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in environment');
  process.exit(1);
}

(async () => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    
    const { data, error } = await supabase.auth.admin.createUser({
      email: 'Edvin.lovic@povio.com',
      email_confirm: true,
      password: 'edvin2025%$',
    user_metadata: { },
      app_metadata: { roles: ['admin'] }
    });

    if (error) throw error;
    
    console.log('✅ Temporary admin created successfully!');
    console.log(`- Email: Edvin.lovic@povio.com`);
    console.log(`- Password: edvin2025%$`);
    console.log('- Access level: Full admin');

  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();