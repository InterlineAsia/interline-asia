-- Auth Security Hardening Migration
-- Configures secure auth settings for Supabase
-- Created: 2025-07-20

-- ============================================================================
-- AUTH CONFIGURATION HARDENING
-- ============================================================================

-- Note: Some auth settings require Supabase Dashboard configuration
-- This migration handles database-level auth security

-- Set email OTP expiry to 10 minutes (600 seconds)
-- This needs to be set in Supabase Dashboard under Authentication > Settings
-- Or via environment variable: GOTRUE_OTP_EXPIRY=600

-- Enable leaked password protection (HIBP check)
-- This needs to be enabled in Supabase Dashboard under Authentication > Settings
-- Or via environment variable: GOTRUE_SECURITY_CAPTCHA_ENABLED=true

-- ============================================================================
-- DATABASE-LEVEL AUTH SECURITY
-- ============================================================================

-- Create auth event logging function
CREATE OR REPLACE FUNCTION public.log_auth_event()
RETURNS TRIGGER AS $$
BEGIN
    -- Log authentication events for security monitoring
    IF TG_OP = 'INSERT' THEN
        -- New user signup
        PERFORM public.log_security_event(
            'user_signup',
            'auth.users',
            true,
            jsonb_build_object(
                'user_id', NEW.id,
                'email', NEW.email,
                'provider', COALESCE(NEW.app_metadata->>'provider', 'email')
            )
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- User login/update
        IF OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at THEN
            PERFORM public.log_security_event(
                'user_login',
                'auth.users',
                true,
                jsonb_build_object(
                    'user_id', NEW.id,
                    'email', NEW.email,
                    'last_sign_in', NEW.last_sign_in_at
                )
            );
        END IF;
        
        -- Email confirmation
        IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
            PERFORM public.log_security_event(
                'email_confirmed',
                'auth.users',
                true,
                jsonb_build_object(
                    'user_id', NEW.id,
                    'email', NEW.email
                )
            );
        END IF;
        
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public, extensions;

-- Create trigger for auth event logging
DROP TRIGGER IF EXISTS auth_event_logger ON auth.users;
CREATE TRIGGER auth_event_logger
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.log_auth_event();

-- ============================================================================
-- RATE LIMITING AND BRUTE FORCE PROTECTION
-- ============================================================================

-- Create failed login attempts tracking
CREATE TABLE IF NOT EXISTS public.failed_login_attempts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email TEXT NOT NULL,
    ip_address INET,
    attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_agent TEXT
);

-- Enable RLS on failed login attempts
ALTER TABLE public.failed_login_attempts ENABLE ROW LEVEL SECURITY;

-- Only admins can view failed login attempts
CREATE POLICY "failed_logins_admin_only" ON public.failed_login_attempts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_failed_logins_email_time 
ON public.failed_login_attempts(email, attempted_at);

-- Function to check for suspicious login patterns
CREATE OR REPLACE FUNCTION public.check_login_attempts(p_email TEXT, p_ip INET DEFAULT NULL)
RETURNS JSONB AS $$
DECLARE
    recent_attempts INTEGER;
    result JSONB;
BEGIN
    -- Count recent failed attempts (last 15 minutes)
    SELECT COUNT(*) INTO recent_attempts
    FROM public.failed_login_attempts
    WHERE email = p_email
    AND attempted_at > NOW() - INTERVAL '15 minutes';
    
    result := jsonb_build_object(
        'email', p_email,
        'recent_attempts', recent_attempts,
        'is_suspicious', recent_attempts >= 5,
        'should_block', recent_attempts >= 10
    );
    
    -- Log if suspicious
    IF recent_attempts >= 5 THEN
        PERFORM public.log_security_event(
            'suspicious_login_pattern',
            'failed_login_attempts',
            false,
            result
        );
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public, extensions;

-- ============================================================================
-- SESSION SECURITY
-- ============================================================================

-- Create active sessions tracking
CREATE TABLE IF NOT EXISTS public.active_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_token_hash TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE
);

