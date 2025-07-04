# Interline Asia - Supabase Setup Guide

## 🚀 Quick Setup Instructions

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your project URL and anon key from Settings > API

### 2. Set up Database Schema
1. Go to SQL Editor in your Supabase dashboard
2. Copy and paste the contents of `supabase-schema.sql`
3. Run the SQL to create tables, policies, and functions

### 3. Configure Storage
1. Go to Storage in your Supabase dashboard
2. Create a new bucket called `uploads`
3. Set it to private (not public)
4. The SQL schema includes storage policies

### 4. Update Configuration
1. Copy `.env.example` to `.env`
2. Update `config.js` with your actual Supabase credentials:
   ```javascript
   window.SUPABASE_URL = 'https://your-project.supabase.co';
   window.SUPABASE_ANON_KEY = 'your_supabase_anon_key_here';
   ```

### 5. Create Admin User
1. Sign up normally through `signup.html` with `admin@interlineasia.com`
2. Or manually insert admin user in Supabase:
   ```sql
   -- Update the email to match your admin email
   UPDATE profiles 
   SET is_admin = true 
   WHERE email = 'admin@interlineasia.com';
   ```

### 6. Test the System
1. **User Flow:**
   - Visit `signup.html` to create account
   - Check email for verification link
   - Sign in at `login.html`
   - Upload documents at `dashboard.html`

2. **Admin Flow:**
   - Sign in with admin account
   - Access `admin.html` to manage users
   - Approve/reject documents and users

## 🔧 Environment Variables

### Required in `.env`:
```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# reCAPTCHA v3
RECAPTCHA_SITE_KEY=your_site_key
RECAPTCHA_SECRET_KEY=your_secret_key

# Admin
ADMIN_EMAIL=admin@interlineasia.com
```

### Required in `config.js`:
```javascript
window.SUPABASE_URL = 'https://your-project.supabase.co';
window.SUPABASE_ANON_KEY = 'your_supabase_anon_key';
window.RECAPTCHA_SITE_KEY = 'your_recaptcha_site_key';
```

## 📊 Database Schema Overview

### Tables:
- **profiles** - User information and verification status
- **uploads** - Document uploads with approval status
- **admin_actions** - Audit log of admin activities

### Key Features:
- Row Level Security (RLS) enabled
- Automatic profile creation on signup
- Admin-only access controls
- File upload tracking
- Audit logging

## 🔐 Security Features

- **Authentication:** Supabase Auth with email verification
- **Authorization:** Row Level Security policies
- **Bot Protection:** reCAPTCHA v3 on signup, login, and upload
- **File Validation:** Type and size restrictions
- **Admin Controls:** Separate admin interface with audit logging

## 🚀 Deployment

1. **Vercel:** Already configured - just push to GitHub
2. **Environment:** Update `config.js` with production values
3. **Domain:** Configure in Supabase Auth settings

## 📧 Email Notifications (Future)

The system is webhook-ready for email notifications:
- User registration alerts
- Document upload notifications
- Status change confirmations

To implement:
1. Add email service (SendGrid/Resend)
2. Create webhook endpoint
3. Update `notifyAdmin()` function in `supabase-client.js`

## 🛠️ Troubleshooting

### Common Issues:
1. **"User not found"** - Check email verification
2. **"Unauthorized"** - Verify RLS policies are correct
3. **Upload fails** - Check storage bucket permissions
4. **Admin access denied** - Ensure `is_admin = true` in profiles table

### Debug Mode:
Open browser console to see detailed error messages and API calls.

## 📱 Mobile Support

The system is fully responsive and works on:
- Desktop browsers
- Mobile Safari (iOS)
- Chrome Mobile (Android)
- Progressive Web App ready