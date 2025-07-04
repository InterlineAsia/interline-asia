-- Interline Asia - Supabase Database Schema
-- Run this in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected');
CREATE TYPE upload_status AS ENUM ('pending', 'approved', 'rejected');

-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    verification_status verification_status DEFAULT 'pending',
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    notes TEXT
);

-- Document uploads table
CREATE TABLE public.uploads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    upload_status upload_status DEFAULT 'pending',
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES public.profiles(id),
    admin_notes TEXT
);

-- Admin actions log (for audit trail)
CREATE TABLE public.admin_actions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    admin_id UUID REFERENCES public.profiles(id) NOT NULL,
    action_type TEXT NOT NULL, -- 'approve_user', 'reject_user', 'approve_upload', etc.
    target_user_id UUID REFERENCES public.profiles(id),
    target_upload_id UUID REFERENCES public.uploads(id),
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- Uploads policies
CREATE POLICY "Users can view own uploads" ON public.uploads
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own uploads" ON public.uploads
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all uploads" ON public.uploads
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- Admin actions policies
CREATE POLICY "Admins can view admin actions" ON public.admin_actions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

CREATE POLICY "Admins can insert admin actions" ON public.admin_actions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- Functions and Triggers

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, is_admin)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Unknown'),
        NEW.email,
        CASE WHEN NEW.email = 'admin@interlineasia.com' THEN TRUE ELSE FALSE END
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at on profiles
CREATE TRIGGER handle_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Storage bucket for uploads (run this in Supabase Storage)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('uploads', 'uploads', false);

-- Storage policies for uploads bucket
-- CREATE POLICY "Users can upload own files" ON storage.objects
--     FOR INSERT WITH CHECK (
--         bucket_id = 'uploads' AND 
--         auth.uid()::text = (storage.foldername(name))[1]
--     );

-- CREATE POLICY "Users can view own files" ON storage.objects
--     FOR SELECT USING (
--         bucket_id = 'uploads' AND 
--         auth.uid()::text = (storage.foldername(name))[1]
--     );

-- CREATE POLICY "Admins can view all files" ON storage.objects
--     FOR ALL USING (
--         bucket_id = 'uploads' AND
--         EXISTS (
--             SELECT 1 FROM public.profiles 
--             WHERE id = auth.uid() AND is_admin = TRUE
--         )
--     );

-- Insert admin user (update email as needed)
-- INSERT INTO auth.users (email, encrypted_password, email_confirmed_at, created_at, updated_at)
-- VALUES ('admin@interlineasia.com', crypt('your_admin_password', gen_salt('bf')), NOW(), NOW(), NOW());

-- Sample data for testing
-- INSERT INTO public.profiles (id, full_name, email, verification_status, is_admin)
-- VALUES (
--     uuid_generate_v4(),
--     'Demo User',
--     'demo@interlineasia.com',
--     'verified',
--     FALSE
-- );