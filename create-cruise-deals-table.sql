-- Create cruise_deals table for storing cruise deal information

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

-- Create index for faster searches
CREATE INDEX IF NOT EXISTS cruise_deals_departure_date_idx ON public.cruise_deals (departure_date);
CREATE INDEX IF NOT EXISTS cruise_deals_cruise_line_idx ON public.cruise_deals (cruise_line);
CREATE INDEX IF NOT EXISTS cruise_deals_region_idx ON public.cruise_deals (region);

-- Create a view for the dashboard
CREATE OR REPLACE VIEW public.deals_dashboard AS
SELECT 
    id,
    cruise_line,
    ship_name,
    departure_date,
    region,
    nights,
    itinerary,
    inside_price,
    oceanview_price,
    balcony_price,
    suite_price,
    departure_port,
    arrival_port,
    is_active,
    created_at,
    updated_at,
    LEAST(
        COALESCE(inside_price, 999999), 
        COALESCE(oceanview_price, 999999), 
        COALESCE(balcony_price, 999999), 
        COALESCE(suite_price, 999999)
    ) AS price
FROM 
    public.cruise_deals
WHERE 
    is_active = true;

-- Add RLS policies
ALTER TABLE public.cruise_deals ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read cruise deals
CREATE POLICY "Allow public read access" 
    ON public.cruise_deals 
    FOR SELECT 
    USING (is_active = true);

-- Allow authenticated users to read all cruise deals
CREATE POLICY "Allow authenticated read access" 
    ON public.cruise_deals 
    FOR SELECT 
    TO authenticated 
    USING (true);

-- Allow admins to modify cruise deals
CREATE POLICY "Allow admin full access" 
    ON public.cruise_deals 
    FOR ALL 
    TO authenticated 
    USING (
        auth.jwt() ->> 'email' IN ('admin@interlineasia.com', 'admin@telenational.com.au', 'rodney@telenational.com.au')
    );

-- Grant permissions
GRANT SELECT ON public.cruise_deals TO anon;
GRANT SELECT ON public.cruise_deals TO authenticated;
GRANT SELECT ON public.deals_dashboard TO anon;
GRANT SELECT ON public.deals_dashboard TO authenticated;