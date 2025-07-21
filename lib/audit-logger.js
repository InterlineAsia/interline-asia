// Audit Logger - Comprehensive logging for quotes and bookings
// Tracks all submissions with timestamp, IP, user agent, and request details

const fs = require('fs').promises;
const path = require('path');

/**
 * Get client information from request
 */
function getClientInfo(req) {
  return {
    ip: req.headers['x-forwarded-for'] || 
        req.headers['x-real-ip'] || 
        req.connection?.remoteAddress || 
        req.socket?.remoteAddress ||
        'unknown',
    userAgent: req.headers['user-agent'] || 'unknown',
    referer: req.headers['referer'] || 'direct',
    timestamp: new Date().toISOString(),
    requestId: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  };
}

/**
 * Log quote submission
 */
async function logQuoteSubmission(req, quoteData, result) {
  const clientInfo = getClientInfo(req);
  
  const logEntry = {
    type: 'QUOTE_SUBMISSION',
    ...clientInfo,
    data: {
      quoteId: result.quoteId || 'unknown',
      cruiseId: quoteData.cruiseId,
      clientName: quoteData.clientName,
      userId: quoteData.userId,
      userEmail: quoteData.userEmail ? '[REDACTED]' : null, // Privacy protection
      dealId: quoteData.dealId,
      success: result.success || false,
      error: result.error || null
    },
    metadata: {
      bodySize: JSON.stringify(req.body).length,
      hasFiles: false,
      processingTime: result.processingTime || 0
    }
  };
  
  await writeAuditLog('quotes', logEntry);
  console.log(`AUDIT: Quote submission logged - ${logEntry.requestId}`);
}

/**
 * Log booking submission
 */
async function logBookingSubmission(req, bookingData, result) {
  const clientInfo = getClientInfo(req);
  
  const logEntry = {
    type: 'BOOKING_SUBMISSION',
    ...clientInfo,
    data: {
      bookingId: result.bookingId || 'unknown',
      quoteId: bookingData.quoteId,
      firstName: bookingData.firstName,
      lastName: bookingData.lastName,
      email: bookingData.email ? '[REDACTED]' : null, // Privacy protection
      phone: bookingData.phone ? '[REDACTED]' : null, // Privacy protection
      cabinType: bookingData.cabinType,
      success: result.success || false,
      error: result.error || null,
      filesUploaded: result.filesUploaded || 0
    },
    metadata: {
      bodySize: JSON.stringify(req.body).length,
      hasFiles: result.hasFiles || false,
      processingTime: result.processingTime || 0
    }
  };
  
  await writeAuditLog('bookings', logEntry);
  console.log(`AUDIT: Booking submission logged - ${logEntry.requestId}`);
}

/**
 * Log API errors
 */
async function logApiError(req, error, context = {}) {
  const clientInfo = getClientInfo(req);
  
  const logEntry = {
    type: 'API_ERROR',
    ...clientInfo,
    error: {
      message: error.message,
      stack: error.stack,
      code: error.code || 'unknown',
      statusCode: context.statusCode || 500
    },
    context: {
      endpoint: req.url,
      method: req.method,
      ...context
    }
  };
  
  await writeAuditLog('errors', logEntry);
  console.error(`AUDIT: API error logged - ${logEntry.requestId}:`, error.message);
}

/**
 * Log suspicious activity
 */
async function logSuspiciousActivity(req, reason, details = {}) {
  const clientInfo = getClientInfo(req);
  
  const logEntry = {
    type: 'SUSPICIOUS_ACTIVITY',
    ...clientInfo,
    reason,
    details,
    severity: details.severity || 'medium'
  };
  
  await writeAuditLog('security', logEntry);
  console.warn(`AUDIT: Suspicious activity - ${reason} - ${logEntry.requestId}`);
}

/**
 * Write audit log to file
 */
async function writeAuditLog(category, logEntry) {
  try {
    // Create logs directory if it doesn't exist
    const logsDir = path.join(process.cwd(), 'logs');
    try {
      await fs.access(logsDir);
    } catch {
      await fs.mkdir(logsDir, { recursive: true });
    }
    
    // Create daily log file
    const date = new Date().toISOString().split('T')[0];
    const logFile = path.join(logsDir, `${category}_${date}.log`);
    
    // Append log entry
    const logLine = JSON.stringify(logEntry) + '\n';
    await fs.appendFile(logFile, logLine);
    
    // Also log to console in development
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[${category.toUpperCase()}]`, logEntry);
    }
    
  } catch (error) {
    console.error('Failed to write audit log:', error);
    // Don't throw - logging failures shouldn't break the application
  }
}

/**
 * Get audit statistics
 */
async function getAuditStats(category, date = null) {
  try {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const logFile = path.join(process.cwd(), 'logs', `${category}_${targetDate}.log`);
    
    const content = await fs.readFile(logFile, 'utf8');
    const lines = content.trim().split('\n').filter(line => line);
    
    const stats = {
      total: lines.length,
      successful: 0,
      failed: 0,
      ips: new Set(),
      errors: []
    };
    
    lines.forEach(line => {
      try {
        const entry = JSON.parse(line);
        if (entry.data?.success) stats.successful++;
        else if (entry.data?.success === false) stats.failed++;
        if (entry.ip) stats.ips.add(entry.ip);
        if (entry.error) stats.errors.push(entry.error.message);
      } catch (e) {
        // Skip malformed lines
      }
    });
    
    return {
      ...stats,
      uniqueIps: stats.ips.size,
      ips: Array.from(stats.ips)
    };
    
  } catch (error) {
    console.error('Failed to get audit stats:', error);
    return null;
  }
}

module.exports = {
  logQuoteSubmission,
  logBookingSubmission,
  logApiError,
  logSuspiciousActivity,
  getAuditStats,
  getClientInfo
};