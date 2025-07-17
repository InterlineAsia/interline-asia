-- Intelligence Indexes Table for CSV Learning System
-- Stores indexed data for fast cruise bot intelligence

CREATE TABLE IF NOT EXISTS intelligence_indexes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    index_name TEXT NOT NULL UNIQUE,
    index_data JSONB NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_intelligence_indexes_name ON intelligence_indexes(index_name);
CREATE INDEX IF NOT EXISTS idx_intelligence_indexes_updated ON intelligence_indexes(last_updated);

-- Insert initial empty indexes
INSERT INTO intelligence_indexes (index_name, index_data) VALUES
('cruise_lines', '[]'::jsonb),
('regions', '[]'::jsonb),
('price_ranges', '{}'::jsonb),
('duration_ranges', '{}'::jsonb),
('departure_ports', '[]'::jsonb)
ON CONFLICT (index_name) DO NOTHING;

-- Enhanced cruise_deals table (if not exists)
CREATE TABLE IF NOT EXISTS cruise_deals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    seq TEXT UNIQUE NOT NULL,
    cruise_line TEXT,
    ship_name TEXT,
    departure_date TEXT,
    region TEXT,
    nights INTEGER,
    departure_port TEXT,
    arrival_port TEXT,
    itinerary TEXT,
    year TEXT,
    cruise_type TEXT,
    inside_price DECIMAL(10,2),
    oceanview_price DECIMAL(10,2),
    balcony_price DECIMAL(10,2),
    suite_price DECIMAL(10,2),
    min_price DECIMAL(10,2),
    max_price DECIMAL(10,2),
    max_pax INTEGER,
    cruise_offer_url TEXT,
    ship_map TEXT,
    source_file TEXT,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for cruise_deals
CREATE INDEX IF NOT EXISTS idx_cruise_deals_seq ON cruise_deals(seq);
CREATE INDEX IF NOT EXISTS idx_cruise_deals_cruise_line ON cruise_deals(cruise_line);
CREATE INDEX IF NOT EXISTS idx_cruise_deals_region ON cruise_deals(region);
CREATE INDEX IF NOT EXISTS idx_cruise_deals_nights ON cruise_deals(nights);
CREATE INDEX IF NOT EXISTS idx_cruise_deals_min_price ON cruise_deals(min_price);
CREATE INDEX IF NOT EXISTS idx_cruise_deals_departure_date ON cruise_deals(departure_date);
CREATE INDEX IF NOT EXISTS idx_cruise_deals_source_file ON cruise_deals(source_file);

-- Enable Row Level Security
ALTER TABLE intelligence_indexes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cruise_deals ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Admin full access to intelligence_indexes" ON intelligence_indexes
    FOR ALL USING (true);

CREATE POLICY "Admin full access to cruise_deals" ON cruise_deals
    FOR ALL USING (true);

-- Grant permissions
GRANT ALL ON intelligence_indexes TO authenticated;
GRANT ALL ON cruise_deals TO authenticated;