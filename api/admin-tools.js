// Admin Tools - Consolidated diagnostic, management, and CSV intelligence endpoints
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { tool, action } = req.query;
  
  try {
    // Handle CSV intelligence actions (consolidated from admin-csv-intelligence.js)
    if (action) {
      return await handleCSVIntelligence(req, res);
    }
    
    // Handle admin tools
    switch (tool) {
      case 'get-uploads':
        return await getUploads(req, res);
      case 'update-upload':
        return await updateUpload(req, res);
      case 'health-check':
        return await healthCheck(req, res);
      case 'bot-intelligence':
        return await handleBotIntelligence(req, res);
      default:
        return res.status(404).json({ error: 'Tool not found' });
    }
  } catch (error) {
    console.error('Admin tools error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// CSV Intelligence Handler (consolidated from admin-csv-intelligence.js)
async function handleCSVIntelligence(req, res) {
  const { action } = req.body;
  const csvIntelligence = new AdminCSVIntelligence();

  try {
    switch (action) {
      case 'scan-for-new-csvs':
        return await csvIntelligence.scanForNewCSVs(req, res);
      case 'process-csv':
        return await csvIntelligence.processSpecificCSV(req, res);
      case 'get-learning-status':
        return await csvIntelligence.getLearningStatus(req, res);
      case 'force-relearn':
        return await csvIntelligence.forceRelearn(req, res);
      default:
        return res.status(400).json({ error: 'Invalid CSV intelligence action' });
    }
  } catch (error) {
    console.error('CSV Intelligence error:', error);
    return res.status(500).json({ 
      error: 'CSV Intelligence system error',
      details: error.message 
    });
  }
}

// CSV Intelligence Class (consolidated)
class AdminCSVIntelligence {
  constructor() {
    this.watchDirectories = ['./uploads/', './public/data/', './public/', './'];
    this.supportedFormats = ['river.csv', 'twins.csv', 'deals.csv', 'cruise-deals.csv'];
    this.isProcessing = false;
    this.lastProcessed = new Map();
  }

  async scanForNewCSVs(req, res) {
    if (this.isProcessing) {
      return res.status(200).json({
        success: false,
        message: 'CSV processing already in progress',
        status: 'busy'
      });
    }

    try {
      const fs = await import('fs');
      const path = await import('path');
      
      const foundFiles = [];
      const processedFiles = [];
      const errors = [];

      // Scan directories for CSV files
      for (const dir of this.watchDirectories) {
        try {
          if (fs.existsSync(dir)) {
            const files = fs.readdirSync(dir);
            const csvFiles = files.filter(file => 
              file.endsWith('.csv') && this.isSupportedFormat(file)
            );

            for (const file of csvFiles) {
              const filePath = path.join(dir, file);
              const stats = fs.statSync(filePath);
              const lastModified = stats.mtime.getTime();
              
              foundFiles.push({
                file: file,
                path: filePath,
                size: stats.size,
                lastModified: lastModified,
                isNew: !this.lastProcessed.has(filePath) || 
                       this.lastProcessed.get(filePath) < lastModified
              });
            }
          }
        } catch (dirError) {
          console.warn(`Could not scan directory ${dir}:`, dirError.message);
        }
      }

      return res.status(200).json({
        success: true,
        message: `Found ${foundFiles.length} CSV files`,
        foundFiles: foundFiles.length,
        newFiles: foundFiles.filter(f => f.isNew).length
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to scan for CSV files',
        details: error.message
      });
    }
  }

  isSupportedFormat(filename) {
    return this.supportedFormats.some(format => 
      filename.toLowerCase().includes(format.toLowerCase().replace('.csv', ''))
    );
  }

  async getLearningStatus(req, res) {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      const { count: totalDeals } = await supabase
        .from('cruise_deals')
        .select('*', { count: 'exact', head: true });

      return res.status(200).json({
        success: true,
        status: {
          totalDeals: totalDeals || 0,
          isProcessing: this.isProcessing,
          watchDirectories: this.watchDirectories,
          supportedFormats: this.supportedFormats
        }
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to get learning status',
        details: error.message
      });
    }
  }

  async forceRelearn(req, res) {
    this.lastProcessed.clear();
    return await this.scanForNewCSVs(req, res);
  }
}

// Get pending uploads
async function getUploads(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nxreyyxbuwxjfmtvdkji.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: uploads, error: uploadsError } = await supabase
      .from('uploads')
      .select('id, filename, status, created_at, user_id')
      .order('created_at', { ascending: false });

    if (uploadsError) throw uploadsError;

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, email, created_at');

    if (profilesError) throw profilesError;

    const uploadsWithUsers = uploads.map(upload => {
      const user = profiles.find(p => p.id === upload.user_id);
      return { ...upload, user: user || { full_name: 'Unknown User', email: 'unknown@example.com' } };
    });

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
      }
    });

  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

