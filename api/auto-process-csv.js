// Webhook/trigger to automatically process CSV files when uploaded to Supabase Storage
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { type, table, record, old_record } = req.body;
    
    // Check if this is a storage upload event
    if (type === 'INSERT' && table === 'objects' && record) {
      const fileName = record.name;
      const bucketId = record.bucket_id;
      
      // Check if it's a CSV file in the uploads bucket
      if (bucketId === 'uploads' && fileName.endsWith('.csv')) {
        console.log(`New CSV file uploaded: ${fileName}`);
        
        // Check if it's one of our target CSV files
        if (fileName.includes('Cabin Types Upload') || fileName.includes('Master Upload Twins')) {
          console.log(`Processing CSV file: ${fileName}`);
          
          // Trigger CSV processing
          const processResponse = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/process-csv-deals`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          if (processResponse.ok) {
            const result = await processResponse.json();
            console.log('CSV processing completed:', result);
            
            return res.status(200).json({
              success: true,
              message: `Automatically processed ${fileName}`,
              result: result
            });
          } else {
            throw new Error(`CSV processing failed: ${processResponse.statusText}`);
          }
        }
      }
    }
    
    // Not a relevant event, return success
    res.status(200).json({ success: true, message: 'Event received but not processed' });
    
  } catch (error) {
    console.error('Error in auto-process-csv:', error);
    res.status(500).json({ 
      error: 'Failed to auto-process CSV', 
      details: error.message 
    });
  }
}

// Alternative: Database function to trigger CSV processing
// This can be called from a Supabase database trigger or cron job

export async function setupDatabaseTrigger() {
  // SQL to create a trigger that calls this API when CSV files are uploaded
  const triggerSQL = `
    -- Create a function to call the CSV processing API
    CREATE OR REPLACE FUNCTION trigger_csv_processing()
    RETURNS TRIGGER AS $$
    DECLARE
      response_status INTEGER;
    BEGIN
      -- Check if the uploaded file is a CSV in uploads bucket
      IF NEW.bucket_id = 'uploads' AND NEW.name LIKE '%.csv' THEN
        -- Call the processing API using pg_net extension
        SELECT status INTO response_status
        FROM net.http_post(
          url := '${process.env.VERCEL_URL || 'http://localhost:3000'}/api/process-csv-deals',
          headers := '{"Content-Type": "application/json"}'::jsonb,
          body := '{}'::jsonb
        );
        
        -- Log the result
        INSERT INTO csv_processing_log (file_name, status, processed_at)
        VALUES (NEW.name, response_status, NOW());
      END IF;
      
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    -- Create the trigger
    DROP TRIGGER IF EXISTS csv_upload_trigger ON storage.objects;
    CREATE TRIGGER csv_upload_trigger
      AFTER INSERT ON storage.objects
      FOR EACH ROW
      EXECUTE FUNCTION trigger_csv_processing();

    -- Create a log table for CSV processing
    CREATE TABLE IF NOT EXISTS csv_processing_log (
      id BIGSERIAL PRIMARY KEY,
      file_name TEXT NOT NULL,
      status INTEGER,
      processed_at TIMESTAMPTZ DEFAULT NOW(),
      error_message TEXT
    );
  `;
  
  return triggerSQL;
}