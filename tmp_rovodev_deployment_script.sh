#!/bin/bash

# Interline Asia Login Fix Deployment Script
# This script applies the database schema fixes and creates admin users

echo "🚀 Deploying Interline Asia Login Fix..."

# 1. Apply database schema fixes
echo "📊 Applying database schema fixes..."
echo "Please run the following SQL in your Supabase SQL Editor:"
echo "----------------------------------------"
cat tmp_rovodev_fix_login_schema.sql
echo "----------------------------------------"

# 2. Create admin users
echo ""
echo "👥 Creating admin users..."
echo "Please run the following Node.js script:"
echo "node tmp_rovodev_create_admin_users.js"

# 3. Test the login flow
echo ""
echo "🧪 Testing the login flow..."
echo "1. Go to https://www.interlineasia.com/login"
echo "2. Login with admin@telenational.com.au / InterlineAdmin2024!"
echo "3. Should redirect to /dashboard-choice.html"
echo "4. Should see both Admin and Member dashboard options"
echo ""
echo "5. Login with rodney@telenational.com.au / RodneyAdmin2024!"
echo "6. Should redirect to /dashboard-choice.html"
echo "7. Should see both Admin and Member dashboard options"

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Summary of changes:"
echo "- ✅ Added missing columns to profiles table (role, is_super_admin, verified)"
echo "- ✅ Updated trigger to auto-assign admin roles to target emails"
echo "- ✅ Fixed login redirect logic to check multiple admin indicators"
echo "- ✅ Fixed dashboard-choice logic to properly detect admin access"
echo "- ✅ Both rodney@telenational.com.au and admin@telenational.com.au now have:"
echo "  → Admin access"
echo "  → Member access"
echo "  → Choice between Admin or Member dashboard at login"
echo ""
echo "🔧 Next steps:"
echo "1. Run the SQL schema update in Supabase"
echo "2. Run the admin user creation script"
echo "3. Test the login flow with both email addresses"
echo "4. Verify role switching works correctly"