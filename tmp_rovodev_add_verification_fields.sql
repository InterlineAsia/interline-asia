-- Add verification document fields to profiles table
-- Run this in Supabase SQL Editor

-- Add verification document fields
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS verification_document_url TEXT,
ADD COLUMN IF NOT EXISTS verification_document_name TEXT;

-- Update storage policies to allow users to upload their own verification documents
CREATE POLICY IF NOT EXISTS "Users can upload verification documents" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'verification-uploads' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY IF NOT EXISTS "Users can view own verification documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'verification-uploads' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Show current profiles structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;