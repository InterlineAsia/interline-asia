// Bot Performance Monitoring API
// Tracks daily bot usage, errors, and system uptime

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return await getBotPerformanceStats(req, res);
  } else if (req.method === 'POST') {
    return await logBotUsage(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getBotPerformanceStats(req, res) {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get today's date for filtering
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Try to get bot usage stats
    let dailyStats = {};
    let weeklyStats = {};
    let errorStats = {};
    
    try {
      // Daily bot usage
      const { data: dailyUsage, error: dailyError } = await supabase
        .from('bot_logs')
        .select('bot_name, event_name, timestamp')
        .gte('timestamp', today + 'T00:00:00.000Z')
        .lt('timestamp', today + 'T23:59:59.999Z');
      
      if (!dailyError && dailyUsage) {
        dailyStats = dailyUsage.reduce((acc, log) => {
          acc[log.bot_name] = (acc[log.bot_name] || 0) + 1;
          return acc;
        }, {});
      }
      
      // Weekly bot usage
      const { data: weeklyUsage, error: weeklyError } = await supabase
        .from('bot_logs')
        .select('bot_name, event_name, timestamp')
        .gte('timestamp', weekAgo + 'T00:00:00.000Z');
      
      if (!weeklyError && weeklyUsage) {
        weeklyStats = weeklyUsage.reduce((acc, log) => {
          acc[log.bot_name] = (acc[log.bot_name] || 0) + 1;
          return acc;
        }, {});
      }
      
      // Error tracking
      const { data: errors, error: errorQueryError } = await supabase
        .from('bot_logs')
        .select('bot_name, event_name, event_data, timestamp')
        .eq('event_name', 'error_occurred')
        .gte('timestamp', weekAgo + 'T00:00:00.000Z');
      
      if (!errorQueryError && errors) {
        errorStats = {
          totalErrors: errors.length,
          errorsByBot: errors.reduce((acc, error) => {
            acc[error.bot_name] = (acc[error.bot_name] || 0) + 1;
            return acc;
          }, {}),
          recentErrors: errors.slice(-5).map(error => ({
            bot: error.bot_name,
            timestamp: error.timestamp,
            message: error.event_data?.error || 'Unknown error'
          }))
        };
      }
      
    } catch (dbError) {
      console.log('Bot logs table not available, using fallback stats');
    }
    
    // System uptime (simplified)
    const systemStats = {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString()
    };
    
    const performanceReport = {
      date: today,
      dailyUsage: dailyStats,
      weeklyUsage: weeklyStats,
      errors: errorStats,
      system: systemStats,
      summary: {
        totalDailyRequests: Object.values(dailyStats).reduce((sum, count) => sum + count, 0),
        totalWeeklyRequests: Object.values(weeklyStats).reduce((sum, count) => sum + count, 0),
        errorRate: Object.values(weeklyStats).reduce((sum, count) => sum + count, 0) > 0 
          ? ((errorStats.totalErrors || 0) / Object.values(weeklyStats).reduce((sum, count) => sum + count, 0) * 100).toFixed(2) + '%'
          : '0%',
        systemHealth: 'operational'
      }
    };
    
    return res.status(200).json({
      success: true,
      performance: performanceReport,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Performance monitoring error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

async function logBotUsage(req, res) {
  try {
    const { botName, eventType, userId, responseTime, success } = req.body;
    
    if (!botName || !eventType) {
      return res.status(400).json({ error: 'botName and eventType required' });
    }
    
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const logEntry = {
      bot_name: botName,
      event_name: eventType,
      event_data: {
        userId,
        responseTime,
        success,
        timestamp: new Date().toISOString()
      },
      timestamp: new Date().toISOString(),
      access_level: 'monitoring'
    };
    
    try {
      const { error } = await supabase
        .from('bot_logs')
        .insert([logEntry]);
      
      if (error && error.code !== '42P01') {
        throw error;
      }
    } catch (dbError) {
      // Fallback to console logging if database unavailable
      console.log('Bot Usage Log:', JSON.stringify(logEntry, null, 2));
    }
    
    return res.status(200).json({
      success: true,
      message: 'Usage logged successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Usage logging error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}