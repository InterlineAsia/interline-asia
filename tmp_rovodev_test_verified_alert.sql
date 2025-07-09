-- Test script for the verified user alert system
-- Run this after setting up the trigger to test the functionality

-- 1. First, let's see current users and their verification status
SELECT 
  id,
  full_name,
  email,
  verification_status,
  created_at
FROM public.profiles
ORDER BY created_at DESC
LIMIT 10;

-- 2. Create a test user if needed (uncomment and modify as needed)
-- INSERT INTO public.profiles (id, full_name, email, verification_status)
-- VALUES (
--   uuid_generate_v4(),
--   'Test User for Alert',
--   'test.alert@example.com',
--   'pending'
-- );

-- 3. Test the trigger by updating a user to verified
-- Replace 'USER_ID_HERE' with an actual user ID from step 1
-- UPDATE public.profiles 
-- SET verification_status = 'verified' 
-- WHERE id = 'USER_ID_HERE' 
-- AND verification_status != 'verified';

-- 4. Check if the update worked
-- SELECT 
--   id,
--   full_name,
--   email,
--   verification_status,
--   updated_at
-- FROM public.profiles
-- WHERE id = 'USER_ID_HERE';

-- Note: After running the UPDATE, check your Edge Function logs in Supabase Dashboard
-- and verify that admin@interlineasia.com received the notification email