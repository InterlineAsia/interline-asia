-- Create Stephen Williams user account - Interline Asia
-- User-only access (not admin) for stephenw@interlinetravel.com.au
-- Run this SQL in your Supabase SQL Editor

-- Step 1: Create the auth user (you'll need to do this via Supabase Auth dashboard)
-- Go to Authentication > Users > Add User
-- Email: stephenw@interlinetravel.com.au
-- Password: stephenw2025$
-- Auto Confirm User: YES

-- Step 2: Create/update the profile (run this SQL after creating the auth user)
-- Replace 'USER_ID_HERE' with the actual UUID from the auth user created above

INSERT INTO public.profiles (
    id,
    full_name,
    email,
    verification_status,
    is_admin,
    verified,
    role,
    created_at,
    updated_at,
    notes
) VALUES (
    'USER_ID_HERE', -- Replace with actual user ID from auth.users
    'Stephen Williams',
    'stephenw@interlinetravel.com.au',
    'verified',
    false, -- User-only access (not admin)
    true,
    'user',
    NOW(),
    NOW(),
    'Created for Stephen Williams - Interline Travel staff member'
)
ON CONFLICT (id) 
DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    verification_status = EXCLUDED.verification_status,
    is_admin = EXCLUDED.is_admin,
    verified = EXCLUDED.verified,
    role = EXCLUDED.role,
    updated_at = NOW(),
    notes = EXCLUDED.notes;

-- Step 3: Verify the user was created correctly
SELECT 
    id,
    full_name,
    email,
    verification_status,
    is_admin,
    verified,
    role,
    created_at,
    notes
FROM public.profiles 
WHERE email = 'stephenw@interlinetravel.com.au';