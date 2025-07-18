-- Quote & Booking System Database Schema
-- Add these tables to your existing Supabase schema

-- Quote requests table
CREATE TABLE public.quote_requests (
    id TEXT PRIMARY KEY, -- Custom format: quote_timestamp_random
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    cruise_id TEXT NOT NULL, -- Reference to cruise from CSV data
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    client_name TEXT NOT NULL, -- Full name (First Middle Last)
    token TEXT NOT NULL UNIQUE, -- Secure token for quote form access
    status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'expired'
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Quote pricing (filled by Stephen's team)
    interior_price DECIMAL(10,2),
    oceanview_price DECIMAL(10,2),
    balcony_price DECIMAL(10,2),
    suite_price DECIMAL(10,2),
    notes TEXT,
    valid_until DATE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Cruise details snapshot (for reference)
    cruise_data JSONB NOT NULL
);

-- Bookings table
CREATE TABLE public.bookings (
    id TEXT PRIMARY KEY, -- Custom format: booking_timestamp_random
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    quote_request_id TEXT REFERENCES public.quote_requests(id),
    
    -- Primary guest details
    first_name TEXT NOT NULL,
    middle_name TEXT,
    last_name TEXT NOT NULL,
    date_of_birth DATE NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    
    -- Booking details
    cabin_type TEXT NOT NULL, -- 'Interior', 'Oceanview', 'Balcony', 'Suite'
    special_requests TEXT,
    
    -- Document uploads (stored as JSON array)
    uploaded_documents JSONB NOT NULL DEFAULT '[]',
    
    -- Status tracking
    status TEXT DEFAULT 'pending', -- 'pending', 'confirmed', 'cancelled'
    
    -- Cruise details snapshot
    cruise_data JSONB NOT NULL
);

-- RLS for quote_requests table
ALTER TABLE public.quote_requests ENABLE ROW LEVEL SECURITY;

-- Quote requests policies
CREATE POLICY "Users can view own quote requests" ON public.quote_requests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quote requests" ON public.quote_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all quote requests" ON public.quote_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- RLS for bookings table
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Bookings policies
CREATE POLICY "Users can view own bookings" ON public.bookings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.quote_requests 
            WHERE id = quote_request_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert bookings from own quotes" ON public.bookings
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.quote_requests 
            WHERE id = quote_request_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all bookings" ON public.bookings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- Indexes for performance
CREATE INDEX idx_quote_requests_user_id ON public.quote_requests(user_id);
CREATE INDEX idx_quote_requests_token ON public.quote_requests(token);
CREATE INDEX idx_quote_requests_status ON public.quote_requests(status);
CREATE INDEX idx_quote_requests_expires_at ON public.quote_requests(expires_at);

CREATE INDEX idx_bookings_quote_request_id ON public.bookings(quote_request_id);
CREATE INDEX idx_bookings_email ON public.bookings(email);
CREATE INDEX idx_bookings_status ON public.bookings(status);

-- Triggers for updated_at
CREATE TRIGGER handle_quote_requests_updated_at
    BEFORE UPDATE ON public.quote_requests
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_bookings_updated_at
    BEFORE UPDATE ON public.bookings
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Storage bucket for booking documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('booking-documents', 'booking-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for booking-documents bucket
CREATE POLICY "Allow booking document uploads" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'booking-documents'
    );

CREATE POLICY "Users can view own booking documents" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'booking-documents' AND
        (storage.foldername(name))[1] IN (
            SELECT id FROM public.bookings 
            WHERE EXISTS (
                SELECT 1 FROM public.quote_requests 
                WHERE id = quote_request_id AND user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Admins can view all booking documents" ON storage.objects
    FOR ALL USING (
        bucket_id = 'booking-documents' AND
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- Function to clean up expired quote requests (run periodically)
CREATE OR REPLACE FUNCTION public.cleanup_expired_quotes()
RETURNS INTEGER AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    UPDATE public.quote_requests 
    SET status = 'expired'
    WHERE status = 'pending' 
    AND expires_at < NOW();
    
    GET DIAGNOSTICS expired_count = ROW_COUNT;
    RETURN expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Sample data for testing (uncomment if needed)
-- INSERT INTO public.quote_requests (
--     id, cruise_id, user_id, client_name, token, expires_at, cruise_data
-- ) VALUES (
--     'quote_test_123',
--     'sample_cruise_1',
--     (SELECT id FROM auth.users LIMIT 1),
--     'John Doe',
--     'test_token_123',
--     NOW() + INTERVAL '7 days',
--     '{"cruise_line": "Test Line", "ship_name": "Test Ship"}'::jsonb
-- );