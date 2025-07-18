-- Fix Row Level Security for storage buckets
-- This script adds proper policies to allow admin users to upload files

-- First, enable RLS on the storage.objects table if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create policy to allow admins to perform all operations on storage objects
CREATE POLICY "Admin users can do all operations" 
ON storage.objects
FOR ALL 
TO authenticated
USING (
  auth.jwt() ->> 'email' IN ('admin@interlineasia.com', 'admin@telenational.com.au', 'rodney@telenational.com.au')
);

-- Create policy to allow all users to read public files
CREATE POLICY "Anyone can read public files"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'public');

-- Create policy to allow authenticated users to read from uploads bucket
CREATE POLICY "Authenticated users can read from uploads bucket"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'uploads');

-- Create policy to allow authenticated users to upload to uploads bucket
CREATE POLICY "Authenticated users can upload to uploads bucket"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'uploads');

-- Create the uploads bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Grant usage on storage schema
GRANT USAGE ON SCHEMA storage TO public;
GRANT USAGE ON SCHEMA storage TO authenticated;

-- Grant select on buckets to public and authenticated
GRANT SELECT ON storage.buckets TO public;
GRANT SELECT ON storage.buckets TO authenticated;

-- Grant select on objects to public and authenticated
GRANT SELECT ON storage.objects TO public;
GRANT SELECT ON storage.objects TO authenticated;

-- Grant insert, update on objects to authenticated
GRANT INSERT, UPDATE ON storage.objects TO authenticated;