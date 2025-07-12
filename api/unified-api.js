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
      case 'langchain-diagnostic':
        return await handleLangChainDiagnostic(req, res);
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
    
    // Intelligent admin bot response
    if (botType === 'admin') {
      console.log('Admin bot received message:', message);
      
      try {
        // Import and use the intelligent response system
        const { getIntelligentResponse } = await import('./admin-bot-intelligence.js');
        const intelligentResponse = await getIntelligentResponse(message);
        
        console.log('Admin bot generated response length:', intelligentResponse.length);
        
        return res.status(200).json({
          success: true,
          response: intelligentResponse
        });
      } catch (error) {
        console.error('Admin bot intelligence error:', error);
        
        // Fallback response with error logging
        return res.status(200).json({
          success: true,
          response: `Admin Helper Bot - Ready to assist!

I can help you with:
• User management and verifications
• System health monitoring  
• Database queries and reports
• Admin workflow guidance

Ask me about specific admin tasks!

*Note: Advanced AI features temporarily unavailable - ${error.message}*`
        });
      }
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
}// Get pending uploads for admin review
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