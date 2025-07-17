// CruiseHelperBot - Website Chatbot Integration
// Trained on CSV cruise deal data with escalation support

class CruiseHelperBot {
  constructor() {
    this.isOpen = false;
    this.cruiseData = [];
    this.isLoading = false;
    this.escalationMode = false;
    this.userId = null;
    this.conversationHistory = [];
    this.intelligenceEnabled = true; // Flag to enable/disable intelligence
    this.init();
  }

  async init() {
    this.createChatWidget();
    await this.loadCruiseData();
    this.setupEventListeners();
  }

  createChatWidget() {
    const chatWidget = document.createElement('div');
    chatWidget.innerHTML = `
      <!-- Chat Button -->
      <div id="chat-button" class="chat-button">
        <i class="ri-customer-service-2-line"></i>
        <span class="chat-badge">Ask about cruises</span>
      </div>

      <!-- Chat Window -->
      <div id="chat-window" class="chat-window">
        <div class="chat-header">
          <div class="chat-title">
            <i class="ri-ship-line"></i>
            <span>CruiseHelper</span>
          </div>
          <button id="chat-close" class="chat-close">
            <i class="ri-close-line"></i>
          </button>
        </div>
        
        <div class="chat-messages" id="chat-messages">
          <div class="bot-message">
            <div class="message-avatar">🚢</div>
            <div class="message-content">
              <p>Hi! I'm your enhanced CruiseHelper with <strong>Smart Route Intelligence</strong>! 🧠</p>
              <p><strong>🎯 Ask me about specific routes:</strong></p>
              <ul>
                <li>"Cruises from Japan to Alaska"</li>
                <li>"Any sailings from Middle East to Europe?"</li>
                <li>"Between Asia and Australia - or vice versa"</li>
                <li>"Departing from Singapore to anywhere"</li>
              </ul>
              <p><strong>🔍 I can also help with:</strong></p>
              <ul>
                <li>💰 Pricing and cabin types</li>
                <li>📅 Departure dates and schedules</li>
                <li>🚢 Cruise lines and ship details</li>
                <li>🌍 Regional cruise options</li>
              </ul>
              <p><em>I only show relevant results - no random cruises!</em> What route interests you?</p>
            </div>
          </div>
        </div>
        
        <div class="chat-input-area">
          <div id="escalation-form" class="escalation-form" style="display: none;">
            <h4>Let us help you personally!</h4>
            <p>Please fill out this short form and we'll get back to you:</p>
            <form id="escalation-form-data">
              <input type="text" id="escalation-name" placeholder="Your Name *" required>
              <input type="email" id="escalation-email" placeholder="Your Email *" required>
              <textarea id="escalation-question" placeholder="Your Question *" required rows="3"></textarea>
              <div class="escalation-buttons">
                <button type="submit" class="escalation-submit">Send Message</button>
                <button type="button" class="escalation-cancel">Back to Chat</button>
              </div>
            </form>
          </div>
          
          <div id="chat-input-container" class="chat-input-container">
            <input type="text" id="chat-input" placeholder="Ask about cruise deals..." maxlength="500">
            <button id="chat-send" class="chat-send">
              <i class="ri-send-plane-line"></i>
            </button>
          </div>
        </div>
      </div>
    `;

    // Add styles
    const styles = document.createElement('style');
    styles.textContent = `
      .chat-button {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        color: white;
        border: none;
        border-radius: 50px;
        padding: 15px 20px;
        cursor: pointer;
        box-shadow: 0 4px 20px rgba(59, 130, 246, 0.3);
        z-index: 1000;
        display: flex;
        align-items: center;
        gap: 10px;
        font-weight: 600;
        transition: all 0.3s ease;
      }
      
      .chat-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 30px rgba(59, 130, 246, 0.4);
      }
      
      .chat-badge {
        font-size: 14px;
        white-space: nowrap;
      }
      
      .chat-window {
        position: fixed;
        bottom: 90px;
        right: 20px;
        width: 380px;
        height: 500px;
        background: white;
        border-radius: 16px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
        z-index: 1001;
        display: none;
        flex-direction: column;
        overflow: hidden;
      }
      
      .chat-header {
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        color: white;
        padding: 15px 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .chat-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 600;
      }
      
      .chat-close {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        padding: 5px;
        border-radius: 4px;
        transition: background 0.2s;
      }
      
      .chat-close:hover {
        background: rgba(255, 255, 255, 0.2);
      }
      
      .chat-messages {
        flex: 1;
        overflow-y: auto;
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 15px;
      }
      
      .bot-message, .user-message {
        display: flex;
        gap: 10px;
        align-items: flex-start;
      }
      
      .user-message {
        flex-direction: row-reverse;
      }
      
      .message-avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        flex-shrink: 0;
      }
      
      .bot-message .message-avatar {
        background: #e5e7eb;
      }
      
      .user-message .message-avatar {
        background: #3b82f6;
        color: white;
      }
      
      .message-content {
        background: #f8fafc;
        padding: 12px 16px;
        border-radius: 12px;
        max-width: 280px;
        line-height: 1.5;
      }
      
      .user-message .message-content {
        background: #3b82f6;
        color: white;
      }
      
      .message-content ul {
        margin: 8px 0;
        padding-left: 20px;
      }
      
      .message-content li {
        margin: 4px 0;
      }
      
      .chat-input-area {
        border-top: 1px solid #e5e7eb;
        padding: 15px 20px;
      }
      
      .chat-input-container {
        display: flex;
        gap: 10px;
        align-items: center;
      }
      
      .chat-input-container input {
        flex: 1;
        padding: 12px 16px;
        border: 1px solid #d1d5db;
        border-radius: 25px;
        outline: none;
        font-size: 14px;
      }
      
      .chat-input-container input:focus {
        border-color: #3b82f6;
      }
      
      .chat-send {
        background: #3b82f6;
        color: white;
        border: none;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s;
      }
      
      .chat-send:hover {
        background: #2563eb;
      }
      
      .escalation-form {
        background: #f8fafc;
        padding: 20px;
        border-radius: 12px;
        margin-bottom: 15px;
      }
      
      .escalation-form h4 {
        color: #1f2937;
        margin-bottom: 8px;
      }
      
      .escalation-form p {
        color: #6b7280;
        margin-bottom: 15px;
        font-size: 14px;
      }
      
      .escalation-form input,
      .escalation-form textarea {
        width: 100%;
        padding: 10px 12px;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        margin-bottom: 10px;
        font-size: 14px;
        font-family: inherit;
      }
      
      .escalation-buttons {
        display: flex;
        gap: 10px;
      }
      
      .escalation-submit {
        background: #059669;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
        flex: 1;
      }
      
      .escalation-cancel {
        background: #6b7280;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 8px;
        cursor: pointer;
        flex: 1;
      }
      
      .loading-message {
        display: flex;
        align-items: center;
        gap: 10px;
        color: #6b7280;
        font-style: italic;
      }
      
      .loading-dots {
        display: inline-block;
        animation: loading-dots 1.5s infinite;
      }
      
      @keyframes loading-dots {
        0%, 20% { opacity: 0; }
        50% { opacity: 1; }
        100% { opacity: 0; }
      }
      
      @media (max-width: 480px) {
        .chat-window {
          width: calc(100vw - 40px);
          height: calc(100vh - 140px);
          bottom: 90px;
          right: 20px;
        }
        
        .chat-button {
          bottom: 20px;
          right: 20px;
        }
        
        .chat-badge {
          display: none;
        }
      }
    `;

    document.head.appendChild(styles);
    document.body.appendChild(chatWidget);
  }

