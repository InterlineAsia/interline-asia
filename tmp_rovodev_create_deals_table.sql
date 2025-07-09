-- Create the deals table and view that the website expects
-- Run this in your Supabase SQL Editor

-- Create deals table for cruise deal data
CREATE TABLE IF NOT EXISTS public.deals (
  id BIGSERIAL PRIMARY KEY,
  cruise_line TEXT NOT NULL,
  ship_name TEXT NOT NULL,
  cruise_name TEXT NOT NULL,
  departure_date DATE,
  return_date DATE,
  price INTEGER NOT NULL DEFAULT 0,
  cabin_type TEXT,
  category TEXT DEFAULT 'standard',
  itinerary TEXT,
  region TEXT DEFAULT 'Other',
  duration INTEGER, -- Number of days
  link_to_pdf TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_deals_cruise_line ON deals(cruise_line);
CREATE INDEX IF NOT EXISTS idx_deals_region ON deals(region);
CREATE INDEX IF NOT EXISTS idx_deals_category ON deals(category);
CREATE INDEX IF NOT EXISTS idx_deals_departure_date ON deals(departure_date);
CREATE INDEX IF NOT EXISTS idx_deals_price ON deals(price);
CREATE INDEX IF NOT EXISTS idx_deals_duration ON deals(duration);

-- Create a composite index for common filter combinations
CREATE INDEX IF NOT EXISTS idx_deals_filters ON deals(cruise_line, region, category, departure_date);

-- Enable Row Level Security (RLS)
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to read deals
CREATE POLICY "Allow authenticated users to read deals" ON deals
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policy to allow service role to manage deals
CREATE POLICY "Allow service role to manage deals" ON deals
  FOR ALL
  TO service_role
  USING (true);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_deals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_deals_updated_at
  BEFORE UPDATE ON deals
  FOR EACH ROW
  EXECUTE FUNCTION update_deals_updated_at();

-- Create a view for dashboard queries with computed fields
CREATE OR REPLACE VIEW deals_dashboard AS
SELECT 
  id,
  cruise_line,
  ship_name,
  cruise_name,
  departure_date,
  return_date,
  price,
  cabin_type,
  category,
  itinerary,
  region,
  duration,
  link_to_pdf,
  description,
  created_at,
  updated_at,
  -- Computed fields for dashboard
  CASE 
    WHEN departure_date IS NOT NULL THEN 
      TO_CHAR(departure_date, 'Mon DD, YYYY')
    ELSE 'TBA'
  END as formatted_departure,
  CASE 
    WHEN return_date IS NOT NULL THEN 
      TO_CHAR(return_date, 'Mon DD, YYYY')
    ELSE 'TBA'
  END as formatted_return,
  CASE 
    WHEN duration IS NOT NULL THEN 
      duration || ' days'
    ELSE 'TBA'
  END as formatted_duration,
  '$' || TO_CHAR(price, 'FM999,999') as formatted_price
FROM deals
WHERE price > 0
ORDER BY departure_date ASC NULLS LAST, price ASC;

-- Insert sample deals data
INSERT INTO deals (cruise_line, ship_name, cruise_name, departure_date, return_date, price, cabin_type, category, itinerary, region, duration, description) VALUES
('Royal Caribbean', 'Symphony of the Seas', 'Caribbean Adventure', '2024-12-15', '2024-12-22', 1299, 'Interior', 'standard', 'Miami - Cozumel - Jamaica - Miami', 'Caribbean', 7, 'Explore the beautiful Caribbean islands with Royal Caribbean'),
('Norwegian', 'Norwegian Escape', 'Mediterranean Explorer', '2024-12-20', '2024-12-30', 1899, 'Balcony', 'premium', 'Barcelona - Rome - Naples - Barcelona', 'Mediterranean', 10, 'Discover the Mediterranean with Norwegian Cruise Line'),
('Celebrity', 'Celebrity Eclipse', 'Alaska Glacier Bay', '2025-01-10', '2025-01-17', 2299, 'Suite', 'luxury', 'Seattle - Juneau - Glacier Bay - Seattle', 'Alaska', 7, 'Experience the majesty of Alaska with Celebrity Cruises'),
('Princess', 'Crown Princess', 'Asia Discovery', '2025-01-15', '2025-01-29', 3299, 'Balcony', 'premium', 'Singapore - Hong Kong - Tokyo - Singapore', 'Asia', 14, 'Explore exotic Asia with Princess Cruises'),
('MSC', 'MSC Seaside', 'Caribbean Paradise', '2025-02-01', '2025-02-08', 999, 'Interior', 'standard', 'Miami - Barbados - St. Lucia - Miami', 'Caribbean', 7, 'Affordable Caribbean cruise with MSC');

-- Verify the data was inserted
SELECT COUNT(*) as total_deals FROM deals;
SELECT COUNT(*) as dashboard_deals FROM deals_dashboard;