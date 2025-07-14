-- Fix Interline Asia Login Schema
-- Add missing columns to profiles table

-- Add missing columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user',
ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE;

-- Update the trigger function to handle admin emails properly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, is_admin, is_super_admin, role, verified)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Unknown'),
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
            WHEN NEW.email IN ('admin@telenational.com.au', 'rodney@telenational.com.au') THEN 'super_admin' 
            ELSE 'user' 
        END,
        CASE 
            WHEN NEW.email IN ('admin@telenational.com.au', 'rodney@telenational.com.au') THEN TRUE 
            ELSE FALSE 
        END
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing admin users to have proper roles
UPDATE public.profiles 
SET 
    role = 'super_admin',
    is_admin = TRUE,
    is_super_admin = TRUE,
    verified = TRUE,
    verification_status = 'verified'
WHERE email IN ('admin@telenational.com.au', 'rodney@telenational.com.au');

-- Insert admin users if they don't exist
INSERT INTO public.profiles (id, full_name, email, role, is_admin, is_super_admin, verified, verification_status)
SELECT 
    gen_random_uuid(),
    CASE 
        WHEN email = 'admin@telenational.com.au' THEN 'System Administrator'
        WHEN email = 'rodney@telenational.com.au' THEN 'Rodney Pattison'
    END,
    email,
    'super_admin',
    TRUE,
    TRUE,
    TRUE,
    'verified'
FROM (VALUES ('admin@telenational.com.au'), ('rodney@telenational.com.au')) AS emails(email)
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.email = emails.email
);

-- Verify the setup
SELECT email, full_name, role, is_admin, is_super_admin, verified, verification_status 
FROM public.profiles 
WHERE email IN ('admin@telenational.com.au', 'rodney@telenational.com.au')
ORDER BY email;