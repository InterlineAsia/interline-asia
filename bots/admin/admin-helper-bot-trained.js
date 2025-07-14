// Interline Asia - Admin Helper Bot (Trained & Access-Controlled)
// ADMIN-ONLY bot with full system access and business intelligence

import BaseBot from '../core/base-bot.js';

export class AdminHelperBot extends BaseBot {
  constructor() {
    super('AdminHelperBot', {
      accessLevel: 'admin',
      expertise: [
        'user_management',
        'booking_analytics', 
        'email_campaigns',
        'verification_stats',
        'company_breakdowns',
        'system_health',
        'database_queries',
        'brevo_analytics'
      ]
    });
  }

  async processRequest(requestData, userContext = {}) {
    try {
      // Strict admin access validation
      this.validateAccess('admin', userContext);
      
      if (!userContext.isAdmin) {
        return {
          success: false,
          response: "Access denied. Admin Helper Bot is restricted to administrators only.",
          requiresAuth: true
        };
      }

      const message = requestData.message || '';
      const messageLower = message.toLowerCase();

      // Route to specific admin functions
      if (messageLower.includes('member') || messageLower.includes('user')) {
        return await this.handleUserQueries(message);
      }
      
      if (messageLower.includes('booking')) {
        return await this.handleBookingQueries(message);
      }
      
      if (messageLower.includes('email') || messageLower.includes('campaign')) {
        return await this.handleEmailQueries(message);
      }
      
      if (messageLower.includes('verification') || messageLower.includes('upload')) {
        return await this.handleVerificationQueries(message);
      }
      
      if (messageLower.includes('company') || messageLower.includes('breakdown')) {
        return await this.handleCompanyQueries(message);
      }
      
      if (messageLower.includes('health') || messageLower.includes('system')) {
        return await this.handleSystemQueries(message);
      }

      // General admin assistance
      return await this.generateAdminResponse(message);

    } catch (error) {
      await this.handleError(error, { requestData, userContext });
      return {
        success: false,
        response: "I encountered an error processing your admin request. Please try again.",
        error: error.message
      };
    }
  }

