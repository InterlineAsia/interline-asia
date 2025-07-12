// Debug current user and admin status
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nxreyyxbuwxjfmtvdkji.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all users to debug admin status
    const { data: users, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return res.status(200).json({
      success: true,
      users: users,
      adminUsers: users.filter(u => [
        'admin@interlineasia.com',
        'edvin@interlineasia.com', 
        'nuch@interlineasia.com',
        'rodney@interlineasia.com',
        'admin@telenational.com.au',
        'rodney@telenational.com.au'
      ].includes(u.email)),
      superAdminEmails: [
        'admin@interlineasia.com',
        'edvin@interlineasia.com',
        'nuch@interlineasia.com',
        'rodney@interlineasia.com'
      ],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}