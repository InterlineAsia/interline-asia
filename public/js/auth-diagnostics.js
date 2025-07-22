// AUTH DIAGNOSTICS TOOL
// This script helps diagnose authentication issues

console.log('AUTH_DIAGNOSTICS: Initializing...');

class AuthDiagnostics {
  constructor() {
    this.supabase = null;
    this.diagnosticResults = {};
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initialize());
    } else {
      this.initialize();
    }
  }
  
  async initialize() {
    console.log('AUTH_DIAGNOSTICS: Initializing diagnostics tool');
    
    // Initialize Supabase client
    this.initializeSupabase();
    
    // Add global access
    window.authDiagnostics = this;
    
    // Add diagnostic methods to window
    window.checkAuthStatus = () => this.checkAuthStatus();
    window.clearAuthState = () => this.clearAuthState();
    window.fixCookieIssues = () => this.fixCookieIssues();
    window.runFullDiagnostics = () => this.runFullDiagnostics();
    
    console.log('AUTH_DIAGNOSTICS: Diagnostics tool ready');
    console.log('AUTH_DIAGNOSTICS: Available commands:');
    console.log('  - window.checkAuthStatus()');
    console.log('  - window.clearAuthState()');
    console.log('  - window.fixCookieIssues()');
    console.log('  - window.runFullDiagnostics()');
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
    
    console.log('AUTH_DIAGNOSTICS: Supabase client initialized');
  }
  
  async checkAuthStatus() {
    console.log('AUTH_DIAGNOSTICS: Checking auth status...');
    
    try {
      // Check session
      const { data: { session } } = await this.supabase.auth.getSession();
      
      // Check if window.supabaseClient exists
      const hasSupabaseClient = !!window.supabaseClient;
      const clientSession = hasSupabaseClient ? window.supabaseClient.currentSession : null;
      
      // Check localStorage for auth items
      const authItems = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('sb-')) {
          authItems.push(key);
        }
      }
      
      // Check cookies for auth items
      const authCookies = document.cookie.split(';')
        .map(cookie => cookie.trim())
        .filter(cookie => cookie.startsWith('sb-'));
      
      // Compile results
      const results = {
        hasSession: !!session,
        sessionUser: session ? session.user.email : null,
        hasSupabaseClient,
        hasClientSession: !!clientSession,
        clientSessionUser: clientSession ? clientSession.user.email : null,
        authLocalStorageItems: authItems,
        authCookies,
        timestamp: new Date().toISOString()
      };
      
      console.log('AUTH_DIAGNOSTICS: Auth status results:', results);
      this.diagnosticResults.authStatus = results;
      
      return results;
    } catch (error) {
      console.error('AUTH_DIAGNOSTICS: Error checking auth status:', error);
      return {
        error: error.message,
        stack: error.stack
      };
    }
  }
  
  async clearAuthState() {
    console.log('AUTH_DIAGNOSTICS: Clearing auth state...');
    
    try {
      // Sign out from Supabase
      await this.supabase.auth.signOut({ scope: 'global' });
      
      // Clear localStorage items
      const authItems = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('sb-')) {
          authItems.push(key);
          localStorage.removeItem(key);
        }
      }
      
      // Clear cookies
      const authCookies = document.cookie.split(';')
        .map(cookie => cookie.trim())
        .filter(cookie => cookie.startsWith('sb-'));
      
      document.cookie.split(";").forEach(function(c) { 
        if (c.trim().startsWith('sb-')) {
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
        }
      });
      
      // Compile results
      const results = {
        clearedLocalStorageItems: authItems,
        clearedCookies: authCookies,
        timestamp: new Date().toISOString()
      };
      
      console.log('AUTH_DIAGNOSTICS: Auth state cleared:', results);
      this.diagnosticResults.clearAuthState = results;
      
      return results;
    } catch (error) {
      console.error('AUTH_DIAGNOSTICS: Error clearing auth state:', error);
      return {
        error: error.message,
        stack: error.stack
      };
    }
  }
  
  async fixCookieIssues() {
    console.log('AUTH_DIAGNOSTICS: Fixing cookie issues...');
    
    try {
      // Get current session
      const { data: { session } } = await this.supabase.auth.getSession();
      
      if (!session) {
        console.log('AUTH_DIAGNOSTICS: No session found, nothing to fix');
        return {
          status: 'no_session',
          message: 'No session found, nothing to fix'
        };
      }
      
      // Force set session
      await this.supabase.auth.setSession(session);
      
      // Check if cookies are now set
      const authCookies = document.cookie.split(';')
        .map(cookie => cookie.trim())
        .filter(cookie => cookie.startsWith('sb-'));
      
      // Compile results
      const results = {
        status: 'fixed',
        sessionRefreshed: true,
        authCookies,
        timestamp: new Date().toISOString()
      };
      
      console.log('AUTH_DIAGNOSTICS: Cookie issues fixed:', results);
      this.diagnosticResults.fixCookieIssues = results;
      
      return results;
    } catch (error) {
      console.error('AUTH_DIAGNOSTICS: Error fixing cookie issues:', error);
      return {
        error: error.message,
        stack: error.stack
      };
    }
  }
  
  async runFullDiagnostics() {
    console.log('AUTH_DIAGNOSTICS: Running full diagnostics...');
    
    try {
      // Check browser info
      const browserInfo = {
        userAgent: navigator.userAgent,
        cookiesEnabled: navigator.cookieEnabled,
        localStorage: !!window.localStorage,
        sessionStorage: !!window.sessionStorage
      };
      
      // Check auth status
      const authStatus = await this.checkAuthStatus();
      
      // Check for conflicting scripts
      const scripts = Array.from(document.scripts).map(script => script.src);
      const authScripts = scripts.filter(src => 
        src.includes('supabase') || 
        src.includes('auth') || 
        src.includes('login')
      );
      
      // Compile results
      const results = {
        browserInfo,
        authStatus,
        authScripts,
        timestamp: new Date().toISOString()
      };
      
      console.log('AUTH_DIAGNOSTICS: Full diagnostics results:', results);
      this.diagnosticResults.fullDiagnostics = results;
      
      return results;
    } catch (error) {
      console.error('AUTH_DIAGNOSTICS: Error running full diagnostics:', error);
      return {
        error: error.message,
        stack: error.stack
      };
    }
  }
}

// Create a single instance of the diagnostics tool
new AuthDiagnostics();