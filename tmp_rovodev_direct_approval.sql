-- Direct approval bypassing triggers
-- Run this in Supabase SQL Editor

-- 1. First disable all triggers temporarily
ALTER TABLE public.profiles DISABLE TRIGGER ALL;

-- 2. Update the user directly
UPDATE public.profiles 
SET verified = true 
WHERE email = 'admin@telenational.com.au';

-- 3. Re-enable triggers
ALTER TABLE public.profiles ENABLE TRIGGER ALL;

-- 4. Verify the update worked
SELECT full_name, email, verified, role, updated_at
FROM public.profiles 
WHERE email = 'admin@telenational.com.au';