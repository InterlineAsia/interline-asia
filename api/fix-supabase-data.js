// Fix Supabase data and test Admin Helper Bot
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔧 Starting Supabase data fixes...');
    
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nxreyyxbuwxjfmtvdkji.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY not found');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Insert test users
    console.log('👥 Adding test users...');
    
    const testUsers = [
      {
        id: '11111111-1111-1111-1111-111111111111',
        full_name: 'Nuch Pattison',
        email: 'nuch@interlineasia.com',
        verification_status: 'verified',
        is_admin: true
      },
      {
        id: '22222222-2222-2222-2222-222222222222',
        full_name: 'Rodney Pattison', 
        email: 'rodney@interlineasia.com',
        verification_status: 'verified',
        is_admin: true
      },
      {
        id: '33333333-3333-3333-3333-333333333333',
        full_name: 'Test Member',
        email: 'member@interlineasia.com',
        verification_status: 'pending',
        is_admin: false
      }
    ];

    for (const user of testUsers) {
      const { data, error } = await supabase
        .from('profiles')
        .upsert(user, { onConflict: 'email' });
      
      if (error) {
        console.warn(`User insert warning for ${user.email}:`, error.message);
      } else {
        console.log(`✅ User added/updated: ${user.email}`);
      }
    }

    // 2. Insert test uploads
    console.log('📁 Adding test uploads...');
    
    const testUploads = [
      {
        user_id: '11111111-1111-1111-1111-111111111111',
        file_name: 'passport_verification.pdf',
        file_path: '/uploads/nuch/passport.pdf',
        file_type: 'application/pdf',
        file_size: 1024000,
        upload_status: 'approved'
      },
      {
        user_id: '22222222-2222-2222-2222-222222222222',
        file_name: 'business_license.jpg',
        file_path: '/uploads/rodney/license.jpg', 
        file_type: 'image/jpeg',
        file_size: 512000,
        upload_status: 'pending'
      },
      {
        user_id: '33333333-3333-3333-3333-333333333333',
        file_name: 'travel_agent_cert.pdf',
        file_path: '/uploads/member/cert.pdf',
        file_type: 'application/pdf', 
        file_size: 768000,
        upload_status: 'pending'
      }
    ];

    for (const upload of testUploads) {
      const { data, error } = await supabase
        .from('uploads')
        .insert(upload);
      
      if (error) {
        console.warn(`Upload insert warning:`, error.message);
      } else {
        console.log(`✅ Upload added: ${upload.file_name}`);
      }
    }

    // 3. Test queries that the bot uses
    console.log('🧪 Testing bot queries...');
    
    // Test member count
    const { count: memberCount, error: countError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // Test member list
    const { data: members, error: membersError } = await supabase
      .from('profiles')
      .select('id, full_name, email, verification_status, created_at')
      .order('created_at', { ascending: false });

    // Test uploads
    const { data: uploads, error: uploadsError } = await supabase
      .from('uploads')
      .select('id, file_name, upload_status, uploaded_at')
      .order('uploaded_at', { ascending: false });

    // Test today's signups
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { data: todayMembers, error: todayError } = await supabase
      .from('profiles')
      .select('id, full_name, email, created_at')
      .gte('created_at', today.toISOString());

    const results = {
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        memberCount: memberCount || 0,
        members: members || [],
        uploads: uploads || [],
        todaySignups: todayMembers || []
      },
      errors: {
        countError: countError?.message,
        membersError: membersError?.message,
        uploadsError: uploadsError?.message,
        todayError: todayError?.message
      }
    };

    console.log('✅ Supabase data fixes completed');
    return res.status(200).json(results);

  } catch (error) {
    console.error('❌ Supabase fix error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}