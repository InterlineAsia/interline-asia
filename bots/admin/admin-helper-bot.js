// Interline Asia - AdminHelperBot
// Production-grade internal chatbot for admin dashboard control

import BaseBot from '../core/base-bot.js';

export class AdminHelperBot extends BaseBot {
  constructor() {
    super('AdminHelperBot', {
      description: 'Internal AI assistant for admin dashboard control and automation',
      capabilities: [
        'natural_language_queries',
        'database_search',
        'action_execution',
        'email_automation',
        'system_monitoring',
        'workflow_explanation',
        'schema_insights'
      ]
    });
  }

  async processRequest(requestData) {
    const trace = await this.startTrace('admin_helper_processing', {
      query: requestData.query?.substring(0, 100),
      adminUserId: requestData.adminUserId,
      requestType: requestData.type || 'natural_language'
    });

    try {
      console.log(`🧠 AdminHelperBot processing: ${requestData.type || 'query'}`);

      let result;
      switch (requestData.type) {
        case 'natural_language':
          result = await this.processNaturalLanguageQuery(requestData);
          break;
        case 'search_data':
          result = await this.searchDatabase(requestData);
          break;
        case 'execute_action':
          result = await this.executeAdminAction(requestData);
          break;
        case 'send_email':
          result = await this.triggerEmail(requestData);
          break;
        case 'system_health':
          result = await this.getSystemHealth();
          break;
        case 'explain_workflow':
          result = await this.explainWorkflow(requestData);
          break;
        case 'schema_info':
          result = await this.getSchemaInfo(requestData);
          break;
        default:
          result = await this.processNaturalLanguageQuery(requestData);
      }

      await this.endTrace(trace?.id, { result, success: true });
      return result;

    } catch (error) {
      await this.endTrace(trace?.id, { error: error.message }, 'error');
      await this.handleError(error, { requestData });
      throw error;
    }
  }

  async processNaturalLanguageQuery(requestData) {
    const { query, adminUserId } = requestData;
    
    await this.logToLangSmith('natural_language_query', {
      query,
      adminUserId,
      timestamp: new Date().toISOString()
    });

    // Use AI to understand the intent and route appropriately
    try {
      const intentAnalysis = await this.analyzeQueryIntent(query);
      
      await this.logToLangSmith('query_intent_analyzed', {
        query,
        intent: intentAnalysis.intent,
        confidence: intentAnalysis.confidence,
        extractedData: intentAnalysis.extractedData
      });

      // Route based on intent
      switch (intentAnalysis.intent) {
        case 'search_user':
        case 'search_booking':
        case 'find_document':
          return await this.handleSearchQuery(query, intentAnalysis);
        
        case 'execute_action':
          return await this.handleActionQuery(query, intentAnalysis, adminUserId);
        
        case 'send_email':
          return await this.handleEmailQuery(query, intentAnalysis, adminUserId);
        
        case 'system_status':
          return await this.getSystemHealth();
        
        case 'explain_process':
          return await this.explainWorkflow({ topic: intentAnalysis.extractedData.topic });
        
        case 'schema_question':
          return await this.getSchemaInfo({ table: intentAnalysis.extractedData.table });
        
        default:
          return await this.generateHelpfulResponse(query);
      }

    } catch (error) {
      console.warn('AI intent analysis failed, using fallback:', error.message);
      return await this.generateFallbackResponse(query);
    }
  }

  async analyzeQueryIntent(query) {
    if (!this.geminiClient) {
      return this.fallbackIntentAnalysis(query);
    }

    const prompt = `Analyze this admin query and determine the intent and extract relevant data:

Query: "${query}"

Possible intents:
- search_user: Looking for user information, verification status
- search_booking: Looking for booking details, status, passengers
- find_document: Looking for uploaded files, passports, employment proof
- execute_action: Wants to approve, reject, mark verified, delete, etc.
- send_email: Wants to send confirmation, reminder, follow-up emails
- system_status: Asking about bot health, system status
- explain_process: Asking how something works
- schema_question: Asking about database structure, fields
- general_help: General questions or unclear intent

Extract relevant data like:
- Names (first, last, full)
- Email addresses
- Booking references (CRUISE-REQ-YYYYMMDD-###)
- Actions (approve, reject, verify, delete, send)
- Table names
- Document types

Return JSON with: intent, confidence (0-100), extractedData object`;

    try {
      const response = await this.geminiClient.generateContent(prompt, {
        type: 'intent_analysis',
        query: query
      });

      return JSON.parse(response);
    } catch (error) {
      console.warn('AI intent analysis failed:', error.message);
      return this.fallbackIntentAnalysis(query);
    }
  }

