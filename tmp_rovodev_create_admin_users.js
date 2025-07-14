#!/usr/bin/env node

// Script to create admin users for Interline Asia
// This ensures both rodney@telenational.com.au and admin@telenational.com.au have proper access

const { createClient } = require('@supabase/supabase-js');

// You'll need to set these environment variables or update them here
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-key';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAdminUsers() {
  console.log('🚀 Creating admin users for Interline Asia...');
  
  const adminUsers = [
    {
      email: 'admin@telenational.com.au',
      password: 'InterlineAdmin2024!',
      full_name: 'System Administrator'
    },
    {
      email: 'rodney@telenational.com.au', 
      password: 'RodneyAdmin2024!',
      full_name: 'Rodney Pattison'
    }
  ];

  for (const adminUser of adminUsers) {
    try {
      console.log(`\n📧 Processing ${adminUser.email}...`);
      
      // Check if user already exists
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existingUser = existingUsers.users.find(u => u.email === adminUser.email);
      
      let userId;
      
      if (existingUser) {
        console.log('✅ User already exists, updating...');
        userId = existingUser.id;
        
        // Update user metadata
        await supabase.auth.admin.updateUserById(userId, {
          email_confirm: true,
          user_metadata: {
            full_name: adminUser.full_name,
            role: 'super_admin',
            is_super_admin: true
          },
          app_metadata: {
            role: 'super_admin',
            is_super_admin: true
          }
        });
        
      } else {
        console.log('🆕 Creating new user...');
        
        // Create new user
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email: adminUser.email,
          password: adminUser.password,
          email_confirm: true,
          user_metadata: {
            full_name: adminUser.full_name,
            role: 'super_admin',
            is_super_admin: true
          },
          app_metadata: {
            role: 'super_admin',
            is_super_admin: true
          }
        });
        
        if (createError) {
          console.error(`❌ Failed to create ${adminUser.email}:`, createError.message);
          continue;
        }
        
        userId = newUser.user.id;
        console.log(`✅ Created user with ID: ${userId}`);
      }
      
      // Create/update profile
      console.log('📝 Updating profile...');
      
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          email: adminUser.email,
          full_name: adminUser.full_name,
          role: 'super_admin',
          is_admin: true,
          is_super_admin: true,
          verified: true,
          verification_status: 'verified',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        });
      
      if (profileError) {
        console.error(`⚠️ Profile update failed for ${adminUser.email}:`, profileError.message);
      } else {
        console.log(`✅ Profile updated for ${adminUser.email}`);
      }
      
    } catch (error) {
      console.error(`❌ Error processing ${adminUser.email}:`, error.message);
    }
  }
  
  console.log('\n🎉 Admin user creation complete!');
  console.log('\n📋 Login credentials:');
  adminUsers.forEach(user => {
    console.log(`   ${user.email} / ${user.password}`);
  });
  console.log('\n⚠️  Please ask users to change passwords on first login');
}

if (require.main === module) {
  createAdminUsers().catch(console.error);
}

module.exports = { createAdminUsers };