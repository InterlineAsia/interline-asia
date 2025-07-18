// Admin Verifications API - Phase 2
// Returns user verification data for admin panel

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify admin authentication
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid authentication' });
    }

    // Check if user is admin
    if (user.email !== 'admin@interlineasia.com' && user.user_metadata?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Get all users with their verification status
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('Users fetch error:', usersError);
      return res.status(500).json({ error: 'Failed to fetch users' });
    }

    // Format user data for admin panel
    const formattedUsers = users.users.map(user => ({
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
      first_name: user.user_metadata?.firstName || '',
      last_name: user.user_metadata?.lastName || '',
      company: user.user_metadata?.company || '',
      job_title: user.user_metadata?.jobTitle || '',
      phone: user.user_metadata?.phone || '',
      verification_status: user.user_metadata?.verificationStatus || 'pending',
      marketing_opt_in: user.user_metadata?.marketingOptIn || false,
      signup_date: user.user_metadata?.signupDate || user.created_at
    }));

    // Sort by creation date (newest first)
    formattedUsers.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.status(200).json(formattedUsers);

  } catch (error) {
    console.error('Admin verifications error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}