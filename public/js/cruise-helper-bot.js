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

    // Load modern design system
    const modernCSS = document.createElement('link');
    modernCSS.rel = 'stylesheet';
    modernCSS.href = '/css/modern-design-system.css';
    document.head.appendChild(modernCSS);

    // Add styles
    const styles = document.createElement('style');
    styles.textContent = `
      .chat-button {
        position: fixed;
        bottom: 24px;
        right: 24px;
        background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
        color: white;
        border: none;
        border-radius: 50px;
        padding: 16px 24px;
        cursor: pointer;
        box-shadow: 0 8px 32px rgba(15, 23, 42, 0.3);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 12px;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-weight: 600;
        font-size: 14px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        border: 1px solid rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(12px);
        max-width: calc(100vw - 48px);
      }
      
      .chat-button:hover {
        transform: translateY(-4px) scale(1.02);
        box-shadow: 0 32px 64px rgba(15, 23, 42, 0.4);
        background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
      }
      
      .chat-badge {
        font-size: 13px;
        white-space: nowrap;
      }
      
      .chat-window {
        position: fixed;
        bottom: 90px;
        right: 24px;
        width: 380px;
        height: 500px;
        background: white;
        border-radius: 16px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
        z-index: 9999;
        display: none;
        flex-direction: column;
        overflow: hidden;
        border: 1px solid rgba(0, 0, 0, 0.08);
        backdrop-filter: blur(20px);
        max-width: calc(100vw - 48px);
      }
      
      .chat-header {
        background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
        color: white;
        padding: 20px 24px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
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
        padding: 16px 20px;
        border-radius: 16px;
        max-width: 300px;
        line-height: 1.6;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
        border: 1px solid rgba(226, 232, 240, 0.6);
      }
      
      .user-message .message-content {
        background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
        color: white;
        box-shadow: 0 4px 16px rgba(15, 23, 42, 0.2);
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
          width: calc(100vw - 32px);
          height: calc(100vh - 120px);
          bottom: 100px;
          right: 16px;
          border-radius: 16px;
        }
        
        .chat-button {
          bottom: 20px;
          right: 16px;
          padding: 16px 20px;
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
      console.log('🚢 CRUISE_BOT: Loading COMPLETE cruise inventory...');
      
      // Check if we need to refresh data (weekly refresh)
      const lastUpdate = localStorage.getItem('cruiseDataLastUpdate');
      const oneWeek = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
      const shouldRefresh = !lastUpdate || (Date.now() - parseInt(lastUpdate)) > oneWeek;
      
      if (shouldRefresh) {
        console.log('🔄 CRUISE_BOT: Weekly refresh needed, loading fresh data...');
        localStorage.removeItem('cruiseDataCache');
      }
      
      // Try to load from cache first
      const cachedData = localStorage.getItem('cruiseDataCache');
      if (cachedData && !shouldRefresh) {
        console.log('⚡ CRUISE_BOT: Loading from cache...');
        this.cruiseData = JSON.parse(cachedData);
        console.log(`✅ CRUISE_BOT: Loaded ${this.cruiseData.length} cached cruise deals`);
        return;
      }
      
      // Load fresh data from CSV files
      this.cruiseData = [];
      
      // Load river cruise data
      const riverResponse = await fetch('/river.csv?t=' + Date.now());
      if (riverResponse.ok) {
        const riverCSV = await riverResponse.text();
        const riverDeals = this.parseCSV(riverCSV, 'River Cruise');
        this.cruiseData = this.cruiseData.concat(riverDeals);
        console.log(`🏞️ CRUISE_BOT: Loaded ${riverDeals.length} river cruises`);
      }

      // Load ocean cruise data
      const oceanResponse = await fetch('/twins.csv?t=' + Date.now());
      if (oceanResponse.ok) {
        const oceanCSV = await oceanResponse.text();
        const oceanDeals = this.parseCSV(oceanCSV, 'Ocean Cruise');
        this.cruiseData = this.cruiseData.concat(oceanDeals);
        console.log(`🌊 CRUISE_BOT: Loaded ${oceanDeals.length} ocean cruises`);
      }

      // Load any additional CSV files
      await this.loadAdditionalCruiseFiles();

      console.log(`✅ CRUISE_BOT: COMPLETE INVENTORY LOADED - ${this.cruiseData.length} total cruise deals`);
      
      // Cache the data and update timestamp
      localStorage.setItem('cruiseDataCache', JSON.stringify(this.cruiseData));
      localStorage.setItem('cruiseDataLastUpdate', Date.now().toString());
      
      // Build search indexes for faster queries
      this.buildSearchIndexes();
      
    } catch (error) {
      console.error('❌ CRUISE_BOT: Error loading cruise data:', error);
    }
  }

  parseCSV(csvText, cruiseType) {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const deals = [];
    
    // Load ALL deals for complete bot knowledge
    console.log(`CRUISE_BOT: Loading ALL ${lines.length - 1} ${cruiseType} deals...`);
    
    for (let i = 1; i < lines.length; i++) {
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
    
    console.log(`CRUISE_BOT: Successfully loaded ${deals.length} ${cruiseType} deals`);
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
        // Check if authentication is required and user is NOT signed in
        if (result.requiresAuth && !await this.isUserAuthenticated()) {
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

  // Async version for proper authentication checking
  async isUserAuthenticated() {
    try {
      // Check if Supabase client is available globally
      if (window.supabaseClient && window.supabaseClient.currentSession) {
        return true;
      }
      
      // Check if user is logged in via global supabase
      if (window.supabase) {
        const { data: { session } } = await window.supabase.auth.getSession();
        return !!session;
      }
      
      // Check localStorage for session (fallback)
      const storedSession = localStorage.getItem('supabase.auth.token');
      if (storedSession) {
        try {
          const sessionData = JSON.parse(storedSession);
          return !!sessionData.access_token;
        } catch (e) {
          return false;
        }
      }
      
      return false;
      
    } catch (error) {
      console.log('CRUISE_BOT: Could not check authentication:', error.message);
      return false;
    }
  }

  async handleInventoryQuery(message) {
    const totalCruises = this.cruiseData.length;
    
    if (totalCruises === 0) {
      return "🔄 I'm currently loading our complete cruise inventory. Please try again in a moment!";
    }
    
    let response = `🚢 **COMPLETE INVENTORY: ${totalCruises.toLocaleString()} exclusive cruise deals available!**\n\n`;
    
    // Add comprehensive breakdown
    const stats = this.generateInventoryStats();
    
    response += "**📊 INVENTORY BREAKDOWN:**\n";
    response += `• **Total Cruises:** ${totalCruises.toLocaleString()}\n`;
    response += `• **Regions Covered:** ${stats.regions.length}\n`;
    response += `• **Cruise Lines:** ${stats.cruiseLines.length}\n`;
    response += `• **Departure Ports:** ${stats.departurePorts.length}\n\n`;
    
    response += "**🌍 TOP REGIONS:**\n";
    Object.entries(stats.regionCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8)
      .forEach(([region, count]) => {
        response += `• ${region}: ${count.toLocaleString()} cruises\n`;
      });
    
    response += "\n**⚓ TOP CRUISE LINES:**\n";
    Object.entries(stats.cruiseLineCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 6)
      .forEach(([line, count]) => {
        response += `• ${line}: ${count.toLocaleString()} cruises\n`;
      });
    
    response += "\n**💰 PRICE RANGES:**\n";
    response += `• Budget (Under $1,000): ${stats.priceRanges.budget.toLocaleString()}\n`;
    response += `• Moderate ($1,000-$2,500): ${stats.priceRanges.moderate.toLocaleString()}\n`;
    response += `• Luxury ($2,500-$5,000): ${stats.priceRanges.luxury.toLocaleString()}\n`;
    response += `• Premium ($5,000+): ${stats.priceRanges.premium.toLocaleString()}\n\n`;
    
    response += "**🔍 ASK ME ANYTHING:**\n";
    response += "• *\"Show me Alaska cruises departing from Seattle\"*\n";
    response += "• *\"Mediterranean cruises under $2000 in September\"*\n";
    response += "• *\"Royal Caribbean ships to Caribbean\"*\n";
    response += "• *\"River cruises in Europe next spring\"*\n\n";
    
    response += `📅 **Data Updated:** ${this.getLastUpdateTime()}\n`;
    response += "🔄 **Auto-refresh:** Weekly (every Monday)";
    
    return response;
  }

  // Generate comprehensive inventory statistics
  generateInventoryStats() {
    const stats = {
      regions: [],
      cruiseLines: [],
      departurePorts: [],
      regionCounts: {},
      cruiseLineCounts: {},
      priceRanges: {
        budget: 0,
        moderate: 0,
        luxury: 0,
        premium: 0
      }
    };

    this.cruiseData.forEach(cruise => {
      // Regions
      const region = cruise.region || 'Other';
      if (!stats.regions.includes(region)) {
        stats.regions.push(region);
      }
      stats.regionCounts[region] = (stats.regionCounts[region] || 0) + 1;

      // Cruise Lines
      const cruiseLine = cruise.cruiseLine || 'Unknown';
      if (!stats.cruiseLines.includes(cruiseLine)) {
        stats.cruiseLines.push(cruiseLine);
      }
      stats.cruiseLineCounts[cruiseLine] = (stats.cruiseLineCounts[cruiseLine] || 0) + 1;

      // Departure Ports
      const depPort = cruise.departurePort || 'Unknown';
      if (!stats.departurePorts.includes(depPort)) {
        stats.departurePorts.push(depPort);
      }

      // Price Ranges
      const lowestPrice = this.getLowestPrice(cruise);
      if (lowestPrice < 1000) {
        stats.priceRanges.budget++;
      } else if (lowestPrice < 2500) {
        stats.priceRanges.moderate++;
      } else if (lowestPrice < 5000) {
        stats.priceRanges.luxury++;
      } else if (lowestPrice < Infinity) {
        stats.priceRanges.premium++;
      }
    });

    return stats;
  }

  // Get last update time for display
  getLastUpdateTime() {
    const lastUpdate = localStorage.getItem('cruiseDataLastUpdate');
    if (lastUpdate) {
      const date = new Date(parseInt(lastUpdate));
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    }
    return 'Just now';
  }

  async processWithFallback(message) {
    const messageLower = message.toLowerCase();
    
    // Check for inventory/count queries
    if (messageLower.includes('how many cruises') || messageLower.includes('how many deals') || 
        messageLower.includes('total cruises') || messageLower.includes('available cruises')) {
      return await this.handleInventoryQuery(message);
    }
    
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

// Smart Route-Based Cruise Intelligence System
class CruiseIntelligenceSystem {
  constructor() {
    this.cruiseData = [];
    this.regionMapping = {
      // Countries to regions mapping
      'japan': 'Asia',
      'china': 'Asia',
      'singapore': 'Asia',
      'thailand': 'Asia',
      'vietnam': 'Asia',
      'south korea': 'Asia',
      'hong kong': 'Asia',
      'taiwan': 'Asia',
      'philippines': 'Asia',
      'indonesia': 'Asia',
      'malaysia': 'Asia',
      'india': 'Asia',
      
      'uae': 'Middle East',
      'dubai': 'Middle East',
      'qatar': 'Middle East',
      'oman': 'Middle East',
      'saudi arabia': 'Middle East',
      'israel': 'Middle East',
      'jordan': 'Middle East',
      
      'egypt': 'Africa',
      'south africa': 'Africa',
      'morocco': 'Africa',
      'tunisia': 'Africa',
      'kenya': 'Africa',
      'madagascar': 'Africa',
      
      'spain': 'Mediterranean',
      'italy': 'Mediterranean',
      'france': 'Mediterranean',
      'greece': 'Mediterranean',
      'turkey': 'Mediterranean',
      'croatia': 'Mediterranean',
      'montenegro': 'Mediterranean',
      'cyprus': 'Mediterranean',
      'malta': 'Mediterranean',
      
      'norway': 'Europe',
      'sweden': 'Europe',
      'denmark': 'Europe',
      'finland': 'Europe',
      'germany': 'Europe',
      'netherlands': 'Europe',
      'belgium': 'Europe',
      'uk': 'Europe',
      'united kingdom': 'Europe',
      'ireland': 'Europe',
      'portugal': 'Europe',
      'russia': 'Europe',
      
      'usa': 'North America',
      'united states': 'North America',
      'canada': 'North America',
      'alaska': 'Alaska',
      
      'mexico': 'Caribbean',
      'bahamas': 'Caribbean',
      'jamaica': 'Caribbean',
      'barbados': 'Caribbean',
      'aruba': 'Caribbean',
      'curacao': 'Caribbean',
      'puerto rico': 'Caribbean',
      'dominican republic': 'Caribbean',
      'cuba': 'Caribbean',
      
      'brazil': 'South America',
      'argentina': 'South America',
      'chile': 'South America',
      'peru': 'South America',
      'uruguay': 'South America',
      
      'australia': 'Australia',
      'new zealand': 'Australia',
      
      'fiji': 'South Pacific',
      'tahiti': 'South Pacific',
      'hawaii': 'Hawaii',
      'french polynesia': 'South Pacific',
      'vanuatu': 'South Pacific',
      'new caledonia': 'South Pacific'
    };
  }

  async init() {
    // Load cruise data if available
    if (window.cruiseData && Array.isArray(window.cruiseData)) {
      this.cruiseData = window.cruiseData;
    }
    console.log('🧠 Intelligence System: Loaded', this.cruiseData.length, 'cruises');
  }

  async processRouteQuery(message) {
    try {
      console.log('🧠 Processing route query:', message);
      
      // Extract route information from the message
      const routeInfo = this.extractRouteInformation(message);
      console.log('🧠 Extracted route info:', routeInfo);
      
      if (!routeInfo.hasRouteQuery) {
        return { success: false, reason: 'No route detected' };
      }

      // Find matching cruises
      const matchingCruises = this.findMatchingCruises(routeInfo);
      console.log('🧠 Found matching cruises:', matchingCruises.length);

      // Generate response
      const response = this.generateRouteResponse(routeInfo, matchingCruises);
      
      return {
        success: true,
        response: response,
        results: matchingCruises,
        routeInfo: routeInfo
      };
      
    } catch (error) {
      console.error('🧠 Error in processRouteQuery:', error);
      return { success: false, error: error.message };
    }
  }

  extractRouteInformation(query) {
    const lowerQuery = query.toLowerCase();
    const routeInfo = {
      from: null,
      to: null,
      viceVersa: false,
      hasRouteQuery: false,
      stops: [],
      originalQuery: query
    };

    // Check for "vice versa" or "reverse" patterns
    if (/vice versa|reverse|either way|both ways|both directions|or the other way/i.test(query)) {
      routeInfo.viceVersa = true;
    }

    // Route patterns to match
    const routePatterns = [
      // "from X to Y" patterns
      /from\s+([^to]+?)\s+to\s+([^,.!?]+)/i,
      // "X to Y" patterns  
      /([a-zA-Z\s]+?)\s+to\s+([a-zA-Z\s]+?)(?:\s|$|[,.!?])/i,
      // "between X and Y" patterns
      /between\s+([^and]+?)\s+and\s+([^,.!?]+)/i,
      // "departing from X" patterns
      /departing\s+(?:from\s+)?([^,.!?]+)/i,
      // "sailing to Y" patterns
      /sailing\s+to\s+([^,.!?]+)/i,
      // "going to Y" patterns
      /going\s+to\s+([^,.!?]+)/i
    ];

    // Try each pattern
    for (let i = 0; i < routePatterns.length; i++) {
      const pattern = routePatterns[i];
      const match = lowerQuery.match(pattern);
      
      if (match) {
        routeInfo.hasRouteQuery = true;
        
        if (i === 0 || i === 1) { // "from X to Y" or "X to Y"
          routeInfo.from = this.cleanLocationName(match[1]);
          routeInfo.to = this.cleanLocationName(match[2]);
        } else if (i === 2) { // "between X and Y"
          routeInfo.from = this.cleanLocationName(match[1]);
          routeInfo.to = this.cleanLocationName(match[2]);
          routeInfo.viceVersa = true;
        } else if (i === 3) { // "departing from X"
          routeInfo.from = this.cleanLocationName(match[1]);
        } else if (i === 4 || i === 5) { // "sailing to Y" or "going to Y"
          routeInfo.to = this.cleanLocationName(match[1]);
        }
        
        console.log('🧠 Matched pattern', i, ':', match);
        break;
      }
    }

    // Extract stops/ports of call
    const stopsPattern = /stopping at|port(?:s)? of call|visit(?:ing)?|calling at/i;
    if (stopsPattern.test(query)) {
      // Extract locations mentioned after stopping phrases
      const afterStops = query.split(stopsPattern)[1];
      if (afterStops) {
        const locations = afterStops.match(/[a-zA-Z\s]+/g);
        if (locations) {
          routeInfo.stops = locations.map(loc => this.cleanLocationName(loc)).filter(loc => loc.length > 2);
        }
      }
    }

    return routeInfo;
  }

  cleanLocationName(name) {
    if (!name) return null;
    return name.trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s]/g, '')
      .toLowerCase();
  }

  findMatchingCruises(routeInfo) {
    if (!this.cruiseData || this.cruiseData.length === 0) {
      console.log('🧠 No cruise data available');
      return [];
    }

    const matches = [];

    for (const cruise of this.cruiseData) {
      if (this.matchesCruiseRoute(cruise, routeInfo)) {
        matches.push(cruise);
      }
    }

    console.log('🧠 Route matching found', matches.length, 'cruises');
    return matches;
  }

  matchesCruiseRoute(cruise, routeInfo) {
    // Get cruise text for matching
    const cruiseDeparture = (cruise.departure_port || '').toLowerCase();
    const cruiseArrival = (cruise.arrival_port || '').toLowerCase();
    const cruiseItinerary = (cruise.itinerary || '').toLowerCase();
    const cruiseRegion = (cruise.region || '').toLowerCase();
    
    // Combine all cruise text
    const allCruiseText = `${cruiseDeparture} ${cruiseArrival} ${cruiseItinerary} ${cruiseRegion}`;

    let fromMatch = true;
    let toMatch = true;

    // Check FROM location
    if (routeInfo.from) {
      fromMatch = this.locationMatches(routeInfo.from, cruiseDeparture, cruiseArrival, cruiseItinerary, cruiseRegion, routeInfo.viceVersa);
    }

    // Check TO location  
    if (routeInfo.to) {
      toMatch = this.locationMatches(routeInfo.to, cruiseArrival, cruiseDeparture, cruiseItinerary, cruiseRegion, routeInfo.viceVersa);
    }

    // Check stops
    let stopsMatch = true;
    if (routeInfo.stops && routeInfo.stops.length > 0) {
      stopsMatch = routeInfo.stops.some(stop => 
        allCruiseText.includes(stop) || this.regionMatches(stop, cruiseRegion)
      );
    }

    const finalMatch = fromMatch && toMatch && stopsMatch;
    
    if (finalMatch) {
      console.log('🧠 Cruise matched:', cruise.cruise_line, cruise.ship_name, cruise.departure_port, '→', cruise.arrival_port);
    }

    return finalMatch;
  }

  locationMatches(searchLocation, primaryPort, secondaryPort, itinerary, region, allowReverse = false) {
    // Direct text matching
    if (primaryPort.includes(searchLocation)) return true;
    if (allowReverse && secondaryPort.includes(searchLocation)) return true;
    if (itinerary.includes(searchLocation)) return true;

    // Region matching
    if (this.regionMatches(searchLocation, region)) return true;

    // Country/city to region mapping
    const mappedRegion = this.regionMapping[searchLocation];
    if (mappedRegion && region.includes(mappedRegion.toLowerCase())) return true;

    return false;
  }

  regionMatches(searchLocation, cruiseRegion) {
    // Direct region match
    if (cruiseRegion.includes(searchLocation)) return true;

    // Check if search location maps to cruise region
    const mappedRegion = this.regionMapping[searchLocation];
    if (mappedRegion && cruiseRegion.includes(mappedRegion.toLowerCase())) return true;

    return false;
  }

  generateRouteResponse(routeInfo, matchingCruises) {
    let response = '';

    // Generate route description
    let routeDescription = '';
    if (routeInfo.from && routeInfo.to) {
      routeDescription = `from **${this.capitalizeLocation(routeInfo.from)}** to **${this.capitalizeLocation(routeInfo.to)}**`;
      if (routeInfo.viceVersa) {
        routeDescription += ` (or vice versa)`;
      }
    } else if (routeInfo.from) {
      routeDescription = `departing from **${this.capitalizeLocation(routeInfo.from)}**`;
    } else if (routeInfo.to) {
      routeDescription = `sailing to **${this.capitalizeLocation(routeInfo.to)}**`;
    }

    // Generate response based on results
    if (matchingCruises.length === 0) {
      response = `I couldn't find any cruises ${routeDescription}. 

