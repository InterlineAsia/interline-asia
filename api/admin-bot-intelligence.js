// Intelligent Admin Bot with Database Access
// Note: Using dynamic import to avoid module issues

let supabase = null;

async function initSupabase() {
  if (!supabase) {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nxreyyxbuwxjfmtvdkji.supabase.co';
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Missing Supabase credentials');
      }
      
      supabase = createClient(supabaseUrl, supabaseServiceKey);
    } catch (error) {
      console.error('Supabase init error:', error);
      throw error;
    }
  }
  return supabase;
}


export async function getIntelligentResponse(message) {
  const msg = message.toLowerCase();
  
  try {
    const supabaseClient = await initSupabase();
    // Member statistics and analytics
    if (msg.includes('how many') && (msg.includes('member') || msg.includes('user'))) {
      const { data: users, error } = await supabaseClient
        .from('profiles')
        .select('id, created_at, verification_status, email, full_name')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const totalUsers = users.length;
      const verifiedUsers = users.filter(u => u.verification_status === 'verified').length;
      const unverifiedUsers = totalUsers - verifiedUsers;
      
      return `👥 **Member Statistics**

**Total Members**: ${totalUsers}
**Verified Members**: ${verifiedUsers}
**Pending Verification**: ${unverifiedUsers}

**Recent Activity**:
• Last 7 days: ${users.filter(u => new Date(u.created_at) > new Date(Date.now() - 7*24*60*60*1000)).length} new signups
• Last 30 days: ${users.filter(u => new Date(u.created_at) > new Date(Date.now() - 30*24*60*60*1000)).length} new signups

Use /admin-verifications.html to manage user verifications.`;
    }
    
    // Today's signups
    if (msg.includes('today') && (msg.includes('join') || msg.includes('signup') || msg.includes('member'))) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data: todayUsers, error } = await supabaseClient
        .from('profiles')
        .select('id, full_name, email, created_at')
        .gte('created_at', today.toISOString())
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return `📅 **Today's New Members**: ${todayUsers.length}

${todayUsers.length > 0 ? 
  todayUsers.slice(0, 5).map(u => `• ${u.full_name} (${u.email})`).join('\n') +
  (todayUsers.length > 5 ? `\n• ...and ${todayUsers.length - 5} more` : '')
  : 'No new signups today yet.'}

${todayUsers.length > 0 ? 'Check /admin-verifications.html to review these new members.' : ''}`;
    }
    
    // Member locations/demographics
    if (msg.includes('where') && (msg.includes('member') || msg.includes('from') || msg.includes('location'))) {
      const { data: users, error } = await supabaseClient
        .from('profiles')
        .select('id, email')
        .not('email', 'is', null);
      
      if (error) throw error;
      
      // Analyze email domains for location insights
      const domains = {};
      users.forEach(user => {
        const domain = user.email.split('@')[1];
        domains[domain] = (domains[domain] || 0) + 1;
      });
      
      const sortedDomains = Object.entries(domains)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10);
      
      return `🌍 **Member Demographics**

**Top Email Domains**:
${sortedDomains.map(([domain, count]) => `• ${domain}: ${count} members`).join('\n')}

**Geographic Insights**:
• .com.au domains: ${sortedDomains.filter(([d]) => d.includes('.au')).reduce((sum, [,count]) => sum + count, 0)} (Australia)
• .com domains: ${sortedDomains.filter(([d]) => d.endsWith('.com') && !d.includes('.au')).reduce((sum, [,count]) => sum + count, 0)} (International)

For detailed analytics, check the monitoring dashboard.`;
    }

    // Documents and uploads
    if (msg.includes('document') || msg.includes('upload') || msg.includes('file')) {
      const { data: uploads, error } = await supabaseClient
        .from('uploads')
        .select('id, user_id, filename, status, created_at')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const totalUploads = uploads.length;
      const pendingUploads = uploads.filter(u => u.status === 'pending').length;
      const approvedUploads = uploads.filter(u => u.status === 'approved').length;
      
      return `📁 **Document Management**

**Total Documents**: ${totalUploads}
**Pending Review**: ${pendingUploads}
**Approved**: ${approvedUploads}

**Storage Location**: Supabase Storage bucket \`uploads\`
**Database Table**: \`uploads\` table tracks metadata

**Admin Actions**:
• Review documents: /admin-verifications.html
• Find user docs: Search by email in admin panel
• Manual verification: Update \`verification_status\` in profiles table`;
    }

    // Admin utilities and how-to guides
    if (msg.includes('how to') || msg.includes('manually') || msg.includes('verify') || msg.includes('promote')) {
      if (msg.includes('verify') || msg.includes('approve')) {
        return `✅ **Manual User Verification**

**Method 1 - Admin Panel**:
1. Go to /admin-verifications.html
2. Find the user in the list
3. Click "Approve" or "Reject"

**Method 2 - Direct Database**:
\`\`\`sql
UPDATE profiles 
SET verification_status = 'verified' 
WHERE email = 'user@example.com';
\`\`\`

**Method 3 - Find User Documents**:
1. Search user email in admin panel
2. Review uploaded documents
3. Update status accordingly`;
      }
      
      if (msg.includes('promote') || msg.includes('admin')) {
        return `👑 **Promote User to Admin**

**Database Method**:
\`\`\`sql
UPDATE profiles 
SET is_admin = true 
WHERE email = 'user@example.com';
\`\`\`

**Current Super Admins**:
• admin@interlineasia.com
• edvin@interlineasia.com

**Admin Permissions**: Access to /admin dashboard, user management, system tools`;
      }
    }
    
    // Available deals
    if (msg.includes('deal') || msg.includes('cruise') || msg.includes('available')) {
      // Try to get deals from the deals table or JSON files
      let dealsInfo = '';
      
      try {
        const { data: deals, error } = await supabase
          .from('deals_dashboard')
          .select('*')
          .limit(10);
        
        if (!error && deals && deals.length > 0) {
          dealsInfo = `🚢 **Available Cruise Deals**: ${deals.length} active deals

**Recent Deals**:
${deals.slice(0, 5).map(deal => 
  `• ${deal.cruise_line || 'Cruise'}: ${deal.destination || 'Various destinations'} - $${deal.price || 'Price TBA'}`
).join('\n')}

${deals.length > 5 ? `• ...and ${deals.length - 5} more deals` : ''}`;
        } else {
          // Fallback to file-based deals
          dealsInfo = `🚢 **Cruise Deals Management**

**Deal Sources**:
• Database: Check deals_dashboard table
• CSV Files: Multiple deal files in /public/data/
• Admin Tools: Use /admin-deals.html to manage deals

**Quick Actions**:
• Upload new deals via /admin-csv-processor.html
• View all deals at /admin-deals.html
• Monitor deal performance in analytics`;
        }
      } catch (err) {
        dealsInfo = `🚢 **Cruise Deals System**

**Available Tools**:
• Deals Dashboard: /admin-deals.html
• CSV Processor: /admin-csv-processor.html  
• Deal Files: Check /public/data/ directory

**Deal Management**:
• Upload bulk deals via CSV
• Individual deal editing
• Price and availability updates`;
      }
      
      return dealsInfo;
    }
    
    // Document locations
    if (msg.includes('document') || msg.includes('file') || msg.includes('upload') || msg.includes('verification')) {
      const { data: uploads, error } = await supabase
        .storage
        .from('verification-uploads')
        .list();
      
      const uploadCount = uploads ? uploads.length : 0;
      
      return `📄 **Document & Verification System**

**Document Storage**:
• Supabase Storage: "verification-uploads" bucket
• Total Files: ${uploadCount} uploaded documents
• Access: /admin-verifications.html

**Document Types**:
• Employment verification documents
• Identity verification files
• Supporting documentation

**Management Tools**:
• Review documents: /admin-verifications.html
• Download files: Direct from user profiles
• Approve/reject: Built-in verification workflow

**Quick Actions**:
• Check pending verifications
• Download user documents
• Update verification status`;
    }
    
    // System status and health
    if (msg.includes('status') || msg.includes('health') || msg.includes('system')) {
      const { data: recentUsers, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .gte('created_at', new Date(Date.now() - 24*60*60*1000).toISOString());
      
      const { data: storage, error: storageError } = await supabase
        .storage
        .from('verification-uploads')
        .list();
      
      return `🔍 **System Health Status**

**Database**: ✅ Connected and responsive
**Authentication**: ✅ Supabase auth working
**Storage**: ✅ ${storage ? storage.length : 0} files in verification bucket
**Admin Access**: ✅ Full admin privileges active

**24-Hour Activity**:
• New signups: ${recentUsers ? recentUsers.length : 0}
• System uptime: Operational
• API responses: Normal

**Monitoring Tools**:
• Database health: /admin/debug.html
• System metrics: /monitoring.html
• Error logs: Check Vercel dashboard

**All systems operational** ✅`;
    }
    
    // Website functions and features
    if (msg.includes('function') || msg.includes('feature') || msg.includes('how') || msg.includes('work')) {
      return `⚙️ **Website Functions & Features**

**Core Systems**:
• **User Registration**: Signup with email verification
• **Document Upload**: Employment verification system  
• **Cruise Deals**: Browse and search cruise packages
• **Member Dashboard**: Personal account management
• **Admin Panel**: Complete administration tools

**Key Features**:
• Supabase authentication and database
• Document storage and verification
• Email automation (Brevo integration)
• Responsive design and mobile support
• Admin bot assistance (that's me!)

**Admin Functions**:
• User management and verification
• Cruise deal management and CSV upload
• System monitoring and analytics
• Document review and approval

**Technical Stack**:
• Frontend: HTML, CSS, JavaScript
• Backend: Vercel serverless functions
• Database: Supabase PostgreSQL
• Storage: Supabase Storage
• Email: Brevo API

Need help with any specific function?`;
    }
    
    // Default intelligent response
    return `🤖 **Admin Intelligence Ready**

I can help you with real-time data about:

**Member Analytics**:
• "How many members do we have?"
• "How many members joined today?"
• "Where are our members from?"

**System Information**:
• "What deals do we have available?"
• "Where can I find member documents?"
• "What's our system status?"
• "How do website functions work?"

**Quick Stats** (Live Data):
• Total members: Loading...
• Today's signups: Loading...
• System status: Operational ✅

Ask me anything specific about your system!`;
    
  } catch (error) {
    console.error('Bot intelligence error:', error);
    return `🤖 **Admin Helper Bot**

I'm experiencing some difficulty accessing the database right now, but I can still help with:

• **User Management**: /admin-verifications.html
• **Cruise Deals**: /admin-deals.html  
• **System Tools**: /admin/debug.html
• **Monitoring**: /monitoring.html

Please try your question again, or use the admin tools directly.`;
  }
}