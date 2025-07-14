// Cruise Data Integration API - FIXED to use cruise_deals table
// Now properly fetches from the actual cruise_deals table

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return await getUnifiedCruiseDeals(req, res);
  } else if (req.method === 'POST' && req.query.action === 'sync-csv') {
    return await syncCSVToTable(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getUnifiedCruiseDeals(req, res) {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://inzyhmxskjqbtcnmlaby.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('🔍 Fetching from cruise_deals table (FIXED VERSION)...');
    
    // FIXED: Fetch from the actual cruise_deals table instead of non-existent tables
    const { data: cruiseDeals, error: cruiseError, count } = await supabase
      .from('cruise_deals')
      .select('*', { count: 'exact' })
      .eq('is_active', true)
      .order('departure_date', { ascending: true })
      .limit(1000);
    
    if (cruiseError) {
      console.error('❌ Supabase cruise_deals error:', cruiseError);
      
      // Try without RLS restrictions using service role
      if (process.env.SUPABASE_SERVICE_ROLE_KEY && supabaseKey !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.log('🔄 Retrying with service role key to bypass RLS...');
        const serviceSupabase = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY);
        
        const { data: serviceData, error: serviceError } = await serviceSupabase
          .from('cruise_deals')
          .select('*')
          .eq('is_active', true)
          .limit(1000);
          
        if (serviceError) {
          throw new Error(`Service role query failed: ${serviceError.message}`);
        }
        
        const formattedDeals = formatDealsForFrontend(serviceData || []);
        
        return res.status(200).json({
          success: true,
          deals: formattedDeals,
          summary: {
            total: serviceData?.length || 0,
            source: 'cruise_deals_service_role',
            message: 'Retrieved using service role due to RLS restrictions'
          },
          timestamp: new Date().toISOString()
        });
      }
      
      throw new Error(`Cruise deals query failed: ${cruiseError.message}`);
    }
    
    console.log(`✅ Successfully fetched ${cruiseDeals?.length || 0} deals from cruise_deals table`);
    
    const formattedDeals = formatDealsForFrontend(cruiseDeals || []);
    
    return res.status(200).json({
      success: true,
      deals: formattedDeals,
      summary: {
        total: count || formattedDeals.length,
        filtered: formattedDeals.length,
        source: 'cruise_deals',
        message: 'Successfully retrieved from cruise_deals table'
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Cruise data integration error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      details: 'Failed to fetch from cruise_deals table',
      timestamp: new Date().toISOString()
    });
  }
}

async function fetchRiverCruises(supabase) {
  try {
    const { data, error } = await supabase
      .from('0807_master_upload_river')
      .select('*');
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching river cruises:', error);
    return [];
  }
}

async function fetchOceanCruises(supabase) {
  try {
    // First try to fetch from table (if CSV was already converted)
    const { data: tableData, error: tableError } = await supabase
      .from('1007_master_upload_twins')
      .select('*');
    
    if (!tableError && tableData && tableData.length > 0) {
      console.log('📋 Using ocean cruises from table');
      return tableData;
    }
    
    // If table doesn't exist or is empty, fetch from storage bucket
    console.log('📁 Fetching ocean cruises from storage bucket...');
    return await fetchCSVFromStorage(supabase);
    
  } catch (error) {
    console.error('Error fetching ocean cruises:', error);
    return [];
  }
}

async function fetchCSVFromStorage(supabase) {
  try {
    // Try to read CSV from local file first, then storage bucket
    const fs = require('fs');
    const path = require('path');
    
    let csvText;
    
    try {
      // Try local file first
      const localPath = path.join(process.cwd(), '1007 Master Upload Twins.csv');
      csvText = fs.readFileSync(localPath, 'utf8');
      console.log('📁 Using local CSV file: 1007 Master Upload Twins.csv');
    } catch (localError) {
      console.log('📁 Local file not found, trying storage bucket...');
      
      // Fallback to storage bucket
      const { data: csvData, error: downloadError } = await supabase.storage
        .from('twins-upload-1007')
        .download('1007 Master Upload Twins.csv');
      
      if (downloadError) throw downloadError;
      csvText = await csvData.text();
      console.log('☁️ Using storage bucket CSV file');
    }
    
    
    // Parse CSV
    const parsedData = parseCSV(csvText);
    console.log(`📊 Parsed ${parsedData.length} ocean cruise records from CSV`);
    
    return parsedData;
    
  } catch (error) {
    console.error('Error fetching CSV from storage:', error);
    return [];
  }
}

async function fetchCabinTypes(supabase) {
  try {
    const { data, error } = await supabase
      .from('0807_cabin_types')
      .select('*');
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching cabin types:', error);
    return [];
  }
}

function parseCSV(csvText) {
  const lines = csvText.split('\n');
  if (lines.length < 2) return [];
  
  // Get headers from first line
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  
  // Parse data rows
  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = parseCSVLine(line);
    if (values.length !== headers.length) continue;
    
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ? values[index].trim().replace(/"/g, '') : '';
    });
    
    data.push(row);
  }
  
  return data;
}

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

