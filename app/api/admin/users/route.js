// app/api/admin/users/route.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role key for server-side operations

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function GET(request) {
  try {
    // Implement access control: only allow admins to access this route
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }
    const token = authHeader.split(' ')[1];

    const { data: user, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user || user.user.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    }

    // Fetch unverified users
    const { data: users, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, created_at, verified')
      .eq('verified', false);

    if (error) {
      console.error('Error fetching unverified users:', error.message);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify(users), { status: 200 });
  } catch (err) {
    console.error('Unhandled error in GET /api/admin/users:', err.message);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}

export async function PUT(request) {
  try {
    // Implement access control: only allow admins to access this route
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }
    const token = authHeader.split(' ')[1];

    const { data: user, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user || user.user.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    }

    const { id } = await request.json();

    if (!id) {
      return new Response(JSON.stringify({ error: 'User ID is required' }), { status: 400 });
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({ verified: true })
      .eq('id', id);

    if (error) {
      console.error('Error updating user verification status:', error.message);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ message: 'User marked as verified', data }), { status: 200 });
  } catch (err) {
    console.error('Unhandled error in PUT /api/admin/users:', err.message);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}