  fallbackIntentAnalysis(query) {
    const queryLower = query.toLowerCase();
    
    // Simple keyword-based intent detection
    if (queryLower.includes('passport') || queryLower.includes('document') || queryLower.includes('file')) {
      return {
        intent: 'find_document',
        confidence: 80,
        extractedData: { type: 'document_search' }
      };
    }
    
    if (queryLower.includes('booking') || queryLower.includes('cruise-req')) {
      return {
        intent: 'search_booking',
        confidence: 80,
        extractedData: { type: 'booking_search' }
      };
    }
    
    if (queryLower.includes('approve') || queryLower.includes('verify') || queryLower.includes('reject')) {
      return {
        intent: 'execute_action',
        confidence: 70,
        extractedData: { type: 'admin_action' }
      };
    }
    
    if (queryLower.includes('email') || queryLower.includes('send') || queryLower.includes('resend')) {
      return {
        intent: 'send_email',
        confidence: 70,
        extractedData: { type: 'email_action' }
      };
    }
    
    if (queryLower.includes('health') || queryLower.includes('status') || queryLower.includes('bot')) {
      return {
        intent: 'system_status',
        confidence: 90,
        extractedData: { type: 'system_check' }
      };
    }

    return {
      intent: 'general_help',
      confidence: 50,
      extractedData: { type: 'unknown' }
    };
  }

  async handleSearchQuery(query, intentAnalysis) {
    const searchResults = await this.searchDatabase({
      query: query,
      intent: intentAnalysis.intent,
      extractedData: intentAnalysis.extractedData
    });

    // Format results for chat interface
    if (searchResults.results && searchResults.results.length > 0) {
      return {
        type: 'search_results',
        message: `Found ${searchResults.results.length} result(s):`,
        results: searchResults.results,
        actions: this.generateSearchActions(searchResults.results, intentAnalysis.intent)
      };
    } else {
      return {
        type: 'no_results',
        message: `No results found. ${this.generateSearchSuggestions(query)}`,
        suggestions: this.getSearchSuggestions(intentAnalysis.intent)
      };
    }
  }

  async searchDatabase(requestData) {
    const { query, intent, extractedData } = requestData;
    
    await this.logToLangSmith('database_search', {
      query,
      intent,
      extractedData
    });

    const results = [];

    try {
      // Search based on intent
      switch (intent) {
        case 'search_user':
        case 'find_document':
          const userResults = await this.searchUsers(query);
          results.push(...userResults);
          break;
        
        case 'search_booking':
          const bookingResults = await this.searchBookings(query);
          results.push(...bookingResults);
          break;
        
        default:
          // General search across all tables
          const allResults = await Promise.all([
            this.searchUsers(query),
            this.searchBookings(query)
          ]);
          results.push(...allResults.flat());
      }

      await this.logToLangSmith('search_completed', {
        query,
        resultsCount: results.length,
        resultTypes: results.map(r => r.type)
      });

      return {
        success: true,
        results: results,
        query: query
      };

    } catch (error) {
      await this.logToLangSmith('search_failed', {
        query,
        error: error.message
      });
      
      return {
        success: false,
        error: error.message,
        message: 'Search failed. Please try a different query.'
      };
    }
  }

  async searchUsers(query) {
    try {
      const { data: users, error } = await this.supabaseClient
        .from('users')
        .select('*')
        .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(10);

      if (error) throw error;

      return users.map(user => ({
        type: 'user',
        id: user.id,
        title: user.full_name || user.email,
        subtitle: user.email,
        details: {
          verified: user.is_verified,
          admin: user.is_admin,
          created: user.created_at
        },
        actions: [
          { label: '👤 View Profile', action: 'view_user', data: { userId: user.id } },
          { label: user.is_verified ? '✅ Verified' : '⚠️ Verify User', action: 'verify_user', data: { userId: user.id } }
        ]
      }));
    } catch (error) {
      console.error('User search failed:', error);
      return [];
    }
  }