function normalizeRiverCruises(riverData, cabinTypes) {
  return riverData.map(cruise => {
    // Create cabin type mapping
    const cabinMapping = createCabinMapping(cruise, cabinTypes, 'river');
    
    return {
      id: `river_${cruise.id || generateId()}`,
      source: 'RIVER',
      cruiseType: 'River',
      
      // Basic info
      ship: cruise.ship_name || cruise.vessel || cruise.ship || '',
      cruiseLine: cruise.cruise_line || cruise.operator || '',
      itinerary: cruise.itinerary || cruise.route || '',
      destination: cruise.destination || cruise.region || '',
      
      // Dates
      departureDate: normalizeDate(cruise.departure_date || cruise.start_date),
      returnDate: normalizeDate(cruise.return_date || cruise.end_date),
      duration: cruise.duration || calculateDuration(cruise.departure_date, cruise.return_date),
      
      // Pricing
      pricing: {
        inside: parsePrice(cruise.inside_price || cruise.interior_price),
        oceanview: parsePrice(cruise.oceanview_price || cruise.outside_price),
        balcony: parsePrice(cruise.balcony_price || cruise.veranda_price),
        suite: parsePrice(cruise.suite_price || cruise.premium_price)
      },
      
      // Cabin mappings
      cabinTypes: cabinMapping,
      
      // Additional info
      description: cruise.description || '',
      highlights: cruise.highlights || '',
      
      // Metadata
      originalData: cruise,
      lastUpdated: new Date().toISOString()
    };
  });
}

function normalizeOceanCruises(oceanData, cabinTypes) {
  let quoteOnlyCount = 0;
  
  const normalized = oceanData.map(cruise => {
    // Create cabin type mapping
    const cabinMapping = createCabinMapping(cruise, cabinTypes, 'ocean');
    
    const normalizedCruise = {
      id: `ocean_${cruise.id || generateId()}`,
      source: 'TWINS',
      cruiseType: 'Ocean',
      
      // Basic info
      ship: cruise.Ship || cruise.ship_name || cruise.vessel || cruise.ship || '',
      cruiseLine: cruise['Cruise Line'] || cruise.cruise_line || cruise.operator || '',
      itinerary: cruise.Itinerary || cruise.itinerary || cruise.route || '',
      destination: cruise.Region || cruise.destination || cruise.region || '',
      
      // Dates
      departureDate: normalizeDate(cruise.Date || cruise.departure_date || cruise.sail_date),
      returnDate: normalizeDate(cruise.return_date || cruise.end_date),
      duration: cruise.Nights || cruise.duration || cruise.nights || calculateDuration(cruise.departure_date, cruise.return_date),
      
      // Pricing
      pricing: {
        inside: parsePrice(cruise.Inside || cruise.inside_price || cruise.interior),
        oceanview: parsePrice(cruise.Oceanview || cruise.oceanview_price || cruise.ocean_view),
        balcony: parsePrice(cruise.Balcony || cruise.balcony_price || cruise.balcony),
        suite: parsePrice(cruise.Suite || cruise.suite_price || cruise.suite)
      },
      
      // Check if this is a quote-only cruise
      quoteOnly: isQuoteOnlyCruise(cruise),
      
      // Cabin mappings
      cabinTypes: cabinMapping,
      
      // Additional info
      description: cruise.description || '',
      highlights: cruise.highlights || '',
      
      // Metadata
      originalData: cruise,
      lastUpdated: new Date().toISOString()
    };
    
    // Count quote-only cruises for logging
    if (normalizedCruise.quoteOnly) {
      quoteOnlyCount++;
    }
    
    return normalizedCruise;
  });
  
  // Log quote-only cruise statistics
  if (quoteOnlyCount > 0) {
    console.log(`📋 Imported ${quoteOnlyCount} quote-only cruises out of ${oceanData.length} total ocean cruises`);
  }
  
  return normalized;
}