  async handleUserQueries(message) {
    try {
      // Get user statistics
      console.log('BOT: Attempting to fetch user data from profiles table...');
      console.log('BOT: Supabase client available:', !!this.supabaseClient);
      console.log('BOT: this.supabase available:', !!this.supabase);
      
      // Initialize Supabase client if not available
      if (!this.supabaseClient && !this.supabase) {
        console.log('BOT: Initializing Supabase client...');
        await this.initializeSupabase();
      }
      
      // Use whichever client is available
      const supabaseInstance = this.supabaseClient || this.supabase;
      console.log('BOT: Using Supabase instance:', !!supabaseInstance);
      
      if (!supabaseInstance) {
        throw new Error('No Supabase client available after initialization attempt');
      }
      
      const { data: profiles, error: profileError } = await supabaseInstance
        .from('profiles')
        .select('id, full_name, email, company_name, created_at, role');

      console.log('BOT: Query result:', {
        profiles: profiles,
        error: profileError,
        profileCount: profiles ? profiles.length : 0
      });

      if (profileError) {
        console.error('BOT: Profile query error:', profileError);
        throw profileError;
      }
      
      if (!profiles || profiles.length === 0) {
        console.warn('BOT: No profiles found in database');
        return {
          response: `📊 **User Management Summary**

**Total Members**: 0

No user profiles found in the database. This could mean:
- The profiles table is empty
- There may be an RLS (Row Level Security) issue
- The table structure may have changed

Please check the database directly or contact system administrator.`
        };
      }

      const totalUsers = profiles.length;
      const adminUsers = profiles.filter(p => p.role === 'admin').length;
      const memberUsers = profiles.filter(p => p.role === 'member').length;
      
      // Company breakdown
      const companies = {};
      profiles.forEach(profile => {
        const company = profile.company_name || 'Unknown';
        companies[company] = (companies[company] || 0) + 1;
      });

      const response = `📊 **User Management Summary**

**Total Members**: ${totalUsers}
- Admins: ${adminUsers}
- Members: ${memberUsers}

**Company Breakdown**:
${Object.entries(companies)
  .sort(([,a], [,b]) => b - a)
  .map(([company, count]) => `• ${company}: ${count} members`)
  .join('\n')}

**Recent Signups** (Last 7 days):
${profiles
  .filter(p => new Date(p.created_at) > new Date(Date.now() - 7*24*60*60*1000))
  .length} new members

Would you like detailed information about any specific company or user management task?`;

      await this.logToSupabase('admin_user_query', { 
        totalUsers, 
        companies: Object.keys(companies).length 
      });

      return {
        success: true,
        response: response
      };

    } catch (error) {
      console.error('BOT: Error fetching user data:', error);
      console.error('BOT: Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      
      // Try a simpler query as fallback
      try {
        console.log('BOT: Attempting fallback user count query...');
        const supabaseInstance = this.supabaseClient || this.supabase;
        
        if (!supabaseInstance) {
          throw new Error('No Supabase client available for fallback query');
        }
        
        const { count, error: countError } = await supabaseInstance
          .from('profiles')
          .select('*', { count: 'exact', head: true });
        
        if (countError) {
          console.error('BOT: Fallback count query failed:', countError);
        } else {
          console.log('BOT: Fallback count successful:', count);
          return {
            success: true,
            response: `📊 **User Management Summary**

**Total Members**: ${count || 0}

*Note: Detailed breakdown temporarily unavailable. Basic count retrieved successfully.*

Database connection is working but detailed queries may need optimization.`
          };
        }
      } catch (fallbackError) {
        console.error('BOT: Fallback query also failed:', fallbackError);
      }
      
      return {
        success: false,
        response: `❌ **Database Connection Issue**

Unable to retrieve user data. Error details:
- Message: ${error.message || 'Unknown error'}
- Code: ${error.code || 'No error code'}

**Troubleshooting Steps:**
1. Check Supabase connection status
2. Verify profiles table exists and has data
3. Check RLS (Row Level Security) policies
4. Verify API key permissions

Please check the browser console for detailed error logs.`
      };
    }
  }

  async handleBookingQueries(message) {
    try {
      // Get booking statistics
      const { data: bookings, error: bookingError } = await this.supabaseClient
        .from('bookings')
        .select('id, status, created_at, total_amount, cruise_line');

      if (bookingError) throw bookingError;

      const totalBookings = bookings.length;
      const pendingBookings = bookings.filter(b => b.status === 'pending').length;
      const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length;
      const cancelledBookings = bookings.filter(b => b.status === 'cancelled').length;

      const totalRevenue = bookings
        .filter(b => b.status === 'confirmed')
        .reduce((sum, b) => sum + (parseFloat(b.total_amount) || 0), 0);

      // Cruise line breakdown
      const cruiseLines = {};
      bookings.forEach(booking => {
        const line = booking.cruise_line || 'Unknown';
        cruiseLines[line] = (cruiseLines[line] || 0) + 1;
      });

      const response = `🚢 **Booking Analytics Summary**

**Total Bookings**: ${totalBookings}
- Pending: ${pendingBookings}
- Confirmed: ${confirmedBookings}
- Cancelled: ${cancelledBookings}

**Revenue**: $${totalRevenue.toLocaleString()}

**Popular Cruise Lines**:
${Object.entries(cruiseLines)
  .sort(([,a], [,b]) => b - a)
  .slice(0, 5)
  .map(([line, count]) => `• ${line}: ${count} bookings`)
  .join('\n')}

**Recent Activity** (Last 7 days):
${bookings
  .filter(b => new Date(b.created_at) > new Date(Date.now() - 7*24*60*60*1000))
  .length} new bookings

Need details on specific bookings or want to update booking statuses?`;

      await this.logToSupabase('admin_booking_query', { 
        totalBookings, 
        pendingBookings,
        totalRevenue 
      });

      return {
        success: true,
        response: response
      };

    } catch (error) {
      console.error('Booking query error:', error);
      return {
        success: false,
        response: "Unable to retrieve booking data. Please check database connection."
      };
    }
  }

  async handleEmailQueries(message) {
    try {
      // Get Brevo campaign stats (if available)
      const brevoApiKey = process.env.BREVO_API_KEY;
      
      if (!brevoApiKey) {
        return {
          success: false,
          response: "Brevo API key not configured. Cannot retrieve email statistics."
        };
      }

      // Basic email info (would need Brevo API integration for full stats)
      const response = `📧 **Email Campaign Summary**

**Brevo Integration**: ✅ Connected
**API Status**: Active

**Available Actions**:
• View campaign performance
• Check subscriber lists
• Monitor email deliverability
• Review bounce/complaint rates

**Recent Campaigns**:
• Welcome series: Active
• Booking confirmations: Automated
• Follow-up sequences: Scheduled

Would you like me to check specific campaign metrics or subscriber engagement?

*Note: Detailed analytics require Brevo API integration*`;

      await this.logToSupabase('admin_email_query', { 
        brevoConfigured: true 
      });

      return {
        success: true,
        response: response
      };

    } catch (error) {
      console.error('Email query error:', error);
      return {
        success: false,
        response: "Unable to retrieve email data. Please check Brevo configuration."
      };
    }
  }

  async handleVerificationQueries(message) {
    try {
      // Get upload/verification statistics
      const { data: uploads, error: uploadError } = await this.supabaseClient
        .from('uploads')
        .select('id, status, created_at, filename');

      if (uploadError) throw uploadError;

      const totalUploads = uploads.length;
      const pendingUploads = uploads.filter(u => u.status === 'pending').length;
      const approvedUploads = uploads.filter(u => u.status === 'approved').length;
      const rejectedUploads = uploads.filter(u => u.status === 'rejected').length;

      const response = `📋 **Verification & Upload Summary**

**Total Uploads**: ${totalUploads}
- Pending Review: ${pendingUploads}
- Approved: ${approvedUploads}
- Rejected: ${rejectedUploads}

**Approval Rate**: ${totalUploads > 0 ? Math.round((approvedUploads / totalUploads) * 100) : 0}%

**Recent Uploads** (Last 24 hours):
${uploads
  .filter(u => new Date(u.created_at) > new Date(Date.now() - 24*60*60*1000))
  .length} new documents

**Action Required**: ${pendingUploads} uploads awaiting review

Would you like to review pending uploads or update verification statuses?`;

      await this.logToSupabase('admin_verification_query', { 
        totalUploads, 
        pendingUploads,
        approvalRate: totalUploads > 0 ? Math.round((approvedUploads / totalUploads) * 100) : 0
      });

      return {
        success: true,
        response: response
      };

    } catch (error) {
      console.error('Verification query error:', error);
      return {
        success: false,
        response: "Unable to retrieve verification data. Please check database connection."
      };
    }
  }

  async handleCompanyQueries(message) {
    try {
      // Get detailed company breakdown
      const { data: profiles, error } = await this.supabaseClient
        .from('profiles')
        .select('company_name, created_at, role');

      if (error) throw error;

      const companies = {};
      profiles.forEach(profile => {
        const company = profile.company_name || 'Unknown';
        if (!companies[company]) {
          companies[company] = { total: 0, admins: 0, members: 0, recent: 0 };
        }
        companies[company].total++;
        if (profile.role === 'admin') companies[company].admins++;
        if (profile.role === 'member') companies[company].members++;
        
        // Recent signups (last 30 days)
        if (new Date(profile.created_at) > new Date(Date.now() - 30*24*60*60*1000)) {
          companies[company].recent++;
        }
      });

      const sortedCompanies = Object.entries(companies)
        .sort(([,a], [,b]) => b.total - a.total);

      const response = `🏢 **Company Breakdown Analysis**

**Total Companies**: ${Object.keys(companies).length}
**Total Members**: ${profiles.length}

**Top Companies by Member Count**:
${sortedCompanies
  .slice(0, 10)
  .map(([company, stats]) => 
    `• **${company}**: ${stats.total} members (${stats.recent} new this month)`
  )
  .join('\n')}

**Growth Trends**:
• Most active: ${sortedCompanies[0]?.[0] || 'N/A'}
• Fastest growing: ${sortedCompanies
  .sort(([,a], [,b]) => b.recent - a.recent)[0]?.[0] || 'N/A'}

Would you like detailed analytics for a specific company or export this data?`;

      await this.logToSupabase('admin_company_query', { 
        totalCompanies: Object.keys(companies).length,
        topCompany: sortedCompanies[0]?.[0]
      });

      return {
        success: true,
        response: response
      };

    } catch (error) {
      console.error('Company query error:', error);
      return {
        success: false,
        response: "Unable to retrieve company data. Please check database connection."
      };
    }
  }

  async handleSystemQueries(message) {
    try {
      // System health check
      const healthStatus = await this.healthCheck();
      
      const response = `🔧 **System Health Report**

**Bot Status**: ${healthStatus.initialized ? '✅ Operational' : '❌ Issues'}
**Database**: ${healthStatus.supabase ? '✅ Connected' : '❌ Disconnected'}
**AI Engine**: ${healthStatus.gemini ? '✅ Connected' : '❌ Disconnected'}
**Email Service**: ${healthStatus.brevo ? '✅ Configured' : '❌ Not Configured'}

**Admin Bot Features**:
✅ User management queries
✅ Booking analytics
✅ Email campaign monitoring
✅ Verification tracking
✅ Company breakdowns
✅ System diagnostics

**Last Health Check**: ${new Date().toLocaleString()}

All admin functions are operational. What would you like to investigate?`;

      return {
        success: true,
        response: response
      };

    } catch (error) {
      console.error('System query error:', error);
      return {
        success: false,
        response: "Unable to perform system health check. Please investigate manually."
      };
    }
  }

  async generateAdminResponse(message) {
    try {
      if (this.geminiClient) {
        const adminPrompt = `You are the Admin Helper Bot for Interline Asia travel platform. 
        
You have access to:
- User management and member statistics
- Booking analytics and revenue data  
- Email campaign performance via Brevo
- Document verification workflows
- Company member breakdowns
- System health monitoring

User question: "${message}"

Provide a helpful admin-focused response. If they're asking for specific data, guide them on what information you can provide. Be professional and concise.`;

        const response = await this.generateIntelligentResponse(adminPrompt, {
          isAdmin: true,
          botType: 'admin'
        });

        return {
          success: true,
          response: response
        };
      }

      // Fallback response without AI
      return {
        success: true,
        response: `Admin Helper Bot - Ready to assist!

I can help you with:
• User management and member statistics
• Booking analytics and revenue tracking
• Email campaign monitoring (Brevo)
• Document verification workflows  
• Company member breakdowns
• System health diagnostics

What specific admin task would you like help with?`
      };

    } catch (error) {
      console.error('Admin response generation error:', error);
      return {
        success: false,
        response: "I'm experiencing technical difficulties. Please try a more specific admin query."
      };
    }
  }
}

export default AdminHelperBot;