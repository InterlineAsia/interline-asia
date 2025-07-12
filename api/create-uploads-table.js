// Create uploads table and populate test data
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔧 Creating uploads table and test data...');
    
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nxreyyxbuwxjfmtvdkji.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Create uploads table using RPC (since we can't run DDL directly)
    console.log('📁 Checking uploads table...');
    
    // Test if uploads table exists by trying to query it
    const { data: uploadsTest, error: uploadsTestError } = await supabase
      .from('uploads')
      .select('id')
      .limit(1);

    if (uploadsTestError && uploadsTestError.message.includes('does not exist')) {
      console.log('❌ Uploads table does not exist. Please run this SQL in Supabase SQL Editor:');
      
      const createTableSQL = `
-- Create uploads table
CREATE TABLE IF NOT EXISTS public.uploads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.uploads ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Service role can read uploads" ON public.uploads FOR SELECT USING (true);
CREATE POLICY "Users can view own uploads" ON public.uploads FOR SELECT USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON public.uploads TO authenticated;
GRANT ALL ON public.uploads TO service_role;
      `;
      
      return res.status(200).json({
        success: false,
        message: 'Uploads table does not exist',
        sql: createTableSQL,
        action: 'Please run the provided SQL in Supabase SQL Editor'
      });
    }

    // 2. Add test users to profiles
    console.log('👥 Adding test users...');
    
    const testUsers = [
      {
        full_name: 'Nuch Pattison',
        email: 'nuch@interlineasia.com',
        is_admin: true
      },
      {
        full_name: 'Rodney Pattison', 
        email: 'rodney@interlineasia.com',
        is_admin: true
      },
      {
        full_name: 'Test Member',
        email: 'member@interlineasia.com',
        is_admin: false
      }
    ];

    const userResults = [];
    for (const user of testUsers) {
      const { data, error } = await supabase
        .from('profiles')
        .upsert(user, { onConflict: 'email' })
        .select();
      
      if (error) {
        console.warn(`User upsert warning for ${user.email}:`, error.message);
        userResults.push({ email: user.email, status: 'error', error: error.message });
      } else {
        console.log(`✅ User added/updated: ${user.email}`);
        userResults.push({ email: user.email, status: 'success', data });
      }
    }

    // 3. Test the queries that bot uses
    console.log('🧪 Testing bot queries...');
    
    const { count: memberCount, error: countError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    const { data: members, error: membersError } = await supabase
      .from('profiles')
      .select('id, full_name, email, is_admin, created_at')
      .order('created_at', { ascending: false });

    const results = {
      success: true,
      timestamp: new Date().toISOString(),
      actions: {
        usersAdded: userResults,
        uploadsTableExists: !uploadsTestError
      },
      testQueries: {
        memberCount: memberCount || 0,
        members: members || [],
        errors: {
          countError: countError?.message,
          membersError: membersError?.message
        }
      }
    };

    console.log('✅ Database setup completed');
    return res.status(200).json(results);

  } catch (error) {
    console.error('❌ Database setup error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}