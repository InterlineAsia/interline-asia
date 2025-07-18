// Admin Update Verification API - Phase 2
// Updates user verification status and sends notification emails

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, status } = req.body;

    // Validate input
    if (!userId || !status) {
      return res.status(400).json({ error: 'User ID and status are required' });
    }

    if (!['verified', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Verify admin authentication
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user: adminUser }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !adminUser) {
      return res.status(401).json({ error: 'Invalid authentication' });
    }

    // Check if user is admin
    if (adminUser.email !== 'admin@interlineasia.com' && adminUser.user_metadata?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Get user details
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userId);
    
    if (userError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update user metadata
    const updatedMetadata = {
      ...user.user_metadata,
      verificationStatus: status,
      verificationDate: new Date().toISOString(),
      verifiedBy: adminUser.email
    };

    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: updatedMetadata
    });

    if (updateError) {
      console.error('User update error:', updateError);
      return res.status(500).json({ error: 'Failed to update user' });
    }

    // Send notification email to user
    await sendVerificationEmail(user, status);

    res.status(200).json({
      success: true,
      message: `User ${status} successfully`
    });

  } catch (error) {
    console.error('Update verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function sendVerificationEmail(user, status) {
  try {
    const userName = user.user_metadata?.firstName || user.email.split('@')[0];
    
    let emailContent = '';
    let subject = '';

    if (status === 'verified') {
      subject = 'Welcome to Interline Asia - Account Verified!';
      emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Account Verified!</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Welcome to Interline Asia</p>
          </div>

          <div style="background: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <p style="color: #1e293b; font-size: 16px;">Dear ${userName},</p>
            
            <p style="color: #475569; line-height: 1.6;">
              Congratulations! Your Interline Asia account has been verified and you now have access to our exclusive cruise deals and industry rates.
            </p>

            <div style="background: #dcfce7; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #166534; margin-top: 0;">What's Next?</h3>
              <ul style="color: #15803d; line-height: 1.6; margin: 0; padding-left: 20px;">
                <li>Browse our exclusive cruise inventory</li>
                <li>Request quotes for your preferred cruises</li>
                <li>Access member-only pricing and deals</li>
                <li>Manage your bookings through your dashboard</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
                 style="background: linear-gradient(135deg, #059669, #047857); color: white; 
                        padding: 15px 30px; text-decoration: none; border-radius: 8px; 
                        font-weight: bold; font-size: 16px; display: inline-block;">
                Access Your Dashboard
              </a>
            </div>

            <p style="color: #64748b; font-size: 14px; line-height: 1.6;">
              If you have any questions or need assistance, please don't hesitate to contact us at admin@interlineasia.com.
            </p>
          </div>
        </div>
      `;
    } else if (status === 'rejected') {
      subject = 'Interline Asia - Additional Information Required';
      emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Additional Information Required</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Interline Asia Account Review</p>
          </div>

          <div style="background: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <p style="color: #1e293b; font-size: 16px;">Dear ${userName},</p>
            
            <p style="color: #475569; line-height: 1.6;">
              Thank you for your interest in Interline Asia. We need additional information to verify your eligibility for our travel industry professional program.
            </p>

            <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #92400e; margin-top: 0;">Next Steps</h3>
              <p style="color: #78350f; line-height: 1.6; margin: 0;">
                Please reply to this email with additional documentation proving your employment in the travel industry, such as:
              </p>
              <ul style="color: #78350f; line-height: 1.6; margin: 10px 0 0 20px;">
                <li>Current employment letter or business card</li>
                <li>Travel industry certification or license</li>
                <li>Company website or LinkedIn profile</li>
              </ul>
            </div>

            <p style="color: #64748b; font-size: 14px; line-height: 1.6;">
              Our exclusive rates are reserved for verified travel industry professionals. We appreciate your understanding and look forward to welcoming you to Interline Asia.
            </p>
          </div>
        </div>
      `;
    }

    if (emailContent) {
      await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': process.env.BREVO_API_KEY
        },
        body: JSON.stringify({
          sender: {
            name: 'Interline Asia',
            email: 'admin@interlineasia.com'
          },
          to: [{ email: user.email, name: userName }],
          subject: subject,
          htmlContent: emailContent
        })
      });
    }

  } catch (error) {
    console.error('Verification email error:', error);
    // Don't throw error - verification update should succeed even if email fails
  }
}