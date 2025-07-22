// Unified Auth Guard - Single source of truth for authentication
// This replaces all ad-hoc auth checks across the application

// Load configuration helper
async function loadConfig() {
  // Wait for config.js to load
  let attempts = 0;
  while (!window.SUPABASE_URL && attempts < 50) {
    await new Promise(resolve => setTimeout(resolve, 100));
    attempts++;
  }
  
  if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
    throw new Error('Supabase configuration not loaded');
  }
  
  return {
    supabaseUrl: window.SUPABASE_URL,
    supabaseAnonKey: window.SUPABASE_ANON_KEY
  };
}

// Create the unified Supabase client (only this file should create the client)
const createUnifiedClient = async () => {
  try {
    // Wait for Supabase library to load
    let attempts = 0;
    while (!window.supabase && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    
    if (!window.supabase) {
      throw new Error('Supabase library not loaded');
    }
    
    // Load configuration
    const config = await loadConfig();
    
    // Create Supabase client with optimized settings for SPA
    const client = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false // SPA, no PKCE callback
      },
      global: {
        headers: {
          'X-Client-Info': 'interline-asia-web'
        }
      }
    });

    console.log('AUTH_GUARD: Unified Supabase client created');
    return client;
  } catch (error) {
    console.error('AUTH_GUARD: Failed to create unified client:', error);
    throw error;
  }
};

// Export the unified client (singleton pattern)
export const supabase = window.supabaseClient?.supabase || await createUnifiedClient();

// Create ready promise that resolves when session is loaded
supabase.readyPromise = supabase.auth.getSession().then(({ data }) => {
  console.log('AUTH_GUARD: Session loaded:', data.session ? 'session exists' : 'no session');
  return data.session;
});

// Main auth guard function
export async function requireAuth(redirectOnFail = '/login.html') {
  console.log('AUTH_GUARD: Checking authentication...');
  
  try {
    // Wait until Supabase has loaded (max 2s fallback)
    const session = await Promise.race([
      supabase.readyPromise,
      new Promise(res => setTimeout(() => res(null), 2000))
    ]);

    console.log('AUTH_GUARD: Session check result:', session ? 'authenticated' : 'not authenticated');

    if (session?.user) {
      console.log('AUTH_GUARD: User authenticated:', session.user.email);
      return session;
    }

    // Not logged in: stash current URL and bounce
    console.log('AUTH_GUARD: User not authenticated, redirecting to:', redirectOnFail);
    localStorage.setItem('redirectAfterLogin', location.href);
    location.replace(redirectOnFail);
    return null;
  } catch (error) {
    console.error('AUTH_GUARD: Error checking auth:', error);
    // On error, redirect to login
    localStorage.setItem('redirectAfterLogin', location.href);
    location.replace(redirectOnFail);
    return null;
  }
}

// Helper function to check if user is logged in (synchronous)
export function isLoggedIn() {
  // Use the existing client if available
  if (window.supabaseClient) {
    return window.supabaseClient.isLoggedIn();
  }
  
  // Fallback: check if we have a session in localStorage
  try {
    const authData = localStorage.getItem('sb-' + window.SUPABASE_URL?.split('//')[1]?.split('.')[0] + '-auth-token');
    if (authData) {
      const parsed = JSON.parse(authData);
      return !!(parsed?.access_token && parsed?.expires_at > Date.now() / 1000);
    }
  } catch (error) {
    console.warn('AUTH_GUARD: Error checking localStorage session:', error);
  }
  
  return false;
}

// Helper function to get current user
export async function getCurrentUser() {
  try {
    await supabase.readyPromise;
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch (error) {
    console.error('AUTH_GUARD: Error getting current user:', error);
    return null;
  }
}

console.log('AUTH_GUARD: Module loaded');