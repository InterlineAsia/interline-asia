// API endpoint for uploading CSV files
// This bypasses Supabase storage RLS issues by using the service role key

import { createClient } from '@supabase/supabase-js';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

// Disable the default body parser to handle form data
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Initialize Supabase client with service role key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nxreyyxbuwxjfmtvdkji.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseKey) {
      return res.status(500).json({ 
        success: false, 
        error: 'Server configuration error: Missing Supabase service role key' 
      });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Check authentication and admin status
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
    }
    
    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
    
    // Check if user is admin (whitelist approach)
    const adminEmails = [
      'admin@interlineasia.com',
      'admin@telenational.com.au',
      'rodney@telenational.com.au'
    ];
    
    if (!adminEmails.includes(user.email.toLowerCase())) {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }
    
    // Parse form data
    const form = new formidable.IncomingForm();
    form.keepExtensions = true;
    
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });
    
    // Get the uploaded file
    const file = files.file;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Check file type
    if (!file.originalFilename.toLowerCase().endsWith('.csv')) {
      return res.status(400).json({ error: 'Only CSV files are allowed' });
    }
    
    // Read the file
    const fileContent = await fs.promises.readFile(file.filepath);
    
    // Generate a unique filename
    const timestamp = Date.now();
    const fileType = fields.fileType || 'csv';
    const filename = `${timestamp}_${fileType}_${file.originalFilename}`;
    
    // Upload to Supabase storage using service role key
    const { data, error } = await supabase.storage
      .from('uploads')
      .upload(filename, fileContent, {
        contentType: 'text/csv',
        cacheControl: '3600',
        upsert: true
      });
    
    if (error) {
      console.error('Upload error:', error);
      return res.status(500).json({ 
        success: false, 
        error: `Upload failed: ${error.message}` 
      });
    }
    
    // Return success response
    return res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      file: {
        name: filename,
        size: file.size,
        type: file.mimetype,
        url: `${supabaseUrl}/storage/v1/object/public/uploads/${filename}`
      }
    });
    
  } catch (error) {
    console.error('CSV upload error:', error);
    return res.status(500).json({
      success: false,
      error: `Upload failed: ${error.message}`
    });
  }
}