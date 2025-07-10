#!/usr/bin/env node

// Standalone script to create admin user for Edvin
// Usage: node scripts/create-edvin-admin.js

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '.env.local' });

// Use the correct Supabase URL from config.js
const supabaseUrl = 'https://nxreyyxbuwxjfmtvdkji.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAdminUser() {
  try {
    // Using edvin's email and password
    const adminEmail = 'edvin.lovic@povio.com';
    const adminPassword = 'edvin2025%$'; // As provided by user
    
    console.log('🔍 Checking for existing user:', adminEmail);
    
    // Check if user already exists
    const { data: existingUsers, error: searchError } = await supabase.auth.admin.listUsers();
    
    if (searchError) {
      throw new Error(`Failed to search users: ${searchError.message}`);
    }
    
    const existingUser = existingUsers.users.find(user => user.email.toLowerCase() === adminEmail.toLowerCase());
    
    let userId;
    let userCreated = false;
    
    if (existingUser) {
      console.log('✅ User already exists, updating to admin...');
      userId = existingUser.id;
      
      // Update existing user
      const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(
        userId,
        {
          email_confirm: true,
          user_metadata: {
            role: 'admin',
            is_super_admin: true,
            full_name: 'Edvin Lovic'
          },
          app_metadata: {
            role: 'admin',
            is_super_admin: true
          }
        }
      );
      
      if (updateError) {
        throw new Error(`Failed to update user: ${updateError.message}`);
      }
      
      console.log('✅ Updated existing user to admin');
      
    } else {
      console.log('🆕 Creating new admin user...');
      
      // Create new user
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: {
          role: 'admin',
          is_super_admin: true,
          full_name: 'Edvin Lovic'
        },
        app_metadata: {
          role: 'admin',
          is_super_admin: true
        }
      });
      
      if (createError) {
        throw new Error(`Failed to create user: ${createError.message}`);
      }
      
      userId = newUser.user.id;
      userCreated = true;
      console.log('✅ Created new admin user');
    }
    
    // Create/update profile
    console.log('📝 Creating/updating profile...');
    
    const profileData = {
      id: userId,
      email: adminEmail.toLowerCase(),
      full_name: 'Edvin Lovic',
      role: 'admin',
      is_admin: true,
      is_super_admin: true,
      verification_status: 'approved',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .upsert(profileData, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      })
      .select()
      .single();
    
    if (profileError) {
      console.warn('⚠️ Profile creation failed:', profileError.message);
    } else {
      console.log('✅ Profile created/updated successfully');
    }
    
    // Verify user
    console.log('🔍 Verifying admin user...');
    
    const { data: verifyUser, error: verifyError } = await supabase.auth.admin.getUserById(userId);
    
    if (verifyError) {
      console.error('❌ User verification failed:', verifyError.message);
    } else {
      console.log('✅ User verification successful');
      console.log('📋 User Details:');
      console.log(`   ID: ${verifyUser.user.id}`);
      console.log(`   Email: ${verifyUser.user.email}`);
      console.log(`   Email Confirmed: ${!!verifyUser.user.email_confirmed_at}`);
      console.log(`   App Metadata: ${JSON.stringify(verifyUser.user.app_metadata)}`);
      console.log(`   User Metadata: ${JSON.stringify(verifyUser.user.user_metadata)}`);
    }
    
    console.log('\n🎉 ADMIN USER SETUP COMPLETE!');
    console.log('📧 Email:', adminEmail);
    
    if (userCreated) {
      console.log('🔑 Password:', adminPassword);
    }
    
    console.log('\n🚀 You can now log in at: https://www.interlineasia.com/login');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    process.exit(1);
  }
}

// Run the script
createAdminUser();