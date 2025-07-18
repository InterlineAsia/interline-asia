// Simple CSV processing endpoint that accepts CSV content as text
// This avoids the need for formidable and file upload handling

import { createClient } from '@supabase/supabase-js';

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
    
    // Get CSV content from request body
    const { csvContent, filename } = req.body;
    
    if (!csvContent) {
      return res.status(400).json({ 
        success: false, 
        error: 'No CSV content provided' 
      });
    }
    
    // Parse CSV content
    const deals = parseCSV(csvContent);
    
    if (deals.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'No valid data found in CSV content' 
      });
    }
    
    // Insert deals directly into database
    let insertedCount = 0;
    let errors = [];
    
    // Process in batches to avoid overwhelming the database
    const batchSize = 50;
    for (let i = 0; i < deals.length; i += batchSize) {
      const batch = deals.slice(i, i + batchSize);
      
      try {
        const { error: insertError } = await supabase
          .from('cruise_deals')
          .upsert(batch, { 
            onConflict: 'cruise_line,ship_name,departure_date',
            ignoreDuplicates: false
          });
        
        if (insertError) {
          errors.push(`Batch ${Math.floor(i/batchSize) + 1}: ${insertError.message}`);
        } else {
          insertedCount += batch.length;
        }
      } catch (batchError) {
        errors.push(`Batch ${Math.floor(i/batchSize) + 1}: ${batchError.message}`);
      }
    }
    
    // Return results
    return res.status(200).json({
      success: true,
      message: `CSV processed successfully! ${insertedCount} deals processed from ${filename || 'uploaded file'}`,
      details: {
        filename: filename || 'uploaded file',
        totalRows: deals.length,
        insertedCount: insertedCount,
        errors: errors
      }
    });
    
  } catch (error) {
    console.error('CSV processing error:', error);
    return res.status(500).json({
      success: false,
      error: `Processing failed: ${error.message}`
    });
  }
}

// Helper function to parse CSV content
function parseCSV(content) {
  const lines = content.trim().split('\n');
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const deals = [];
  
  for (let i = 1; i < lines.length; i++) {
    try {
      const values = parseCSVLine(lines[i]);
      if (values.length !== headers.length) continue;
      
      const deal = {};
      headers.forEach((header, index) => {
        deal[header] = values[index] || '';
      });
      
      // Transform to database schema
      const transformedDeal = {
        cruise_line: deal['Cruise Line'] || deal.cruise_line || deal['cruise_line'] || '',
        ship_name: deal.Ship || deal.ship_name || deal['ship_name'] || '',
        departure_date: formatDate(deal.Date || deal.departure_date || deal['departure_date'] || ''),
        region: deal.Region || deal.region || deal['region'] || '',
        nights: parseInt(deal.Nights || deal.nights || deal['nights'] || 0),
        itinerary: deal.Itinerary || deal.itinerary || deal['itinerary'] || '',
        inside_price: parsePrice(deal.Inside || deal.inside_price || deal['inside_price']),
        oceanview_price: parsePrice(deal.Oceanview || deal.oceanview_price || deal['oceanview_price']),
        balcony_price: parsePrice(deal.Balcony || deal.balcony_price || deal['balcony_price']),
        suite_price: parsePrice(deal.Suite || deal.suite_price || deal['suite_price']),
        departure_port: deal.From || deal.departure_port || deal['departure_port'] || '',
        arrival_port: deal.To || deal.arrival_port || deal['arrival_port'] || '',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Only add deals with required fields
      if (transformedDeal.cruise_line && transformedDeal.ship_name) {
        deals.push(transformedDeal);
      }
    } catch (lineError) {
      console.warn(`Error parsing line ${i}:`, lineError);
    }
  }
  
  return deals;
}

// Helper function to parse CSV line
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
  return result.map(val => val.trim().replace(/"/g, ''));
}

// Helper function to parse price
function parsePrice(price) {
  if (!price) return null;
  if (typeof price === 'string' && price.toLowerCase().includes('quote')) return null;
  
  const cleaned = price.toString().replace(/[^0-9.]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
}

// Helper function to format date
function formatDate(dateStr) {
  if (!dateStr) return null;
  
  try {
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
  } catch (error) {
    return null;
  }
}