  async searchBookings(query) {
    try {
      const { data: bookings, error } = await this.supabaseClient
        .from('bookings')
        .select(`
          *,
          passengers (*)
        `)
        .or(`reference_number.ilike.%${query}%,cruise_line.ilike.%${query}%,ship_name.ilike.%${query}%`)
        .limit(10);

      if (error) throw error;

      return bookings.map(booking => ({
        type: 'booking',
        id: booking.id,
        title: `${booking.cruise_line} - ${booking.ship_name}`,
        subtitle: `Ref: ${booking.reference_number} | Status: ${booking.status}`,
        details: {
          departure: booking.departure_date,
          nights: booking.nights,
          passengers: booking.passengers?.length || 0,
          status: booking.status
        },
        actions: [
          { label: '📋 View Booking', action: 'view_booking', data: { bookingId: booking.id } },
          { label: '📄 View Documents', action: 'view_documents', data: { bookingId: booking.id } },
          ...(booking.status === 'pending' ? [
            { label: '✅ Approve', action: 'approve_booking', data: { bookingId: booking.id } },
            { label: '❌ Decline', action: 'decline_booking', data: { bookingId: booking.id } }
          ] : [])
        ]
      }));
    } catch (error) {
      console.error('Booking search failed:', error);
      return [];
    }
  }

  generateSearchActions(results, intent) {
    const actions = [];
    
    if (intent === 'find_document') {
      actions.push({ label: '📁 View All Documents', action: 'view_all_documents' });
    }
    
    if (results.some(r => r.type === 'user')) {
      actions.push({ label: '👥 Manage Users', action: 'open_user_management' });
    }
    
    if (results.some(r => r.type === 'booking')) {
      actions.push({ label: '📊 Booking Dashboard', action: 'open_booking_dashboard' });
    }

    return actions;
  }

  generateSearchSuggestions(query) {
    return "Try searching by:\n• Full name or email\n• Booking reference (CRUISE-REQ-...)\n• Cruise line name\n• Ship name";
  }

  getSearchSuggestions(intent) {
    const suggestions = {
      'find_document': [
        "Search by passenger name",
        "Try booking reference number",
        "Search by email address"
      ],
      'search_user': [
        "Try full name or email",
        "Search by company name",
        "Check verification status"
      ],
      'search_booking': [
        "Use booking reference",
        "Try cruise line name",
        "Search by passenger name"
      ]
    };

    return suggestions[intent] || [
      "Try a different search term",
      "Check spelling",
      "Use partial names or emails"
    ];
  }

  async handleActionQuery(query, intentAnalysis, adminUserId) {
    // Implementation for admin actions
    return {
      type: 'action_confirmation',
      message: 'Action identified. Please confirm:',
      action: intentAnalysis.extractedData,
      confirmButton: 'Execute Action'
    };
  }

  async handleEmailQuery(query, intentAnalysis, adminUserId) {
    // Implementation for email actions
    return {
      type: 'email_confirmation',
      message: 'Email action identified. Ready to send:',
      emailType: intentAnalysis.extractedData,
      confirmButton: 'Send Email'
    };
  }

  async getSystemHealth() {
    try {
      const response = await fetch('/api/bot-health');
      const healthData = await response.json();

      return {
        type: 'system_health',
        message: '🏥 System Health Report',
        health: healthData,
        summary: this.formatHealthSummary(healthData)
      };
    } catch (error) {
      return {
        type: 'error',
        message: '❌ Unable to fetch system health',
        error: error.message
      };
    }
  }

  formatHealthSummary(healthData) {
    const status = healthData.status;
    const bots = healthData.bots || [];
    
    let summary = `Overall Status: ${status === 'healthy' ? '✅' : status === 'degraded' ? '⚠️' : '❌'} ${status.toUpperCase()}\n\n`;
    
    bots.forEach(bot => {
      const icon = bot.initialized ? '✅' : '❌';
      summary += `${icon} ${bot.botName || bot.name}: ${bot.initialized ? 'Running' : 'Offline'}\n`;
    });

    return summary;
  }

