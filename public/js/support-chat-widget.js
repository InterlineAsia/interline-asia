// Support Chat Widget - Frontend Implementation
// Embeddable chat widget for homepage and account pages

class SupportChatWidget {
  constructor(options = {}) {
    this.isOpen = false;
    this.conversationHistory = [];
    this.userEmail = options.userEmail || null;
    this.containerId = options.containerId || 'support-chat-container';
    this.apiEndpoint = '/api/unified-api?endpoint=support-bot';
    
    this.init();
  }

  init() {
    this.createChatWidget();
    this.attachEventListeners();
    this.loadConversationHistory();
  }

  createChatWidget() {
    const container = document.getElementById(this.containerId) || document.body;
    
    const widgetHTML = `
      <div id="support-chat-widget" class="support-chat-widget">
        <!-- Chat Trigger Button -->
        <button id="support-chat-trigger" class="support-chat-trigger" title="Need help? Chat with support">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM20 16H5.17L4 17.17V4H20V16Z" fill="currentColor"/>
            <circle cx="7" cy="10" r="1" fill="currentColor"/>
            <circle cx="12" cy="10" r="1" fill="currentColor"/>
            <circle cx="17" cy="10" r="1" fill="currentColor"/>
          </svg>
          <span class="support-chat-text">Need Help?</span>
        </button>

        <!-- Chat Window -->
        <div id="support-chat-window" class="support-chat-window" style="display: none;">
          <div class="support-chat-header">
            <div class="support-chat-title">
              <h3>💬 Support Chat</h3>
              <p>How can we help you today?</p>
            </div>
            <button id="support-chat-close" class="support-chat-close" title="Close chat">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>

          <div id="support-chat-messages" class="support-chat-messages">
            <div class="support-message support-bot-message">
              <div class="support-message-content">
                <p>Hi! I'm here to help with login issues, verification, document uploads, and other support questions. What can I help you with?</p>
              </div>
            </div>
          </div>

          <div class="support-chat-input-area">
            <div class="support-chat-input-container">
              <textarea 
                id="support-chat-input" 
                class="support-chat-input" 
                placeholder="Type your question here..."
                rows="1"
              ></textarea>
              <button id="support-chat-send" class="support-chat-send" title="Send message">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 2L9 11L4 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    container.insertAdjacentHTML('beforeend', widgetHTML);
    this.loadChatStyles();
  }

  loadChatStyles() {
    if (document.getElementById('support-chat-styles')) return;

    const styles = `
      <style id="support-chat-styles">
        .support-chat-widget {
          position: fixed;
          bottom: 20px;
          left: 20px;
          z-index: 1000;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .support-chat-trigger {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 25px;
          padding: 12px 20px;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
          transition: all 0.3s ease;
          font-size: 14px;
          font-weight: 500;
        }

        .support-chat-trigger:hover {
          background: #0056b3;
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0, 123, 255, 0.4);
        }

        .support-chat-window {
          position: absolute;
          bottom: 70px;
          left: 0;
          width: 350px;
          height: 500px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border: 1px solid #e1e8ed;
        }

        .support-chat-header {
          background: #007bff;
          color: white;
          padding: 16px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .support-chat-title h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
        }

        .support-chat-title p {
          margin: 4px 0 0 0;
          font-size: 12px;
          opacity: 0.9;
        }

        .support-chat-close {
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          opacity: 0.8;
          transition: opacity 0.2s;
        }

        .support-chat-close:hover {
          opacity: 1;
        }

        .support-chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .support-message {
          display: flex;
          flex-direction: column;
        }

        .support-user-message {
          align-items: flex-end;
        }

        .support-bot-message {
          align-items: flex-start;
        }

        .support-message-content {
          max-width: 80%;
          padding: 12px 16px;
          border-radius: 18px;
          font-size: 14px;
          line-height: 1.4;
        }

        .support-user-message .support-message-content {
          background: #007bff;
          color: white;
          border-bottom-right-radius: 4px;
        }

        .support-bot-message .support-message-content {
          background: #f1f3f4;
          color: #333;
          border-bottom-left-radius: 4px;
        }

        .support-message-feedback {
          margin-top: 8px;
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .support-feedback-btn {
          background: none;
          border: 1px solid #ddd;
          border-radius: 16px;
          padding: 4px 12px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .support-feedback-btn:hover {
          background: #f8f9fa;
        }

        .support-feedback-btn.helpful {
          border-color: #28a745;
          color: #28a745;
        }

        .support-feedback-btn.not-helpful {
          border-color: #dc3545;
          color: #dc3545;
        }

        .support-feedback-btn.escalate {
          border-color: #007bff;
          color: #007bff;
        }

        .support-chat-input-area {
          border-top: 1px solid #e1e8ed;
          padding: 16px;
        }

        .support-chat-input-container {
          display: flex;
          gap: 8px;
          align-items: flex-end;
        }

        .support-chat-input {
          flex: 1;
          border: 1px solid #ddd;
          border-radius: 20px;
          padding: 10px 16px;
          font-size: 14px;
          resize: none;
          max-height: 100px;
          min-height: 40px;
          outline: none;
          transition: border-color 0.2s;
        }

        .support-chat-input:focus {
          border-color: #007bff;
        }

        .support-chat-send {
          background: #007bff;
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

        .support-chat-send:hover {
          background: #0056b3;
        }

        .support-chat-send:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .support-typing-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          color: #666;
          font-size: 12px;
          font-style: italic;
        }

        .support-typing-dots {
          display: flex;
          gap: 2px;
        }

        .support-typing-dot {
          width: 4px;
          height: 4px;
          background: #666;
          border-radius: 50%;
          animation: supportTyping 1.4s infinite ease-in-out;
        }

        .support-typing-dot:nth-child(1) { animation-delay: -0.32s; }
        .support-typing-dot:nth-child(2) { animation-delay: -0.16s; }

        @keyframes supportTyping {
          0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
          40% { transform: scale(1); opacity: 1; }
        }

        @media (max-width: 480px) {
          .support-chat-widget {
            bottom: 10px;
            left: 10px;
          }

          .support-chat-window {
            width: calc(100vw - 20px);
            height: 400px;
            bottom: 60px;
            left: 0;
          }

          .support-chat-trigger .support-chat-text {
            display: none;
          }
        }
      </style>
    `;

    document.head.insertAdjacentHTML('beforeend', styles);
  }

  attachEventListeners() {
    const trigger = document.getElementById('support-chat-trigger');
    const closeBtn = document.getElementById('support-chat-close');
    const sendBtn = document.getElementById('support-chat-send');
    const input = document.getElementById('support-chat-input');

    trigger?.addEventListener('click', () => this.toggleChat());
    closeBtn?.addEventListener('click', () => this.closeChat());
    sendBtn?.addEventListener('click', () => this.sendMessage());
    
    input?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    input?.addEventListener('input', () => this.autoResizeInput());
  }

  toggleChat() {
    const window = document.getElementById('support-chat-window');
    if (this.isOpen) {
      this.closeChat();
    } else {
      this.openChat();
    }
  }

  openChat() {
    const window = document.getElementById('support-chat-window');
    const input = document.getElementById('support-chat-input');
    
    window.style.display = 'flex';
    this.isOpen = true;
    
    // Focus input after animation
    setTimeout(() => input?.focus(), 100);
  }

  closeChat() {
    const window = document.getElementById('support-chat-window');
    window.style.display = 'none';
    this.isOpen = false;
  }

  async sendMessage() {
    const input = document.getElementById('support-chat-input');
    const message = input.value.trim();
    
    if (!message) return;

    // Add user message to chat
    this.addMessage(message, 'user');
    input.value = '';
    this.autoResizeInput();

    // Show typing indicator
    this.showTypingIndicator();

    try {
      // Send to support bot API
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'chat',
          message: message,
          userEmail: this.userEmail,
          conversationHistory: this.getConversationHistory()
        })
      });

      const result = await response.json();
      
      // Hide typing indicator
      this.hideTypingIndicator();

      if (result.success) {
        // Add bot response
        this.addMessage(result.response, 'bot', {
          responseId: result.responseId,
          feedbackEnabled: result.feedbackEnabled,
          escalationEnabled: result.escalationEnabled,
          category: result.category,
          responseType: result.responseType
        });
      } else {
        this.addMessage(
          "I'm having trouble right now. Please try again or email admin@interlineasia.com for help.",
          'bot'
        );
      }

    } catch (error) {
      console.error('Support chat error:', error);
      this.hideTypingIndicator();
      this.addMessage(
        "Sorry, I'm having connection issues. Please try again or email admin@interlineasia.com",
        'bot'
      );
    }

    // Store conversation
    this.saveConversationHistory();
  }

  addMessage(content, sender, metadata = {}) {
    const messagesContainer = document.getElementById('support-chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `support-message support-${sender}-message`;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'support-message-content';
    contentDiv.innerHTML = this.formatMessage(content);

    messageDiv.appendChild(contentDiv);

    // Add feedback buttons for bot messages
    if (sender === 'bot' && metadata.feedbackEnabled) {
      const feedbackDiv = this.createFeedbackButtons(metadata);
      messageDiv.appendChild(feedbackDiv);
    }

    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Store in conversation history
    this.conversationHistory.push({
      content,
      sender,
      timestamp: new Date().toISOString(),
      metadata
    });
  }

  createFeedbackButtons(metadata) {
    const feedbackDiv = document.createElement('div');
    feedbackDiv.className = 'support-message-feedback';

    const helpfulBtn = document.createElement('button');
    helpfulBtn.className = 'support-feedback-btn helpful';
    helpfulBtn.innerHTML = '👍 Yes, this helped';
    helpfulBtn.onclick = () => this.sendFeedback(metadata.responseId, 'helpful', metadata);

    const notHelpfulBtn = document.createElement('button');
    notHelpfulBtn.className = 'support-feedback-btn not-helpful';
    notHelpfulBtn.innerHTML = '👎 Not really';
    notHelpfulBtn.onclick = () => this.sendFeedback(metadata.responseId, 'not_helpful', metadata);

    if (metadata.escalationEnabled) {
      const escalateBtn = document.createElement('button');
      escalateBtn.className = 'support-feedback-btn escalate';
      escalateBtn.innerHTML = '📧 Still need help';
      escalateBtn.onclick = () => this.escalateToSupport();
      feedbackDiv.appendChild(escalateBtn);
    }

    feedbackDiv.appendChild(helpfulBtn);
    feedbackDiv.appendChild(notHelpfulBtn);

    return feedbackDiv;
  }

  async sendFeedback(responseId, feedback, metadata) {
    try {
      await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'feedback',
          responseId: responseId,
          feedback: feedback,
          userEmail: this.userEmail,
          message: metadata.originalMessage,
          response: metadata.response
        })
      });

      // Update button to show feedback was recorded
      const feedbackBtns = document.querySelectorAll('.support-feedback-btn');
      feedbackBtns.forEach(btn => {
        if (btn.onclick.toString().includes(responseId)) {
          btn.style.opacity = '0.5';
          btn.disabled = true;
        }
      });

    } catch (error) {
      console.error('Failed to send feedback:', error);
    }
  }

  async escalateToSupport() {
    try {
      const lastUserMessage = this.conversationHistory
        .filter(msg => msg.sender === 'user')
        .pop()?.content || 'General support request';

      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'escalate',
          userEmail: this.userEmail,
          userQuestion: lastUserMessage,
          conversationHistory: this.getConversationHistory()
        })
      });

      const result = await response.json();
      
      if (result.success) {
        this.addMessage(
          "✅ Your request has been sent to our support team. We'll get back to you soon!",
          'bot'
        );
      } else {
        this.addMessage(
          "Sorry, there was an issue sending your request. Please email admin@interlineasia.com directly.",
          'bot'
        );
      }

    } catch (error) {
      console.error('Escalation error:', error);
      this.addMessage(
        "Please email admin@interlineasia.com directly for assistance.",
        'bot'
      );
    }
  }

  showTypingIndicator() {
    const messagesContainer = document.getElementById('support-chat-messages');
    const typingDiv = document.createElement('div');
    typingDiv.id = 'support-typing-indicator';
    typingDiv.className = 'support-typing-indicator';
    typingDiv.innerHTML = `
      Support is typing
      <div class="support-typing-dots">
        <div class="support-typing-dot"></div>
        <div class="support-typing-dot"></div>
        <div class="support-typing-dot"></div>
      </div>
    `;
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  hideTypingIndicator() {
    const typingIndicator = document.getElementById('support-typing-indicator');
    if (typingIndicator) {
      typingIndicator.remove();
    }
  }

  formatMessage(content) {
    // Convert line breaks to HTML
    return content.replace(/\n/g, '<br>');
  }

  autoResizeInput() {
    const input = document.getElementById('support-chat-input');
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 100) + 'px';
  }

  getConversationHistory() {
    return this.conversationHistory
      .map(msg => `${msg.sender}: ${msg.content}`)
      .join('\n');
  }

  saveConversationHistory() {
    try {
      localStorage.setItem('support_chat_history', JSON.stringify(this.conversationHistory));
    } catch (error) {
      console.error('Failed to save conversation history:', error);
    }
  }

  loadConversationHistory() {
    try {
      const saved = localStorage.getItem('support_chat_history');
      if (saved) {
        this.conversationHistory = JSON.parse(saved);
        // Optionally restore messages to UI
      }
    } catch (error) {
      console.error('Failed to load conversation history:', error);
    }
  }
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  // Check if we're on a page that should have the support chat
  const shouldShowChat = document.body.classList.contains('support-chat-enabled') ||
                         window.location.pathname === '/' ||
                         window.location.pathname.includes('/dashboard') ||
                         window.location.pathname.includes('/account');

  if (shouldShowChat) {
    // Try to get user email from page context
    const userEmail = window.userEmail || 
                     document.querySelector('meta[name="user-email"]')?.content ||
                     null;

    // Initialize support chat widget
    window.supportChat = new SupportChatWidget({
      userEmail: userEmail,
      containerId: 'support-chat-container'
    });
  }
});

// Export for manual initialization
window.SupportChatWidget = SupportChatWidget;