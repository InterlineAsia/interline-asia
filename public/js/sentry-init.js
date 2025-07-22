// SENTRY DISABLED FOR LOCAL DEV - COMMENTED OUT TO PREVENT CRASHES
// Sentry initialization for client-side error tracking
// Following Sentry best practices for proper instrumentation

(function() {
  // SENTRY DISABLED
  console.log('Sentry disabled for local development');
  return;
  
  // Sentry DSN
  // const SENTRY_DSN = 'https://0d303493dda99798ec54797ed93d27fa@o4509632867598336.ingest.de.sentry.io/4509632880967760';
  
  // Only initialize if Sentry library is available
  // if (typeof Sentry !== 'undefined') {
    try {
      Sentry.init({
        dsn: SENTRY_DSN,
        environment: window.location.hostname === 'localhost' ? 'development' : 'production',
        
        // Performance monitoring
        tracesSampleRate: 0.1, // 10% of transactions
        
        // Session replay
        replaysSessionSampleRate: 0.1, // 10% of sessions
        replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
        
        // Enable integrations (removed consoleLoggingIntegration as it's not available in this SDK version)
        integrations: [
          // Use available integrations
          new Sentry.BrowserTracing(),
        ],
        
        // Filter out common noise
        beforeSend(event) {
          // Filter out extension errors
          if (event.exception) {
            const error = event.exception.values[0];
            if (error && error.stacktrace && error.stacktrace.frames) {
              const frames = error.stacktrace.frames;
              const lastFrame = frames[frames.length - 1];
              if (lastFrame && lastFrame.filename && 
                  (lastFrame.filename.includes('extension://') || 
                   lastFrame.filename.includes('moz-extension://'))) {
                return null; // Don't send browser extension errors
              }
            }
          }
          
          // Filter out network errors that aren't our fault
          if (event.message && 
              (event.message.includes('Network request failed') ||
               event.message.includes('Failed to fetch'))) {
            return null;
          }
          
          return event;
        },
        
        // Set user context when available
        initialScope: {
          tags: {
            component: 'frontend'
          }
        }
      });
      
      // Set user context if logged in
      if (window.supabaseClient && window.supabaseClient.currentUser) {
        Sentry.setUser({
          id: window.supabaseClient.currentUser.id,
          email: window.supabaseClient.currentUser.email,
          username: window.supabaseClient.currentUser.full_name
        });
      }
      
      console.log('✅ Sentry initialized successfully for error tracking', {
        environment: window.location.hostname === 'localhost' ? 'development' : 'production',
        component: 'frontend'
      });
      
    } catch (error) {
      console.warn('⚠️ Sentry initialization failed:', error);
    }
  } else {
    console.warn('⚠️ Sentry library not loaded');
  }
})();

// Global error handler as fallback
window.addEventListener('error', function(event) {
  console.error('Global error caught:', event.error);
  if (typeof Sentry !== 'undefined') {
    Sentry.captureException(event.error);
  }
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', function(event) {
  console.error('Unhandled promise rejection:', event.reason);
  if (typeof Sentry !== 'undefined') {
    Sentry.captureException(event.reason);
  }
});