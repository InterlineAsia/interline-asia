/*
================================================================================
INTERLINE ASIA - UPLOADS TABLE CREATION SCRIPT
================================================================================

PURPOSE: Creates the uploads table for document management in the Admin Helper Bot

MANUAL SETUP INSTRUCTIONS:
1. Open your Supabase project dashboard
2. Navigate to "SQL Editor" in the left sidebar
3. Click "New Query" 
4. Copy and paste this entire script
5. Click "Run" to execute
6. Verify success by checking the "Table Editor" for the new uploads table

SAFETY: This script is idempotent - safe to run multiple times
================================================================================
*/

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create uploads table (idempotent - safe to run multiple times)
CREATE TABLE IF NOT EXISTS public.uploads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    filename TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Additional useful fields for file management
    file_size INTEGER,
    file_type TEXT,
    file_url TEXT,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES auth.users(id),
    admin_notes TEXT
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.uploads ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Service role can read all uploads" ON public.uploads;
DROP POLICY IF EXISTS "Users can view own uploads" ON public.uploads;
DROP POLICY IF EXISTS "Users can insert own uploads" ON public.uploads;
DROP POLICY IF EXISTS "Admins can update uploads" ON public.uploads;

-- Create RLS policies
CREATE POLICY "Service role can read all uploads" 
    ON public.uploads 
    FOR SELECT 
    USING (true);

CREATE POLICY "Users can view own uploads" 
    ON public.uploads 
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own uploads" 
    ON public.uploads 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update uploads" 
    ON public.uploads 
    FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- Grant permissions
GRANT ALL ON public.uploads TO authenticated;
GRANT ALL ON public.uploads TO service_role;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

-- Insert sample test data (optional - remove if not needed)
INSERT INTO public.uploads (user_id, filename, status, file_type, file_size)
SELECT 
    auth.uid(),
    'sample_document.pdf',
    'pending',
    'application/pdf',
    1024000
WHERE NOT EXISTS (
    SELECT 1 FROM public.uploads WHERE filename = 'sample_document.pdf'
) AND auth.uid() IS NOT NULL;

-- Verify table creation
SELECT 
    'uploads' as table_name,
    COUNT(*) as record_count,
    'Table created successfully' as status
FROM public.uploads;

/*
================================================================================
VERIFICATION STEPS:
1. Check that the uploads table appears in your Supabase Table Editor
2. Verify RLS is enabled (should show "RLS enabled" in table settings)
3. Confirm policies are created (check Authentication > Policies)
4. Test the Admin Helper Bot with: "Where can I find client documents?"

TROUBLESHOOTING:
- If you get permission errors, ensure you're running as the database owner
- If policies fail, check that the profiles table exists with is_admin column
- For RLS issues, verify your service role key has proper permissions

SUPPORT: Check the README.md file for additional setup instructions
================================================================================
*/