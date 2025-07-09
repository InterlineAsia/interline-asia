// API endpoint to create admin user - Rodney Pattison
import { createClient } from '@supabase/supabase-js';

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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const adminEmail = 'admin@telenational.com.au';
    const adminPassword = 'TempPassword123!'; // Temporary password - user should reset
    
    console.log('Creating admin user:', adminEmail);
    
    // Step 1: Check if user already exists in auth.users
    const { data: existingUsers, error: searchError } = await supabase.auth.admin.listUsers();
    
    if (searchError) {
      console.error('Error searching for existing users:', searchError);
      throw new Error(`Failed to search users: ${searchError.message}`);
    }
    
    const existingUser = existingUsers.users.find(user => user.email === adminEmail);
    
    let userId;
    let userCreated = false;
    
    if (existingUser) {
      console.log('User already exists:', existingUser.id);
      userId = existingUser.id;
      
      // Update existing user to confirm email and set as admin
      const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(
        userId,
        {
          email_confirm: true,
          user_metadata: {
            role: 'admin',
            is_super_admin: true,
            full_name: 'Rodney Pattison'
          },
          app_metadata: {
            role: 'admin',
            is_super_admin: true
          }
        }
      );
      
      if (updateError) {
        console.error('Error updating existing user:', updateError);
        throw new Error(`Failed to update user: ${updateError.message}`);
      }
      
      console.log('Updated existing user to admin:', updatedUser);
      
    } else {
      console.log('Creating new user...');
      
      // Create new user with confirmed email
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: {
          role: 'admin',
          is_super_admin: true,
          full_name: 'Rodney Pattison'
        },
        app_metadata: {
          role: 'admin',
          is_super_admin: true
        }
      });
      
      if (createError) {
        console.error('Error creating new user:', createError);
        throw new Error(`Failed to create user: ${createError.message}`);
      }
      
      userId = newUser.user.id;
      userCreated = true;
      console.log('Created new admin user:', newUser.user);
    }
    
    // Step 2: Create or update profile in profiles table
    const profileData = {
      id: userId,
      email: adminEmail,
      full_name: 'Rodney Pattison',
      role: 'admin',
      is_super_admin: true,
      verification_status: 'approved',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Try to insert profile, if it exists, update it
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .upsert(profileData, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      })
      .select()
      .single();
    
    if (profileError) {
      console.error('Error creating/updating profile:', profileError);
      // Don't throw error here, user creation was successful
      console.warn('Profile creation failed but user was created successfully');
    } else {
      console.log('Profile created/updated successfully:', profile);
    }
    
    // Step 3: Verify the user can be authenticated
    const { data: verifyUser, error: verifyError } = await supabase.auth.admin.getUserById(userId);
    
    if (verifyError) {
      console.error('Error verifying user:', verifyError);
    } else {
      console.log('User verification successful:', {
        id: verifyUser.user.id,
        email: verifyUser.user.email,
        email_confirmed_at: verifyUser.user.email_confirmed_at,
        role: verifyUser.user.user_metadata?.role,
        is_super_admin: verifyUser.user.user_metadata?.is_super_admin
      });
    }
    
    res.status(200).json({
      success: true,
      message: userCreated ? 'Admin user created successfully' : 'Existing user updated to admin',
      user: {
        id: userId,
        email: adminEmail,
        role: 'admin',
        is_super_admin: true,
        email_confirmed: true,
        created: userCreated
      },
      instructions: userCreated ? 
        `User created with temporary password: ${adminPassword}. Please ask Rodney to reset password on first login.` :
        'Existing user updated to admin role.'
    });
    
  } catch (error) {
    console.error('Error in create-admin-user:', error);
    res.status(500).json({
      error: 'Failed to create admin user',
      details: error.message
    });
  }
}

// Helper function to generate secure random password
function generateSecurePassword() {
  const length = 16;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  
  return password;
}