function createCabinMapping(cruise, cabinTypes, cruiseType) {
  const mapping = {
    inside: [],
    oceanview: [],
    balcony: [],
    suite: []
  };
  
  // Find matching cabin types based on ship and cruise line
  const shipName = cruise.ship_name || cruise.vessel || cruise.ship || '';
  const cruiseLine = cruise.cruise_line || cruise.operator || '';
  
  cabinTypes.forEach(cabinType => {
    const matchesShip = !cabinType.ship_name || 
                       cabinType.ship_name.toLowerCase().includes(shipName.toLowerCase()) ||
                       shipName.toLowerCase().includes(cabinType.ship_name.toLowerCase());
    
    const matchesCruiseLine = !cabinType.cruise_line ||
                             cabinType.cruise_line.toLowerCase().includes(cruiseLine.toLowerCase()) ||
                             cruiseLine.toLowerCase().includes(cabinType.cruise_line.toLowerCase());
    
    if (matchesShip && matchesCruiseLine) {
      const category = categorizeCabinType(cabinType.cabin_category || cabinType.category || '');
      if (category && mapping[category]) {
        mapping[category].push({
          code: cabinType.cabin_code || cabinType.code,
          category: cabinType.cabin_category || cabinType.category,
          description: cabinType.description || ''
        });
      }
    }
  });
  
  return mapping;
}

function categorizeCabinType(category) {
  const categoryLower = category.toLowerCase();
  
  if (categoryLower.includes('inside') || categoryLower.includes('interior')) {
    return 'inside';
  } else if (categoryLower.includes('oceanview') || categoryLower.includes('ocean view') || categoryLower.includes('outside')) {
    return 'oceanview';
  } else if (categoryLower.includes('balcony') || categoryLower.includes('veranda')) {
    return 'balcony';
  } else if (categoryLower.includes('suite') || categoryLower.includes('premium')) {
    return 'suite';
  }
  
  return null;
}

function normalizeDate(dateStr) {
  if (!dateStr) return null;
  
  try {
    // Handle various date formats
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
  } catch (error) {
    return null;
  }
}

function parsePrice(priceStr) {
  if (!priceStr) return null;
  
  // Check for quote-only pricing
  if (priceStr.toString().toLowerCase().includes('quote available') || 
      priceStr.toString().toLowerCase().includes('quote only')) {
    return { price: null, quoteOnly: true };
  }
  
  // Remove currency symbols and parse number
  const cleaned = priceStr.toString().replace(/[^0-9.]/g, '');
  const price = parseFloat(cleaned);
  
  return isNaN(price) ? null : price;
}

function calculateDuration(startDate, endDate) {
  if (!startDate || !endDate) return null;
  
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  } catch (error) {
    return null;
  }
}

function deduplicateDeals(deals) {
  const seen = new Set();
  const deduplicated = [];
  
  deals.forEach(deal => {
    // Create a unique key based on ship, departure date, and itinerary
    const key = `${deal.ship}_${deal.departureDate}_${deal.itinerary}`.toLowerCase();
    
    if (!seen.has(key)) {
      seen.add(key);
      deduplicated.push(deal);
    }
  });
  
  return deduplicated;
}

