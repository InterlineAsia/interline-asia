-- Fix CSV Processor - Create missing deals_dashboard view
-- Run this in your Supabase SQL Editor

-- Create deals_dashboard view based on existing cruise_deals table
CREATE OR REPLACE VIEW public.deals_dashboard AS
SELECT 
  id,
  cruise_line,
  ship_name,
  departure_date,
  region,
  nights as duration,
  departure_port,
  arrival_port,
  itinerary,
  inside_price,
  oceanview_price,
  balcony_price,
  suite_price,
  seq_number,
  created_at,
  updated_at,
  
  -- Computed fields for dashboard
  CASE 
    WHEN departure_date IS NOT NULL THEN 
      TO_CHAR(departure_date, 'Mon DD, YYYY')
    ELSE 'TBA'
  END as formatted_departure,
  
  -- Extract numeric price from inside_price for sorting
  CASE 
    WHEN inside_price ~ '^[0-9]+(\.[0-9]+)?$' THEN 
      inside_price::numeric
    ELSE 0
  END as price,
  
  '$' || COALESCE(inside_price, 'Quote Available') as formatted_price
  
FROM public.cruise_deals
WHERE is_active = TRUE
ORDER BY departure_date ASC NULLS LAST, 
         CASE WHEN inside_price ~ '^[0-9]+(\.[0-9]+)?$' THEN inside_price::numeric ELSE 999999 END ASC;

-- Grant access to the view
GRANT SELECT ON public.deals_dashboard TO authenticated;
GRANT SELECT ON public.deals_dashboard TO anon;