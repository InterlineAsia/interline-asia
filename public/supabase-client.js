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

    // Create client with limited session persistence for login flow
    this.supabase = window.supabase.createClient(
      window.SUPABASE_URL,
      window.SUPABASE_ANON_KEY,
      {
        auth: {
          persistSession: true,        // Enable for login flow
          autoRefreshToken: false,     // Keep disabled for security
          detectSessionInUrl: false,   // Keep disabled
          storage: window.localStorage  // Use localStorage for persistent sessions
        }
      }
    );
    // console.log('Supabase client initialized successfully.'); // Reduce noise

    // Now that the client exists, initialize auth state
    await this.initializeAuth();
  }

  async initializeAuth() {
    // This method is part of the internal initialization process.
    if (!this.supabase) return; // Guard against initialization failure
    
    // Check for existing session to maintain login state
    const { data: { session } } = await this.supabase.auth.getSession();
    if (session) {
      // console.log('AUTH: Existing session found:', session.user.email); // Reduce noise
      this.currentSession = session;
      await this._setCurrentUserWithMetadata(session.user);
    }
    
    this.authReady = true;

    this.supabase.auth.onAuthStateChange(async (event, session) => {
      // console.log('AUTH: State change:', event, session ? 'session exists' : 'no session'); // Reduce noise
      
      if (event === 'SIGNED_IN' && session) {
        // console.log('AUTH: User signed in:', session.user.email); // Reduce noise
        this.currentSession = session;
        await this._setCurrentUserWithMetadata(session.user);
      } else if (event === 'SIGNED_OUT') {
        console.log('AUTH: User signed out');
        this.currentUser = null;
        this.currentSession = null;
      }
    });
  }

  async _setCurrentUserWithMetadata(authUser) {
    // console.log('Setting user metadata for:', authUser.email); // Reduce noise
    // console.log('Auth user data:', { // Reduce noise
    //   id: authUser.id,
    //   email: authUser.email,
    //   app_metadata: authUser.app_metadata,
    //   user_metadata: authUser.user_metadata
    // });
    
    // Get profile from database
    const { data: profile, error: profileError } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle();
      
    if (profileError) {
      console.warn('SUPABASE: Error fetching profile, falling back:', profileError.message); // Log warning
    }
    
    // console.log('Profile data from DB:', profile); // Reduce noise
    
    // --- Define Super Admins by email for security ---
    // This is a secure way to grant top-level access without relying on database fields that could be misconfigured.
    const SUPER_ADMIN_EMAILS = [
      'admin@interlineasia.com',
      'admin@telenational.com.au',
      'rodney@telenational.com.au'
    ];

    const normalizedEmail = authUser.email.toLowerCase();
    const isSuperAdminByEmail = SUPER_ADMIN_EMAILS.includes(normalizedEmail);

    // Determine role from various sources, with a clear hierarchy.
    const roleFromSources = authUser.app_metadata?.role || authUser.user_metadata?.role || profile?.role || authUser.app_metadata?.role || authUser.user_metadata?.role || 'user'; // Ensure fallback from authUser metadata
    const finalRole = isSuperAdminByEmail ? 'super_admin' : roleFromSources;
    
    // console.log('Role determination:', { // Reduce noise
    //   email: normalizedEmail,
    //   isSuperAdminByEmail,
    //   roleFromAppMetadata: authUser.app_metadata?.role,
    //   roleFromUserMetadata: authUser.user_metadata?.role,
    //   roleFromProfile: profile?.role,
    //   finalRole
    // });

    // Merge auth user data with profile data and extract metadata
    const profileData = profile || {}; // Ensure profileData is an object even if profile is null

    this.currentUser = {
      ...authUser,
      ...profileData,
      // Extract metadata for easier access and ensure defaults
      full_name: authUser.user_metadata?.full_name || profileData.full_name || authUser.email?.split('@')[0] || 'Guest',
      role: finalRole,
      is_super_admin: finalRole === 'super_admin',
      is_admin: finalRole === 'admin' || finalRole === 'super_admin' || profileData.is_admin === true,
      verification_status: profileData.verification_status || 'pending',
      verified: profileData.verified || false,
      verification_document_url: profileData.verification_document_url || null,
      verification_document_name: profileData.verification_document_name || null,
      // Add other expected fields that might be missing from profile
      created_at: authUser.created_at || profileData.created_at || new Date().toISOString(),
      updated_at: authUser.updated_at || profileData.updated_at || new Date().toISOString()
    };
    
    // console.log('Final user object created:', { // Reduce noise
    //   email: this.currentUser.email,
    //   role: this.currentUser.role,
    //   is_admin: this.currentUser.is_admin,
    //   is_super_admin: this.currentUser.is_super_admin
    // });
    
    // console.log('User set with metadata:', { // Reduce noise
    //   id: this.currentUser.id,
    //   email: this.currentUser.email,
    //   full_name: this.currentUser.full_name,
    //   role: this.currentUser.role,
    //   is_admin: this.currentUser.is_admin,
    //   is_super_admin: this.currentUser.is_super_admin,
    //   verification_status: this.currentUser.verification_status
    // });
  }

  async signUp(userData) {
    await this.readyPromise;
    console.log('Attempting signup for:', userData.email);
    
    const { data, error } = await this.supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          full_name: userData.fullName
        },
        captchaToken: userData.turnstileToken // For Cloudflare Turnstile
      }
    });
    
    console.log('Supabase signup response:', { data, error });
    
    if (error) {
      console.error('Supabase signup error details:', error);
      throw error;
    }
    
    // If signup successful, create profile record
    if (data.user && !error) {
      try {
        const { error: profileError } = await this.supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            full_name: userData.fullName,
            email: userData.email,
            verification_status: 'pending',
            created_at: new Date().toISOString()
          });
        
        if (profileError) {
          console.warn('Profile creation error (may already exist):', profileError);
        } else {
          console.log('Profile created successfully');
        }
      } catch (profileErr) {
        console.warn('Profile creation failed:', profileErr);
      }
    }
    
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

  async signIn(email, password, turnstileToken = null) {
    await this.readyPromise;
    console.log('AUTH: Attempting login for:', email);
    
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password
    });
    
    console.log('AUTH: Supabase auth response:', { data, error });
    console.log('AUTH: Session data:', data?.session);
    console.log('AUTH: User data:', data?.user);
    
    if (error) {
      console.error('AUTH: Supabase auth error details:', error);
      throw error;
    }
    
    if (data.user) {
      this.currentSession = data.session;
      await this._setCurrentUserWithMetadata(data.user);
      
      // Ensure session is properly stored
      if (data.session) {
        await this.supabase.auth.setSession(data.session);
        console.log('AUTH: Session set in Supabase');
      }
      
      console.log('AUTH: Login successful, user set:', this.currentUser?.email);
      console.log('AUTH: Is logged in check:', this.isLoggedIn());
    }
    
    return {
      user: this.currentUser,
      session: data.session
    };
  }

  async signOut() {
    await this.readyPromise;
    console.log('Signing out user...');
    
    // Clear local state immediately
    this.currentUser = null;
    this.currentSession = null;
    
    // Sign out from Supabase with all scopes
    await this.supabase.auth.signOut({ scope: 'global' });
    
    // Force clear session
    await this.supabase.auth.setSession(null);
    
    // Clear any local storage that might persist session
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear any cookies
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
    
    // Force redirect with no history and cache busting
    window.location.replace('/login.html?t=' + Date.now());
  }

  isLoggedIn() {
    return !!this.currentSession;
  }

  async getCurrentUser() {
    if (this.currentUser) {
      return this.currentUser;
    }

    // If currentUser is null, attempt to get session and set user again
    // This handles cases where client might be ready but user hasn't been set yet (e.g., page refresh)
    // Or if there was a temporary network glitch during initial session retrieval
    const { data: { session: currentSession } } = await this.supabase.auth.getSession();

    if (currentSession) {
      this.currentSession = currentSession;
      await this._setCurrentUserWithMetadata(currentSession.user);
      return this.currentUser; // Return the newly set user
    }

    // Optional retry: If session is still null, try one more time
    if (!currentSession) {
      console.warn('SUPABASE: getSession returned null, retrying once...');
      await new Promise(resolve => setTimeout(resolve, 500)); // Wait a bit before retrying
      const { data: { session: retriedSession } } = await this.supabase.auth.getSession();

      if (retriedSession) {
        console.log('SUPABASE: Session found on retry.');
        this.currentSession = retriedSession;
        await this._setCurrentUserWithMetadata(retriedSession.user);
        return this.currentUser;
      } else {
        console.warn('SUPABASE: getSession still null after retry.');
      }
    }
    return null;
  }

  isAdmin(email = null) {
    // Define the same super admin emails as in _setCurrentUserWithMetadata
    const SUPER_ADMIN_EMAILS = [
      'admin@interlineasia.com',
      'admin@telenational.com.au',
      'rodney@telenational.com.au'
    ];
    
    // Check by email parameter first (for external calls)
    if (email) {
      const normalizedEmail = email.toLowerCase();
      const isSuperAdmin = SUPER_ADMIN_EMAILS.includes(normalizedEmail);
      console.log(`isAdmin check by email (${email}):`, isSuperAdmin);
      return isSuperAdmin;
    }
    
    // Check current user
    if (!this.currentUser) {
      console.log('isAdmin check: No current user');
      return false;
    }
    
    // Check by email first (most reliable)
    const normalizedCurrentEmail = this.currentUser.email.toLowerCase();
    if (SUPER_ADMIN_EMAILS.includes(normalizedCurrentEmail)) {
      console.log(`isAdmin check: User ${this.currentUser.email} is admin by email whitelist`);
      return true;
    }
    
    // Then check flags
    const isAdminByFlag = this.currentUser.is_admin === true || this.currentUser.is_super_admin === true;
    
    // Log detailed user information for debugging
    console.log('isAdmin check details:', {
      email: this.currentUser.email,
      is_admin_flag: this.currentUser.is_admin,
      is_super_admin_flag: this.currentUser.is_super_admin,
      role: this.currentUser.role,
      result: isAdminByFlag
    });
    
    return isAdminByFlag;
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
    
    // Verify user is authenticated
    if (!this.currentSession) {
      throw new Error('User must be authenticated to upload files');
    }
    
    if (!userId) {
      userId = this.currentUser?.id;
    }
    if (!userId) {
      throw new Error('User ID is required for upload');
    }
    
    console.log('Starting file upload for user:', userId, 'file:', file.name);
    
    try {
      // Step 1: Get a secure, one-time upload URL from our Edge Function.
      // This is the modern, secure way to handle user uploads.
      console.log('Requesting signed URL for upload...');
      const { data: signedUrlData, error: signedUrlError } = await this.supabase.functions.invoke(
        'generate-signed-upload-url',
        {
          body: { fileName: file.name },
        }
      );

      if (signedUrlError) {
        throw new Error(`Could not get signed URL: ${signedUrlError.message}`);
      }
      
      const { signedURL, token, filePath } = signedUrlData;
      if (!signedURL) {
          throw new Error('Failed to retrieve a signed upload URL from the server.');
      }

      // Step 2: Upload the file directly to Supabase Storage using the signed URL.
      // This bypasses the need for the client to have broad storage permissions.
      console.log('Uploading file to storage via signed URL...');
      const { error: uploadError } = await this.supabase.storage
        .from('verification-uploads')
        .uploadToSignedUrl(filePath, token, file);

      if (uploadError) {
        throw new Error(`Storage upload failed: ${uploadError.message}`);
      }

      console.log('File uploaded successfully to storage:', filePath);

      // Step 3: Create the database record for the upload.
      console.log('Creating database record for the upload...');
      const { data: dbData, error: dbError } = await this.supabase
        .from('uploads')
        .insert({
          user_id: userId,
          file_name: file.name,
          file_path: filePath, // Use the secure path returned from the function
          file_type: file.type,
          file_size: file.size,
          upload_status: 'pending',
          uploaded_at: new Date().toISOString()
        })
        .select()
        .single();

      if (dbError) {
        console.error('Database insert error:', dbError);
        console.error('Database error details:', JSON.stringify(dbError, null, 2));
        
        // If DB insert fails, the file is an "orphan" but was uploaded.
        console.warn('File uploaded but database record creation failed. File path:', filePath);
        throw new Error(`File uploaded but database error: ${dbError.message}`);
      }
      
      console.log('Upload record created in database:', dbData);
      return dbData;
      
    } catch (uploadError) {
      console.error('Complete upload process failed:', uploadError);
      console.error('Upload error stack:', uploadError.stack);
      throw uploadError;
    }
  }

  async resetPasswordForEmail(email) {
    await this.readyPromise;
    const { data, error } = await this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password.html`
    });
    if (error) throw error;
    return data;
  }

  async updateUserStatus(userId, status, notes = '') {
    await this.readyPromise;
    if (!this.isAdmin()) {
      throw new Error('Admin access required');
    }
    
    // Convert status to boolean for verified field
    const verified = status === 'verified' || status === true;
    
    const { data, error } = await this.supabase
      .from('profiles')
      .update({
        verified: verified,
        admin_notes: notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateUploadStatus(uploadId, status, notes = '') {
    await this.readyPromise;
    if (!this.isAdmin()) {
      throw new Error('Admin access required');
    }
    
    const { data, error } = await this.supabase
      .from('uploads')
      .update({
        upload_status: status,
        admin_notes: notes,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', uploadId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async getFileUrl(filePath) {
    await this.readyPromise;
    const { data } = await this.supabase.storage
      .from('verification-uploads')
      .createSignedUrl(filePath, 3600); // 1 hour expiry
    
    return data?.signedUrl;
  }

  async getAllUsers() {
    await this.readyPromise;
    if (!this.isAdmin()) {
      throw new Error('Admin access required');
    }
    
    const { data: profiles, error: profilesError } = await this.supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (profilesError) throw profilesError;
    
    // Get uploads for each user
    const usersWithUploads = await Promise.all(
      profiles.map(async (profile) => {
        const uploads = await this.getUserUploads(profile.id);
        return { ...profile, uploads };
      })
    );
    
    return usersWithUploads;
  }

  // Cruise deals methods
  async getAllDeals(filters = {}) {
    await this.readyPromise;
    
    let query = this.supabase
      .from('deals_dashboard')
      .select('*');
    
    // Apply filters
    if (filters.cruise_line) {
      query = query.eq('cruise_line', filters.cruise_line);
    }
    
    if (filters.region) {
      query = query.eq('region', filters.region);
    }
    
    if (filters.category) {
      query = query.eq('category', filters.category);
    }
    
    if (filters.month) {
      query = query.gte('departure_date', `2024-${filters.month}-01`)
                   .lt('departure_date', `2024-${String(parseInt(filters.month) + 1).padStart(2, '0')}-01`);
    }
    
    if (filters.price_min) {
      query = query.gte('price', filters.price_min);
    }
    
    if (filters.price_max) {
      query = query.lte('price', filters.price_max);
    }
    
    if (filters.duration_min) {
      query = query.gte('duration', filters.duration_min);
    }
    
    if (filters.duration_max) {
      query = query.lte('duration', filters.duration_max);
    }
    
    if (filters.search) {
      // Search across multiple fields
      const searchTerm = `%${filters.search.toLowerCase()}%`;
      query = query.or(`cruise_name.ilike.${searchTerm},ship_name.ilike.${searchTerm},cruise_line.ilike.${searchTerm},region.ilike.${searchTerm},itinerary.ilike.${searchTerm}`);
    }
    
    // Order by departure date, then price
    query = query.order('departure_date', { ascending: true, nullsFirst: false })
                 .order('price', { ascending: true });
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching deals:', error);
      throw error;
    }
    
    return data || [];
  }

  async processCsvDeals() {
    await this.readyPromise;
    
    if (!this.isAdmin()) {
      throw new Error('Admin access required');
    }
    
    try {
      const response = await fetch('/api/process-csv-deals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.currentSession?.access_token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return result;
      
    } catch (error) {
      console.error('Error processing CSV deals:', error);
      throw error;
    }
  }

  async triggerCsvProcessing() {
    await this.readyPromise;
    
    // This method can be called when new CSV files are uploaded
    // It will automatically process the CSV files and update the deals table
    try {
      const result = await this.processCsvDeals();
      console.log('CSV processing completed:', result);
      return result;
    } catch (error) {
      console.error('CSV processing failed:', error);
      throw error;
    }
  }
}

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

// Create a single, globally accessible instance of the SupabaseClient
window.supabaseClient = new SupabaseClient();

// Export the class and instance for module systems (optional, if not using global window)
// export { SupabaseClient };
// export default window.supabaseClient;
