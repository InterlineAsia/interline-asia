// Admin Tools - Consolidated diagnostic and management endpoints
export default async function handler(req, res) {
  const { tool } = req.query;
  
  try {
    switch (tool) {
      case 'get-uploads':
        return await getUploads(req, res);
      case 'update-upload':
        return await updateUpload(req, res);
      case 'health-check':
        return await healthCheck(req, res);
      default:
        return res.status(404).json({ error: 'Tool not found' });
    }
  } catch (error) {
    console.error('Admin tools error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Get pending uploads
async function getUploads(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nxreyyxbuwxjfmtvdkji.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: uploads, error: uploadsError } = await supabase
      .from('uploads')
      .select('id, filename, status, created_at, user_id')
      .order('created_at', { ascending: false });

    if (uploadsError) throw uploadsError;

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, email, created_at');

    if (profilesError) throw profilesError;

    const uploadsWithUsers = uploads.map(upload => {
      const user = profiles.find(p => p.id === upload.user_id);
      return { ...upload, user: user || { full_name: 'Unknown User', email: 'unknown@example.com' } };
    });

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
      }
    });

  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

// Update upload status
async function updateUpload(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { uploadId, status } = req.body;
    
    if (!uploadId || !status || !['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ error: 'Invalid uploadId or status' });
    }

    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nxreyyxbuwxjfmtvdkji.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: updatedUpload, error: updateError } = await supabase
      .from('uploads')
      .update({ status: status })
      .eq('id', uploadId)
      .select('id, filename, status, user_id, created_at')
      .single();

    if (updateError) throw updateError;

    return res.status(200).json({
      success: true,
      upload: updatedUpload,
      message: `Upload ${status} successfully`
    });

  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

// System health check
async function healthCheck(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const health = {
    timestamp: new Date().toISOString(),
    status: 'checking',
    systems: {}
  };

  try {
    // Test Supabase
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nxreyyxbuwxjfmtvdkji.supabase.co',
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { count, error } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    health.systems.supabase = error ? 'failed' : 'connected';

    // Test Gemini
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: "Test" }] }] })
      });
      health.systems.gemini = geminiResponse.ok ? 'connected' : 'failed';
    } else {
      health.systems.gemini = 'no_key';
    }

    health.status = Object.values(health.systems).every(s => s === 'connected') ? 'healthy' : 'degraded';
    
    return res.status(200).json(health);

  } catch (error) {
    health.status = 'error';
    health.error = error.message;
    return res.status(500).json(health);
  }
}