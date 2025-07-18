-- Disable RLS on storage.objects to allow admin uploads
-- This is a temporary solution to fix the upload issue

-- First, disable RLS on the storage.objects table
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Create the uploads bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Grant all privileges on storage schema and tables
GRANT ALL PRIVILEGES ON SCHEMA storage TO authenticated;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA storage TO authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA storage TO authenticated;

-- Create cruise_deals table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.cruise_deals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cruise_line TEXT NOT NULL,
    ship_name TEXT NOT NULL,
    departure_date DATE,
    region TEXT,
    nights INTEGER,
    itinerary TEXT,
    inside_price DECIMAL(10, 2),
    oceanview_price DECIMAL(10, 2),
    balcony_price DECIMAL(10, 2),
    suite_price DECIMAL(10, 2),
    departure_port TEXT,
    arrival_port TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable RLS on cruise_deals table
ALTER TABLE public.cruise_deals DISABLE ROW LEVEL SECURITY;

-- Grant all privileges on cruise_deals table
GRANT ALL PRIVILEGES ON TABLE public.cruise_deals TO authenticated;