// Secure Authentication Service for Interline Asia
class SecureAuthService {
    constructor() {
        this.supabase = null;
        this.currentUser = null;
        this.sessionTimeout = 24 * 60 * 60 * 1000; // 24 hours
        this.init();
    }

    async init() {
        try {
            // Initialize Supabase client securely
            if (window.supabase && window.supabase.createClient) {
                this.supabase = window.supabase.createClient(
                    window.SUPABASE_URL,
                    window.SUPABASE_ANON_KEY,
                    {
                        auth: {
                            autoRefreshToken: true,
                            persistSession: true,
                            detectSessionInUrl: true
                        }
                    }
                );
            } else {
                throw new Error('Supabase library not loaded');
            }

            // Set up auth state listener
            this.supabase.auth.onAuthStateChange((event, session) => {
                this.handleAuthStateChange(event, session);
            });

            // Check current session
            await this.checkCurrentSession();

        } catch (error) {
            console.error('Failed to initialize auth service:', error);
            this.handleAuthError(error);
        }
    }

    // Secure login with rate limiting and validation
    async login(email, password) {
        try {
            // Input validation
            if (!this.validateEmail(email)) {
                throw new Error('Invalid email format');
            }

            if (!password || password.length < 6) {
                throw new Error('Password must be at least 6 characters');
            }

            // Rate limiting check
            if (!window.SecureConfig.checkRateLimit('login', email)) {
                throw new Error('Too many login attempts. Please try again later.');
            }

            // Sanitize inputs
            email = window.SecureConfig.sanitizeInput(email);

            // Attempt login
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) {
                this.logSecurityEvent('login_failed', { email, error: error.message });
                throw error;
            }

            // Success
            this.currentUser = data.user;
            this.logSecurityEvent('login_success', { email });
            
            return {
                success: true,
                user: data.user,
                session: data.session
            };

        } catch (error) {
            console.error('Login failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Secure signup with validation
    async signup(email, password, userData = {}) {
        try {
            // Input validation
            if (!this.validateEmail(email)) {
                throw new Error('Invalid email format');
            }

            if (!this.validatePassword(password)) {
                throw new Error('Password must be at least 8 characters with uppercase, lowercase, and number');
            }

            // Rate limiting check
            if (!window.SecureConfig.checkRateLimit('signup', email)) {
                throw new Error('Too many signup attempts. Please try again later.');
            }

            // Sanitize inputs
            email = window.SecureConfig.sanitizeInput(email);
            const sanitizedUserData = this.sanitizeUserData(userData);

            // Attempt signup
            const { data, error } = await this.supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: sanitizedUserData
                }
            });

            if (error) {
                this.logSecurityEvent('signup_failed', { email, error: error.message });
                throw error;
            }

            this.logSecurityEvent('signup_success', { email });
            
            return {
                success: true,
                user: data.user,
                session: data.session
            };

        } catch (error) {
            console.error('Signup failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Secure logout
    async logout() {
        try {
            // Only attempt signOut if supabase client is initialized
            if (this.supabase && this.supabase.auth) {
                const { error } = await this.supabase.auth.signOut();
                
                if (error) {
                    throw error;
                }
            }

            this.currentUser = null;
            this.clearSecureStorage();
            this.logSecurityEvent('logout_success');

            return { success: true };

        } catch (error) {
            console.error('Logout failed:', error);
            // Still clear local state even if remote logout fails
            this.currentUser = null;
            this.clearSecureStorage();
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Check current session
    async checkCurrentSession() {
        try {
            const { data: { session }, error } = await this.supabase.auth.getSession();
            
            if (error) {
                throw error;
            }

            if (session) {
                this.currentUser = session.user;
                this.validateSessionSecurity(session);
            }

            return session;

        } catch (error) {
            console.error('Session check failed:', error);
            await this.logout();
            return null;
        }
    }

    // Validate session security
    validateSessionSecurity(session) {
        const now = Date.now();
        const sessionAge = now - new Date(session.created_at).getTime();
        
        // Check session age
        if (sessionAge > this.sessionTimeout) {
            console.warn('Session expired due to age');
            this.logout();
            return false;
        }

        // Check for suspicious activity
        const lastActivity = localStorage.getItem('lastActivity');
        if (lastActivity) {
            const timeSinceActivity = now - parseInt(lastActivity);
            if (timeSinceActivity > 2 * 60 * 60 * 1000) { // 2 hours
                console.warn('Session expired due to inactivity');
                this.logout();
                return false;
            }
        }

        // Update last activity
        localStorage.setItem('lastActivity', now.toString());
        return true;
    }

    // Handle auth state changes
    handleAuthStateChange(event, session) {
        console.log('Auth state changed:', event);
        
        switch (event) {
            case 'SIGNED_IN':
                this.currentUser = session?.user || null;
                this.onSignIn(session);
                break;
            case 'SIGNED_OUT':
                this.currentUser = null;
                this.onSignOut();
                break;
            case 'TOKEN_REFRESHED':
                this.onTokenRefresh(session);
                break;
            case 'USER_UPDATED':
                this.currentUser = session?.user || null;
                break;
        }

        // Notify other components
        this.notifyAuthChange(event, session);
    }

    // Auth event handlers
    onSignIn(session) {
        localStorage.setItem('lastActivity', Date.now().toString());
        this.logSecurityEvent('session_started');
    }

    onSignOut() {
        this.clearSecureStorage();
        this.logSecurityEvent('session_ended');
    }

    onTokenRefresh(session) {
        this.logSecurityEvent('token_refreshed');
    }

    // Input validation methods
    validateEmail(email) {
        return window.SecureConfig.isValidEmail(email);
    }

    validatePassword(password) {
        if (!password || password.length < 8) return false;
        
        const hasUppercase = /[A-Z]/.test(password);
        const hasLowercase = /[a-z]/.test(password);
        const hasNumber = /\d/.test(password);
        
        return hasUppercase && hasLowercase && hasNumber;
    }

    sanitizeUserData(userData) {
        const sanitized = {};
        
        for (const [key, value] of Object.entries(userData)) {
            if (typeof value === 'string') {
                sanitized[key] = window.SecureConfig.sanitizeInput(value);
            } else {
                sanitized[key] = value;
            }
        }
        
        return sanitized;
    }

    // Security logging
    logSecurityEvent(event, data = {}) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            event: event,
            userAgent: navigator.userAgent,
            ip: 'client-side', // Would be filled server-side
            ...data
        };

        console.log('Security Event:', logEntry);

        // Send to monitoring service in production
        if (window.location.hostname.includes('interlineasia.com')) {
            this.sendSecurityLog(logEntry);
        }
    }

    async sendSecurityLog(logEntry) {
        try {
            // Send to Sentry or other monitoring service
            if (window.Sentry) {
                window.Sentry.addBreadcrumb({
                    message: `Auth: ${logEntry.event}`,
                    category: 'auth',
                    level: 'info',
                    data: logEntry
                });
            }
        } catch (error) {
            console.warn('Failed to send security log:', error);
        }
    }

    // Clear secure storage
    clearSecureStorage() {
        // Clear sensitive data from localStorage
        const keysToRemove = [
            'lastActivity',
            'cruiseDataCache',
            'sync_history'
        ];

        keysToRemove.forEach(key => {
            localStorage.removeItem(key);
        });
    }

    // Notify other components of auth changes
    notifyAuthChange(event, session) {
        const authEvent = new CustomEvent('auth:change', {
            detail: { event, session, user: this.currentUser }
        });
        document.dispatchEvent(authEvent);
    }

    // Handle auth errors
    handleAuthError(error) {
        console.error('Auth error:', error);
        
        // Clear potentially corrupted session
        this.logout();
        
        // Notify user
        if (window.AccessibilityEnhancer) {
            window.AccessibilityEnhancer.announce('Authentication error occurred. Please try logging in again.');
        }
    }

    // Public API methods
    getCurrentUser() {
        return this.currentUser;
    }

    isAuthenticated() {
        return !!this.currentUser;
    }

    async getSession() {
        return await this.checkCurrentSession();
    }

    // Password reset
    async resetPassword(email) {
        try {
            if (!this.validateEmail(email)) {
                throw new Error('Invalid email format');
            }

            email = window.SecureConfig.sanitizeInput(email);

            const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`
            });

            if (error) {
                throw error;
            }

            this.logSecurityEvent('password_reset_requested', { email });
            
            return { success: true };

        } catch (error) {
            console.error('Password reset failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Update password
    async updatePassword(newPassword) {
        try {
            if (!this.validatePassword(newPassword)) {
                throw new Error('Password must be at least 8 characters with uppercase, lowercase, and number');
            }

            const { error } = await this.supabase.auth.updateUser({
                password: newPassword
            });

            if (error) {
                throw error;
            }

            this.logSecurityEvent('password_updated');
            
            return { success: true };

        } catch (error) {
            console.error('Password update failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// Initialize secure auth service
document.addEventListener('DOMContentLoaded', () => {
    window.SecureAuth = new SecureAuthService();
    console.log('Secure authentication service initialized');
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SecureAuthService;
}