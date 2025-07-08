// Admin API for managing user verifications
const { createClient } = require('@supabase/supabase-js');
const { sendApprovalEmail, sendRejectionEmail } = require('../lib/brevo');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export default async function handler(req, res) {
  try {
    // Verify admin access
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization header required' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid authentication' });
    }

    // Check if user is admin
    const isAdmin = user.app_metadata?.role === 'admin' || 
                   user.user_metadata?.role === 'admin' || 
                   user.app_metadata?.is_super_admin === true;

    if (!isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    if (req.method === 'GET') {
      // Get pending verifications
      return await getPendingVerifications(req, res);
    } else if (req.method === 'POST') {
      // Handle verification actions (approve/reject)
      return await handleVerificationAction(req, res);
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Admin verifications API error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}

async function getPendingVerifications(req, res) {
  try {
    // Get pending verifications from the verifications table (standalone applications)
    const { data: verifications, error: verificationsError } = await supabase
      .from('verifications')
      .select(`
        id,
        first_name,
        surname,
        email,
        phone,
        employer,
        date_of_birth,
        file_url,
        status,
        created_at,
        reviewed_at,
        admin_notes
      `)
      .in('status', ['pending', 'rejected'])
      .order('created_at', { ascending: false });

    if (verificationsError) {
      console.warn('Failed to fetch verifications:', verificationsError.message);
    }

    // Get users with pending verification from profiles table (authenticated users)
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        verification_status,
        created_at,
        updated_at,
        notes
      `)
      .in('verification_status', ['pending', 'rejected'])
      .order('created_at', { ascending: false });

    if (profilesError) {
      console.warn('Failed to fetch profiles:', profilesError.message);
    }

    // Get uploads for profile users
    const userIds = profiles?.map(p => p.id) || [];
    const { data: uploads, error: uploadsError } = await supabase
      .from('uploads')
      .select(`
        user_id,
        file_name,
        file_path,
        file_type,
        upload_status,
        uploaded_at,
        admin_notes
      `)
      .in('user_id', userIds)
      .order('uploaded_at', { ascending: false });

    if (uploadsError) {
      console.warn('Failed to fetch uploads:', uploadsError.message);
    }

    // Format verification applications
    const pendingVerifications = (verifications || []).map(verification => ({
      id: verification.id,
      full_name: `${verification.first_name} ${verification.surname}`,
      email: verification.email,
      phone: verification.phone,
      employer: verification.employer,
      date_of_birth: verification.date_of_birth,
      verification_status: verification.status,
      created_at: verification.created_at,
      updated_at: verification.reviewed_at,
      notes: verification.admin_notes,
      file_url: verification.file_url,
      type: 'verification_application',
      uploads: verification.file_url ? [{
        file_name: 'Verification Document',
        file_path: verification.file_url,
        file_type: 'document',
        upload_status: 'pending'
      }] : []
    }));

    // Format profile users
    const pendingProfiles = (profiles || []).map(profile => ({
      ...profile,
      type: 'profile_user',
      uploads: uploads ? uploads.filter(upload => upload.user_id === profile.id) : []
    }));

    // Combine both types
    const allPendingUsers = [...pendingVerifications, ...pendingProfiles];

    res.status(200).json({
      success: true,
      pendingUsers: allPendingUsers,
      count: allPendingUsers.length,
      breakdown: {
        verification_applications: pendingVerifications.length,
        profile_users: pendingProfiles.length
      }
    });

  } catch (error) {
    console.error('Error fetching pending verifications:', error);
    res.status(500).json({
      error: 'Failed to fetch pending verifications',
      details: error.message
    });
  }
}

async function handleVerificationAction(req, res) {
  try {
    const { action, userId, reason } = req.body;

    if (!action || !userId) {
      return res.status(400).json({ 
        error: 'Missing required fields: action and userId' 
      });
    }

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ 
        error: 'Invalid action. Must be "approve" or "reject"' 
      });
    }

    // First check if this is a verification application or profile user
    let profile = null;
    let isVerificationApplication = false;

    // Try to find in verifications table first
    const { data: verification, error: verificationError } = await supabase
      .from('verifications')
      .select('id, first_name, surname, email, status')
      .eq('id', userId)
      .single();

    if (verification && !verificationError) {
      // This is a verification application
      isVerificationApplication = true;
      profile = {
        id: verification.id,
        full_name: `${verification.first_name} ${verification.surname}`,
        email: verification.email,
        verification_status: verification.status
      };
    } else {
      // Try to find in profiles table
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError || !profileData) {
        return res.status(404).json({ 
          error: 'User not found' 
        });
      }
      profile = profileData;
    }

    let updateData = {
      updated_at: new Date().toISOString()
    };

    if (action === 'approve') {
      if (isVerificationApplication) {
        updateData.status = 'verified';
        updateData.reviewed_at = new Date().toISOString();
      } else {
        updateData.verification_status = 'verified';
      }
      if (reason) {
        updateData.admin_notes = reason;
      }
    } else if (action === 'reject') {
      if (isVerificationApplication) {
        updateData.status = 'rejected';
        updateData.reviewed_at = new Date().toISOString();
      } else {
        updateData.verification_status = 'rejected';
      }
      if (reason) {
        updateData.admin_notes = reason;
      }
    }

    // Update the appropriate table
    const tableName = isVerificationApplication ? 'verifications' : 'profiles';
    const { error: updateError } = await supabase
      .from(tableName)
      .update(updateData)
      .eq('id', userId);

    if (updateError) {
      throw new Error(`Failed to update ${tableName}: ${updateError.message}`);
    }

    // Send appropriate email
    try {
      if (action === 'approve') {
        await sendApprovalEmail(profile.email, profile.full_name);
        console.log(`✅ Approval email sent to ${profile.email}`);
      } else if (action === 'reject') {
        await sendRejectionEmail(profile.email, profile.full_name, reason);
        console.log(`📧 Rejection email sent to ${profile.email}`);
      }
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Don't fail the entire operation if email fails
    }

    res.status(200).json({
      success: true,
      message: `User ${action}ed successfully`,
      action,
      userId,
      email: profile.email
    });

  } catch (error) {
    console.error('Error handling verification action:', error);
    res.status(500).json({
      error: 'Failed to process verification action',
      details: error.message
    });
  }
}