**Here are some suggestions:**
• Try broader region names (e.g., "Asia" instead of specific cities)
• Check for seasonal availability - some routes are seasonal
• Consider nearby departure or arrival ports
• Ask about alternative routes in the same regions

Would you like me to suggest similar routes or help you explore other options?`;
    } else {
      response = `🎯 **Found ${matchingCruises.length} cruise${matchingCruises.length !== 1 ? 's' : ''} ${routeDescription}:**

`;

      // Add top 3 cruise results
      const topCruises = matchingCruises.slice(0, 3);
      topCruises.forEach((cruise, index) => {
        response += `**${index + 1}. ${cruise.cruise_line} - ${cruise.ship_name}**
📍 Route: ${cruise.departure_port} → ${cruise.arrival_port}
🗓️ Duration: ${cruise.duration} days
💰 From $${cruise.price_usd?.toLocaleString() || 'N/A'}
🌍 Region: ${cruise.region}

`;
      });

      if (matchingCruises.length > 3) {
        response += `*...and ${matchingCruises.length - 3} more cruise${matchingCruises.length - 3 !== 1 ? 's' : ''} available!*

`;
      }

      response += `Would you like more details about any of these cruises, or shall I help you refine your search?`;
    }

    return response;
  }

  capitalizeLocation(location) {
    return location.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  // Load additional CSV files for complete inventory
  async loadAdditionalCruiseFiles() {
    const additionalFiles = [
      'atlas.csv',
      'deals.csv',
      'cruise-deals.csv',
      'inventory.csv'
    ];

    for (const filename of additionalFiles) {
      try {
        const response = await fetch(`/${filename}?t=` + Date.now());
        if (response.ok) {
          const csvText = await response.text();
          const deals = this.parseCSV(csvText, 'Additional Cruise');
          this.cruiseData = this.cruiseData.concat(deals);
          console.log(`📊 CRUISE_BOT: Loaded ${deals.length} deals from ${filename}`);
        }
      } catch (error) {
        console.log(`📊 CRUISE_BOT: ${filename} not found, skipping...`);
      }
    }
  }

  // Build search indexes for faster queries
  buildSearchIndexes() {
    console.log('🔍 CRUISE_BOT: Building search indexes...');
    
    this.searchIndexes = {
      byRegion: {},
      byCruiseLine: {},
      byDeparturePort: {},
      byArrivalPort: {},
      byMonth: {},
      byPriceRange: {
        budget: [],      // Under $1000
        moderate: [],    // $1000-2500
        luxury: [],      // $2500-5000
        premium: []      // Over $5000
      }
    };

    this.cruiseData.forEach((cruise, index) => {
      // Index by region
      const region = cruise.region?.toLowerCase() || 'other';
      if (!this.searchIndexes.byRegion[region]) {
        this.searchIndexes.byRegion[region] = [];
      }
      this.searchIndexes.byRegion[region].push(index);

      // Index by cruise line
      const cruiseLine = cruise.cruiseLine?.toLowerCase() || 'unknown';
      if (!this.searchIndexes.byCruiseLine[cruiseLine]) {
        this.searchIndexes.byCruiseLine[cruiseLine] = [];
      }
      this.searchIndexes.byCruiseLine[cruiseLine].push(index);

      // Index by departure port
      const depPort = cruise.departurePort?.toLowerCase() || 'unknown';
      if (!this.searchIndexes.byDeparturePort[depPort]) {
        this.searchIndexes.byDeparturePort[depPort] = [];
      }
      this.searchIndexes.byDeparturePort[depPort].push(index);

      // Index by arrival port
      const arrPort = cruise.arrivalPort?.toLowerCase() || 'unknown';
      if (!this.searchIndexes.byArrivalPort[arrPort]) {
        this.searchIndexes.byArrivalPort[arrPort] = [];
      }
      this.searchIndexes.byArrivalPort[arrPort].push(index);

      // Index by month
      if (cruise.departureDate) {
        const month = new Date(cruise.departureDate).getMonth();
        if (!this.searchIndexes.byMonth[month]) {
          this.searchIndexes.byMonth[month] = [];
        }
        this.searchIndexes.byMonth[month].push(index);
      }

      // Index by price range
      const lowestPrice = Math.min(
        cruise.insidePrice || Infinity,
        cruise.oceanviewPrice || Infinity,
        cruise.balconyPrice || Infinity,
        cruise.suitePrice || Infinity
      );

      if (lowestPrice < 1000) {
        this.searchIndexes.byPriceRange.budget.push(index);
      } else if (lowestPrice < 2500) {
        this.searchIndexes.byPriceRange.moderate.push(index);
      } else if (lowestPrice < 5000) {
        this.searchIndexes.byPriceRange.luxury.push(index);
      } else if (lowestPrice < Infinity) {
        this.searchIndexes.byPriceRange.premium.push(index);
      }
    });

    console.log('✅ CRUISE_BOT: Search indexes built successfully');
  }

  // Enhanced cruise query handler with full inventory search
  async handleCruiseQuery(message) {
    const messageLower = message.toLowerCase();
    let relevantDeals = [];

    // Use search indexes for faster queries
    if (this.searchIndexes) {
      relevantDeals = this.searchWithIndexes(messageLower);
    } else {
      // Fallback to linear search
      relevantDeals = this.cruiseData.filter(cruise => 
        this.matchesCruiseQuery(cruise, messageLower)
      );
    }

    if (relevantDeals.length === 0) {
      return "I couldn't find any cruises matching your specific criteria. Let me connect you with our team who can help find exactly what you're looking for!";
    }

    // Sort by relevance and price
    relevantDeals.sort((a, b) => {
      const aPrice = this.getLowestPrice(a);
      const bPrice = this.getLowestPrice(b);
      return aPrice - bPrice;
    });

    let response = `🚢 **Found ${relevantDeals.length} cruises matching your request!**\n\n`;
    
    // Show top 5 results
    const topResults = relevantDeals.slice(0, 5);
    topResults.forEach((cruise, index) => {
      const price = this.getDisplayPrice(cruise);
      response += `**${index + 1}. ${cruise.cruiseLine} - ${cruise.shipName}**\n`;
      response += `📍 ${cruise.region} • ${cruise.nights} nights\n`;
      response += `🚢 ${cruise.departurePort} → ${cruise.arrivalPort}\n`;
      response += `💰 ${price}\n`;
      if (cruise.departureDate) {
        response += `📅 ${cruise.departureDate}\n`;
      }
      response += '\n';
    });

    if (relevantDeals.length > 5) {
      response += `*...and ${relevantDeals.length - 5} more options available!*\n\n`;
    }

    response += "**Want more details?** Ask me about:\n";
    response += "• Specific dates or months\n";
    response += "• Price ranges or cabin types\n";
    response += "• Particular cruise lines\n";
    response += "• Different regions or routes";

    return response;
  }

  // Smart search using indexes
  searchWithIndexes(query) {
    let candidateIndexes = new Set();
    let hasMatches = false;

    // Search by region
    Object.keys(this.searchIndexes.byRegion).forEach(region => {
      if (query.includes(region)) {
        this.searchIndexes.byRegion[region].forEach(idx => candidateIndexes.add(idx));
        hasMatches = true;
      }
    });

    // Search by cruise line
    Object.keys(this.searchIndexes.byCruiseLine).forEach(line => {
      if (query.includes(line.replace(/\s+/g, ' '))) {
        this.searchIndexes.byCruiseLine[line].forEach(idx => candidateIndexes.add(idx));
        hasMatches = true;
      }
    });

    // Search by ports
    Object.keys(this.searchIndexes.byDeparturePort).forEach(port => {
      if (query.includes(port)) {
        this.searchIndexes.byDeparturePort[port].forEach(idx => candidateIndexes.add(idx));
        hasMatches = true;
      }
    });

    Object.keys(this.searchIndexes.byArrivalPort).forEach(port => {
      if (query.includes(port)) {
        this.searchIndexes.byArrivalPort[port].forEach(idx => candidateIndexes.add(idx));
        hasMatches = true;
      }
    });

    // Search by price range
    if (query.includes('budget') || query.includes('cheap') || query.includes('under 1000')) {
      this.searchIndexes.byPriceRange.budget.forEach(idx => candidateIndexes.add(idx));
      hasMatches = true;
    }
    if (query.includes('luxury') || query.includes('premium') || query.includes('expensive')) {
      this.searchIndexes.byPriceRange.luxury.forEach(idx => candidateIndexes.add(idx));
      this.searchIndexes.byPriceRange.premium.forEach(idx => candidateIndexes.add(idx));
      hasMatches = true;
    }

    // If no specific matches, return all cruises for general queries
    if (!hasMatches) {
      return this.cruiseData;
    }

    // Convert indexes back to cruise objects
    return Array.from(candidateIndexes).map(idx => this.cruiseData[idx]);
  }

  // Check if cruise matches query (fallback method)
  matchesCruiseQuery(cruise, query) {
    const searchFields = [
      cruise.cruiseLine?.toLowerCase(),
      cruise.shipName?.toLowerCase(),
      cruise.region?.toLowerCase(),
      cruise.departurePort?.toLowerCase(),
      cruise.arrivalPort?.toLowerCase(),
      cruise.itinerary?.toLowerCase()
    ].filter(Boolean);

    return searchFields.some(field => 
      query.split(' ').some(word => field.includes(word))
    );
  }

  // Get lowest available price for a cruise
  getLowestPrice(cruise) {
    const prices = [
      cruise.insidePrice,
      cruise.oceanviewPrice,
      cruise.balconyPrice,
      cruise.suitePrice
    ].filter(price => price && price > 0);

    return prices.length > 0 ? Math.min(...prices) : Infinity;
  }

  // Enhanced pricing query handler
  async handlePricingQuery(message) {
    const messageLower = message.toLowerCase();
    let priceRange = null;

    // Extract price range from query
    if (messageLower.includes('under') || messageLower.includes('less than')) {
      const match = messageLower.match(/(?:under|less than)\s*\$?(\d+)/);
      if (match) {
        priceRange = { max: parseInt(match[1]) };
      }
    } else if (messageLower.includes('over') || messageLower.includes('more than')) {
      const match = messageLower.match(/(?:over|more than)\s*\$?(\d+)/);
      if (match) {
        priceRange = { min: parseInt(match[1]) };
      }
    } else if (messageLower.includes('between')) {
      const match = messageLower.match(/between\s*\$?(\d+).*?(\d+)/);
      if (match) {
        priceRange = { min: parseInt(match[1]), max: parseInt(match[2]) };
      }
    }

    let relevantCruises = this.cruiseData;

    // Filter by price range if specified
    if (priceRange) {
      relevantCruises = this.cruiseData.filter(cruise => {
        const lowestPrice = this.getLowestPrice(cruise);
        if (lowestPrice === Infinity) return false;

        if (priceRange.min && lowestPrice < priceRange.min) return false;
        if (priceRange.max && lowestPrice > priceRange.max) return false;
        return true;
      });
    }

    if (relevantCruises.length === 0) {
      return "I couldn't find cruises in that price range. Let me show you our best available deals or connect you with our team for personalized pricing!";
    }

    // Sort by price
    relevantCruises.sort((a, b) => this.getLowestPrice(a) - this.getLowestPrice(b));

    let response = `💰 **Found ${relevantCruises.length} cruises`;
    if (priceRange) {
      if (priceRange.min && priceRange.max) {
        response += ` between $${priceRange.min} - $${priceRange.max}`;
      } else if (priceRange.min) {
        response += ` over $${priceRange.min}`;
      } else if (priceRange.max) {
        response += ` under $${priceRange.max}`;
      }
    }
    response += `!**\n\n`;

    // Show price breakdown
    const priceRanges = {
      'Budget (Under $1,000)': relevantCruises.filter(c => this.getLowestPrice(c) < 1000).length,
      'Moderate ($1,000-$2,500)': relevantCruises.filter(c => {
        const price = this.getLowestPrice(c);
        return price >= 1000 && price < 2500;
      }).length,
      'Luxury ($2,500-$5,000)': relevantCruises.filter(c => {
        const price = this.getLowestPrice(c);
        return price >= 2500 && price < 5000;
      }).length,
      'Premium ($5,000+)': relevantCruises.filter(c => this.getLowestPrice(c) >= 5000).length
    };

    response += "**Price Breakdown:**\n";
    Object.entries(priceRanges).forEach(([range, count]) => {
      if (count > 0) {
        response += `• ${range}: ${count} cruises\n`;
      }
    });

    // Show top 3 best deals
    response += "\n🏆 **Best Deals:**\n\n";
    relevantCruises.slice(0, 3).forEach((cruise, index) => {
      const price = this.getDisplayPrice(cruise);
      response += `**${index + 1}. ${cruise.cruiseLine} - ${cruise.shipName}**\n`;
      response += `📍 ${cruise.region} • ${cruise.nights} nights\n`;
      response += `💰 ${price}\n\n`;
    });

    response += "Want to see more options or need help choosing? Just ask!";

    return response;
  }

  // Enhanced date query handler
  async handleDateQuery(message) {
    const messageLower = message.toLowerCase();
    const months = [
      'january', 'february', 'march', 'april', 'may', 'june',
      'july', 'august', 'september', 'october', 'november', 'december'
    ];

    let targetMonth = null;
    let targetYear = null;

    // Find mentioned month
    months.forEach((month, index) => {
      if (messageLower.includes(month)) {
        targetMonth = index;
      }
    });

    // Find mentioned year
    const yearMatch = messageLower.match(/20\d{2}/);
    if (yearMatch) {
      targetYear = parseInt(yearMatch[0]);
    }

    let relevantCruises = this.cruiseData.filter(cruise => {
      if (!cruise.departureDate) return false;
      
      const cruiseDate = new Date(cruise.departureDate);
      if (isNaN(cruiseDate.getTime())) return false;

      if (targetMonth !== null && cruiseDate.getMonth() !== targetMonth) return false;
      if (targetYear !== null && cruiseDate.getFullYear() !== targetYear) return false;

      return true;
    });

    if (relevantCruises.length === 0) {
      return "I couldn't find cruises for that specific time period. Let me show you what's available nearby or connect you with our team for more options!";
    }

    // Sort by date
    relevantCruises.sort((a, b) => new Date(a.departureDate) - new Date(b.departureDate));

    let response = `📅 **Found ${relevantCruises.length} cruises`;
    if (targetMonth !== null) {
      response += ` in ${months[targetMonth]}`;
    }
    if (targetYear !== null) {
      response += ` ${targetYear}`;
    }
    response += `!**\n\n`;

    // Group by month
    const monthlyBreakdown = {};
    relevantCruises.forEach(cruise => {
      const month = new Date(cruise.departureDate).getMonth();
      const monthName = months[month];
      if (!monthlyBreakdown[monthName]) {
        monthlyBreakdown[monthName] = 0;
      }
      monthlyBreakdown[monthName]++;
    });

    response += "**Available by Month:**\n";
    Object.entries(monthlyBreakdown).forEach(([month, count]) => {
      response += `• ${month.charAt(0).toUpperCase() + month.slice(1)}: ${count} cruises\n`;
    });

    // Show upcoming departures
    response += "\n🚢 **Upcoming Departures:**\n\n";
    relevantCruises.slice(0, 4).forEach((cruise, index) => {
      const price = this.getDisplayPrice(cruise);
      response += `**${index + 1}. ${cruise.cruiseLine} - ${cruise.shipName}**\n`;
      response += `📅 ${cruise.departureDate} • ${cruise.nights} nights\n`;
      response += `📍 ${cruise.region}\n`;
      response += `💰 ${price}\n\n`;
    });

    if (relevantCruises.length > 4) {
      response += `*...and ${relevantCruises.length - 4} more departures available!*\n\n`;
    }

    response += "Need help choosing the perfect departure date? Just ask!";

    return response;
  }

  // Enhanced destination query handler
  async handleDestinationQuery(message) {
    const messageLower = message.toLowerCase();
    let relevantCruises = [];

    // Use search indexes for destination queries
    if (this.searchIndexes) {
      relevantCruises = this.searchWithIndexes(messageLower);
    } else {
      relevantCruises = this.cruiseData.filter(cruise => 
        this.matchesDestinationQuery(cruise, messageLower)
      );
    }

    if (relevantCruises.length === 0) {
      return "I couldn't find cruises to that destination. Let me connect you with our team who can help find the perfect cruise for your dream destination!";
    }

    // Group by region
    const regionBreakdown = {};
    relevantCruises.forEach(cruise => {
      const region = cruise.region || 'Other';
      if (!regionBreakdown[region]) {
        regionBreakdown[region] = [];
      }
      regionBreakdown[region].push(cruise);
    });

    let response = `🌍 **Found ${relevantCruises.length} cruises to your destination!**\n\n`;

    response += "**By Region:**\n";
    Object.entries(regionBreakdown)
      .sort(([,a], [,b]) => b.length - a.length)
      .forEach(([region, cruises]) => {
        response += `• ${region}: ${cruises.length} cruises\n`;
      });

    // Show featured destinations
    response += "\n🏖️ **Featured Options:**\n\n";
    const featuredCruises = relevantCruises
      .sort((a, b) => this.getLowestPrice(a) - this.getLowestPrice(b))
      .slice(0, 4);

    featuredCruises.forEach((cruise, index) => {
      const price = this.getDisplayPrice(cruise);
      response += `**${index + 1}. ${cruise.cruiseLine} - ${cruise.shipName}**\n`;
      response += `📍 ${cruise.region} • ${cruise.nights} nights\n`;
      response += `🚢 ${cruise.departurePort} → ${cruise.arrivalPort}\n`;
      response += `💰 ${price}\n\n`;
    });

    if (relevantCruises.length > 4) {
      response += `*...and ${relevantCruises.length - 4} more options to explore!*\n\n`;
    }

    response += "**Want to narrow it down?** Ask about:\n";
    response += "• Specific departure dates\n";
    response += "• Price ranges\n";
    response += "• Cruise line preferences\n";
    response += "• Cabin types";

    return response;
  }

  // Check if cruise matches destination query
  matchesDestinationQuery(cruise, query) {
    const destinationFields = [
      cruise.region?.toLowerCase(),
      cruise.arrivalPort?.toLowerCase(),
      cruise.itinerary?.toLowerCase()
    ].filter(Boolean);

    return destinationFields.some(field => 
      query.split(' ').some(word => field.includes(word))
    );
  }

  // Enhanced general query handler
  async handleGeneralQuery(message) {
    const messageLower = message.toLowerCase();
    
    // Handle common questions
    if (messageLower.includes('hello') || messageLower.includes('hi')) {
      return `Hello! 👋 I'm your CruiseHelper with access to **${this.cruiseData.length} exclusive cruise deals**! I can help you find the perfect cruise by route, destination, price, or dates. What are you looking for?`;
    }

    if (messageLower.includes('help')) {
      return `🚢 **I'm here to help you find the perfect cruise!**\n\n**I can help with:**\n• Route-based searches: "Cruises from Miami to Caribbean"\n• Destination queries: "Mediterranean cruises"\n• Price comparisons: "Cruises under $2000"\n• Date availability: "December 2025 departures"\n• Cruise line info: "Royal Caribbean ships"\n\n**Current Inventory:** ${this.cruiseData.length} exclusive deals\n\nWhat would you like to explore?`;
    }

    if (messageLower.includes('thank')) {
      return "You're welcome! 😊 I'm always here to help you find amazing cruise deals. Is there anything else you'd like to know about our cruises?";
    }

    // Default response with inventory showcase
    const totalCruises = this.cruiseData.length;
    const regions = [...new Set(this.cruiseData.map(c => c.region).filter(Boolean))];
    const cruiseLines = [...new Set(this.cruiseData.map(c => c.cruiseLine).filter(Boolean))];

    let response = `🚢 **Welcome to our cruise intelligence system!**\n\n`;
    response += `📊 **Current Inventory:** ${totalCruises} exclusive deals\n`;
    response += `🌍 **Regions:** ${regions.length} destinations worldwide\n`;
    response += `⚓ **Cruise Lines:** ${cruiseLines.length} premium partners\n\n`;
    
    response += "**Popular Searches:**\n";
    response += "• \"Mediterranean cruises in September\"\n";
    response += "• \"Alaska cruises from Seattle\"\n";
    response += "• \"Caribbean deals under $1500\"\n";
    response += "• \"River cruises in Europe\"\n\n";
    
    response += "What type of cruise experience are you looking for?";

    return response;
  }
}

// Initialize the bot when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.cruiseBot = new CruiseHelperBot();
});