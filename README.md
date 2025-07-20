# Interline Asia

A comprehensive cruise deals platform with user authentication, document management, and exclusive travel offers for industry professionals.

**Latest Update (July 16, 2025):** Complete deals page rebuild with performance optimizations and enhanced user experience.

## Quick Start

This platform includes:
- **User Authentication & Verification** - Secure signup with document upload
- **Admin Dashboard** - User management with AI-powered helper bot
- **Cruise Deals Management** - Exclusive offers for verified travel professionals
- **Document Management** - Secure file uploads and verification workflow
- **AI Integration** - Google Gemini-powered admin assistant

## Manual Setup Tasks

After deploying to Vercel, complete these one-time setup tasks:

### 1. Create Uploads Table in Supabase

**Required for document management and Admin Helper Bot functionality**

1. Open your [Supabase project dashboard](https://supabase.com/dashboard)
2. Navigate to **SQL Editor** in the left sidebar
3. Click **"New Query"**
4. Copy the contents of `sql/create_uploads_table.sql`
5. Paste into the SQL editor and click **"Run"**
6. Verify the `uploads` table appears in **Table Editor**

### 2. Update Environment Variables

**Required for full AI functionality**

1. Go to your [Vercel project dashboard](https://vercel.com/dashboard)
2. Navigate to **Settings → Environment Variables**
3. Update these keys if needed:
   ```
   GEMINI_API_KEY=your_google_gemini_api_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key
   ```
4. Redeploy if you update any environment variables

### 3. Test Admin Helper Bot

**Verify everything is working**

1. Login as an admin user at `/admin`
2. Test the Admin Helper Bot with these queries:
   - "How many members do we have?"
   - "Where can I find client documents?"
   - "What's our system status?"

### 4. Optional: Add Real User Data

**For production use**

1. Import existing member data through the admin interface
2. Configure email templates in Brevo
3. Set up domain verification for email sending

## Development

### Prerequisites
- Node.js 18+
- Supabase account
- Google Gemini API key
- Vercel account (for deployment)

### Local Development
```bash
npm install
npm run dev
```

### Environment Variables
Copy `.env.local` and update with your actual API keys.

## Architecture

- **Frontend**: Vanilla HTML/CSS/JavaScript
- **Backend**: Vercel serverless functions
- **Database**: Supabase (PostgreSQL)
- **AI**: Google Gemini for intelligent responses
- **Email**: Brevo for transactional emails
- **Monitoring**: LangSmith for AI tracing

## Documentation

- **Setup Guide**: `SETUP.md`
- **Admin System**: `ADMIN_SYSTEM_OVERVIEW.md`
- **Security**: `SECURITY_AND_PERFORMANCE.md`
- **API Documentation**: Check `/api/` folder for endpoint details

## Support

For technical issues:
1. Check the manual setup tasks above
2. Review the troubleshooting section in `sql/create_uploads_table.sql`
3. Verify all environment variables are set correctly
4. Test the Admin Helper Bot functionality

## License

Private - Interline Asia ProprietaryEmergency deploy trigger
EMERGENCY_REDEPLOY_1752658649
# Trigger redeploy on Sun 20 Jul 2025 17:48:30 +07
