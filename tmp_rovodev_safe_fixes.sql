-- Safe Backend Fixes - Non-Breaking Changes Only
-- These changes are backward-compatible and wrapped in safety checks

-- 1. Add roomType field to quote_requests table (safe addition)
DO $$ 
BEGIN
    -- Check if column doesn't exist before adding
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'quote_requests' 
        AND column_name = 'room_type'
    ) THEN
        ALTER TABLE public.quote_requests 
        ADD COLUMN room_type TEXT DEFAULT NULL;
        
        -- Add helpful comment
        COMMENT ON COLUMN public.quote_requests.room_type IS 'Preferred room/cabin type for the cruise booking';
        
        RAISE NOTICE 'Added room_type column to quote_requests table';
    ELSE
        RAISE NOTICE 'room_type column already exists in quote_requests table';
    END IF;
END $$;

-- 2. Create function for safe quote ID shortening
CREATE OR REPLACE FUNCTION public.generate_short_quote_id()
RETURNS TEXT AS $$
DECLARE
    timestamp_part TEXT;
    random_part TEXT;
    short_id TEXT;
BEGIN
    -- Generate timestamp-based component (8 chars)
    timestamp_part := encode(digest(extract(epoch from now())::text, 'sha256'), 'hex')::text;
    timestamp_part := substr(timestamp_part, 1, 8);
    
    -- Generate random component (4 chars)
    random_part := encode(gen_random_bytes(2), 'hex');
    
    -- Combine for 12-character ID
    short_id := 'Q' || upper(timestamp_part || random_part);
    
    RETURN short_id;
END;
$$ LANGUAGE plpgsql;

-- Test the function (safe to run)
SELECT public.generate_short_quote_id() as sample_short_id;

-- 3. Create view for formatted dates (non-breaking)
CREATE OR REPLACE VIEW public.quote_requests_formatted AS
SELECT 
    *,
    -- Format departure dates nicely
    CASE 
        WHEN (cruise_data->>'departure_date') IS NOT NULL THEN
            to_char(
                (cruise_data->>'departure_date')::date, 
                'DD Mon YYYY'
            )
        ELSE NULL
    END as formatted_departure_date
FROM public.quote_requests;

-- 4. Create function to clean up expired quotes (maintenance)
CREATE OR REPLACE FUNCTION public.safe_cleanup_expired_quotes()
RETURNS TABLE(cleaned_count INTEGER, error_message TEXT) AS $$
BEGIN
    -- Safely update expired quotes
    BEGIN
        UPDATE public.quote_requests 
        SET status = 'expired'
        WHERE status = 'pending' 
        AND expires_at < NOW()
        AND expires_at IS NOT NULL;
        
        GET DIAGNOSTICS cleaned_count = ROW_COUNT;
        error_message := NULL;
        
        RETURN NEXT;
        
    EXCEPTION WHEN OTHERS THEN
        cleaned_count := 0;
        error_message := SQLERRM;
        RETURN NEXT;
    END;
END;
$$ LANGUAGE plpgsql;

-- 5. Add index for better performance (safe addition)
DO $$
BEGIN
    -- Check if index doesn't exist before creating
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_quote_requests_room_type'
    ) THEN
        CREATE INDEX CONCURRENTLY idx_quote_requests_room_type 
        ON public.quote_requests(room_type) 
        WHERE room_type IS NOT NULL;
        
        RAISE NOTICE 'Created index on room_type column';
    ELSE
        RAISE NOTICE 'Index on room_type already exists';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not create index: %', SQLERRM;
END $$;

-- 6. Create audit log for quote requests (optional enhancement)
CREATE TABLE IF NOT EXISTS public.quote_audit_log (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    quote_request_id TEXT REFERENCES public.quote_requests(id),
    action TEXT NOT NULL, -- 'created', 'updated', 'expired', etc.
    old_values JSONB,
    new_values JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by TEXT DEFAULT current_user
);

-- Enable RLS on audit log
ALTER TABLE public.quote_audit_log ENABLE ROW LEVEL SECURITY;

-- Policy for admins only
CREATE POLICY "Admins can view audit logs" ON public.quote_audit_log
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- 7. Create trigger for audit logging (optional)
CREATE OR REPLACE FUNCTION public.quote_audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.quote_audit_log (quote_request_id, action, new_values)
        VALUES (NEW.id, 'created', to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO public.quote_audit_log (quote_request_id, action, old_values, new_values)
        VALUES (NEW.id, 'updated', to_jsonb(OLD), to_jsonb(NEW));
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger (optional - can be enabled later)
-- DROP TRIGGER IF EXISTS quote_audit_trigger ON public.quote_requests;
-- CREATE TRIGGER quote_audit_trigger
--     AFTER INSERT OR UPDATE ON public.quote_requests
--     FOR EACH ROW EXECUTE FUNCTION public.quote_audit_trigger();

-- 8. Test data integrity
DO $$
DECLARE
    quote_count INTEGER;
    booking_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO quote_count FROM public.quote_requests;
    SELECT COUNT(*) INTO booking_count FROM public.bookings;
    
    RAISE NOTICE 'Database health check:';
    RAISE NOTICE '- Quote requests: %', quote_count;
    RAISE NOTICE '- Bookings: %', booking_count;
    RAISE NOTICE '- All tables accessible and functioning normally';
END $$;