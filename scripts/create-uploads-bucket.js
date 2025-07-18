// Create Uploads Bucket in Supabase Storage
// Run with: node scripts/create-uploads-bucket.js

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://nxreyyxbuwxjfmtvdkji.supabase.co', // Your actual Supabase URL
  process.env.SUPABASE_SERVICE_ROLE_KEY // Service role key from environment
);

async function createUploadsBucket() {
  try {
    console.log('🔧 Creating uploads bucket in Supabase Storage...');
    
    // First check if bucket already exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      throw new Error(`Failed to list buckets: ${listError.message}`);
    }
    
    const existingBucket = buckets.find(bucket => bucket.name === 'uploads');
    
    if (existingBucket) {
      console.log('✅ Uploads bucket already exists:', existingBucket);
      console.log(`   ID: ${existingBucket.id}`);
      console.log(`   Public: ${existingBucket.public}`);
      console.log(`   Created: ${existingBucket.created_at}`);
      return;
    }
    
    // Create the bucket
    const { data, error } = await supabase.storage.createBucket('uploads', {
      public: true, // Make it public for CSV file access
      fileSizeLimit: 50 * 1024 * 1024, // 50MB limit
      allowedMimeTypes: ['text/csv', 'application/csv', 'text/plain']
    });

    if (error) {
      throw new Error(`Failed to create bucket: ${error.message}`);
    }
    
    console.log('✅ Uploads bucket created successfully!');
    console.log('📁 Bucket details:', data);
    
    // Set up bucket policies for admin access
    console.log('🔐 Setting up bucket policies...');
    
    // Note: Bucket policies are typically set via SQL in Supabase dashboard
    console.log('⚠️  Remember to set up RLS policies in Supabase SQL Editor:');
    console.log(`
-- Allow authenticated users to upload files
CREATE POLICY "Allow authenticated uploads" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'uploads' AND 
    auth.role() = 'authenticated'
  );

-- Allow public read access to CSV files
CREATE POLICY "Allow public CSV access" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'uploads' AND 
    (storage.extension(name) = 'csv' OR auth.role() = 'authenticated')
  );

-- Allow admins to manage all files
CREATE POLICY "Allow admin management" ON storage.objects
  FOR ALL USING (
    bucket_id = 'uploads' AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );
    `);
    
  } catch (error) {
    console.error('❌ Error creating uploads bucket:', error.message);
    process.exit(1);
  }
}

// Run the function
createUploadsBucket();