  async explainWorkflow(requestData) {
    const { topic } = requestData;
    
    const workflows = {
      'booking_approval': 'Booking approval workflow:\n1. User submits rate request\n2. BookingBot analyzes with AI\n3. Emails sent to member, admin, supplier\n4. Supplier confirms/declines\n5. Customer notified of outcome',
      'user_verification': 'User verification process:\n1. User signs up\n2. LeadBot qualifies with AI\n3. Verification documents uploaded\n4. Admin reviews credentials\n5. User marked as verified',
      'email_automation': 'Email automation system:\n1. Trigger events (booking, confirmation)\n2. AI generates personalized content\n3. Brevo sends transactional emails\n4. Follow-up emails scheduled\n5. All activity logged in LangSmith'
    };

    return {
      type: 'workflow_explanation',
      message: workflows[topic] || 'Workflow information not found. Try: booking_approval, user_verification, email_automation',
      topic: topic
    };
  }

  async getSchemaInfo(requestData) {
    const { table } = requestData;
    
    const schemas = {
      'users': {
        description: 'User accounts and verification status',
        fields: ['id', 'email', 'full_name', 'is_verified', 'is_admin', 'created_at'],
        relationships: 'Links to bookings via user_id'
      },
      'bookings': {
        description: 'Cruise booking requests and confirmations',
        fields: ['id', 'reference_number', 'user_id', 'cruise_line', 'ship_name', 'status', 'departure_date'],
        relationships: 'Links to users and passengers'
      },
      'passengers': {
        description: 'Passenger details for each booking',
        fields: ['id', 'booking_id', 'full_name', 'email', 'date_of_birth', 'nationality'],
        relationships: 'Belongs to bookings'
      }
    };

    return {
      type: 'schema_info',
      message: schemas[table] ? `Schema for ${table}:` : 'Table not found. Available: users, bookings, passengers',
      schema: schemas[table],
      table: table
    };
  }

  async generateHelpfulResponse(query) {
    if (!this.geminiClient) {
      return this.generateFallbackResponse(query);
    }

    try {
      const response = await this.generateIntelligentResponse(
        `As AdminHelperBot for Interline Asia cruise booking platform, provide a helpful response to this admin query: "${query}"`,
        { type: 'admin_help', query }
      );

      return {
        type: 'ai_response',
        message: response,
        suggestions: [
          'Search for users or bookings',
          'Check system health',
          'Explain a workflow'
        ]
      };
    } catch (error) {
      return this.generateFallbackResponse(query);
    }
  }

  generateFallbackResponse(query) {
    return {
      type: 'fallback_response',
      message: `🤖 **Admin Helper Bot - Interline Asia**

**📁 EMPLOYMENT DOCUMENTS LOCATION:**
When people upload employment verification documents, you can find them at:
• **Go to:** /admin-verifications.html
• **View:** All users and their uploaded documents
• **Access:** Click "View Document" to see employment letters, passports, etc.
• **Actions:** Approve/reject users and add admin notes

**🛠️ ADMIN TOOLS:**
• **User Management:** /admin-verifications.html (review documents, verify users)
• **Cruise Deals:** /admin-deals.html (manage inventory)
• **CSV Upload:** /admin-csv-processor.html (bulk upload deals)
• **Database:** /admin/debug.html (direct access)
• **Main Dashboard:** /admin.html

**💾 SYSTEM INFO:**
• **Database:** Supabase with profiles, uploads, deals_dashboard tables
• **Storage:** Documents in "verification-uploads" bucket
• **Email:** Brevo API for notifications
• **Admin:** admin@telenational.com.au (super admin)

**🔍 I CAN HELP WITH:**
• Finding user documents and verification status
• Explaining admin processes and workflows
• System health checks and troubleshooting
• Database queries and user management
• Email automation and notifications

**Try asking:** "How do I approve a user?" or "Where are the cruise deals?" or "Check system health"`,
      suggestions: [
        'How do I find employment documents?',
        'How do I approve a user?',
        'Where are the cruise deals?',
        'Check system health'
      ]
    };
  }
}

export default AdminHelperBot;