-- Interline Asia Booking System Database Schema
-- This creates the tables needed for the cruise booking flow

-- Create bookings table
CREATE TABLE IF NOT EXISTS public.bookings (
    id BIGSERIAL PRIMARY KEY,
    reference_number TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    cruise_id TEXT NOT NULL,
    cruise_line TEXT NOT NULL,
    ship_name TEXT NOT NULL,
    departure_date DATE,
    nights INTEGER,
    region TEXT,
    cabin_type TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'declined', 'cancelled')),
    supplier_response TEXT,
    cabin_number TEXT,
    official_booking_number TEXT,
    payment_amount DECIMAL(10,2),
    payment_instructions TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ,
    declined_at TIMESTAMPTZ
);

-- Create passengers table
CREATE TABLE IF NOT EXISTS public.passengers (
    id BIGSERIAL PRIMARY KEY,
    booking_id BIGINT REFERENCES public.bookings(id) ON DELETE CASCADE,
    passenger_number INTEGER NOT NULL,
    full_name TEXT NOT NULL,
    date_of_birth DATE NOT NULL,
    nationality TEXT NOT NULL,
    email TEXT NOT NULL,
    mobile TEXT NOT NULL,
    passport_file_url TEXT,
    industry_proof_file_url TEXT,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create booking_files table for document storage
CREATE TABLE IF NOT EXISTS public.booking_files (
    id BIGSERIAL PRIMARY KEY,
    booking_id BIGINT REFERENCES public.bookings(id) ON DELETE CASCADE,
    passenger_id BIGINT REFERENCES public.passengers(id) ON DELETE CASCADE,
    file_type TEXT NOT NULL CHECK (file_type IN ('passport', 'industry_proof')),
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passengers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_files ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for bookings
CREATE POLICY "Users can view their own bookings" ON public.bookings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bookings" ON public.bookings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookings" ON public.bookings
    FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for passengers
CREATE POLICY "Users can view passengers for their bookings" ON public.passengers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.bookings 
            WHERE bookings.id = passengers.booking_id 
            AND bookings.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create passengers for their bookings" ON public.passengers
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.bookings 
            WHERE bookings.id = passengers.booking_id 
            AND bookings.user_id = auth.uid()
        )
    );

-- Create RLS policies for booking files
CREATE POLICY "Users can view files for their bookings" ON public.booking_files
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.bookings 
            WHERE bookings.id = booking_files.booking_id 
            AND bookings.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can upload files for their bookings" ON public.booking_files
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.bookings 
            WHERE bookings.id = booking_files.booking_id 
            AND bookings.user_id = auth.uid()
        )
    );

-- Admin policies (allow admins to see all bookings)
CREATE POLICY "Admins can view all bookings" ON public.bookings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND (users.is_admin = true OR users.is_super_admin = true)
        )
    );

CREATE POLICY "Admins can view all passengers" ON public.passengers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND (users.is_admin = true OR users.is_super_admin = true)
        )
    );

CREATE POLICY "Admins can view all booking files" ON public.booking_files
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND (users.is_admin = true OR users.is_super_admin = true)
        )
    );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_reference_number ON public.bookings(reference_number);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON public.bookings(created_at);
CREATE INDEX IF NOT EXISTS idx_passengers_booking_id ON public.passengers(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_files_booking_id ON public.booking_files(booking_id);

-- Create updated_at trigger for bookings
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_bookings_updated_at 
    BEFORE UPDATE ON public.bookings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to generate reference numbers
CREATE OR REPLACE FUNCTION generate_booking_reference()
RETURNS TEXT AS $$
DECLARE
    ref_number TEXT;
    date_part TEXT;
    counter INTEGER;
BEGIN
    -- Get current date in YYYYMMDD format
    date_part := to_char(NOW(), 'YYYYMMDD');
    
    -- Get next counter for today
    SELECT COALESCE(MAX(CAST(SUBSTRING(reference_number FROM 'CRUISE-REQ-\d{8}-(\d{3})') AS INTEGER)), 0) + 1
    INTO counter
    FROM public.bookings
    WHERE reference_number LIKE 'CRUISE-REQ-' || date_part || '-%';
    
    -- Format reference number
    ref_number := 'CRUISE-REQ-' || date_part || '-' || LPAD(counter::TEXT, 3, '0');
    
    RETURN ref_number;
END;
$$ LANGUAGE plpgsql;

-- Create storage bucket for booking files (if using Supabase Storage)
-- Note: This would typically be done through the Supabase dashboard or API
-- INSERT INTO storage.buckets (id, name, public) VALUES ('booking-documents', 'booking-documents', false);

-- Create storage policies (if using Supabase Storage)
-- CREATE POLICY "Users can upload their booking documents" ON storage.objects
--     FOR INSERT WITH CHECK (bucket_id = 'booking-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Users can view their booking documents" ON storage.objects
--     FOR SELECT USING (bucket_id = 'booking-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Grant permissions
GRANT ALL ON public.bookings TO authenticated;
GRANT ALL ON public.passengers TO authenticated;
GRANT ALL ON public.booking_files TO authenticated;
GRANT USAGE ON SEQUENCE public.bookings_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE public.passengers_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE public.booking_files_id_seq TO authenticated;