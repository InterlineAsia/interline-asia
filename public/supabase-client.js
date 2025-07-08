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
      await this._setCurrentUserWithMetadata(session.user);
    }
    this.authReady = true;

    this.supabase.auth.onAuthStateChange(async (_event, session) => {
      this.currentSession = session;
      if (session) {
        await this._setCurrentUserWithMetadata(session.user);
      } else {
        this.currentUser = null;
      }
    });
  }

  async _setCurrentUserWithMetadata(authUser) {
    // Get profile from database
    const { data: profile } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();
    
    // Merge auth user data with profile data and extract metadata
    this.currentUser = {
      ...authUser,
      ...profile,
      // Extract metadata for easier access
      full_name: authUser.user_metadata?.full_name || profile?.full_name || authUser.email?.split('@')[0],
      role: authUser.app_metadata?.role || authUser.user_metadata?.role || profile?.role || 'user',
      is_super_admin: authUser.app_metadata?.is_super_admin || authUser.user_metadata?.is_super_admin || false,
      is_admin: authUser.app_metadata?.role === 'admin' || authUser.user_metadata?.role === 'admin' || profile?.is_admin || false,
      verification_status: profile?.verification_status || 'pending'
    };
    
    console.log('User set with metadata:', {
      id: this.currentUser.id,
      email: this.currentUser.email,
      full_name: this.currentUser.full_name,
      role: this.currentUser.role,
      is_admin: this.currentUser.is_admin,
      is_super_admin: this.currentUser.is_super_admin,
      verification_status: this.currentUser.verification_status
    });
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

  async signIn(email, password) {
    await this.readyPromise;
    console.log('Attempting login for:', email);
    
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    console.log('Supabase auth response:', { data, error });
    
    if (error) {
      console.error('Supabase auth error details:', error);
      throw error;
    }
    
    if (data.user) {
      this.currentSession = data.session;
      await this._setCurrentUserWithMetadata(data.user);
      console.log('Login successful, user set:', this.currentUser);
    }
    
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
    return this.currentUser?.is_admin === true || 
           this.currentUser?.is_super_admin === true || 
           this.currentUser?.role === 'admin';
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

  async uploadFile(file, userId, session = null) {
    await this.readyPromise;
    
    const activeSession = session || this.currentSession;

    // Verify user is authenticated
    if (!activeSession) {
      throw new Error('User must be authenticated to upload files');
    }
    
    if (!userId) {
      userId = this.currentUser?.id;
    }
    
    if (!userId) {
      throw new Error('User ID is required for upload');
    }
    
    console.log('Starting file upload for user:', userId, 'file:', file.name);
    console.log('Using session for upload:', !!activeSession);
    console.log('File details:', { name: file.name, size: file.size, type: file.type });
    
    // Use proper file path format
    const fileName = `user-uploads/${userId}/${Date.now()}-${file.name}`;
    
    try {
      // First, check if the bucket exists and is accessible
      console.log('Checking bucket access...');
      const { data: buckets, error: bucketError } = await this.supabase.storage.listBuckets();
      console.log('Available buckets:', buckets?.map(b => b.name));
      
      if (bucketError) {
        console.warn('Could not list buckets:', bucketError);
      }
      
      // Try to upload to the verification-uploads bucket
      console.log('Attempting upload to verification-uploads bucket...');
      const { data, error } = await this.supabase.storage
        .from('verification-uploads')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Supabase storage upload error:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        
        // If bucket doesn't exist, try to create it
        if (error.message?.includes('Bucket not found') || error.message?.includes('bucket does not exist')) {
          console.log('Bucket not found, attempting to create...');
          const { error: createError } = await this.supabase.storage.createBucket('verification-uploads', {
            public: false,
            allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'],
            fileSizeLimit: 10485760 // 10MB
          });
          
          if (createError) {
            console.error('Failed to create bucket:', createError);
            throw new Error(`Storage bucket not available: ${createError.message}`);
          }
          
          // Retry upload after creating bucket
          console.log('Retrying upload after bucket creation...');
          const { data: retryData, error: retryError } = await this.supabase.storage
            .from('verification-uploads')
            .upload(fileName, file, {
              cacheControl: '3600',
              upsert: false
            });
            
          if (retryError) {
            throw new Error(`Upload failed after bucket creation: ${retryError.message}`);
          }
          
          data = retryData;
        } else {
          throw new Error(`Upload failed: ${error.message}`);
        }
      }
      
      console.log('File uploaded successfully to storage:', data?.path);

      // Create database record
      console.log('Creating database record...');
      const { data: dbData, error: dbError } = await this.supabase
        .from('uploads')
        .insert({
          user_id: userId,
          file_name: file.name,
          file_path: data.path,
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
        
        // Even if DB insert fails, the file was uploaded successfully
        console.warn('File uploaded but database record creation failed. File path:', data.path);
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
    
    const { data, error } = await this.supabase
      .from('profiles')
      .update({
        verification_status: status,
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
