-- Create direct_bookings table for deal-based bookings
CREATE TABLE IF NOT EXISTS direct_bookings (
    id TEXT PRIMARY KEY,
    deal_id TEXT NOT NULL,
    
    -- Guest 1 Information
    guest1_first_name TEXT NOT NULL,
    guest1_middle_name TEXT,
    guest1_last_name TEXT NOT NULL,
    guest1_date_of_birth DATE NOT NULL,
    
    -- Guest 2 Information  
    guest2_first_name TEXT NOT NULL,
    guest2_middle_name TEXT,
    guest2_last_name TEXT NOT NULL,
    guest2_date_of_birth DATE NOT NULL,
    
    -- Contact Information
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    
    -- Booking Details
    cabin_type TEXT NOT NULL,
    cabin_price TEXT,
    total_amount TEXT,
    cruise_line TEXT,
    ship_name TEXT,
    special_requests TEXT,
    
    -- File Storage
    uploaded_documents JSONB DEFAULT '[]'::jsonb,
    
    -- Status and Timestamps
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_direct_bookings_deal_id ON direct_bookings(deal_id);
CREATE INDEX IF NOT EXISTS idx_direct_bookings_email ON direct_bookings(email);
CREATE INDEX IF NOT EXISTS idx_direct_bookings_status ON direct_bookings(status);
CREATE INDEX IF NOT EXISTS idx_direct_bookings_created_at ON direct_bookings(created_at);

-- Enable RLS (Row Level Security)
ALTER TABLE direct_bookings ENABLE ROW LEVEL SECURITY;

-- Create policy for service role access (for API)
CREATE POLICY "Service role can manage direct bookings" ON direct_bookings
    FOR ALL USING (auth.role() = 'service_role');

-- Create policy for authenticated users to view their own bookings
CREATE POLICY "Users can view their own bookings" ON direct_bookings
    FOR SELECT USING (auth.jwt() ->> 'email' = email);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_direct_bookings_updated_at 
    BEFORE UPDATE ON direct_bookings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create storage bucket for booking documents if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('booking-documents', 'booking-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for booking documents
CREATE POLICY "Service role can upload booking documents" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'booking-documents' AND auth.role() = 'service_role');

CREATE POLICY "Service role can view booking documents" ON storage.objects
    FOR SELECT USING (bucket_id = 'booking-documents' AND auth.role() = 'service_role');

CREATE POLICY "Service role can delete booking documents" ON storage.objects
    FOR DELETE USING (bucket_id = 'booking-documents' AND auth.role() = 'service_role');