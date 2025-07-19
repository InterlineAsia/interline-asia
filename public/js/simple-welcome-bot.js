// Simple Welcome Bot - Homepage Only
// Shows welcome message with Join Now button

class SimpleWelcomeBot {
  constructor() {
    this.isOpen = false;
    this.init();
  }

  init() {
    // Only show on homepage
    if (window.location.pathname !== '/' && window.location.pathname !== '/index.html') {
      return;
    }

    this.createWelcomeWidget();
    this.setupEventListeners();
  }

  createWelcomeWidget() {
    const welcomeWidget = document.createElement('div');
    welcomeWidget.innerHTML = `
      <!-- Welcome Bot Button -->
      <div id="welcome-bot-button" class="welcome-bot-button">
        <div class="bot-avatar">👋</div>
        <span class="bot-text">Hi there!</span>
      </div>

      <!-- Welcome Bot Window -->
      <div id="welcome-bot-window" class="welcome-bot-window">
        <div class="welcome-bot-header">
          <div class="welcome-bot-title">
            <span class="bot-emoji">👋</span>
            <span>Interline Asia Assistant</span>
          </div>
          <button id="welcome-bot-close" class="welcome-bot-close">
            <i class="ri-close-line"></i>
          </button>
        </div>
        
        <div class="welcome-bot-content">
          <div class="welcome-message">
            <p><strong>👋 Hi there! I'm here to assist Interline Asia Members.</strong></p>
            <p>Not a member yet? Join Now to unlock access.</p>
          </div>
          
          <div class="welcome-actions">
            <a href="/signup" class="btn-join-now">
              <i class="ri-ship-line"></i>
              Join Now
            </a>
            <a href="/login" class="btn-member-login">
              <i class="ri-user-line"></i>
              Member Login
            </a>
          </div>
        </div>
      </div>
    `;

    // Add styles
    const styles = document.createElement('style');
    styles.textContent = `
      .welcome-bot-button {
        position: fixed;
        bottom: 24px;
        right: 24px;
        background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
        color: white;
        border: none;
        border-radius: 50px;
        padding: 16px 20px;
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
        animation: gentle-pulse 3s ease-in-out infinite;
        pointer-events: auto;
      }
      
      .welcome-bot-button:hover {
        transform: translateY(-4px) scale(1.02);
        box-shadow: 0 32px 64px rgba(15, 23, 42, 0.4);
        background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
        animation: none;
      }
      
      .bot-avatar {
        font-size: 20px;
        animation: wave 2s ease-in-out infinite;
      }
      
      .bot-text {
        font-size: 14px;
        white-space: nowrap;
      }
      
      .welcome-bot-window {
        position: fixed;
        bottom: 90px;
        right: 24px;
        width: 350px;
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
        animation: slideUp 0.3s ease-out;
      }
      
      .welcome-bot-header {
        background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
        color: white;
        padding: 20px 24px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .welcome-bot-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 600;
        font-size: 16px;
      }
      
      .bot-emoji {
        font-size: 18px;
      }
      
      .welcome-bot-close {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: white;
        cursor: pointer;
        padding: 8px;
        border-radius: 50%;
        transition: all 0.2s ease;
        font-size: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        flex-shrink: 0;
      }
      
      .welcome-bot-close:hover {
        background: rgba(255, 255, 255, 0.3);
        border-color: rgba(255, 255, 255, 0.4);
        transform: scale(1.1);
      }
      
      .welcome-bot-content {
        padding: 24px;
      }
      
      .welcome-message {
        margin-bottom: 24px;
        line-height: 1.6;
        color: #374151;
      }
      
      .welcome-message p {
        margin-bottom: 12px;
      }
      
      .welcome-message p:last-child {
        margin-bottom: 0;
      }
      
      .welcome-actions {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      
      .btn-join-now {
        background: linear-gradient(135deg, #059669 0%, #047857 100%);
        color: white;
        padding: 14px 20px;
        border-radius: 12px;
        text-decoration: none;
        font-weight: 600;
        font-size: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        transition: all 0.3s ease;
        box-shadow: 0 4px 12px rgba(5, 150, 105, 0.2);
      }
      
      .btn-join-now:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(5, 150, 105, 0.3);
        background: linear-gradient(135deg, #047857 0%, #065f46 100%);
      }
      
      .btn-member-login {
        background: rgba(15, 23, 42, 0.05);
        color: #374151;
        padding: 12px 20px;
        border-radius: 12px;
        text-decoration: none;
        font-weight: 500;
        font-size: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        transition: all 0.3s ease;
        border: 1px solid rgba(15, 23, 42, 0.1);
      }
      
      .btn-member-login:hover {
        background: rgba(15, 23, 42, 0.1);
        transform: translateY(-1px);
      }
      
      @keyframes gentle-pulse {
        0%, 100% { 
          box-shadow: 0 8px 32px rgba(15, 23, 42, 0.3);
        }
        50% { 
          box-shadow: 0 8px 32px rgba(15, 23, 42, 0.5), 0 0 0 4px rgba(59, 130, 246, 0.1);
        }
      }
      
      @keyframes wave {
        0%, 100% { transform: rotate(0deg); }
        25% { transform: rotate(20deg); }
        75% { transform: rotate(-10deg); }
      }
      
      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      @media (max-width: 480px) {
        .welcome-bot-window {
          width: calc(100vw - 32px);
          bottom: 100px;
          right: 16px;
          border-radius: 16px;
        }
        
        .welcome-bot-button {
          bottom: 20px;
          right: 16px;
          padding: 16px 18px;
        }
        
        .bot-text {
          display: none;
        }
        
        .welcome-bot-content {
          padding: 20px;
        }
        
        .welcome-actions {
          gap: 10px;
        }
        
        .btn-join-now,
        .btn-member-login {
          padding: 12px 16px;
          font-size: 13px;
        }
      }
    `;

    document.head.appendChild(styles);
    document.body.appendChild(welcomeWidget);
  }

  setupEventListeners() {
    const botButton = document.getElementById('welcome-bot-button');
    const botWindow = document.getElementById('welcome-bot-window');
    const botClose = document.getElementById('welcome-bot-close');

    if (botButton) {
      botButton.addEventListener('click', () => this.toggleWelcome());
    }

    if (botClose) {
      botClose.addEventListener('click', () => this.closeWelcome());
    }

    // Close when clicking outside
    document.addEventListener('click', (e) => {
      if (this.isOpen && 
          !botWindow.contains(e.target) && 
          !botButton.contains(e.target)) {
        this.closeWelcome();
      }
    });

    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.closeWelcome();
      }
    });
  }

  toggleWelcome() {
    const botWindow = document.getElementById('welcome-bot-window');
    this.isOpen = !this.isOpen;
    botWindow.style.display = this.isOpen ? 'flex' : 'none';
  }

  closeWelcome() {
    const botWindow = document.getElementById('welcome-bot-window');
    this.isOpen = false;
    botWindow.style.display = 'none';
  }
}

// Initialize the welcome bot when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new SimpleWelcomeBot();
});

// Export for global use
window.SimpleWelcomeBot = SimpleWelcomeBot;