-- Enable RLS on active sessions
ALTER TABLE public.active_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own sessions
CREATE POLICY "sessions_own_only" ON public.active_sessions
    FOR SELECT USING (auth.uid() = user_id);

-- Admins can see all sessions
CREATE POLICY "sessions_admin_all" ON public.active_sessions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_active_sessions_user_id 
ON public.active_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_active_sessions_expires 
ON public.active_sessions(expires_at);

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    cleaned_count INTEGER;
BEGIN
    -- Mark expired sessions as inactive
    UPDATE public.active_sessions 
    SET is_active = FALSE
    WHERE expires_at < NOW() AND is_active = TRUE;
    
    GET DIAGNOSTICS cleaned_count = ROW_COUNT;
    
    -- Log cleanup activity
    PERFORM public.log_security_event(
        'session_cleanup',
        'active_sessions',
        true,
        jsonb_build_object('cleaned_sessions', cleaned_count)
    );
    
    RETURN cleaned_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public, extensions;

-- ============================================================================
-- ADMIN SECURITY ENHANCEMENTS
-- ============================================================================

-- Create admin activity log
CREATE TABLE IF NOT EXISTS public.admin_activity_log (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    admin_id UUID REFERENCES public.profiles(id) NOT NULL,
    action TEXT NOT NULL,
    target_type TEXT, -- 'user', 'upload', 'verification', etc.
    target_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on admin activity log
ALTER TABLE public.admin_activity_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view admin activity
CREATE POLICY "admin_activity_admin_only" ON public.admin_activity_log
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- Function to log admin actions
CREATE OR REPLACE FUNCTION public.log_admin_action(
    p_action TEXT,
    p_target_type TEXT DEFAULT NULL,
    p_target_id UUID DEFAULT NULL,
    p_old_values JSONB DEFAULT NULL,
    p_new_values JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
    admin_profile RECORD;
BEGIN
    -- Verify user is admin
    SELECT * INTO admin_profile
    FROM public.profiles
    WHERE id = auth.uid() AND is_admin = TRUE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
    END IF;
    
    -- Log the admin action
    INSERT INTO public.admin_activity_log (
        admin_id, action, target_type, target_id, old_values, new_values
    ) VALUES (
        auth.uid(), p_action, p_target_type, p_target_id, p_old_values, p_new_values
    ) RETURNING id INTO log_id;
    
    -- Also log to security audit
    PERFORM public.log_security_event(
        'admin_action',
        p_target_type,
        true,
        jsonb_build_object(
            'action', p_action,
            'target_id', p_target_id,
            'admin_id', auth.uid()
        )
    );
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public, extensions;

-- ============================================================================
-- SECURITY MONITORING VIEWS
-- ============================================================================

-- Create security dashboard view for admins
CREATE OR REPLACE VIEW public.security_dashboard AS
SELECT 
    'failed_logins_24h' as metric,
    COUNT(*)::TEXT as value,
    'Failed login attempts in last 24 hours' as description
FROM public.failed_login_attempts
WHERE attempted_at > NOW() - INTERVAL '24 hours'

UNION ALL

SELECT 
    'active_sessions' as metric,
    COUNT(*)::TEXT as value,
    'Currently active user sessions' as description
FROM public.active_sessions
WHERE is_active = TRUE AND expires_at > NOW()

UNION ALL

SELECT 
    'admin_actions_24h' as metric,
    COUNT(*)::TEXT as value,
    'Admin actions in last 24 hours' as description
FROM public.admin_activity_log
WHERE created_at > NOW() - INTERVAL '24 hours'

UNION ALL

SELECT 
    'security_events_24h' as metric,
    COUNT(*)::TEXT as value,
    'Security events logged in last 24 hours' as description
FROM public.security_audit_log
WHERE created_at > NOW() - INTERVAL '24 hours';

-- Grant access to security dashboard for admins
GRANT SELECT ON public.security_dashboard TO authenticated;

COMMENT ON MIGRATION IS 'Auth security hardening: event logging, rate limiting, session management, and admin monitoring';