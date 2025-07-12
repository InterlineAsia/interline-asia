// Update upload status (approve/reject)
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { uploadId, status, adminNotes } = req.body;
    
    if (!uploadId || !status) {
      return res.status(400).json({ error: 'Missing uploadId or status' });
    }

    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be: approved, rejected, or pending' });
    }

    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nxreyyxbuwxjfmtvdkji.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Update the upload status
    const { data: updatedUpload, error: updateError } = await supabase
      .from('uploads')
      .update({
        status: status
      })
      .eq('id', uploadId)
      .select(`
        id,
        filename,
        status,
        user_id,
        created_at,
        reviewed_at
      `)
      .single();

    if (updateError) {
      throw updateError;
    }

    // Get user info for the upload
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('id', updatedUpload.user_id)
      .single();

    if (userError) {
      console.warn('Could not fetch user info:', userError.message);
    }

    // Log admin action (optional - for audit trail)
    console.log(`Upload ${uploadId} status changed to ${status} for user ${user?.email || 'unknown'}`);

    return res.status(200).json({
      success: true,
      upload: updatedUpload,
      user: user,
      message: `Upload ${status} successfully`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Update upload status error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}