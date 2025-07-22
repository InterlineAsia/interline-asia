// Direct Login System
// This is a simplified login system that directly uses Supabase without any complex wrappers

document.addEventListener('DOMContentLoaded', function() {
  console.log('DIRECT_LOGIN: Initializing direct login system...');
  
  // Get form elements
  const loginForm = document.getElementById('login-form');
  const loginButton = document.getElementById('login-button');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const errorDiv = document.getElementById('error-message');
  const successDiv = document.getElementById('success-message');
  
  // Check if elements exist
  if (!loginForm || !loginButton || !emailInput || !passwordInput) {
    console.error('DIRECT_LOGIN: Required form elements not found');
    return;
  }
  
  // Initialize Supabase client directly
  const supabase = window.supabase.createClient(
    window.SUPABASE_URL || 'https://nxreyyxbuwxjfmtvdkji.supabase.co',
    window.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54cmV5eXhidXd4amZtdHZka2ppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NTg4NDQsImV4cCI6MjA2NzAzNDg0NH0.SuaK9TqBLbysPCe0zyrMA8owMK4R-q7iNZbtLQzEKcE',
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        storage: window.localStorage
      }
    }
  );
  
  console.log('DIRECT_LOGIN: Supabase client initialized');
  
  // Helper functions
  function showError(message) {
    if (errorDiv) {
      errorDiv.textContent = message;
      errorDiv.style.display = 'block';
      if (successDiv) successDiv.style.display = 'none';
    }
  }
  
  function showSuccess(message) {
    if (successDiv) {
      successDiv.textContent = message;
      successDiv.style.display = 'block';
      if (errorDiv) errorDiv.style.display = 'none';
    }
  }
  
  function setLoading(isLoading) {
    if (loginButton) {
      loginButton.disabled = isLoading;
      loginButton.textContent = isLoading ? 'Signing In...' : 'Sign In';
    }
  }
  
  // Handle login form submission
  loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    
    if (!email || !password) {
      showError('Please enter both email and password.');
      return;
    }
    
    setLoading(true);
    console.log('DIRECT_LOGIN: Attempting login for:', email);
    
    try {
      // Sign out first to clear any existing sessions
      await supabase.auth.signOut({ scope: 'local' });
      
      // Attempt login
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        throw error;
      }
      
      if (!data.user || !data.session) {
        throw new Error('Login failed - no user session created');
      }
      
      console.log('DIRECT_LOGIN: Login successful!', data.user.email);
      console.log('DIRECT_LOGIN: Session created:', data.session);
      
      showSuccess('Login successful! Redirecting...');
      
      // Force redirect to dashboard
      const redirectUrl = '/dashboard-choice.html';
      console.log('DIRECT_LOGIN: Redirecting to:', redirectUrl);
      
      // Use a direct window.location assignment for most reliable redirect
      window.location.href = redirectUrl + '?t=' + Date.now();
      
    } catch (error) {
      console.error('DIRECT_LOGIN: Error:', error);
      
      let message = 'Login failed. Please try again.';
      
      if (error.message) {
        if (error.message.includes('Invalid login credentials')) {
          message = 'Invalid email or password.';
        } else if (error.message.includes('Email not confirmed')) {
          message = 'Please check your email and confirm your account first.';
        } else if (error.message.includes('Too many requests')) {
          message = 'Too many login attempts. Please wait and try again.';
        } else {
          message = error.message;
        }
      }
      
      showError(message);
      setLoading(false);
    }
  });
  
  console.log('DIRECT_LOGIN: Login system ready');
});