  async loadCruiseData() {
    try {
      console.log('CRUISE_BOT: Loading cruise data...');
      
      // Load river cruise data
      const riverResponse = await fetch('/river.csv');
      if (riverResponse.ok) {
        const riverCSV = await riverResponse.text();
        const riverDeals = this.parseCSV(riverCSV, 'River Cruise');
        this.cruiseData = this.cruiseData.concat(riverDeals);
      }

      // Load ocean cruise data
      const oceanResponse = await fetch('/twins.csv');
      if (oceanResponse.ok) {
        const oceanCSV = await oceanResponse.text();
        const oceanDeals = this.parseCSV(oceanCSV, 'Ocean Cruise');
        this.cruiseData = this.cruiseData.concat(oceanDeals);
      }

      console.log(`CRUISE_BOT: Loaded ${this.cruiseData.length} cruise deals for bot knowledge`);
      
    } catch (error) {
      console.error('CRUISE_BOT: Error loading cruise data:', error);
    }
  }

  parseCSV(csvText, cruiseType) {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const deals = [];
    
    // Load first 100 deals for bot knowledge
    const maxDeals = Math.min(lines.length - 1, 100);
    
    for (let i = 1; i <= maxDeals; i++) {
      try {
        const values = this.parseCSVLine(lines[i]);
        const deal = this.createDeal(headers, values, cruiseType);
        if (deal && deal.cruiseLine && deal.shipName) {
          deals.push(deal);
        }
      } catch (error) {
        console.warn(`CRUISE_BOT: Skipping row ${i}:`, error);
      }
    }
    
    return deals;
  }

  parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim().replace(/"/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim().replace(/"/g, ''));
    return result;
  }

  createDeal(headers, values, cruiseType) {
    const deal = {};
    headers.forEach((header, index) => {
      deal[header] = values[index] || '';
    });

    return {
      cruiseType: cruiseType,
      cruiseLine: deal['Cruise Line'] || '',
      shipName: deal.Ship || '',
      region: deal.Region || '',
      nights: parseInt(deal.Nights || 0),
      departureDate: deal.Date || '',
      departurePort: deal.From || '',
      arrivalPort: deal.To || '',
      itinerary: deal.Itinerary || '',
      insidePrice: this.parsePrice(deal.Inside),
      oceanviewPrice: this.parsePrice(deal.Oceanview),
      balconyPrice: this.parsePrice(deal.Balcony),
      suitePrice: this.parsePrice(deal.Suite)
    };
  }

  parsePrice(priceStr) {
    if (!priceStr || priceStr.toLowerCase().includes('quote')) return 0;
    const cleaned = priceStr.replace(/[$,]/g, '');
    const price = parseFloat(cleaned);
    return isNaN(price) ? 0 : price;
  }

  setupEventListeners() {
    const chatButton = document.getElementById('chat-button');
    const chatWindow = document.getElementById('chat-window');
    const chatClose = document.getElementById('chat-close');
    const chatInput = document.getElementById('chat-input');
    const chatSend = document.getElementById('chat-send');
    const escalationForm = document.getElementById('escalation-form-data');
    const escalationCancel = document.querySelector('.escalation-cancel');

    chatButton.addEventListener('click', () => this.toggleChat());
    chatClose.addEventListener('click', () => this.closeChat());
    chatSend.addEventListener('click', () => this.sendMessage());
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.sendMessage();
    });

    escalationForm.addEventListener('submit', (e) => this.handleEscalation(e));
    escalationCancel.addEventListener('click', () => this.hideEscalationForm());
  }

  toggleChat() {
    const chatWindow = document.getElementById('chat-window');
    this.isOpen = !this.isOpen;
    chatWindow.style.display = this.isOpen ? 'flex' : 'none';
    
    if (this.isOpen) {
      document.getElementById('chat-input').focus();
    }
  }

  closeChat() {
    const chatWindow = document.getElementById('chat-window');
    this.isOpen = false;
    chatWindow.style.display = 'none';
  }

  async sendMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    
    if (!message || this.isLoading) return;
    
    this.addUserMessage(message);
    input.value = '';
    
    this.isLoading = true;
    this.showTypingIndicator();
    
    try {
      const response = await this.processMessage(message);
      this.hideTypingIndicator();
      this.addBotMessage(response);
    } catch (error) {
      console.error('CRUISE_BOT: Error processing message:', error);
      this.hideTypingIndicator();
      this.addBotMessage("I'm having trouble right now. Let me connect you with our team!", true);
    }
    
    this.isLoading = false;
  }

  async processMessage(message) {
    try {
      // First try the intelligent cruise engine
      const intelligentResponse = await this.processWithIntelligence(message);
      if (intelligentResponse) {
        return intelligentResponse;
      }
      
      // Fallback to original logic if intelligence fails
      return await this.processWithFallback(message);
      
    } catch (error) {
      console.error('CRUISE_BOT: Error in processMessage:', error);
      return await this.processWithFallback(message);
    }
  }

  async processWithIntelligence(message) {
    try {
      console.log('🧠 CRUISE_BOT: Processing with Smart Route Intelligence...');
      
      // Initialize the client-side intelligence system if not already done
      if (!this.intelligenceSystem) {
        this.intelligenceSystem = new CruiseIntelligenceSystem();
        await this.intelligenceSystem.init();
        console.log('🧠 CRUISE_BOT: Client-side intelligence system initialized');
      }

      // Check if this is a route-based query
      const isRouteQuery = this.detectRouteQuery(message);
      console.log('🧠 CRUISE_BOT: Is route query:', isRouteQuery);

      if (isRouteQuery) {
        // Process with smart route intelligence
        const routeResult = await this.intelligenceSystem.processRouteQuery(message);
        console.log('🧠 CRUISE_BOT: Route intelligence result:', routeResult);
        
        if (routeResult.success) {
          let response = routeResult.response;
          
          // Add cruise results if available
          if (routeResult.results && routeResult.results.length > 0) {
            response += this.formatCruiseResults(routeResult.results.slice(0, 3));
          }
          
          // Add follow-up questions
          if (routeResult.followUpQuestions && routeResult.followUpQuestions.length > 0) {
            response += '\n\n**You might also ask:**\n';
            routeResult.followUpQuestions.slice(0, 2).forEach(question => {
              response += `• ${question}\n`;
            });
          }
          
          // Store conversation context
          this.updateConversationHistory(message, response, routeResult.intent);
          
          return response;
        }
      }

      // Fallback to API-based intelligence for non-route queries
      return await this.processWithAPIIntelligence(message);
      
    } catch (error) {
      console.error('🧠 CRUISE_BOT: Smart intelligence error:', error);
      console.log('🧠 CRUISE_BOT: Falling back to API intelligence...');
      return await this.processWithAPIIntelligence(message);
    }
  }

  // 🎯 Route Query Detection
  detectRouteQuery(message) {
    const routePatterns = [
      /from\s+.+\s+to\s+/i,
      /\w+\s+to\s+\w+/i,
      /between\s+.+\s+and\s+/i,
      /departing\s+from\s+/i,
      /sailing\s+to\s+/i,
      /vice\s+versa/i,
      /other\s+way\s+around/i,
      /cruises?\s+from\s+/i,
      /sailings?\s+from\s+/i,
      /— or the other way around/i
    ];

    return routePatterns.some(pattern => pattern.test(message));
  }

  // 🌐 API-Based Intelligence (Fallback)
  async processWithAPIIntelligence(message) {
    try {
      // Get authentication token for member-only access
      const authToken = await this.getAuthToken();
      
      const headers = {
        'Content-Type': 'application/json',
      };
      
      // Add authorization header if user is signed in
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      // Call the enhanced cruise intelligence API
      const response = await fetch('/api/cruise-intelligence-handler-enhanced', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          message: message,
          userId: this.getUserId(),
          conversationHistory: this.getConversationHistory()
        })
      });

      console.log('🧠 CRUISE_BOT: API Intelligence response status:', response.status);

      if (!response.ok) {
        throw new Error(`Intelligence API error: ${response.status}`);
      }

      const result = await response.json();
      console.log('🧠 CRUISE_BOT: API Intelligence result:', result);
      
      if (result.success && result.response) {
        // Check if authentication is required
        if (result.requiresAuth) {
          // Add sign-in prompt for non-members
          let authResponse = result.response;
          authResponse += '\n\n**To access full cruise search:**\n';
          authResponse += '• [Sign in to your member account](/login)\n';
          authResponse += '• [Create account if you\'re in travel industry](/signup)\n';
          authResponse += '\nI can still help with general cruise information!';
          
          this.updateConversationHistory(message, authResponse, { type: 'auth_required' });
          return authResponse;
        }
        
        // Format the intelligent response for display
        let formattedResponse = result.response;
        
        // Add cruise results if available
        if (result.results && result.results.length > 0) {
          formattedResponse += this.formatCruiseResults(result.results.slice(0, 3));
        }
        
        // Add follow-up questions if available
        if (result.followUpQuestions && result.followUpQuestions.length > 0) {
          formattedResponse += '\n\n**You might also ask:**\n';
          result.followUpQuestions.slice(0, 2).forEach(question => {
            formattedResponse += `• ${question}\n`;
          });
        }
        
        // Store conversation context
        this.updateConversationHistory(message, formattedResponse, result.intent);
        
        return formattedResponse;
      }
      
      return null; // Fall back to original logic
      
    } catch (error) {
      console.error('🧠 CRUISE_BOT: API Intelligence system error:', error);
      console.log('🧠 CRUISE_BOT: API Intelligence system unavailable, using fallback');
      return null; // Fall back to original logic
    }
  }

  formatCruiseResults(results) {
    if (!results || results.length === 0) return '';
    
    let formatted = '\n\n🚢 **Here are some great options:**\n\n';
    
    results.forEach((cruise, index) => {
      const price = this.getDisplayPrice(cruise);
      formatted += `**${index + 1}. ${cruise.shipName || cruise.cruiseLine}**\n`;
      formatted += `📍 ${cruise.region} • ${cruise.nights} nights\n`;
      formatted += `💰 ${price}\n`;
      if (cruise.departureDate) {
        formatted += `📅 Departure: ${cruise.departureDate}\n`;
      }
      formatted += '\n';
    });
    
    return formatted;
  }

  getDisplayPrice(cruise) {
    // Check for actual prices in order of preference
    const priceFields = ['insidePrice', 'oceanviewPrice', 'balconyPrice', 'suitePrice'];
    
    for (const field of priceFields) {
      const price = cruise[field];
      if (price && price !== 'Quote Available' && price.toString().includes('$')) {
        return `from ${price}`;
      }
    }
    
    return 'Quote Available';
  }

  getUserId() {
    // Generate or retrieve user ID for conversation tracking
    if (!this.userId) {
      this.userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    return this.userId;
  }

  getConversationHistory() {
    return this.conversationHistory || [];
  }

  updateConversationHistory(userMessage, botResponse, intent) {
    if (!this.conversationHistory) {
      this.conversationHistory = [];
    }
    
    this.conversationHistory.push({
      user: userMessage,
      bot: botResponse,
      intent: intent,
      timestamp: Date.now()
    });
    
    // Keep only last 10 exchanges
    if (this.conversationHistory.length > 10) {
      this.conversationHistory = this.conversationHistory.slice(-10);
    }
  }

  // Get authentication token for member-only features
  async getAuthToken() {
    try {
      // Check if Supabase client is available globally
      if (window.supabaseClient && window.supabaseClient.currentSession) {
        return window.supabaseClient.currentSession.access_token;
      }
      
      // Check if user is logged in via global supabase
      if (window.supabase) {
        const { data: { session } } = await window.supabase.auth.getSession();
        if (session && session.access_token) {
          return session.access_token;
        }
      }
      
      // Check localStorage for session (fallback)
      const storedSession = localStorage.getItem('supabase.auth.token');
      if (storedSession) {
        try {
          const sessionData = JSON.parse(storedSession);
          if (sessionData.access_token) {
            return sessionData.access_token;
          }
        } catch (e) {
          // Invalid stored session
        }
      }
      
      return null; // No valid authentication found
      
    } catch (error) {
      console.log('CRUISE_BOT: Could not retrieve auth token:', error.message);
      return null;
    }
  }

  // Check if user is signed in (for UI hints)
  isUserSignedIn() {
    try {
      if (window.supabaseClient && window.supabaseClient.currentUser) {
        return true;
      }
      
      if (window.supabase) {
        // This is async, but we'll use it as a hint
        window.supabase.auth.getSession().then(({ data: { session } }) => {
          this.userSignedIn = !!session;
        });
      }
      
      return this.userSignedIn || false;
    } catch (error) {
      return false;
    }
  }

  async processWithFallback(message) {
    const messageLower = message.toLowerCase();
    
    // Check for cruise-specific queries
    if (messageLower.includes('cruise') || messageLower.includes('ship') || messageLower.includes('deal')) {
      return await this.handleCruiseQuery(message);
    }
    
    if (messageLower.includes('price') || messageLower.includes('cost') || messageLower.includes('$')) {
      return await this.handlePricingQuery(message);
    }
    
    if (messageLower.includes('date') || messageLower.includes('when') || messageLower.includes('departure')) {
      return await this.handleDateQuery(message);
    }
    
    if (messageLower.includes('destination') || messageLower.includes('where') || messageLower.includes('region')) {
      return await this.handleDestinationQuery(message);
    }

    // Check for booking/personal questions (should escalate)
    if (messageLower.includes('book') || messageLower.includes('reserve') || messageLower.includes('my booking')) {
      return "For booking assistance and personal reservations, I'll connect you with our team who can help you directly!";
    }
    
    // General cruise information
    return await this.handleGeneralQuery(message);
  }

  async handleCruiseQuery(message) {
    const messageLower = message.toLowerCase();
    let relevantDeals = this.cruiseData;
    
    // Filter by cruise line if mentioned
    const cruiseLines = [
      'royal caribbean', 'norwegian', 'celebrity', 'princess', 'holland america', 
      'msc', 'carnival', 'regent', 'regent seven seas', 'oceania', 'crystal', 
      'seabourn', 'silversea', 'azamara', 'cunard', 'viking', 'amawaterways', 
      'scenic', 'emerald', 'avalon'
    ];
    const mentionedLine = cruiseLines.find(line => messageLower.includes(line));
    
    if (mentionedLine) {
      relevantDeals = this.cruiseData.filter(deal => 
        deal.cruiseLine.toLowerCase().includes(mentionedLine)
      );
    }
    
    // Filter by date range if mentioned
    const dateRange = this.extractDateRange(message);
    if (dateRange.startDate || dateRange.endDate) {
      relevantDeals = relevantDeals.filter(deal => {
        if (!deal.departureDate) return false;
        
        const dealDate = this.parseDate(deal.departureDate);
        if (!dealDate) return false;
        
        if (dateRange.startDate && dealDate < dateRange.startDate) return false;
        if (dateRange.endDate && dealDate > dateRange.endDate) return false;
        
        return true;
      });
    }
    
    // Filter by cruise type if mentioned
    if (messageLower.includes('river')) {
      relevantDeals = relevantDeals.filter(deal => deal.cruiseType === 'River Cruise');
    } else if (messageLower.includes('ocean')) {
      relevantDeals = relevantDeals.filter(deal => deal.cruiseType === 'Ocean Cruise');
    }
    
    if (relevantDeals.length === 0) {
      return "I don't have specific information about that cruise. Let me connect you with our team for detailed assistance!";
    }
    
    const sampleDeals = relevantDeals.slice(0, 3);
    let response = `🚢 Here are some cruise options I found:\n\n`;
    
    sampleDeals.forEach((deal, index) => {
      const bestPrice = this.getBestPrice(deal);
      response += `**${index + 1}. ${deal.shipName}** (${deal.cruiseLine})\n`;
      response += `📍 ${deal.region} • ${deal.nights} nights\n`;
      response += `💰 From $${bestPrice.toLocaleString()} AUD per person\n`;
      if (deal.departureDate) response += `📅 Departure: ${deal.departureDate}\n`;
      response += `\n`;
    });
    
    response += `Want to see more details or book one of these cruises? Visit our deals page or let me know if you need specific information!`;
    
    return response;
  }

  async handlePricingQuery(message) {
    const avgPrices = this.calculateAveragePrices();
    
    return `💰 **Cruise Pricing Information**

**Typical Price Ranges (AUD per person):**
• Interior Cabins: $${avgPrices.inside.toLocaleString()} - $${(avgPrices.inside * 1.5).toLocaleString()}
• Oceanview Cabins: $${avgPrices.oceanview.toLocaleString()} - $${(avgPrices.oceanview * 1.5).toLocaleString()}
• Balcony Cabins: $${avgPrices.balcony.toLocaleString()} - $${(avgPrices.balcony * 1.5).toLocaleString()}
• Suite Cabins: $${avgPrices.suite.toLocaleString()} - $${(avgPrices.suite * 1.5).toLocaleString()}

**Pricing Includes:**
✅ All meals and entertainment
✅ Port fees and taxes
✅ Onboard activities and shows
✅ Access to pools and fitness facilities

**Additional Costs:**
• Specialty dining
• Alcoholic beverages
• Shore excursions
• Spa services
• Gratuities

Want to see specific deals with exact pricing? Check our deals page or ask about a particular cruise line!`;
  }

  async handleDateQuery(message) {
    const upcomingDeals = this.cruiseData
      .filter(deal => deal.departureDate)
      .slice(0, 5);
    
    let response = `📅 **Upcoming Cruise Departures:**\n\n`;
    
    upcomingDeals.forEach((deal, index) => {
      response += `${index + 1}. **${deal.shipName}** - ${deal.departureDate}\n`;
      response += `   ${deal.cruiseLine} • ${deal.region} • ${deal.nights} nights\n\n`;
    });
    
    response += `Looking for specific dates? Visit our deals page where you can filter by departure date range!`;
    
    return response;
  }

  async handleDestinationQuery(message) {
    const regions = [...new Set(this.cruiseData.map(deal => deal.region))].filter(Boolean);
    
    let response = `🌍 **Popular Cruise Destinations:**\n\n`;
    
    regions.slice(0, 8).forEach(region => {
      const regionDeals = this.cruiseData.filter(deal => deal.region === region);
      response += `• **${region}** (${regionDeals.length} cruises available)\n`;
    });
    
    response += `\n**Departure Ports Include:**\n`;
    const ports = [...new Set(this.cruiseData.map(deal => deal.departurePort))].filter(Boolean);
    ports.slice(0, 6).forEach(port => {
      response += `• ${port}\n`;
    });
    
    response += `\nWant to explore a specific destination? Ask me about it or browse our deals page!`;
    
    return response;
  }

  async handleGeneralQuery(message) {
    return `🚢 **I'm here to help with cruise information!**

I can assist you with:
• 🔍 Finding specific cruise deals
• 📅 Departure dates and schedules  
• 💰 Pricing for different cabin types
• 🌍 Destinations and itineraries
• 🚢 Ship and cruise line information

**Popular Questions:**
• "Show me Royal Caribbean cruises"
• "What cruises depart in July?"
• "How much do balcony cabins cost?"
• "What destinations are available?"

What would you like to know about our cruise deals?`;
  }

  calculateAveragePrices() {
    const prices = {
      inside: [],
      oceanview: [],
      balcony: [],
      suite: []
    };
    
    this.cruiseData.forEach(deal => {
      if (deal.insidePrice > 0) prices.inside.push(deal.insidePrice);
      if (deal.oceanviewPrice > 0) prices.oceanview.push(deal.oceanviewPrice);
      if (deal.balconyPrice > 0) prices.balcony.push(deal.balconyPrice);
      if (deal.suitePrice > 0) prices.suite.push(deal.suitePrice);
    });
    
    return {
      inside: prices.inside.length ? Math.round(prices.inside.reduce((a, b) => a + b) / prices.inside.length) : 1500,
      oceanview: prices.oceanview.length ? Math.round(prices.oceanview.reduce((a, b) => a + b) / prices.oceanview.length) : 2000,
      balcony: prices.balcony.length ? Math.round(prices.balcony.reduce((a, b) => a + b) / prices.balcony.length) : 2500,
      suite: prices.suite.length ? Math.round(prices.suite.reduce((a, b) => a + b) / prices.suite.length) : 4000
    };
  }

  addUserMessage(message) {
    const messagesContainer = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'user-message';
    messageDiv.innerHTML = `
      <div class="message-avatar">👤</div>
      <div class="message-content">${this.escapeHtml(message)}</div>
    `;
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  addBotMessage(message, shouldEscalate = false) {
    const messagesContainer = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'bot-message';
    
    let content = this.formatBotMessage(message);
    
    if (shouldEscalate) {
      content += `<br><br><button onclick="cruiseBot.showEscalationForm()" style="background: #059669; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 14px;">Get Personal Help</button>`;
    }
    
    messageDiv.innerHTML = `
      <div class="message-avatar">🚢</div>
      <div class="message-content">${content}</div>
    `;
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  showTypingIndicator() {
    const messagesContainer = document.getElementById('chat-messages');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'bot-message loading-message';
    typingDiv.id = 'typing-indicator';
    typingDiv.innerHTML = `
      <div class="message-avatar">🚢</div>
      <div class="message-content">
        <span class="loading-dots">Thinking...</span>
      </div>
    `;
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  hideTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
      typingIndicator.remove();
    }
  }

  showEscalationForm() {
    document.getElementById('escalation-form').style.display = 'block';
    document.getElementById('chat-input-container').style.display = 'none';
    this.escalationMode = true;
  }

  hideEscalationForm() {
    document.getElementById('escalation-form').style.display = 'none';
    document.getElementById('chat-input-container').style.display = 'flex';
    this.escalationMode = false;
  }

  async handleEscalation(e) {
    e.preventDefault();
    
    const name = document.getElementById('escalation-name').value;
    const email = document.getElementById('escalation-email').value;
    const question = document.getElementById('escalation-question').value;
    
    if (!name || !email || !question) {
      alert('Please fill in all fields');
      return;
    }
    
    try {
      // Send escalation email
      const response = await fetch('/api/bot-escalation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          question,
          timestamp: new Date().toISOString(),
          page: window.location.pathname
        })
      });
      
      if (response.ok) {
        this.addBotMessage("✅ Thank you! Your message has been sent to our team. We'll get back to you within 24 hours via email.");
        this.hideEscalationForm();
        
        // Clear form
        document.getElementById('escalation-form-data').reset();
      } else {
        throw new Error('Failed to send message');
      }
      
    } catch (error) {
      console.error('Escalation error:', error);
      this.addBotMessage("❌ Sorry, there was an issue sending your message. Please try again or contact us directly at admin@interlineasia.com");
    }
  }

  formatBotMessage(message) {
    return message
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>')
      .replace(/•/g, '•');
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  extractDateRange(message) {
    const messageLower = message.toLowerCase();
    let startDate = null;
    let endDate = null;
    
    // Look for date patterns like "1st of December 2025", "December 1, 2025", "Dec 2025"
    const monthNames = {
      'january': 0, 'jan': 0, 'february': 1, 'feb': 1, 'march': 2, 'mar': 2,
      'april': 3, 'apr': 3, 'may': 4, 'june': 5, 'jun': 5,
      'july': 6, 'jul': 6, 'august': 7, 'aug': 7, 'september': 8, 'sep': 8,
      'october': 9, 'oct': 9, 'november': 10, 'nov': 10, 'december': 11, 'dec': 11
    };
    
    // Pattern for "1st of December 2025" or "December 1, 2025"
    const datePattern = /(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?(\w+)\s+(\d{4})|(\w+)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})/gi;
    const matches = [...messageLower.matchAll(datePattern)];
    
    if (matches.length >= 1) {
      const match = matches[0];
      if (match[1] && match[2] && match[3]) {
        // Format: "1st of December 2025"
        const day = parseInt(match[1]);
        const monthName = match[2].toLowerCase();
        const year = parseInt(match[3]);
        const month = monthNames[monthName];
        if (month !== undefined) {
          startDate = new Date(year, month, day);
        }
      } else if (match[4] && match[5] && match[6]) {
        // Format: "December 1, 2025"
        const monthName = match[4].toLowerCase();
        const day = parseInt(match[5]);
        const year = parseInt(match[6]);
        const month = monthNames[monthName];
        if (month !== undefined) {
          startDate = new Date(year, month, day);
        }
      }
    }
    
    if (matches.length >= 2) {
      const match = matches[1];
      if (match[1] && match[2] && match[3]) {
        // Format: "31st of January 2026"
        const day = parseInt(match[1]);
        const monthName = match[2].toLowerCase();
        const year = parseInt(match[3]);
        const month = monthNames[monthName];
        if (month !== undefined) {
          endDate = new Date(year, month, day);
        }
      } else if (match[4] && match[5] && match[6]) {
        // Format: "January 31, 2026"
        const monthName = match[4].toLowerCase();
        const day = parseInt(match[5]);
        const year = parseInt(match[6]);
        const month = monthNames[monthName];
        if (month !== undefined) {
          endDate = new Date(year, month, day);
        }
      }
    }
    
    return { startDate, endDate };
  }

  parseDate(dateStr) {
    if (!dateStr) return null;
    
    // Handle various date formats
    if (dateStr.includes('-') && dateStr.length <= 9) {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const day = parseInt(parts[0]);
        const month = parts[1];
        const year = parts[2].length === 2 ? parseInt('20' + parts[2]) : parseInt(parts[2]);
        const monthMap = {
          'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
          'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
        };
        const monthNum = monthMap[month];
        if (!isNaN(day) && monthNum !== undefined && !isNaN(year)) {
          return new Date(year, monthNum, day);
        }
      }
    }
    
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  }

  formatDate(dateStr) {
    const date = this.parseDate(dateStr);
    if (!date) return dateStr;
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getBestPrice(deal) {
    const prices = [deal.insidePrice, deal.oceanviewPrice, deal.balconyPrice, deal.suitePrice].filter(p => p > 0);
    return prices.length > 0 ? Math.min(...prices) : 0;
  }
}

// Initialize the bot when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.cruiseBot = new CruiseHelperBot();
});