// Vercel Serverless Function for CSV Processing with Supabase
// File: /api/process-csv-supabase.js

import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { csvContent, fileName } = req.body;

    if (!csvContent) {
      return res.status(400).json({ error: 'CSV content is required' });
    }

    // Initialize Supabase client
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase configuration missing');
      return res.status(500).json({ error: 'Database configuration missing' });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Generate upload batch ID
    const uploadBatchId = crypto.randomUUID();
    
    // Parse CSV content into rows
    const rows = parseCSV(csvContent);
    if (rows.length === 0) {
      return res.status(400).json({ error: 'No data found in CSV file' });
    }

    console.log(`Processing ${rows.length} rows from ${fileName}`);

    // Create upload log entry
    const { data: logData, error: logError } = await supabase
      .from('csv_upload_logs')
      .insert([{
        filename: fileName || 'unknown.csv',
        total_rows: rows.length,
        upload_batch_id: uploadBatchId,
        status: 'processing'
      }])
      .select()
      .single();

    if (logError) {
      console.error('Failed to create upload log:', logError);
      return res.status(500).json({ error: 'Failed to initialize upload log' });
    }

    // Process CSV rows and convert to cruise deals
    const cruiseDeals = [];
    const errors = [];
    let successCount = 0;

    for (let i = 0; i < rows.length; i++) {
      try {
        const deal = processCruiseDealRow(rows[i], i + 1);
        if (deal) {
          deal.upload_batch_id = uploadBatchId;
          deal.raw_data = rows[i]; // Store original CSV data
          cruiseDeals.push(deal);
        }
      } catch (error) {
        errors.push({
          row: i + 1,
          error: error.message,
          data: rows[i]
        });
      }
    }

    // Insert cruise deals in batches
    const batchSize = 100;
    for (let i = 0; i < cruiseDeals.length; i += batchSize) {
      const batch = cruiseDeals.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from('cruise_deals')
        .insert(batch);

      if (error) {
        console.error(`Batch insert error (${i}-${i + batch.length}):`, error);
        errors.push({
          batch: `${i}-${i + batch.length}`,
          error: error.message
        });
      } else {
        successCount += batch.length;
      }
    }

    // Update upload log with results
    await supabase
      .from('csv_upload_logs')
      .update({
        successful_rows: successCount,
        failed_rows: errors.length,
        status: errors.length === 0 ? 'completed' : 'completed_with_errors',
        error_details: errors.length > 0 ? { errors } : null
      })
      .eq('id', logData.id);

    console.log(`Upload completed: ${successCount} successful, ${errors.length} errors`);

    return res.status(200).json({
      success: true,
      message: `Successfully processed ${successCount} cruise deals`,
      uploadBatchId,
      totalRows: rows.length,
      successfulRows: successCount,
      failedRows: errors.length,
      errors: errors.slice(0, 10) // Return first 10 errors for debugging
    });

  } catch (error) {
    console.error('CSV processing error:', error);
    return res.status(500).json({ 
      error: 'Failed to process CSV file',
      details: error.message 
    });
  }
}

// Parse CSV content into array of objects
function parseCSV(csvContent) {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) return [];

  // Get headers from first line
  const headers = parseCSVLine(lines[0]);
  const rows = [];

  // Process data rows
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length >= headers.length) {
      const row = {};
      headers.forEach((header, index) => {
        row[header.trim()] = values[index] ? values[index].trim() : '';
      });
      rows.push(row);
    }
  }

  return rows;
}

// Parse CSV line handling quotes and commas
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

// Convert CSV row to cruise deal object
function processCruiseDealRow(row, rowNumber) {
  // Validate required fields
  if (!row['Cruise Line'] || !row['Ship'] || !row['Date']) {
    throw new Error(`Missing required fields: Cruise Line, Ship, or Date`);
  }

  // Parse departure date
  let departureDate;
  try {
    departureDate = new Date(row['Date']).toISOString().split('T')[0];
  } catch (error) {
    throw new Error(`Invalid date format: ${row['Date']}`);
  }

  // Parse nights (convert to integer)
  let nights = null;
  if (row['Nights']) {
    const nightsNum = parseInt(row['Nights']);
    if (!isNaN(nightsNum)) {
      nights = nightsNum;
    }
  }

  return {
    cruise_line: row['Cruise Line'],
    ship_name: row['Ship'],
    departure_date: departureDate,
    region: row['Region'] || null,
    nights: nights,
    departure_port: row['From'] || null,
    arrival_port: row['To'] || null,
    itinerary: row['Itinerary'] || null,
    inside_price: row['Inside'] || 'Quote Available',
    oceanview_price: row['Oceanview'] || 'Quote Available',
    balcony_price: row['Balcony'] || 'Quote Available',
    suite_price: row['Suite'] || 'Quote Available',
    seq_number: row['SEQ'] || null,
    is_active: true
  };
}