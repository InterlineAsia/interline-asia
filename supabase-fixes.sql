-- Supabase Admin Helper Bot Fixes
-- Run this in your Supabase SQL Editor

-- 1. Ensure uploads table exists with correct structure
CREATE TABLE IF NOT EXISTS public.uploads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_url TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    file_type TEXT,
    file_size INTEGER
);

-- 2. Enable RLS on uploads table
ALTER TABLE public.uploads ENABLE ROW LEVEL SECURITY;

-- 3. Add RLS policy for service role read access
CREATE POLICY "Service role can read all uploads" ON public.uploads
    FOR SELECT USING (true);

-- 4. Add RLS policy for authenticated users to see their own uploads
CREATE POLICY "Users can view own uploads" ON public.uploads
    FOR SELECT USING (auth.uid() = user_id);

-- 5. Add RLS policy for authenticated users to insert their own uploads
CREATE POLICY "Users can insert own uploads" ON public.uploads
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 6. Insert test users into profiles table
INSERT INTO public.profiles (id, full_name, email, verification_status, is_admin, created_at)
VALUES 
    (gen_random_uuid(), 'Nuch Pattison', 'nuch@interlineasia.com', 'verified', true, NOW()),
    (gen_random_uuid(), 'Rodney Pattison', 'rodney@interlineasia.com', 'verified', true, NOW())
ON CONFLICT (email) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    verification_status = EXCLUDED.verification_status,
    is_admin = EXCLUDED.is_admin;

-- 7. Insert some test uploads for demonstration
INSERT INTO public.uploads (user_id, file_name, file_url, status, file_type)
SELECT 
    p.id,
    'passport_verification.pdf',
    'https://example.com/uploads/passport.pdf',
    'approved',
    'application/pdf'
FROM public.profiles p 
WHERE p.email = 'nuch@interlineasia.com'
LIMIT 1;

INSERT INTO public.uploads (user_id, file_name, file_url, status, file_type)
SELECT 
    p.id,
    'business_license.jpg',
    'https://example.com/uploads/license.jpg',
    'pending',
    'image/jpeg'
FROM public.profiles p 
WHERE p.email = 'rodney@interlineasia.com'
LIMIT 1;

-- 8. Grant necessary permissions
GRANT ALL ON public.uploads TO authenticated;
GRANT ALL ON public.uploads TO service_role;

-- 9. Verify the setup
SELECT 'Profiles count:' as info, COUNT(*) as count FROM public.profiles
UNION ALL
SELECT 'Uploads count:' as info, COUNT(*) as count FROM public.uploads;