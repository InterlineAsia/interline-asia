// Interline Asia - Supabase Client
// Centralized client for authentication, database, and storage

class SupabaseClient {
  constructor() {
    this.supabase = null;
    this.currentUser = null;
    this.currentSession = null;
    this.authReady = false;
    // This promise resolves when the client is fully initialized and ready.
    this.readyPromise = this._initialize();
  }

  async _initialize() {
    // Wait for the Supabase library to be loaded from the CDN
    let attempts = 0;
    while (!window.supabase && attempts < 50) { // Wait for 5 seconds max
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }

    if (!window.supabase) {
      const msg = 'Supabase client library not loaded. Please check the script tag in your HTML.';
      console.error(msg);
      throw new Error(msg);
    }

    if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
      const msg = 'Supabase URL or Anon Key is missing. Check config.js';
      console.error(msg);
      throw new Error(msg);
    }

    // Now it's safe to create the client
    this.supabase = window.supabase.createClient(
      window.SUPABASE_URL,
      window.SUPABASE_ANON_KEY
    );
    console.log('Supabase client initialized successfully.');

    // Now that the client exists, initialize auth state
    await this.initializeAuth();
  }

  async initializeAuth() {
    // This method is part of the internal initialization process.
    if (!this.supabase) return; // Guard against initialization failure
    const { data: { session } } = await this.supabase.auth.getSession();
    if (session) {
      this.currentSession = session;
      const { data: profile } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      this.currentUser = { ...session.user, ...profile };
    }
    this.authReady = true;

    this.supabase.auth.onAuthStateChange(async (_event, session) => {
      this.currentSession = session;
      if (session) {
        const { data: profile } = await this.supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        this.currentUser = { ...session.user, ...profile };
      } else {
        this.currentUser = null;
      }
    });
  }

  async signUp(userData) {
    await this.readyPromise;
    const { data, error } = await this.supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          full_name: userData.fullName
        },
        captchaToken: userData.recaptchaToken // For Turnstile/reCAPTCHA
      }
    });
    if (error) throw error;
    return data;
  }

  async resendConfirmationEmail(email) {
    await this.readyPromise;
    const { data, error } = await this.supabase.auth.resend({
      type: 'signup',
      email: email,
    });
    if (error) throw error;
    return data;
  }

  async signIn(email, password) {
    await this.readyPromise;
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    this.currentUser = { ...data.user, ...data.profile };
    return data;
  }

  async signOut() {
    await this.readyPromise;
    await this.supabase.auth.signOut();
    window.location.href = 'login.html';
  }

  isLoggedIn() {
    return !!this.currentSession;
  }

  isAdmin() {
    return this.currentUser?.is_admin === true;
  }

  requireAuth() {
    // Note: This is synchronous and relies on other parts of the app waiting for `authReady`.
    if (!this.isLoggedIn()) {
      window.location.href = 'login.html';
      return false;
    }
    return true;
  }

  async getUserUploads(userId) {
    await this.readyPromise;
    if (!userId) userId = this.currentUser?.id;
    if (!userId) throw new Error('User not authenticated');

    const { data, error } = await this.supabase
      .from('uploads')
      .select('*')
      .eq('user_id', userId)
      .order('uploaded_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  async uploadFile(file, userId) {
    await this.readyPromise;
    if (!userId) throw new Error('User ID is required for upload');
    
    const fileName = `${userId}/${Date.now()}-${file.name}`;
    const { data, error } = await this.supabase.storage
      .from('uploads')
      .upload(fileName, file);

    if (error) throw error;

    const { data: dbData, error: dbError } = await this.supabase
      .from('uploads')
      .insert({
        user_id: userId,
        file_name: file.name,
        file_path: data.path,
        file_type: file.type,
        file_size: file.size,
        upload_status: 'pending'
      })
      .select()
      .single();

    if (dbError) throw dbError;
    return dbData;
  }
}

// Global instance
window.supabaseClient = new SupabaseClient();

// Global utility functions for user feedback
function showError(message, elementId = 'error-message', allowHtml = false) {
  const errorEl = document.getElementById(elementId);
  if (errorEl) {
    if (allowHtml) {
      errorEl.innerHTML = message;
    } else {
      errorEl.textContent = message;
    }
    errorEl.style.display = 'block';
  }
}

function hideError(elementId = 'error-message') {
  const errorEl = document.getElementById(elementId);
  if (errorEl) {
    errorEl.style.display = 'none';
  }
}

function showSuccess(message, elementId = 'success-message') {
  const successEl = document.getElementById(elementId);
  if (successEl) {
    successEl.textContent = message;
    successEl.style.display = 'block';
  }
}

function hideSuccess(elementId = 'success-message') {
  const successEl = document.getElementById(elementId);
  if (successEl) {
    successEl.style.display = 'none';
  }
}
