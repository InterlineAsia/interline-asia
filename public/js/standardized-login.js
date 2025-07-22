// STANDARDIZED LOGIN SYSTEM
// This is the official login implementation that should be used across the site

console.log('STANDARDIZED_LOGIN: Initializing...');

class LoginSystem {
  constructor() {
    this.supabase = null;
    this.form = null;
    this.emailInput = null;
    this.passwordInput = null;
    this.loginButton = null;
    this.errorDiv = null;
    this.successDiv = null;
    this.isLoading = false;
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initialize());
    } else {
      this.initialize();
    }
  }
  
  async initialize() {
    console.log('STANDARDIZED_LOGIN: DOM ready, initializing login system');
    
    // Get form elements
    this.form = document.getElementById('login-form');
    this.emailInput = document.getElementById('email');
    this.passwordInput = document.getElementById('password');
    this.loginButton = document.getElementById('login-button');
    this.errorDiv = document.getElementById('error-message');
    this.successDiv = document.getElementById('success-message');
    
    // Check if elements exist
    if (!this.form || !this.emailInput || !this.passwordInput) {
      console.error('STANDARDIZED_LOGIN: Required form elements not found');
      return;
    }
    
    // Initialize Supabase client
    this.initializeSupabase();
    
    // Add event listeners
    this.form.addEventListener('submit', (e) => this.handleLogin(e));
    
    console.log('STANDARDIZED_LOGIN: Login system ready');
  }
  
  initializeSupabase() {
    // Get Supabase credentials from window or use defaults
    const supabaseUrl = window.SUPABASE_URL || 'https://nxreyyxbuwxjfmtvdkji.supabase.co';
    const supabaseKey = window.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54cmV5eXhidXd4amZtdHZka2ppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NTg4NDQsImV4cCI6MjA2NzAzNDg0NH0.SuaK9TqBLbysPCe0zyrMA8owMK4R-q7iNZbtLQzEKcE';
    
    // Create Supabase client
    this.supabase = window.supabase.createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        storage: window.localStorage
      }
    });
    
    console.log('STANDARDIZED_LOGIN: Supabase client initialized');
  }
  
  showError(message) {
    if (this.errorDiv) {
      this.errorDiv.textContent = message;
      this.errorDiv.style.display = 'block';
      if (this.successDiv) this.successDiv.style.display = 'none';
    }
  }
  
  showSuccess(message) {
    if (this.successDiv) {
      this.successDiv.textContent = message;
      this.successDiv.style.display = 'block';
      if (this.errorDiv) this.errorDiv.style.display = 'none';
    }
  }
  
  setLoading(isLoading) {
    this.isLoading = isLoading;
    
    if (this.loginButton) {
      this.loginButton.disabled = isLoading;
      this.loginButton.textContent = isLoading ? 'Signing In...' : 'Sign In';
    }
    
    // If there's a loading overlay, toggle it
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
      loadingOverlay.style.display = isLoading ? 'flex' : 'none';
    }
  }
  
  async handleLogin(e) {
    e.preventDefault();
    
    if (this.isLoading) return;
    
    const email = this.emailInput.value.trim();
    const password = this.passwordInput.value.trim();
    
    if (!email || !password) {
      this.showError('Please enter both email and password.');
      return;
    }
    
    this.setLoading(true);
    console.log('STANDARDIZED_LOGIN: Attempting login for:', email);
    
    try {
      // Clear any existing sessions first
      await this.supabase.auth.signOut({ scope: 'local' });
      
      // Attempt login
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        throw error;
      }
      
      if (!data.user || !data.session) {
        throw new Error('Login failed - no user session created');
      }
      
      console.log('STANDARDIZED_LOGIN: Login successful!', data.user.email);
      this.showSuccess('Login successful! Redirecting...');
      
      // Get redirect URL from query params or use default
      const urlParams = new URLSearchParams(window.location.search);
      const redirectUrl = urlParams.get('redirect') || '/dashboard-choice.html';
      
      console.log('STANDARDIZED_LOGIN: Redirecting to:', redirectUrl);
      
      // Use a direct window.location assignment with cache busting
      setTimeout(() => {
        window.location.href = redirectUrl + (redirectUrl.includes('?') ? '&' : '?') + 't=' + Date.now();
      }, 500);
      
    } catch (error) {
      console.error('STANDARDIZED_LOGIN: Error:', error);
      
      let message = 'Login failed. Please try again.';
      
      if (error.message) {
        if (error.message.includes('Invalid login credentials')) {
          message = 'Invalid email or password.';
        } else if (error.message.includes('Email not confirmed')) {
          message = 'Please check your email and confirm your account first.';
        } else if (error.message.includes('Too many requests')) {
          message = 'Too many login attempts. Please wait and try again.';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          message = 'Network error. Please check your connection and try again.';
        } else {
          message = error.message;
        }
      }
      
      this.showError(message);
      this.setLoading(false);
    }
  }
}

// Create a single instance of the login system
window.loginSystem = new LoginSystem();