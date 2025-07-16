-- Favorites System Schema - Interline Asia
-- Tables for user favorites, saved searches, and preferences

-- User Favorites Table
CREATE TABLE IF NOT EXISTS public.user_favorites (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    cruise_id TEXT NOT NULL,
    cruise_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Prevent duplicate favorites
    UNIQUE(user_id, cruise_id)
);

-- Saved Searches Table
CREATE TABLE IF NOT EXISTS public.saved_searches (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    search_name TEXT NOT NULL,
    filters JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Limit number of saved searches per user
    CONSTRAINT check_search_name_length CHECK (char_length(search_name) <= 100)
);

-- User Preferences Table
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    preferences JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics Events Table (Enhanced)
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_id TEXT UNIQUE NOT NULL,
    session_id TEXT NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    event_name TEXT NOT NULL,
    properties JSONB DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    page TEXT,
    user_agent TEXT,
    
    -- Index for common queries
    INDEX idx_analytics_events_user_id (user_id),
    INDEX idx_analytics_events_event_name (event_name),
    INDEX idx_analytics_events_timestamp (timestamp)
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON public.user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_cruise_id ON public.user_favorites(cruise_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_created_at ON public.user_favorites(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_saved_searches_user_id ON public.saved_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_searches_created_at ON public.saved_searches(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);

-- Enhanced indexes for deals_dashboard (if not already present)
CREATE INDEX IF NOT EXISTS idx_deals_dashboard_filters ON public.deals_dashboard(cruise_line, region, departure_date, price);
CREATE INDEX IF NOT EXISTS idx_deals_dashboard_search ON public.deals_dashboard USING gin(to_tsvector('english', cruise_line || ' ' || ship_name || ' ' || region || ' ' || itinerary));

-- Row Level Security (RLS) Policies

-- User Favorites RLS
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own favorites" ON public.user_favorites
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites" ON public.user_favorites
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own favorites" ON public.user_favorites
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites" ON public.user_favorites
    FOR DELETE USING (auth.uid() = user_id);

-- Saved Searches RLS
ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved searches" ON public.saved_searches
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved searches" ON public.saved_searches
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own saved searches" ON public.saved_searches
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved searches" ON public.saved_searches
    FOR DELETE USING (auth.uid() = user_id);

-- User Preferences RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences" ON public.user_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" ON public.user_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON public.user_preferences
    FOR UPDATE USING (auth.uid() = user_id);

-- Analytics Events RLS (Users can only see their own events)
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own analytics events" ON public.analytics_events
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Anyone can insert analytics events" ON public.analytics_events
    FOR INSERT WITH CHECK (true);

-- Admins can view all analytics
CREATE POLICY "Admins can view all analytics events" ON public.analytics_events
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- Functions for maintenance

-- Function to clean old analytics events (keep last 90 days)
CREATE OR REPLACE FUNCTION clean_old_analytics_events()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.analytics_events 
    WHERE timestamp < NOW() - INTERVAL '90 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user favorites summary
CREATE OR REPLACE FUNCTION get_user_favorites_summary(user_uuid UUID)
RETURNS TABLE(
    total_favorites BIGINT,
    cruise_types JSONB,
    regions JSONB,
    recent_favorites JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_favorites,
        jsonb_object_agg(
            COALESCE(cruise_data->>'cruiseType', 'Unknown'),
            type_counts.count
        ) as cruise_types,
        jsonb_object_agg(
            COALESCE(cruise_data->>'region', 'Unknown'),
            region_counts.count
        ) as regions,
        jsonb_agg(
            jsonb_build_object(
                'cruise_id', cruise_id,
                'cruise_data', cruise_data,
                'created_at', created_at
            ) ORDER BY created_at DESC
        ) FILTER (WHERE row_number() OVER (ORDER BY created_at DESC) <= 5) as recent_favorites
    FROM public.user_favorites
    LEFT JOIN LATERAL (
        SELECT COUNT(*) as count
        FROM public.user_favorites uf2
        WHERE uf2.user_id = user_uuid 
        AND COALESCE(uf2.cruise_data->>'cruiseType', 'Unknown') = COALESCE(user_favorites.cruise_data->>'cruiseType', 'Unknown')
    ) type_counts ON true
    LEFT JOIN LATERAL (
        SELECT COUNT(*) as count
        FROM public.user_favorites uf3
        WHERE uf3.user_id = user_uuid 
        AND COALESCE(uf3.cruise_data->>'region', 'Unknown') = COALESCE(user_favorites.cruise_data->>'region', 'Unknown')
    ) region_counts ON true
    WHERE user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for updated_at timestamps

-- User Favorites updated_at trigger
CREATE OR REPLACE FUNCTION update_user_favorites_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_favorites_updated_at
    BEFORE UPDATE ON public.user_favorites
    FOR EACH ROW EXECUTE FUNCTION update_user_favorites_updated_at();

-- Saved Searches updated_at trigger
CREATE OR REPLACE FUNCTION update_saved_searches_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER saved_searches_updated_at
    BEFORE UPDATE ON public.saved_searches
    FOR EACH ROW EXECUTE FUNCTION update_saved_searches_updated_at();

-- User Preferences updated_at trigger
CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_preferences_updated_at
    BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_user_preferences_updated_at();

-- Sample data for testing (optional)
/*
-- Insert sample favorites for testing
INSERT INTO public.user_favorites (user_id, cruise_id, cruise_data) VALUES
(
    (SELECT id FROM public.profiles WHERE email = 'test@example.com' LIMIT 1),
    'sample_cruise_1',
    '{
        "cruiseLine": "Royal Caribbean",
        "shipName": "Symphony of the Seas",
        "region": "Caribbean",
        "departureDate": "2025-07-15",
        "nights": 7,
        "price": 1299,
        "cruiseType": "Ocean Cruise"
    }'::jsonb
);

-- Insert sample saved search
INSERT INTO public.saved_searches (user_id, search_name, filters) VALUES
(
    (SELECT id FROM public.profiles WHERE email = 'test@example.com' LIMIT 1),
    'Caribbean 7-night cruises',
    '{
        "region": "Caribbean",
        "nights": "7",
        "cruise-type": "Ocean Cruise"
    }'::jsonb
);
*/

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_favorites TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_searches TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_preferences TO authenticated;
GRANT SELECT, INSERT ON public.analytics_events TO authenticated;

-- Grant admin permissions
GRANT ALL ON public.user_favorites TO service_role;
GRANT ALL ON public.saved_searches TO service_role;
GRANT ALL ON public.user_preferences TO service_role;
GRANT ALL ON public.analytics_events TO service_role;