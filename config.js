// Interline Asia - Configuration
// Environment variables for frontend (public keys only)

// Note: In production, these would be injected by your build process
// For now, you'll need to manually update these with your actual Supabase values

// Use environment variables in production, fallback to hardcoded for development
window.SUPABASE_URL = process?.env?.SUPABASE_URL || 'https://nxreyyxbuwxjfmtvdkji.supabase.co';
window.SUPABASE_ANON_KEY = process?.env?.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54cmV5eXhidXd4amZtdHZka2ppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NTg4NDQsImV4cCI6MjA2NzAzNDg0NH0.SuaK9TqBLbysPCe0zyrMA8owMK4R-q7iNZbtLQzEKcE';
window.RECAPTCHA_SITE_KEY = '6Ld43XUrAAAAAATguv7FHX2tHDTsnnpdBFQoXNKT';

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