-- Database Schema for Lifecycle Email System
-- Add these tables to your Supabase database

-- Email log table to track sent emails and prevent duplicates
CREATE TABLE IF NOT EXISTS email_log (
  id SERIAL PRIMARY KEY,
  booking_id VARCHAR(50) NOT NULL,
  email_type VARCHAR(50) NOT NULL, -- 'bon_voyage', 'welcome_home', 'birthday'
  sent_at TIMESTAMP DEFAULT NOW(),
  year_sent INTEGER, -- For birthday emails to track yearly sends
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Indexes for performance
  UNIQUE(booking_id, email_type, year_sent) -- Prevent duplicate sends
);

-- Update bookings table to include fields needed for scheduling
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS cruise_departure_date DATE,
ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- Indexes for efficient email scheduling queries
CREATE INDEX IF NOT EXISTS idx_bookings_departure_date ON bookings(cruise_departure_date) WHERE status = 'confirmed';
CREATE INDEX IF NOT EXISTS idx_bookings_birthday ON bookings(date_of_birth) WHERE status = 'confirmed';
CREATE INDEX IF NOT EXISTS idx_email_log_booking_type ON email_log(booking_id, email_type);

-- Sample data structure for testing
-- INSERT INTO bookings (
--   booking_id, user_email, guest_name, cruise_data, cabin_type, guest_count,
--   total_amount, status, cruise_booking_number, cabin_number, 
--   final_client_price, nett_price, cruise_departure_date, date_of_birth
-- ) VALUES (
--   'TEST-123', 'test@example.com', 'John Doe', 
--   '{"shipName": "Test Ship", "cruiseLine": "Test Line", "nights": 7, "from": "Miami", "to": "Caribbean"}',
--   'Balcony', 2, '$3000', 'confirmed', 'TCL123456', 'B-234',
--   3000.00, 2500.00, '2024-03-15', '1985-03-12'
-- );

-- Function to get upcoming departures (for testing)
CREATE OR REPLACE FUNCTION get_upcoming_departures(days_ahead INTEGER DEFAULT 3)
RETURNS TABLE (
  booking_id VARCHAR(50),
  guest_name VARCHAR(255),
  user_email VARCHAR(255),
  cruise_departure_date DATE,
  cruise_data JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.booking_id,
    b.guest_name,
    b.user_email,
    b.cruise_departure_date,
    b.cruise_data
  FROM bookings b
  WHERE b.status = 'confirmed'
    AND b.cruise_departure_date = CURRENT_DATE + INTERVAL '1 day' * days_ahead
    AND NOT EXISTS (
      SELECT 1 FROM email_log el 
      WHERE el.booking_id = b.booking_id 
        AND el.email_type = 'bon_voyage'
    );
END;
$$ LANGUAGE plpgsql;

-- Function to get recent returns (for testing)
CREATE OR REPLACE FUNCTION get_recent_returns(days_ago INTEGER DEFAULT 3)
RETURNS TABLE (
  booking_id VARCHAR(50),
  guest_name VARCHAR(255),
  user_email VARCHAR(255),
  cruise_departure_date DATE,
  cruise_data JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.booking_id,
    b.guest_name,
    b.user_email,
    b.cruise_departure_date,
    b.cruise_data
  FROM bookings b
  WHERE b.status = 'confirmed'
    AND b.cruise_departure_date + INTERVAL '1 day' * (b.cruise_data->>'nights')::INTEGER + INTERVAL '1 day' * days_ago = CURRENT_DATE
    AND NOT EXISTS (
      SELECT 1 FROM email_log el 
      WHERE el.booking_id = b.booking_id 
        AND el.email_type = 'welcome_home'
    );
END;
$$ LANGUAGE plpgsql;

-- Function to get today's birthdays (for testing)
CREATE OR REPLACE FUNCTION get_todays_birthdays()
RETURNS TABLE (
  booking_id VARCHAR(50),
  guest_name VARCHAR(255),
  user_email VARCHAR(255),
  date_of_birth DATE,
  age INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.booking_id,
    b.guest_name,
    b.user_email,
    b.date_of_birth,
    EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER - EXTRACT(YEAR FROM b.date_of_birth)::INTEGER AS age
  FROM bookings b
  WHERE b.status = 'confirmed'
    AND EXTRACT(MONTH FROM b.date_of_birth) = EXTRACT(MONTH FROM CURRENT_DATE)
    AND EXTRACT(DAY FROM b.date_of_birth) = EXTRACT(DAY FROM CURRENT_DATE)
    AND NOT EXISTS (
      SELECT 1 FROM email_log el 
      WHERE el.booking_id = b.booking_id 
        AND el.email_type = 'birthday'
        AND el.year_sent = EXTRACT(YEAR FROM CURRENT_DATE)
    );
END;
$$ LANGUAGE plpgsql;

-- Grant permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE ON email_log TO authenticated;
-- GRANT SELECT, UPDATE ON bookings TO authenticated;
-- GRANT EXECUTE ON FUNCTION get_upcoming_departures TO authenticated;
-- GRANT EXECUTE ON FUNCTION get_recent_returns TO authenticated;
-- GRANT EXECUTE ON FUNCTION get_todays_birthdays TO authenticated;