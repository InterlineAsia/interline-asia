// Get pending uploads for admin review
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nxreyyxbuwxjfmtvdkji.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all uploads with user information
    const { data: uploads, error: uploadsError } = await supabase
      .from('uploads')
      .select(`
        id,
        filename,
        status,
        created_at,
        user_id
      `)
      .order('created_at', { ascending: false });

    if (uploadsError) {
      throw uploadsError;
    }

    // Get user profiles to match with uploads
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, email, created_at');

    if (profilesError) {
      throw profilesError;
    }

    // Combine uploads with user data
    const uploadsWithUsers = uploads.map(upload => {
      const user = profiles.find(p => p.id === upload.user_id);
      return {
        ...upload,
        user: user || { full_name: 'Unknown User', email: 'unknown@example.com' }
      };
    });

    // Group by status for easy admin review
    const groupedUploads = {
      pending: uploadsWithUsers.filter(u => u.status === 'pending'),
      approved: uploadsWithUsers.filter(u => u.status === 'approved'),
      rejected: uploadsWithUsers.filter(u => u.status === 'rejected')
    };

    return res.status(200).json({
      success: true,
      uploads: uploadsWithUsers,
      grouped: groupedUploads,
      summary: {
        total: uploads.length,
        pending: groupedUploads.pending.length,
        approved: groupedUploads.approved.length,
        rejected: groupedUploads.rejected.length
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get uploads error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}