-- Create deals table for cruise deal data from CSV uploads
-- This table will store all cruise deals parsed from the CSV files

CREATE TABLE IF NOT EXISTS deals (
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