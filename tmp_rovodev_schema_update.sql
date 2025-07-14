-- ✅ INTERLINE ASIA - DATABASE SCHEMA UPDATE
-- Ensure profiles table has all required columns for the new login system

-- Add missing columns if they don't exist
DO $$ 
BEGIN
    -- Add role column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role') THEN
        ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'member';
        RAISE NOTICE 'Added role column to profiles table';
    END IF;
    
    -- Add is_super_admin column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_super_admin') THEN
        ALTER TABLE public.profiles ADD COLUMN is_super_admin BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added is_super_admin column to profiles table';
    END IF;
    
    -- Add verified column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'verified') THEN
        ALTER TABLE public.profiles ADD COLUMN verified BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added verified column to profiles table';
    END IF;
END $$;

-- Update the trigger function to handle admin emails properly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        id, 
        full_name, 
        email, 
        is_admin, 
        is_super_admin, 
        role, 
        verified,
        verification_status
    )
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
        NEW.email,
        CASE 
            WHEN NEW.email IN ('admin@telenational.com.au', 'rodney@telenational.com.au') THEN TRUE 
            ELSE FALSE 
        END,
        CASE 
            WHEN NEW.email IN ('admin@telenational.com.au', 'rodney@telenational.com.au') THEN TRUE 
            ELSE FALSE 
        END,
        CASE 
            WHEN NEW.email IN ('admin@telenational.com.au', 'rodney@telenational.com.au') THEN 'admin' 
            ELSE 'member' 
        END,
        CASE 
            WHEN NEW.email IN ('admin@telenational.com.au', 'rodney@telenational.com.au') THEN TRUE 
            ELSE FALSE 
        END,
        CASE 
            WHEN NEW.email IN ('admin@telenational.com.au', 'rodney@telenational.com.au') THEN 'verified' 
            ELSE 'pending' 
        END
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing admin users to have proper roles
UPDATE public.profiles 
SET 
    role = 'admin',
    is_admin = TRUE,
    is_super_admin = TRUE,
    verified = TRUE,
    verification_status = 'verified',
    updated_at = NOW()
WHERE email IN ('admin@telenational.com.au', 'rodney@telenational.com.au');

-- Create profiles for admin emails if they don't exist
INSERT INTO public.profiles (
    id, 
    full_name, 
    email, 
    role, 
    is_admin, 
    is_super_admin, 
    verified, 
    verification_status,
    created_at,
    updated_at
)
SELECT 
    gen_random_uuid(),
    CASE 
        WHEN email = 'admin@telenational.com.au' THEN 'System Administrator'
        WHEN email = 'rodney@telenational.com.au' THEN 'Rodney Pattison'
    END,
    email,
    'admin',
    TRUE,
    TRUE,
    TRUE,
    'verified',
    NOW(),
    NOW()
FROM (VALUES ('admin@telenational.com.au'), ('rodney@telenational.com.au')) AS emails(email)
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.email = emails.email
);

-- Verify the setup
SELECT 
    email, 
    full_name, 
    role, 
    is_admin, 
    is_super_admin, 
    verified, 
    verification_status 
FROM public.profiles 
WHERE email IN ('admin@telenational.com.au', 'rodney@telenational.com.au')
ORDER BY email;