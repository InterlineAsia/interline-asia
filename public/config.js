// Interline Asia - Configuration
// Environment variables for frontend (public keys only)

// These values are set directly for use in the browser.
// In a production environment with a build step, these might be injected
// by the build tool (e.g., Vite, Webpack) to avoid hardcoding them in source control.

window.SUPABASE_URL = 'https://interlineasia.supabase.co';
window.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54cmV5eXhidXd4amZtdHZka2ppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NTg4NDQsImV4cCI6MjA2NzAzNDg0NH0.SuaK9TqBLbysPCe0zyrMA8owMK4R-q7iNZbtLQzEKcE';
// Using Cloudflare Turnstile for security verification
// All reCAPTCHA references have been removed

// File upload configuration
window.FILE_CONFIG = {
  maxSize: 5 * 1024 * 1024, // 5MB for verification uploads
  allowedTypes: ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'],
  allowedExtensions: ['pdf', 'png', 'jpg', 'jpeg']
};

// Verification configuration
window.VERIFICATION_CONFIG = {
  passcode: 'TRAVEL2025',
  minAge: 18
};

// Admin configuration
window.ADMIN_EMAIL = 'admin@interlineasia.com';