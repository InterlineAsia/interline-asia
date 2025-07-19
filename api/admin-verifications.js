import { createClient } from '@supabase/supabase-js';

// Helper function to generate temporary password
function generateTempPassword() {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
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
        // Initialize Supabase client
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nxreyyxbuwxjfmtvdkji.supabase.co';
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseKey) {
            return res.status(500).json({
                success: false,
                error: 'Server configuration error: Missing Supabase service role key'
            });
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        // Verify admin access
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'Missing or invalid authorization header'
            });
        }

        const token = authHeader.split(' ')[1];
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid token or user not found'
            });
        }

        // Check if user is admin
        const adminEmails = [
            'rodney@telenational.com.au',
            'admin@interlineasia.com',
            'support@interlineasia.com'
        ];

        if (!adminEmails.includes(user.email)) {
            return res.status(403).json({
                success: false,
                error: 'Access denied: Admin privileges required'
            });
        }

        if (req.method === 'GET') {
            // Get pending verifications
            const { data: users, error: usersError } = await supabase
                .from('users')
                .select(`
                    id,
                    email,
                    full_name,
                    verification_status,
                    notes,
                    created_at,
                    uploads:user_uploads(
                        id,
                        file_name,
                        file_path,
                        uploaded_at
                    )
                `)
                .in('verification_status', ['pending', 'rejected'])
                .order('created_at', { ascending: false });

            if (usersError) {
                throw usersError;
            }

            const pendingCount = users.filter(u => u.verification_status === 'pending').length;

            return res.status(200).json({
                success: true,
                pendingUsers: users || [],
                count: pendingCount
            });

        } else if (req.method === 'POST') {
            // Handle verification actions and member creation
            const { action, userId, reason, memberData } = req.body;

            if (!action) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required field: action'
                });
            }

            if (action === 'create_member') {
                // Handle manual member creation
                if (!memberData || !memberData.email || !memberData.fullName) {
                    return res.status(400).json({
                        success: false,
                        error: 'Missing required member data: email and fullName'
                    });
                }

                // Check if user already exists
                const { data: existingUser, error: checkError } = await supabase
                    .from('users')
                    .select('id, email')
                    .eq('email', memberData.email.toLowerCase())
                    .single();

                if (existingUser) {
                    return res.status(400).json({
                        success: false,
                        error: 'A user with this email already exists'
                    });
                }

                // Generate temporary password
                const tempPassword = generateTempPassword();

                // Create user account in Supabase Auth
                const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
                    email: memberData.email.toLowerCase(),
                    password: tempPassword,
                    email_confirm: true,
                    user_metadata: {
                        full_name: memberData.fullName,
                        created_by_admin: true
                    }
                });

                if (authError) {
                    console.error('Auth user creation error:', authError);
                    return res.status(500).json({
                        success: false,
                        error: `Failed to create user account: ${authError.message}`
                    });
                }

                // Create user profile in database
                const { error: profileError } = await supabase
                    .from('users')
                    .insert({
                        id: authUser.user.id,
                        email: memberData.email.toLowerCase(),
                        full_name: memberData.fullName,
                        company: memberData.company || null,
                        phone: memberData.phone || null,
                        country: memberData.country || null,
                        verification_status: 'verified',
                        verified_at: new Date().toISOString(),
                        notes: memberData.notes || 'Created manually by admin',
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    });

                if (profileError) {
                    console.error('Profile creation error:', profileError);
                    // Try to clean up the auth user if profile creation failed
                    await supabase.auth.admin.deleteUser(authUser.user.id);
                    return res.status(500).json({
                        success: false,
                        error: `Failed to create user profile: ${profileError.message}`
                    });
                }

                // Log the creation
                console.log(`Admin ${user.email} created new member: ${memberData.email}`);

                return res.status(200).json({
                    success: true,
                    message: 'Member created successfully',
                    tempPassword: tempPassword,
                    user: {
                        id: authUser.user.id,
                        email: memberData.email,
                        fullName: memberData.fullName,
                        status: 'verified'
                    }
                });
            }

            // Handle existing verification actions (approve/reject)
            if (!userId) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required field: userId'
                });
            }

            if (!['approve', 'reject'].includes(action)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid action. Must be "approve", "reject", or "create_member"'
                });
            }

            // Get user details
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('email, full_name, verification_status')
                .eq('id', userId)
                .single();

            if (userError || !userData) {
                return res.status(404).json({
                    success: false,
                    error: 'User not found'
                });
            }

            // Update verification status
            const newStatus = action === 'approve' ? 'verified' : 'rejected';
            const updateData = {
                verification_status: newStatus,
                verified_at: action === 'approve' ? new Date().toISOString() : null
            };

            if (reason) {
                updateData.notes = reason;
            }

            const { error: updateError } = await supabase
                .from('users')
                .update(updateData)
                .eq('id', userId);

            if (updateError) {
                throw updateError;
            }

            // Send notification email (you can implement this later)
            // For now, we'll just log it
            console.log(`User ${userData.email} ${action}ed by admin. Reason: ${reason || 'None'}`);

            return res.status(200).json({
                success: true,
                message: `User ${action}ed successfully`,
                user: {
                    id: userId,
                    email: userData.email,
                    status: newStatus
                }
            });

        } else {
            return res.status(405).json({
                success: false,
                error: 'Method not allowed'
            });
        }

    } catch (error) {
        console.error('Admin verifications error:', error);
        return res.status(500).json({
            success: false,
            error: `Server error: ${error.message}`
        });
    }
}