// API endpoint for processing CSV deals
// This endpoint is used by the admin CSV processor page

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
    // Initialize Supabase client
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
    
    // Process CSV files
    console.log('Processing CSV files for admin:', user.email);
    
    // 1. List files in the uploads bucket
    const { data: files, error: listError } = await supabase.storage
      .from('uploads')
      .list('', { limit: 100 });
    
    if (listError) {
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to list files', 
        details: listError.message 
      });
    }
    
    // 2. Find CSV files
    const csvFiles = files.filter(file => file.name.endsWith('.csv'));
    console.log(`Found ${csvFiles.length} CSV files`);
    
    // 3. Process each CSV file
    let processedDeals = 0;
    let errors = [];
    
    for (const file of csvFiles) {
      try {
        // Download file content
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('uploads')
          .download(file.name);
        
        if (downloadError) {
          errors.push({ file: file.name, error: downloadError.message });
          continue;
        }
        
        // Parse CSV content
        const content = await fileData.text();
        const deals = parseCSV(content);
        
        // Insert deals into database
        if (deals.length > 0) {
          const { error: insertError } = await supabase
            .from('cruise_deals')
            .upsert(deals, { 
              onConflict: 'cruise_line,ship_name,departure_date,itinerary',
              ignoreDuplicates: false
            });
          
          if (insertError) {
            errors.push({ file: file.name, error: insertError.message });
          } else {
            processedDeals += deals.length;
          }
        }
      } catch (fileError) {
        errors.push({ file: file.name, error: fileError.message });
      }
    }
    
    // 4. Return results
    return res.status(200).json({
      success: true,
      message: `Processed ${csvFiles.length} CSV files with ${processedDeals} deals`,
      deals_count: processedDeals,
      files_processed: csvFiles.length,
      errors: errors
    });
    
  } catch (error) {
    console.error('CSV processing error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process CSV files',
      details: error.message
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
        cruise_line: deal['Cruise Line'] || deal.cruise_line || '',
        ship_name: deal.Ship || deal.ship_name || '',
        departure_date: formatDate(deal.Date || deal.departure_date || ''),
        region: deal.Region || deal.region || '',
        nights: parseInt(deal.Nights || deal.nights || 0),
        itinerary: deal.Itinerary || deal.itinerary || '',
        inside_price: parsePrice(deal.Inside || deal.inside_price),
        oceanview_price: parsePrice(deal.Oceanview || deal.oceanview_price),
        balcony_price: parsePrice(deal.Balcony || deal.balcony_price),
        suite_price: parsePrice(deal.Suite || deal.suite_price),
        departure_port: deal.From || deal.departure_port || '',
        arrival_port: deal.To || deal.arrival_port || '',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      deals.push(transformedDeal);
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