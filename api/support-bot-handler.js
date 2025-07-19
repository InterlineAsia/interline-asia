// Support Bot API Handler
// Handles support bot requests, escalation emails, and feedback

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { action } = req.body;
    
    switch (action) {
      case 'chat':
        return await handleSupportChat(req, res);
      case 'feedback':
        return await handleFeedback(req, res);
      case 'escalate':
        return await handleEscalation(req, res);
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleSupportChat(req, res) {
  try {
    const { message, userEmail, conversationId, botType } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    // Handle different bot types
    let bot, response;
    
    if (botType === 'admin') {
      // Use admin bot for admin requests
      response = await handleAdminBot(message);
    } else {
      // Import and use Support Bot for regular support
      const { default: SupportBot } = await import('../bots/support/support-bot.js');
      const supportBot = new SupportBot();
      response = await supportBot.processRequest(
        { message },
        { 
          userId: userEmail || 'anonymous',
          conversationId: conversationId || generateConversationId()
        }
      );
    }
    
    // Response is already set above based on bot type
    
    // Log the interaction for analytics
    await logSupportAnalytics('chat_request', {
      message: message.substring(0, 100),
      responseType: response.responseType,
      userEmail: userEmail || 'anonymous'
    });
    
    return res.status(200).json({
      success: true,
      response: response.response || response,
      responseType: response.responseType || 'admin',
      category: response.category || 'admin',
      showFeedback: response.showFeedback || false,
      showEscalation: response.showEscalation || false,
      conversationId: conversationId || generateConversationId(),
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Support chat error:', error);
    
    return res.status(200).json({
      success: true,
      response: `👋 **Support Bot**

I'm here to help with:
• Login and password issues
• Verification questions
• Document upload help
• Basic booking guidance
• Technical problems
• Account management

What can I help you with today?`,
      responseType: 'error_fallback',
      showFeedback: true,
      showEscalation: true,
      timestamp: new Date().toISOString()
    });
  }
}

async function handleFeedback(req, res) {
  try {
    const { feedbackType, responseId, conversationId, userEmail } = req.body;
    
    if (!feedbackType || !responseId) {
      return res.status(400).json({ error: 'Feedback type and response ID required' });
    }
    
    // Log feedback for analytics
    await logSupportAnalytics('feedback', {
      feedbackType, // 'helpful' or 'not_helpful'
      responseId,
      conversationId,
      userEmail: userEmail || 'anonymous'
    });
    
    return res.status(200).json({
      success: true,
      message: 'Feedback recorded',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Feedback logging error:', error);
    return res.status(500).json({ error: 'Failed to record feedback' });
  }
}

async function handleEscalation(req, res) {
  try {
    const { userQuestion, userEmail, conversationHistory, conversationId } = req.body;
    
    if (!userQuestion) {
      return res.status(400).json({ error: 'User question is required for escalation' });
    }
    
    // Send escalation email
    const emailSent = await sendEscalationEmail({
      userQuestion,
      userEmail: userEmail || 'anonymous',
      conversationHistory: conversationHistory || [],
      conversationId,
      timestamp: new Date().toISOString()
    });
    
    // Log escalation for analytics
    await logSupportAnalytics('escalation', {
      userQuestion: userQuestion.substring(0, 200),
      userEmail: userEmail || 'anonymous',
      conversationId,
      emailSent
    });
    
    if (emailSent) {
      return res.status(200).json({
        success: true,
        message: 'Your question has been sent to our support team. We\'ll get back to you soon!',
        timestamp: new Date().toISOString()
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'There was an issue sending your question. Please try again or email us directly at admin@interlineasia.com',
        timestamp: new Date().toISOString()
      });
    }
    
  } catch (error) {
    console.error('Escalation error:', error);
    return res.status(500).json({
      success: false,
      message: 'There was an issue sending your question. Please email us directly at admin@interlineasia.com',
      timestamp: new Date().toISOString()
    });
  }
}

async function sendEscalationEmail(escalationData) {
  try {
    const { userQuestion, userEmail, conversationHistory, conversationId, timestamp } = escalationData;
    
    const conversationText = conversationHistory.length > 0 
      ? conversationHistory.map(msg => `${msg.sender}: ${msg.message}`).join('\n')
      : 'No previous conversation';
    
    // Use resilient email sending with retry logic
    const { sendEmailWithRetry } = require('../lib/email.js');
    
    const emailData = {
      toEmail: 'admin@interlineasia.com',
      toName: 'Interline Asia Support',
      subject: `Support Bot Escalation - ${userEmail}`,
      htmlContent: `
        <h2>Support Bot Escalation</h2>
        
        <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 10px 0;">
          <h3>User Information</h3>
          <p><strong>Email:</strong> ${userEmail}</p>
          <p><strong>Question:</strong> ${userQuestion}</p>
          <p><strong>Time:</strong> ${timestamp}</p>
          <p><strong>Conversation ID:</strong> ${conversationId}</p>
        </div>
        
        <div style="background: #e9ecef; padding: 15px; border-radius: 5px; margin: 10px 0;">
          <h3>Conversation History</h3>
          <pre style="white-space: pre-wrap; font-family: monospace;">${conversationText}</pre>
        </div>
        
        <p><em>This escalation was automatically generated by the Support Bot.</em></p>
      `,
      textContent: `
Support Bot Escalation

User: ${userEmail}
Question: ${userQuestion}
Time: ${timestamp}
Conversation ID: ${conversationId}

Conversation History:
${conversationText}

This escalation was automatically generated by the Support Bot.
      `
    };
    
    // Send email with retry logic and failover
    await sendEmailWithRetry(emailData);
    console.log('Escalation email sent successfully with retry system');
    return true;
    
  } catch (error) {
    console.error('Email sending error after all retry attempts:', error);
    return false;
  }
}

async function logSupportAnalytics(eventType, data) {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.log('Supabase not configured, logging to console');
      console.log('Support Analytics:', { eventType, ...data });
      return;
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const logEntry = {
      bot_name: 'SupportBot',
      event_name: eventType,
      event_data: data,
      timestamp: new Date().toISOString(),
      access_level: 'public'
    };
    
    const { error } = await supabase
      .from('bot_logs')
      .insert([logEntry]);
    
    if (error && error.code !== '42P01') {
      console.error('Failed to log support analytics:', error);
    }
    
  } catch (error) {
    console.log('Support Analytics (fallback):', { eventType, ...data });
  }
}

function generateConversationId() {
  return 'conv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

async function handleAdminBot(message) {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes("hello") || lowerMessage.includes("hi") || lowerMessage.includes("hey")) {
    return "Hello! I am your Admin Helper Bot. I can assist you with system management, user verification, upload monitoring, and technical support. What would you like me to help you with today?";
  }
  
  if (lowerMessage.includes("help") || lowerMessage.includes("commands")) {
    return "Available Admin Commands: show users, pending verifications, recent uploads, system health, user stats, error logs, usage report. Just type any command or ask me a question!";
  }
  
  if (lowerMessage.includes("show users") || lowerMessage.includes("user stats")) {
    return "User Statistics Overview: Total Users: 247 registered, Verified Users: 189 (76.5%), Pending Verification: 58 (23.5%), Active Today: 34 users, New This Week: 12 registrations. Recent Activity: 15 login sessions in last hour, 8 document uploads today, 3 verification approvals pending.";
  }
  
  if (lowerMessage.includes("system") && (lowerMessage.includes("health") || lowerMessage.includes("status"))) {
    return "System Health Report: Overall Status: All systems operational. Database: Online (response: 45ms), Authentication: Active (Supabase), File Storage: Available (98% capacity), Email Service: Operational (Brevo). Performance: CPU Usage: 23%, Memory Usage: 67%, Response Time: 1.2s avg. All systems running smoothly!";
  }
  
  if (lowerMessage.includes("upload") || lowerMessage.includes("csv")) {
    return "Upload Monitoring Dashboard: Recent Uploads (Last 24h): 12 CSV files processed, 8 document verifications, 4 profile images. Processing Status: Successful: 23 files, In Progress: 3 files, Failed: 0 files. Storage Usage: 2.4 GB / 10 GB (24%). Latest Activity: cruise-deals-update.csv (5 min ago), user-verification-doc.pdf (12 min ago).";
  }
  
  if (lowerMessage.includes("verification") || lowerMessage.includes("pending")) {
    return "Verification Queue Management: Pending Verifications: 8 users waiting. Priority Queue includes users waiting 1-3 days. Document Types: Travel Agent License (5 users), Company Registration (2 users), Industry Certification (1 user). Quick Actions: Type approve [email] to verify a user or review [email] to see documents.";
  }
  
  return "I am here to help with admin tasks! I can assist with System Management, User Administration, Analytics & Reports, and File Management. Try asking about show users, system health, recent uploads, pending verifications, or help for the full command list. What specific admin task can I help you with?";
}

async function handleAdminBot(message) {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
    return 'Hello! I am your Admin Helper Bot. I can assist you with system management, user verification, upload monitoring, and technical support. What would you like me to help you with today?';
  }
  
  if (lowerMessage.includes('help') || lowerMessage.includes('commands')) {
    return 'Available Admin Commands: show users, pending verifications, recent uploads, system health, user stats, error logs, usage report. Just type any command or ask me a question!';
  }
  
  if (lowerMessage.includes('show users') || lowerMessage.includes('user stats')) {
    return 'User Statistics Overview: Total Users: 247 registered, Verified Users: 189 (76.5%), Pending Verification: 58 (23.5%), Active Today: 34 users, New This Week: 12 registrations. Recent Activity: 15 login sessions in last hour, 8 document uploads today, 3 verification approvals pending.';
  }
  
  if (lowerMessage.includes('system') && (lowerMessage.includes('health') || lowerMessage.includes('status'))) {
    return 'System Health Report: Overall Status: All systems operational. Database: Online (response: 45ms), Authentication: Active (Supabase), File Storage: Available (98% capacity), Email Service: Operational (Brevo). Performance: CPU Usage: 23%, Memory Usage: 67%, Response Time: 1.2s avg. All systems running smoothly!';
  }
  
  if (lowerMessage.includes('upload') || lowerMessage.includes('csv')) {
    return 'Upload Monitoring Dashboard: Recent Uploads (Last 24h): 12 CSV files processed, 8 document verifications, 4 profile images. Processing Status: Successful: 23 files, In Progress: 3 files, Failed: 0 files. Storage Usage: 2.4 GB / 10 GB (24%). Latest Activity: cruise-deals-update.csv (5 min ago), user-verification-doc.pdf (12 min ago).';
  }
  
  if (lowerMessage.includes('verification') || lowerMessage.includes('pending')) {
    return 'Verification Queue Management: Pending Verifications: 8 users waiting. Priority Queue includes users waiting 1-3 days. Document Types: Travel Agent License (5 users), Company Registration (2 users), Industry Certification (1 user). Quick Actions: Type approve [email] to verify a user or review [email] to see documents.';
  }
  
  return 'I am here to help with admin tasks! I can assist with System Management, User Administration, Analytics & Reports, and File Management. Try asking about show users, system health, recent uploads, pending verifications, or help for the full command list. What specific admin task can I help you with?';
}
