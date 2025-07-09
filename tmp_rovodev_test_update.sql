-- Test script to update user and trigger the notification

-- 1. First, let's see if the user exists and current status
SELECT id, full_name, email, verified, created_at, updated_at
FROM public.profiles 
WHERE id = '9032acf2-b0c9-4f7e-89ae-68546659ea93';

-- 2. Update the user's verified field to TRUE (this should trigger the notification)
UPDATE public.profiles
SET verified = TRUE
WHERE id = '9032acf2-b0c9-4f7e-89ae-68546659ea93'
AND verified = FALSE;

-- 3. Verify the update worked
SELECT id, full_name, email, verified, updated_at
FROM public.profiles 
WHERE id = '9032acf2-b0c9-4f7e-89ae-68546659ea93';

-- 4. Check if any other users need the verified column
SELECT COUNT(*) as total_users,
       COUNT(CASE WHEN verified IS NULL THEN 1 END) as users_without_verified_column
FROM public.profiles;