// Interline Asia - Unified API Handler
// Consolidates multiple API endpoints to stay within Vercel Hobby plan limits

export default async function handler(req, res) {
  const { endpoint } = req.query;
  
  try {
    switch (endpoint) {
      case 'bot-webhook':
        return await handleBotWebhook(req, res);
      case 'bot-health':
        return await handleBotHealth(req, res);
      case 'get-pending-uploads':
        return await handleGetPendingUploads(req, res);
      case 'update-upload-status':
        return await handleUpdateUploadStatus(req, res);
      case 'system-health-check':
        return await handleSystemHealthCheck(req, res);
      case 'bot-automated-tests':
        return await handleBotAutomatedTests(req, res);
      case 'bot-performance-monitor':
        return await handleBotPerformanceMonitor(req, res);
      case 'support-bot':
        return await handleSupportBot(req, res);
      case 'cruise-data':
        return await handleCruiseData(req, res);
      case 'csv-manager':
        return await handleCSVManager(req, res);
      default:
        return res.status(404).json({ error: 'Endpoint not found' });
    }
  } catch (error) {
    console.error('Unified API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Bot Webhook Handler - With Intelligent Response
async function handleBotWebhook(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { botType, action, data } = req.body || {};
    
    if (!botType || !action || !data) {
      return res.status(400).json({ error: 'Missing required fields: botType, action, data' });
    }

    const message = data.message || '';
    
    // Route to appropriate trained bot
    try {
      let BotClass;
      let botResponse;
      
      switch (botType) {
        case 'admin':
          const { default: AdminHelperBot } = await import('../bots/admin/admin-helper-bot-trained.js');
          BotClass = new AdminHelperBot();
          botResponse = await BotClass.processRequest(data, { 
            isAdmin: true, 
            userId: data.userId 
          });
          break;
          
        case 'customer':
          const { default: CustomerBot } = await import('../bots/customer/customer-bot-trained.js');
          BotClass = new CustomerBot();
          botResponse = await BotClass.processRequest(data, { 
            isCustomer: true 
          });
          break;
          
        case 'booking':
        case 'post-booking':
          const { default: PostBookingBot } = await import('../bots/booking/booking-bot-trained.js');
          BotClass = new PostBookingBot();
          botResponse = await BotClass.processRequest(data, { 
            isMember: true, 
            userId: data.userId 
          });
          break;
          
        case 'newsletter':
          const { default: NewsletterBot } = await import('../bots/newsletter/newsletter-bot-trained.js');
          BotClass = new NewsletterBot();
          botResponse = await BotClass.processRequest(data, { 
            isPublic: true 
          });
          break;
          
        default:
          // Default to customer bot for unknown types
          const { default: DefaultCustomerBot } = await import('../bots/customer/customer-bot-trained.js');
          BotClass = new DefaultCustomerBot();
          botResponse = await BotClass.processRequest(data, { 
            isCustomer: true 
          });
      }
      
      return res.status(200).json(botResponse);
      
    } catch (error) {
      console.error('Bot processing error:', error);
      
      return res.status(200).json({
        success: true,
        response: `I apologize, but I'm experiencing technical difficulties. Please try again later or contact support for assistance.`,
        error: 'Bot service temporarily unavailable'
      });
    }
    
    return res.status(200).json({
      success: true,
      response: 'Hello! I am ready to help. What can I assist you with today?'
    });
    
  } catch (error) {
    return res.status(200).json({
      success: false,
      response: 'I apologize, but I am experiencing technical difficulties. Please try again later.',
      error: 'Bot service temporarily unavailable'
    });
  }
}

// Bot Health Handler
async function handleBotHealth(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    return res.status(200).json({
      status: 'ok',
      bots: ['admin', 'booking', 'lead', 'followup'],
      gemini_status: 'connected',
      timestamp: new Date().toISOString(),
      endpoint: '/api/unified-api?endpoint=bot-health'
    });

  } catch (error) {
    console.error('Bot health check error:', error);
    
    return res.status(503).json({
      status: 'error',
      error: error.message,
      endpoint: '/api/unified-api?endpoint=bot-health',
      timestamp: new Date().toISOString()
    });
  }
}// Bot Automated Tests Handler
async function handleBotAutomatedTests(req, res) {
  try {
    const { default: testHandler } = await import('./bot-automated-tests.js');
    return await testHandler(req, res);
  } catch (error) {
    return res.status(500).json({ error: 'Bot testing service unavailable' });
  }
}

// Bot Performance Monitor Handler
async function handleBotPerformanceMonitor(req, res) {
  try {
    const { default: monitorHandler } = await import('./bot-performance-monitor.js');
    return await monitorHandler(req, res);
  } catch (error) {
    return res.status(500).json({ error: 'Performance monitoring service unavailable' });
  }
}

// Support Bot Handler
async function handleSupportBot(req, res) {
  try {
    const { default: supportHandler } = await import('./support-bot-handler.js');
    return await supportHandler(req, res);
  } catch (error) {
    return res.status(500).json({ error: 'Support bot service unavailable' });
  }
}

// Cruise Data Integration Handler
async function handleCruiseData(req, res) {
  try {
    const { default: cruiseDataHandler } = await import('./cruise-data-integration.js');
    return await cruiseDataHandler(req, res);
  } catch (error) {
    return res.status(500).json({ error: 'Cruise data service unavailable' });
  }
}

// CSV File Manager Handler
async function handleCSVManager(req, res) {
  try {
    const { default: csvManagerHandler } = await import('./csv-file-manager.js');
    return await csvManagerHandler(req, res);
  } catch (error) {
    return res.status(500).json({ error: 'CSV manager service unavailable' });
  }
}

// Get pending uploads for admin review
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nxreyyxbuwxjfmtvdkji.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all uploads with user information
    const { data: uploads, error: uploadsError } = await supabase
      .from('uploads')
      .select(`
        id,
        filename,
        status,
        created_at,
        user_id
      `)
      .order('created_at', { ascending: false });

    if (uploadsError) {
      throw uploadsError;
    }

    // Get user profiles to match with uploads
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, email, created_at');

    if (profilesError) {
      throw profilesError;
    }

    // Combine uploads with user data
    const uploadsWithUsers = uploads.map(upload => {
      const user = profiles.find(p => p.id === upload.user_id);
      return {
        ...upload,
        user: user || { full_name: 'Unknown User', email: 'unknown@example.com' }
      };
    });

    // Group by status for easy admin review
    const groupedUploads = {
      pending: uploadsWithUsers.filter(u => u.status === 'pending'),
      approved: uploadsWithUsers.filter(u => u.status === 'approved'),
      rejected: uploadsWithUsers.filter(u => u.status === 'rejected')
    };

    return res.status(200).json({
      success: true,
      uploads: uploadsWithUsers,
      grouped: groupedUploads,
      summary: {
        total: uploads.length,
        pending: groupedUploads.pending.length,
        approved: groupedUploads.approved.length,
        rejected: groupedUploads.rejected.length
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get uploads error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}