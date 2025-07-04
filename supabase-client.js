// Interline Asia - Supabase Client Configuration
// Handles all database operations and authentication

class SupabaseClient {
  constructor() {
    // Initialize Supabase client
    this.supabase = window.supabase.createClient(
      window.SUPABASE_URL,
      window.SUPABASE_ANON_KEY
    );
    
    this.currentUser = null;
    this.currentSession = null;
    
    // Initialize auth state
    this.initializeAuth();
  }

  async initializeAuth() {
    try {
      // Get current session
      const { data: { session }, error } = await this.supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
        return;
      }

      if (session) {
        this.currentSession = session;
        await this.loadUserProfile(session.user.id);
      }

      // Listen for auth changes
      this.supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state changed:', event, session);
        
        if (event === 'SIGNED_IN' && session) {
          this.currentSession = session;
          await this.loadUserProfile(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          this.currentSession = null;
          this.currentUser = null;
        }
      });

    } catch (error) {
      console.error('Error initializing auth:', error);
    }
  }

  async loadUserProfile(userId) {
    try {
      const { data: profile, error } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error loading profile:', error);
        return null;
      }

      this.currentUser = profile;
      return profile;
    } catch (error) {
      console.error('Error loading user profile:', error);
      return null;
    }
  }

  // Authentication methods
  async signUp(userData) {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            full_name: userData.fullName
          }
        }
      });

      if (error) throw error;

      // Send admin notification
      await this.notifyAdmin('registration', {
        email: userData.email,
        fullName: userData.fullName,
        userId: data.user?.id
      });

      return data;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  }

  async signIn(email, password) {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      // Update last login
      if (data.user) {
        await this.supabase
          .from('profiles')
          .update({ last_login: new Date().toISOString() })
          .eq('id', data.user.id);
      }

      return data;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }

  async signOut() {
    try {
      const { error } = await this.supabase.auth.signOut();
      if (error) throw error;
      
      this.currentUser = null;
      this.currentSession = null;
      
      // Redirect to login
      window.location.href = 'login.html';
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  // File upload methods
  async uploadFile(file, userId) {
    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await this.supabase.storage
        .from('uploads')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Save upload record to database
      const { data: dbData, error: dbError } = await this.supabase
        .from('uploads')
        .insert({
          user_id: userId,
          file_name: file.name,
          file_path: uploadData.path,
          file_type: file.type,
          file_size: file.size
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // Notify admin
      await this.notifyAdmin('upload', {
        userId,
        fileName: file.name,
        uploadId: dbData.id
      });

      return dbData;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  }

  async getUserUploads(userId) {
    try {
      const { data, error } = await this.supabase
        .from('uploads')
        .select('*')
        .eq('user_id', userId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting uploads:', error);
      return [];
    }
  }

  // Admin methods
  async getAllUsers() {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select(`
          *,
          uploads (
            id,
            file_name,
            upload_status,
            uploaded_at
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  }

  async updateUserStatus(userId, status, notes = '') {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .update({ 
          verification_status: status,
          notes: notes
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

      // Log admin action
      await this.logAdminAction('update_user_status', {
        target_user_id: userId,
        details: { status, notes }
      });

      return data;
    } catch (error) {
      console.error('Error updating user status:', error);
      throw error;
    }
  }

  async updateUploadStatus(uploadId, status, notes = '') {
    try {
      const { data, error } = await this.supabase
        .from('uploads')
        .update({ 
          upload_status: status,
          admin_notes: notes,
          reviewed_at: new Date().toISOString(),
          reviewed_by: this.currentUser?.id
        })
        .eq('id', uploadId)
        .select()
        .single();

      if (error) throw error;

      // Log admin action
      await this.logAdminAction('update_upload_status', {
        target_upload_id: uploadId,
        details: { status, notes }
      });

      return data;
    } catch (error) {
      console.error('Error updating upload status:', error);
      throw error;
    }
  }

  async logAdminAction(actionType, details) {
    try {
      if (!this.currentUser?.is_admin) return;

      const { error } = await this.supabase
        .from('admin_actions')
        .insert({
          admin_id: this.currentUser.id,
          action_type: actionType,
          target_user_id: details.target_user_id || null,
          target_upload_id: details.target_upload_id || null,
          details: details.details || {}
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error logging admin action:', error);
    }
  }

  // Utility methods
  isLoggedIn() {
    return this.currentSession !== null && this.currentUser !== null;
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

  requireAdmin() {
    if (!this.isLoggedIn() || !this.isAdmin()) {
      window.location.href = 'login.html';
      return false;
    }
    return true;
  }

  async getFileUrl(filePath) {
    try {
      const { data, error } = await this.supabase.storage
        .from('uploads')
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      if (error) throw error;
      return data.signedUrl;
    } catch (error) {
      console.error('Error getting file URL:', error);
      return null;
    }
  }

  // Admin notification (placeholder for webhook)
  async notifyAdmin(type, data) {
    try {
      // This would be replaced with actual email service
      console.log('Admin notification:', { type, data });
      
      // Future: Send to webhook endpoint or email service
      // await fetch('/api/notify-admin', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ type, data })
      // });
      
    } catch (error) {
      console.error('Error sending admin notification:', error);
    }
  }
}

// Global instance
window.supabaseClient = new SupabaseClient();

// Utility functions for UI
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