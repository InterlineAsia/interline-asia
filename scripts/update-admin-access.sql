-- Interline Asia - Update Admin Access Configuration
-- Ensure only admin@telenational.com.au has admin privileges

-- First, remove admin privileges from all users
UPDATE users 
SET is_admin = false, is_super_admin = false 
WHERE email != 'admin@telenational.com.au';

-- Grant admin privileges only to admin@telenational.com.au
UPDATE users 
SET is_admin = true, is_super_admin = true 
WHERE email = 'admin@telenational.com.au';

-- Ensure rodney@telenational.com.au is a regular user (not admin)
UPDATE users 
SET is_admin = false, is_super_admin = false 
WHERE email = 'rodney@telenational.com.au';

-- Create admin user if it doesn't exist
INSERT INTO users (email, full_name, is_admin, is_super_admin, is_verified, verification_status)
VALUES ('admin@telenational.com.au', 'System Administrator', true, true, true, 'verified')
ON CONFLICT (email) 
DO UPDATE SET 
  is_admin = true, 
  is_super_admin = true, 
  is_verified = true, 
  verification_status = 'verified';

-- Verify the configuration
SELECT email, full_name, is_admin, is_super_admin, is_verified 
FROM users 
WHERE email IN ('admin@telenational.com.au', 'rodney@telenational.com.au')
ORDER BY email;