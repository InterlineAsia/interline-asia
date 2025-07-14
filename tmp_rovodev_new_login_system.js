// ✅ INTERLINE ASIA - REBUILT LOGIN SYSTEM
// Complete rebuild of login logic with proper role management

class InterlineLoginSystem {
    constructor() {
        this.ADMIN_EMAILS = ['rodney@telenational.com.au', 'admin@telenational.com.au'];
        this.supabaseClient = window.supabaseClient;
        this.isInitialized = false;
    }

    async initialize() {
        if (this.isInitialized) return;
        
        console.log('🚀 LOGIN_SYSTEM: Initializing...');
        await this.supabaseClient.readyPromise;
        this.isInitialized = true;
        console.log('✅ LOGIN_SYSTEM: Ready');
    }

    /**
     * Determine user roles based on email and database data
     */
    async determineUserRoles(user) {
        console.log('🔍 LOGIN_SYSTEM: Determining roles for:', user.email);
        
        const email = user.email.toLowerCase();
        const isAdminEmail = this.ADMIN_EMAILS.includes(email);
        
        // Get profile from database
        let profile = null;
        try {
            const { data, error } = await this.supabaseClient.supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .maybeSingle();
            
            if (error && error.code !== 'PGRST116') {
                console.error('❌ LOGIN_SYSTEM: Error fetching profile:', error);
            } else {
                profile = data;
            }
        } catch (err) {
            console.error('❌ LOGIN_SYSTEM: Profile fetch failed:', err);
        }

        // Determine roles
        const roles = {
            hasAdmin: false,
            hasMember: true, // Everyone gets member access
            isAdminEmail: isAdminEmail,
            profileData: profile
        };

        // Admin role logic
        if (isAdminEmail) {
            roles.hasAdmin = true;
            console.log('✅ LOGIN_SYSTEM: Admin access granted via email whitelist');
        } else if (profile?.is_admin === true || profile?.role === 'admin' || profile?.role === 'super_admin') {
            roles.hasAdmin = true;
            console.log('✅ LOGIN_SYSTEM: Admin access granted via database flags');
        }

        console.log('📋 LOGIN_SYSTEM: Final roles:', roles);
        return roles;
    }

    /**
     * Create or update user profile with correct roles
     */
    async ensureUserProfile(user, roles) {
        console.log('📝 LOGIN_SYSTEM: Ensuring profile for:', user.email);
        
        const profileData = {
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.email.split('@')[0],
            is_admin: roles.hasAdmin,
            role: roles.hasAdmin ? 'admin' : 'member',
            verified: roles.isAdminEmail ? true : (roles.profileData?.verified || false),
            verification_status: roles.isAdminEmail ? 'verified' : (roles.profileData?.verification_status || 'pending'),
            updated_at: new Date().toISOString()
        };

        // Add missing columns if they don't exist
        if (roles.hasAdmin) {
            profileData.is_super_admin = roles.isAdminEmail;
        }

        try {
            const { data, error } = await this.supabaseClient.supabase
                .from('profiles')
                .upsert(profileData, { 
                    onConflict: 'id',
                    ignoreDuplicates: false 
                })
                .select()
                .single();

            if (error) {
                console.error('❌ LOGIN_SYSTEM: Profile upsert failed:', error);
                // Continue anyway - don't block login for profile issues
            } else {
                console.log('✅ LOGIN_SYSTEM: Profile updated successfully');
            }

            return profileData;
        } catch (err) {
            console.error('❌ LOGIN_SYSTEM: Profile operation failed:', err);
            return profileData; // Return what we intended to save
        }
    }

    /**
     * Determine where to redirect user based on their roles
     */
    determineRedirect(roles) {
        console.log('🎯 LOGIN_SYSTEM: Determining redirect for roles:', roles);

        if (roles.hasAdmin && roles.hasMember) {
            console.log('✅ LOGIN_SYSTEM: User has both roles → dashboard choice');
            return '/dashboard-choice.html';
        } else if (roles.hasAdmin && !roles.hasMember) {
            console.log('✅ LOGIN_SYSTEM: Admin-only user → admin dashboard');
            return '/admin.html';
        } else if (!roles.hasAdmin && roles.hasMember) {
            console.log('✅ LOGIN_SYSTEM: Member-only user → member dashboard');
            return '/dashboard.html';
        } else {
            console.log('⚠️ LOGIN_SYSTEM: No roles detected → default to member dashboard');
            return '/dashboard.html';
        }
    }

    /**
     * Main login processing function
     */
    async processLogin(email, password, turnstileToken = null) {
        console.log('🔐 LOGIN_SYSTEM: Processing login for:', email);
        
        try {
            await this.initialize();

            // Step 1: Authenticate with Supabase
            console.log('1️⃣ LOGIN_SYSTEM: Authenticating...');
            const authResult = await this.supabaseClient.signIn(email, password, turnstileToken);
            
            if (!authResult.user) {
                throw new Error('Authentication failed - no user returned');
            }

            const user = authResult.user;
            console.log('✅ LOGIN_SYSTEM: Authentication successful');

            // Step 2: Determine user roles
            console.log('2️⃣ LOGIN_SYSTEM: Determining roles...');
            const roles = await this.determineUserRoles(user);

            // Step 3: Ensure profile exists with correct data
            console.log('3️⃣ LOGIN_SYSTEM: Ensuring profile...');
            const profile = await this.ensureUserProfile(user, roles);

            // Step 4: Update the current user object with complete data
            console.log('4️⃣ LOGIN_SYSTEM: Updating user object...');
            this.supabaseClient.currentUser = {
                ...user,
                ...profile,
                roles: roles
            };

            // Step 5: Determine redirect
            console.log('5️⃣ LOGIN_SYSTEM: Determining redirect...');
            const redirectUrl = this.determineRedirect(roles);

            console.log('🎉 LOGIN_SYSTEM: Login process complete!');
            console.log('📊 LOGIN_SYSTEM: Final state:', {
                email: user.email,
                hasAdmin: roles.hasAdmin,
                hasMember: roles.hasMember,
                redirectUrl: redirectUrl
            });

            return {
                success: true,
                user: this.supabaseClient.currentUser,
                roles: roles,
                redirectUrl: redirectUrl
            };

        } catch (error) {
            console.error('❌ LOGIN_SYSTEM: Login failed:', error);
            return {
                success: false,
                error: error.message,
                redirectUrl: null
            };
        }
    }

    /**
     * Check if current user has admin access
     */
    hasAdminAccess(user = null) {
        const currentUser = user || this.supabaseClient.getCurrentUser();
        if (!currentUser) return false;

        const email = currentUser.email?.toLowerCase();
        const isAdminEmail = this.ADMIN_EMAILS.includes(email);
        const hasAdminFlag = currentUser.is_admin === true || currentUser.role === 'admin' || currentUser.role === 'super_admin';

        return isAdminEmail || hasAdminFlag;
    }

    /**
     * Check if current user has member access
     */
    hasMemberAccess(user = null) {
        // Everyone has member access
        return true;
    }
}

// Global instance
window.interlineLoginSystem = new InterlineLoginSystem();