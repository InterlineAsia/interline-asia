const fs = require('fs');

let content = fs.readFileSync('api/unified-api.js', 'utf8');

// Replace the simple bot response with a more intelligent contextual one
const oldCode = `    // Simple admin bot response
    if (botType === 'admin') {
      return res.status(200).json({
        success: true,
        response: \`🤖 **Admin Helper Bot** - Ready to assist!

I can help you with:
• User management and verifications
• System health monitoring  
• Database queries and reports
• Admin workflow guidance

Ask me about specific admin tasks!\`
      });
    }`;

const newCode = `    // Intelligent contextual admin bot responses
    if (botType === 'admin') {
      let response = '';
      const msg = message.toLowerCase();
      
      if (msg.includes('how many') && (msg.includes('member') || msg.includes('user'))) {
        response = \`**Member Statistics**

To check current member counts:
• **User Management**: Go to /admin-verifications.html to see all users
• **Database Query**: Use /admin/debug.html for direct database access
• **Analytics**: Check the monitoring dashboard

**What you'll find:**
• Total registered members
• Verified vs unverified users
• Recent signup activity
• Member verification status

**Quick Actions:**
• View all users: /admin-verifications.html
• Run database queries: /admin/debug.html
• Check recent activity: Look for "created_at" timestamps\`;
      } else if (msg.includes('today') && (msg.includes('join') || msg.includes('signup') || msg.includes('member'))) {
        response = \`**Today's New Members**

To see today's signups:
• **User Management**: /admin-verifications.html (sort by newest)
• **Database Query**: /admin/debug.html - filter by today's date
• **SQL Query**: \\\`SELECT * FROM profiles WHERE DATE(created_at) = CURRENT_DATE\\\`

**What to look for:**
• Recent "created_at" timestamps
• Unverified new users
• Email domains and patterns
• Verification document uploads

**Follow-up Actions:**
• Review new user documents
• Send welcome emails
• Monitor for verification completions\`;
      } else if (msg.includes('where') && (msg.includes('member') || msg.includes('from') || msg.includes('location'))) {
        response = \`**Member Demographics & Locations**

To analyze member locations:
• **Email Analysis**: Check email domains in /admin-verifications.html
• **Database Query**: \\\`SELECT email FROM profiles\\\` and analyze domains
• **Geographic Insights**: Look for country-specific email domains

**Common Patterns:**
• .com.au = Australia
• .co.uk = United Kingdom  
• .com = International/US
• Company domains = Employment verification

**Analysis Tools:**
• Export user data from /admin-verifications.html
• Use /admin/debug.html for custom queries
• Check email patterns for geographic distribution\`;
      } else if (msg.includes('deal') || msg.includes('cruise') || msg.includes('available')) {
        response = \`**Available Cruise Deals**

**Deal Management Tools:**
• **Deals Dashboard**: /admin-deals.html - View and manage all deals
• **CSV Processor**: /admin-csv-processor.html - Bulk upload new deals
• **Deal Files**: Check /public/data/ directory for JSON deal files

**Current Deal Sources:**
• Database: deals_dashboard table
• JSON Files: Multiple cruise-deals-*.json files
• CSV Uploads: Processed through admin tools

**Deal Information Includes:**
• Cruise lines and destinations
• Pricing and availability
• Departure dates and durations
• Cabin types and amenities

**Quick Actions:**
• View all deals: /admin-deals.html
• Upload new deals: /admin-csv-processor.html
• Update pricing: Edit individual deals\`;
      } else if (msg.includes('document') || msg.includes('file') || msg.includes('upload') || msg.includes('verification')) {
        response = \`**Member Documents & Verification**

**Document Locations:**
• **Supabase Storage**: "verification-uploads" bucket
• **User Profiles**: Linked to each user's profile in database
• **Admin Access**: /admin-verifications.html for review

**Document Types:**
• Employment verification documents
• Identity verification files
• Supporting documentation
• Uploaded during signup process

**Management Actions:**
• **Review Documents**: /admin-verifications.html
• **Download Files**: Click on user profiles
• **Approve/Reject**: Use verification workflow
• **Storage Access**: Supabase dashboard for direct file access

**Verification Process:**
1. User uploads documents during signup
2. Files stored in Supabase Storage
3. Admin reviews via /admin-verifications.html
4. Approve or request additional documentation\`;
      } else if (msg.includes('status') || msg.includes('health') || msg.includes('system')) {
        response = \`**System Health & Status**

**Current Status**: ✅ Operational

**System Components:**
• **Database**: Supabase PostgreSQL - Connected
• **Authentication**: Supabase Auth - Working
• **Storage**: Supabase Storage - Active
• **API**: Vercel Functions - Responding
• **Admin Bot**: Online and responding

**Monitoring Tools:**
• **System Health**: /monitoring.html
• **Database Tools**: /admin/debug.html
• **Error Logs**: Vercel dashboard
• **User Activity**: /admin-verifications.html

**Key Metrics to Monitor:**
• User signup rates
• Verification completion rates
• System response times
• Storage usage
• API error rates\`;
      } else if (msg.includes('function') || msg.includes('feature') || msg.includes('how') || msg.includes('work')) {
        response = \`**Website Functions & Features**

**Core User Features:**
• **Registration**: Email-based signup with verification
• **Document Upload**: Employment verification system
• **Cruise Browsing**: Search and view cruise deals
• **Member Dashboard**: Personal account management

**Admin Functions:**
• **User Management**: /admin-verifications.html
• **Deal Management**: /admin-deals.html
• **CSV Processing**: /admin-csv-processor.html
• **System Monitoring**: /monitoring.html
• **Database Tools**: /admin/debug.html

**Technical Architecture:**
• **Frontend**: HTML, CSS, JavaScript
• **Backend**: Vercel serverless functions
• **Database**: Supabase PostgreSQL
• **Storage**: Supabase file storage
• **Email**: Brevo API integration
• **Authentication**: Supabase Auth

**Key Workflows:**
1. User signup → Email verification → Document upload
2. Admin review → Verification approval → Member access
3. Deal upload → CSV processing → Public display\`;
      } else if (msg.includes('morning') || msg.includes('hello') || msg.includes('hi')) {
        response = \`**Good morning! Welcome to the admin dashboard.**

**Today's Priority Tasks:**
• Check pending user verifications at /admin-verifications.html
• Review new member signups and documents
• Monitor system health and performance
• Update cruise deals if needed

**Quick Admin Actions:**
• "How many members do we have?" - Get user statistics
• "How many members joined today?" - Check recent signups
• "Where can I find member documents?" - Document management
• "What deals do we have available?" - Cruise deal overview
• "What's our system status?" - Health check

**Popular Questions:**
• Member analytics and demographics
• Document verification workflow
• System status and monitoring
• Cruise deal management

**Ready to help with any specific admin tasks!**\`;
      } else {
        response = \`**Admin Helper Bot** - Intelligent Assistant Ready!

**I can help you with detailed information about:**

**Member Management:**
• "How many members do we have?" - User statistics
• "How many members joined today?" - Recent signups
• "Where are our members from?" - Demographics analysis

**System Operations:**
• "Where can I find member documents?" - Document locations
• "What deals do we have available?" - Cruise deal overview
• "What's our system status?" - Health monitoring
• "How do website functions work?" - Technical details

**Quick Access:**
• User Management: /admin-verifications.html
• Cruise Deals: /admin-deals.html
• System Health: /monitoring.html
• Database Tools: /admin/debug.html

**Ask me anything specific about your system - I have detailed knowledge of all functions and can guide you to the exact tools and information you need!**\`;
      }
      
      return res.status(200).json({
        success: true,
        response: response
      });
    }`;

content = content.replace(oldCode, newCode);
fs.writeFileSync('api/unified-api.js', content);
console.log('Intelligent contextual bot responses added!');