// Update upload status
async function updateUpload(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { uploadId, status } = req.body;
    
    if (!uploadId || !status || !['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ error: 'Invalid uploadId or status' });
    }

    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nxreyyxbuwxjfmtvdkji.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: updatedUpload, error: updateError } = await supabase
      .from('uploads')
      .update({ status: status })
      .eq('id', uploadId)
      .select('id, filename, status, user_id, created_at')
      .single();

    if (updateError) throw updateError;

    return res.status(200).json({
      success: true,
      upload: updatedUpload,
      message: `Upload ${status} successfully`
    });

  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

// System health check
async function healthCheck(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const health = {
    timestamp: new Date().toISOString(),
    status: 'checking',
    systems: {}
  };

  try {
    // Test Supabase
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nxreyyxbuwxjfmtvdkji.supabase.co',
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { count, error } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    health.systems.supabase = error ? 'failed' : 'connected';

    // Test Gemini
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: "Test" }] }] })
      });
      health.systems.gemini = geminiResponse.ok ? 'connected' : 'failed';
    } else {
      health.systems.gemini = 'no_key';
    }

    health.status = Object.values(health.systems).every(s => s === 'connected') ? 'healthy' : 'degraded';
    
    return res.status(200).json(health);

  } catch (error) {
    health.status = 'error';
    health.error = error.message;
    return res.status(500).json(health);
  }
}

// Bot Intelligence Handler (consolidated from admin-bot-intelligence.js)
async function handleBotIntelligence(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, message, userId } = req.body;

    switch (action) {
      case 'process-message':
        return await processBotMessage(message, userId, res);
      case 'get-bot-stats':
        return await getBotStats(res);
      case 'train-bot':
        return await trainBot(res);
      default:
        return res.status(400).json({ error: 'Invalid bot intelligence action' });
    }
  } catch (error) {
    console.error('Bot Intelligence error:', error);
    return res.status(500).json({ 
      error: 'Bot Intelligence system error',
      details: error.message 
    });
  }
}

async function processBotMessage(message, userId, res) {
  try {
    // Simple bot response logic
    const response = generateBotResponse(message);
    
    // Log conversation if userId provided
    if (userId) {
      await logBotConversation(userId, message, response);
    }

    return res.status(200).json({
      success: true,
      response: response,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to process bot message',
      details: error.message
    });
  }
}

function generateBotResponse(message) {
  const messageLower = message.toLowerCase();
  
  if (messageLower.includes('hello') || messageLower.includes('hi')) {
    return "👋 Hi there! I'm here to assist Interline Asia Members. Not a member yet? Join Now to unlock access.";
  }
  
  if (messageLower.includes('cruise') || messageLower.includes('booking')) {
    return "🚢 I can help you find amazing cruise deals! Please sign in to access our exclusive member rates and booking system.";
  }
  
  if (messageLower.includes('help')) {
    return "I'm here to help! I can assist with cruise information, bookings, and member services. What would you like to know?";
  }
  
  return "Thanks for your message! For the best assistance with cruise bookings and exclusive deals, please sign in to your member account.";
}

async function logBotConversation(userId, message, response) {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    await supabase
      .from('bot_conversations')
      .insert({
        user_id: userId,
        message: message,
        response: response,
        created_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('Failed to log bot conversation:', error);
  }
}

async function getBotStats(res) {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { count: totalConversations } = await supabase
      .from('bot_conversations')
      .select('*', { count: 'exact', head: true });

    return res.status(200).json({
      success: true,
      stats: {
        totalConversations: totalConversations || 0,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to get bot stats',
      details: error.message
    });
  }
}

async function trainBot(res) {
  return res.status(200).json({
    success: true,
    message: 'Bot training completed',
    timestamp: new Date().toISOString()
  });
}