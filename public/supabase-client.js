// Interline Asia - Supabase Client
// Centralized client for authentication, database, and storage

class SupabaseClient {
  constructor() {
    if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
      console.error('Supabase URL or Anon Key is missing. Check config.js');
      return;
    }
    this.supabase = window.supabase.createClient(
      window.SUPABASE_URL,
      window.SUPABASE_ANON_KEY
    );
    this.currentUser = null;
    this.currentSession = null;
    this.authReady = false;
    this.initializeAuth();
  }

  async initializeAuth() {
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

  async signIn(email, password) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    this.currentUser = { ...data.user, ...data.profile };
    return data;
  }

  async signOut() {
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
    if (!this.isLoggedIn()) {
      window.location.href = 'login.html';
      return false;
    }
    return true;
  }

  async getUserUploads(userId) {
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
function showError(message, elementId = 'error-message') {
  const errorEl = document.getElementById(elementId);
  if (errorEl) {
    errorEl.textContent = message;
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
