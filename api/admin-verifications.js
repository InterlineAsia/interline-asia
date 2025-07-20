import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Admin email whitelist
const ADMIN_EMAILS = [
  'admin@telenational.com.au',
  'rodney@telenational.com.au',
  'nuch@interlineasia.com',
  'stephen@telenational.com.au'
];

async function isAdmin(email) {
  if (!email) return false;
  
  // Check whitelist first
  if (ADMIN_EMAILS.includes(email.toLowerCase())) {
    return true;
  }
  
  // Check database admin flag
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('is_admin, is_super_admin')
      .eq('email', email.toLowerCase())
      .single();
      
    if (error) {
      console.error('Admin check error:', error);
      return false;
    }
    
    return data?.is_admin === true || data?.is_super_admin === true;
  } catch (error) {
    console.error('Admin check failed:', error);
    return false;
  }
}

async function getUserFromToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Invalid authorization header');
  }
  
  const token = authHeader.substring(7);
  
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    throw new Error('Invalid token');
  }
  
  return user;
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    // Verify authentication
    const user = await getUserFromToken(req.headers.authorization);
    
    // Verify admin access
    const adminAccess = await isAdmin(user.email);
    if (!adminAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin privileges required.'
      });
    }
    
    if (req.method === 'GET') {
      // Get pending verifications
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          email,
          verification_status,
          created_at,
          notes
        `)
        .in('verification_status', ['pending', 'rejected'])
        .order('created_at', { ascending: false });
        
      if (usersError) {
        throw new Error(`Failed to fetch users: ${usersError.message}`);
      }
      
      // Get uploads for each user
      const userIds = users.map(user => user.id);
      const { data: uploads, error: uploadsError } = await supabase
        .from('uploads')
        .select('user_id, file_name, file_path, created_at')
        .in('user_id', userIds);
        
      if (uploadsError) {
        console.error('Failed to fetch uploads:', uploadsError);
      }
      
      // Group uploads by user
      const uploadsByUser = {};
      if (uploads) {
        uploads.forEach(upload => {
          if (!uploadsByUser[upload.user_id]) {
            uploadsByUser[upload.user_id] = [];
          }
          uploadsByUser[upload.user_id].push(upload);
        });
      }
      
      // Combine user data with uploads
      const usersWithUploads = users.map(user => ({
        ...user,
        uploads: uploadsByUser[user.id] || []
      }));
      
      const pendingCount = users.filter(user => user.verification_status === 'pending').length;
      
      return res.status(200).json({
        success: true,
        pendingUsers: usersWithUploads,
        count: pendingCount
      });
      
    } else if (req.method === 'POST') {
      // Handle approve/reject actions
      const { action, userId, reason } = req.body;
      
      if (!action || !userId) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: action, userId'
        });
      }
      
      if (!['approve', 'reject'].includes(action)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid action. Must be "approve" or "reject"'
        });
      }
      
      // Get user details first
      const { data: userProfile, error: userError } = await supabase
        .from('profiles')
        .select('full_name, email, verification_status')
        .eq('id', userId)
        .single();
        
      if (userError || !userProfile) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }
      
      // Update verification status
      const newStatus = action === 'approve' ? 'verified' : 'rejected';
      const updateData = {
        verification_status: newStatus,
        updated_at: new Date().toISOString()
      };
      
      if (reason) {
        updateData.notes = reason;
      }
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId);
        
      if (updateError) {
        throw new Error(`Failed to update user: ${updateError.message}`);
      }
      
      // Send notification email (optional - implement if needed)
      try {
        await sendVerificationEmail(userProfile, action, reason);
      } catch (emailError) {
        console.error('Failed to send notification email:', emailError);
        // Don't fail the request if email fails
      }
      
      return res.status(200).json({
        success: true,
        message: `User ${action}ed successfully`,
        user: {
          id: userId,
          status: newStatus,
          email: userProfile.email,
          name: userProfile.full_name
        }
      });
      
    } else {
      return res.status(405).json({
        success: false,
        error: 'Method not allowed'
      });
    }
    
  } catch (error) {
    console.error('Admin verifications API error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}

async function sendVerificationEmail(userProfile, action, reason) {
  // This is a placeholder for email notification
  // You can implement this using your preferred email service (Brevo, SendGrid, etc.)
  
  const emailData = {
    to: userProfile.email,
    subject: `Verification ${action === 'approve' ? 'Approved' : 'Update'} - Interline Asia`,
    template: action === 'approve' ? 'verification-approved' : 'verification-rejected',
    data: {
      name: userProfile.full_name,
      reason: reason || ''
    }
  };
  
  console.log('Email notification would be sent:', emailData);
  
  // TODO: Implement actual email sending
  // Example with fetch to your email service:
  /*
  const response = await fetch('/api/send-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(emailData)
  });
  */
}