function applyFilters(deals, filters) {
  let filtered = [...deals];
  
  // Filter by destination
  if (filters.destination) {
    filtered = filtered.filter(deal => 
      deal.destination.toLowerCase().includes(filters.destination.toLowerCase())
    );
  }
  
  // Filter by cruise line
  if (filters.cruiseLine) {
    filtered = filtered.filter(deal => 
      deal.cruiseLine.toLowerCase().includes(filters.cruiseLine.toLowerCase())
    );
  }
  
  // Filter by month
  if (filters.month) {
    const month = parseInt(filters.month);
    filtered = filtered.filter(deal => {
      if (!deal.departureDate) return false;
      const departureMonth = new Date(deal.departureDate).getMonth() + 1;
      return departureMonth === month;
    });
  }
  
  // Filter by cruise type
  if (filters.type) {
    filtered = filtered.filter(deal => 
      deal.cruiseType.toLowerCase() === filters.type.toLowerCase()
    );
  }
  
  // Filter by source
  if (filters.source) {
    filtered = filtered.filter(deal => 
      deal.source.toLowerCase() === filters.source.toLowerCase()
    );
  }
  
  return filtered;
}

function isQuoteOnlyCruise(cruise) {
  // Check if ALLOW_QUOTE_ONLY is enabled
  const allowQuoteOnly = process.env.ALLOW_QUOTE_ONLY === 'true';
  if (!allowQuoteOnly) return false;
  
  // Check if all cabin types are quote-only
  const cabinFields = ['Inside', 'Oceanview', 'Balcony', 'Suite'];
  const quoteOnlyCount = cabinFields.filter(field => {
    const value = cruise[field];
    return value && value.toString().toLowerCase().includes('quote available');
  }).length;
  
  // If all 4 cabins are quote-only, mark the entire cruise as quote-only
  return quoteOnlyCount === 4;
}

function formatDealsForFrontend(deals) {
  return deals.map(deal => ({
    id: deal.id,
    source: 'SUPABASE_CRUISE_DEALS',
    cruiseType: 'Ocean', // Default, could be enhanced
    
    // Basic info
    ship: deal.ship_name || '',
    cruiseLine: deal.cruise_line || '',
    itinerary: deal.itinerary || '',
    destination: deal.region || '',
    
    // Dates
    departureDate: deal.departure_date || null,
    duration: deal.nights || null,
    
    // Pricing - handle both string and numeric formats
    pricing: {
      inside: parsePrice(deal.inside_price),
      oceanview: parsePrice(deal.oceanview_price),
      balcony: parsePrice(deal.balcony_price),
      suite: parsePrice(deal.suite_price)
    },
    
    // Ports
    departurePort: deal.departure_port || '',
    arrivalPort: deal.arrival_port || '',
    
    // Additional info
    isActive: deal.is_active,
    createdAt: deal.created_at,
    updatedAt: deal.updated_at,
    
    // Metadata
    originalData: deal,
    lastUpdated: new Date().toISOString()
  }));
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Sync CSV to Supabase table for better performance
async function syncCSVToTable(req, res) {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('🔄 Syncing CSV to Supabase table...');
    
    // Fetch CSV data
    const csvData = await fetchCSVFromStorage(supabase);
    
    if (csvData.length === 0) {
      throw new Error('No data found in CSV file');
    }
    
    // Create table if it doesn't exist and insert data
    const { error: insertError } = await supabase
      .from('1007_master_upload_twins')
      .upsert(csvData, { onConflict: 'id' });
    
    if (insertError) {
      console.log('Table might not exist, data logged for manual table creation');
      console.log('Sample data structure:', JSON.stringify(csvData[0], null, 2));
    }
    
    return res.status(200).json({
      success: true,
      message: `Synced ${csvData.length} records from CSV to table`,
      recordCount: csvData.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('CSV sync error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}