// Authentication Fallback System
// Provides robust authentication handling for all pages

class AuthFallback {
  constructor() {
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1 second
    this.initialized = false;
  }

  // Robust authentication check with retries
  async checkAuthWithRetries(retries = 0) {
    try {
      // Wait for supabaseClient to be available
      if (!window.supabaseClient) {
        if (retries < this.maxRetries) {
          console.log(`AUTH_FALLBACK: Waiting for supabaseClient, retry ${retries + 1}/${this.maxRetries}`);
          await new Promise(resolve => setTimeout(resolve, this.retryDelay));
          return this.checkAuthWithRetries(retries + 1);
        }
        throw new Error('Supabase client not available after retries');
      }

      // Wait for client to be ready
      await window.supabaseClient.readyPromise;

      // Validate session with retries
      const sessionValid = await this.validateSessionWithRetries();
      
      if (!sessionValid) {
        console.log('AUTH_FALLBACK: Session validation failed');
        return false;
      }

      // Double-check login status
      if (!window.supabaseClient.isLoggedIn()) {
        console.log('AUTH_FALLBACK: Not logged in after validation');
        return false;
      }

      // Get current user
      const user = await window.supabaseClient.getCurrentUser();
      if (!user) {
        console.log('AUTH_FALLBACK: No current user found');
        return false;
      }

      console.log('AUTH_FALLBACK: Authentication check passed for:', user.email);
      return true;

    } catch (error) {
      console.error('AUTH_FALLBACK: Authentication check failed:', error);
      
      if (retries < this.maxRetries) {
        console.log(`AUTH_FALLBACK: Retrying authentication check, attempt ${retries + 1}/${this.maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        return this.checkAuthWithRetries(retries + 1);
      }
      
      return false;
    }
  }

  // Session validation with retries
  async validateSessionWithRetries(retries = 0) {
    try {
      if (window.supabaseClient.validateSession) {
        return await window.supabaseClient.validateSession();
      }
      
      // Fallback validation
      return window.supabaseClient.isLoggedIn();
      
    } catch (error) {
      console.error('AUTH_FALLBACK: Session validation error:', error);
      
      if (retries < this.maxRetries) {
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        return this.validateSessionWithRetries(retries + 1);
      }
      
      return false;
    }
  }

  // Enhanced quote request with robust authentication
  async requestQuoteWithFallback(dealId, cruiseLine, shipName, buttonElement) {
    // Store original button text before any operations
    const originalText = buttonElement ? buttonElement.innerHTML : '';
    
    try {
      console.log('AUTH_FALLBACK: Starting quote request with robust authentication');
      
      // Show loading state
      if (buttonElement) {
        buttonElement.disabled = true;
        buttonElement.innerHTML = '<i class="ri-loader-4-line"></i> Checking authentication...';
      }

      // Robust authentication check
      const isAuthenticated = await this.checkAuthWithRetries();
      
      if (!isAuthenticated) {
        alert('Please log in to request a quote.');
        window.location.href = '/login.html';
        return;
      }

      // Update loading state
      if (buttonElement) {
        buttonElement.innerHTML = '<i class="ri-loader-4-line"></i> Requesting quote...';
      }

      // Get user information
      const user = await window.supabaseClient.getCurrentUser();
      const fullName = user.full_name || user.user_metadata?.full_name || '';
      
      if (!fullName || fullName.trim() === '') {
        alert('Please complete your profile with your full name before requesting a quote.');
        window.location.href = '/dashboard.html';
        return;
      }

      // Send quote request with retry logic
      const response = await this.sendQuoteRequestWithRetries({
        dealId: dealId,
        cruiseId: dealId,
        clientName: fullName.trim(),
        userEmail: user.email,
        userId: user.id,
        timestamp: new Date().toISOString()
      });

      if (response.success) {
        console.log('✅ QUOTE: Request successfully sent to reservations team');
        alert('Quote request sent successfully! You will receive an email with pricing details within 24-48 hours.');
        
        if (confirm('Would you like to view your quote requests in your dashboard?')) {
          window.location.href = '/dashboard.html';
        }
      } else {
        throw new Error(response.error || 'Failed to send quote request');
      }

    } catch (error) {
      console.error('AUTH_FALLBACK: Quote request failed:', error);
      alert(error.message || 'Failed to request quote. Please try again.');
    } finally {
      // Restore button state
      if (buttonElement) {
        buttonElement.disabled = false;
        buttonElement.innerHTML = originalText;
      }
    }
  }

  // Send quote request with retries
  async sendQuoteRequestWithRetries(requestData, retries = 0) {
    try {
      const response = await fetch('/api/quotes?action=request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${window.supabaseClient.currentSession?.access_token || 'authenticated'}`
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to request quote');
      }

      const result = await response.json();
      return { success: true, data: result };

    } catch (error) {
      console.error('AUTH_FALLBACK: Quote request API error:', error);
      
      if (retries < this.maxRetries && (error.message.includes('network') || error.message.includes('fetch'))) {
        console.log(`AUTH_FALLBACK: Retrying quote request, attempt ${retries + 1}/${this.maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        return this.sendQuoteRequestWithRetries(requestData, retries + 1);
      }
      
      return { success: false, error: error.message };
    }
  }

  // Initialize fallback system
  init() {
    if (this.initialized) return;
    
    console.log('AUTH_FALLBACK: Initializing robust authentication system');
    
    // Override the global requestQuote function with our robust version
    window.requestQuoteRobust = (dealId, cruiseLine, shipName) => {
      const button = event.target;
      return this.requestQuoteWithFallback(dealId, cruiseLine, shipName, button);
    };
    
    this.initialized = true;
    console.log('AUTH_FALLBACK: Robust authentication system ready');
  }
}

// Initialize the fallback system
const authFallback = new AuthFallback();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => authFallback.init());
} else {
  authFallback.init();
}

// Export for global use
window.AuthFallback = authFallback;