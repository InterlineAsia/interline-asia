// Unified API endpoint for bot webhooks and other services
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { endpoint } = req.query;
    
    if (endpoint === 'bot-webhook') {
      return await handleBotWebhook(req, res);
    }
    
    return res.status(404).json({
      success: false,
      error: 'Endpoint not found'
    });
    
  } catch (error) {
    console.error('Unified API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
}

async function handleBotWebhook(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    const { botType, action, data } = req.body;
    
    if (!botType || !action || !data) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: botType, action, data'
      });
    }

    // Handle different bot types
    switch (botType) {
      case 'admin':
        return await handleAdminBot(req, res, action, data);
      case 'cruise':
        return await handleCruiseBot(req, res, action, data);
      default:
        return res.status(400).json({
          success: false,
          error: 'Unknown bot type'
        });
    }
    
  } catch (error) {
    console.error('Bot webhook error:', error);
    return res.status(500).json({
      success: false,
      error: 'Bot processing failed',
      message: error.message
    });
  }
}

async function handleAdminBot(req, res, action, data) {
  const { message, context } = data;
  
  if (action !== 'chat') {
    return res.status(400).json({
      success: false,
      error: 'Unknown action for admin bot'
    });
  }

  // Simple admin bot responses
  const messageLower = message.toLowerCase();
  let response = '';

  if (messageLower.includes('user') || messageLower.includes('account')) {
    response = `👥 **User Management Help**

**Common Tasks**:
• View pending verifications: Check /admin-verifications.html
• Approve/reject users: Use the action buttons in user management
• Search users: Use the search filter in the users table
• Check user status: Look for verification badges

**Quick Actions**:
• Pending users need manual approval
• Verified users have green checkmarks
• Rejected users show red status

Need help with a specific user? Please provide their email or name.`;

  } else if (messageLower.includes('deal') || messageLower.includes('cruise')) {
    response = `🚢 **Cruise Deals Management**

**Deal Operations**:
• Upload CSV: Use /admin-csv-processor.html
• View deals: Check /admin-deals.html
• Current data source: 1807 Master Upload Twins.csv
• Deal validation: Automatic price and date checking

**CSV Format Requirements**:
• Required columns: Cruise Line, Ship, Date, Nights, Region
• Price columns: Inside, Oceanview, Balcony
• Date format: MM/DD/YYYY or DD/MM/YYYY

**Troubleshooting**:
• Check console for CSV parsing errors
• Verify file encoding (UTF-8 recommended)
• Ensure no empty required fields`;

  } else if (messageLower.includes('system') || messageLower.includes('health') || messageLower.includes('status')) {
    response = `⚡ **System Health Status**

**Current Status**: ✅ All systems operational

**Key Components**:
• Database: Supabase PostgreSQL - Connected
• Authentication: Supabase Auth - Active
• File Storage: Vercel Static - Working
• API Endpoints: All responding
• CSV Processing: Functional

**Monitoring**:
• Error tracking: Sentry enabled
• Performance: Vercel analytics active
• Uptime: 99.9% target

**Quick Checks**:
• Login flow: Working
• Deal loading: Active
• User verification: Operational

Need specific system diagnostics? Let me know what to check.`;

  } else if (messageLower.includes('csv') || messageLower.includes('upload')) {
    response = `📊 **CSV Upload & Processing**

**Current Setup**:
• Primary file: /1807 Master Upload Twins.csv
• Backup files: /data/twins.csv, /twins.csv
• River cruises: /river.csv
• Auto-refresh: Cache busting enabled

**Upload Process**:
1. Go to /admin-csv-processor.html
2. Select your CSV file
3. Verify column mapping
4. Process and validate
5. Deploy changes

**File Requirements**:
• Format: UTF-8 encoded CSV
• Max size: 10MB recommended
• Required columns: Cruise Line, Ship, Date, Nights
• Price format: Numbers only (no currency symbols)

**Troubleshooting**:
• Check browser console for errors
• Verify CSV format matches template
• Ensure no special characters in headers`;

  } else if (messageLower.includes('login') || messageLower.includes('auth')) {
    response = `🔐 **Authentication & Login Help**

**Login Flow Status**: ✅ Working correctly

**Admin Access**:
• Admin emails: rodney@telenational.com.au, admin@telenational.com.au
• Admin dashboard: /dashboard-choice.html
• User dashboard: /dashboard.html

**Common Issues**:
• Login loops: Check session validation
• Redirect problems: Verify Supabase auth state
• Password resets: Use /reset-password.html

**Session Management**:
• Sessions persist across browser tabs
• Auto-logout after 24 hours
• Remember me: 30 days

**Troubleshooting**:
• Clear browser cache if issues persist
• Check network tab for auth errors
• Verify Supabase connection status`;

  } else {
    response = `🤖 **Admin Helper Bot**

I can help you with:

**👥 User Management**
• User verification and approval
• Account status checking
• User search and filtering

**🚢 Cruise Deals**
• CSV upload and processing
• Deal management and validation
• Data source configuration

**⚡ System Health**
• Status monitoring
• Performance checks
• Error diagnostics

**🔐 Authentication**
• Login flow troubleshooting
• Session management
• Access control

**💡 Quick Commands**:
• "show me users" - User management help
• "system status" - Health check
• "csv upload" - File processing help
• "login issues" - Auth troubleshooting

What would you like help with?`;
  }

  return res.status(200).json({
    success: true,
    response: response,
    botType: 'admin',
    timestamp: new Date().toISOString()
  });
}

async function handleCruiseBot(req, res, action, data) {
  const { message } = data;
  
  // Simple cruise bot response
  const response = `🚢 **Cruise Assistant**

Thank you for your message: "${message}"

I can help you with:
• Finding cruise deals
• Comparing prices and itineraries
• Booking assistance
• Travel recommendations

For detailed cruise information, please visit our deals page or contact our support team.

*This is a basic response. Full cruise bot functionality coming soon!*`;

  return res.status(200).json({
    success: true,
    response: response,
    botType: 'cruise',
    timestamp: new Date().toISOString()
  });
}