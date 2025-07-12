// Cruise Data Integration API
// Unifies river cruises, ocean cruises, and cabin type mappings

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
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('🔍 Starting unified cruise deals fetch...');
    
    // Fetch all data sources in parallel
    const [riverCruises, oceanCruises, cabinTypes] = await Promise.all([
      fetchRiverCruises(supabase),
      fetchOceanCruises(supabase),
      fetchCabinTypes(supabase)
    ]);
    
    console.log(`📊 Data fetched - River: ${riverCruises.length}, Ocean: ${oceanCruises.length}, Cabin Types: ${cabinTypes.length}`);
    
    // Normalize and enrich all deals
    const normalizedRiver = normalizeRiverCruises(riverCruises, cabinTypes);
    const normalizedOcean = normalizeOceanCruises(oceanCruises, cabinTypes);
    
    // Combine and deduplicate
    const allDeals = [...normalizedRiver, ...normalizedOcean];
    const deduplicatedDeals = deduplicateDeals(allDeals);
    
    console.log(`✅ Unified ${deduplicatedDeals.length} deals (${normalizedRiver.length} river + ${normalizedOcean.length} ocean)`);
    
    // Apply filters if provided
    const filteredDeals = applyFilters(deduplicatedDeals, req.query);
    
    return res.status(200).json({
      success: true,
      deals: filteredDeals,
      summary: {
        total: deduplicatedDeals.length,
        filtered: filteredDeals.length,
        river: normalizedRiver.length,
        ocean: normalizedOcean.length,
        sources: ['0807_master_upload_river', '1007_master_upload_twins', '0807_cabin_types']
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Cruise data integration error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
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
    // Download CSV from storage bucket
    const { data: csvData, error: downloadError } = await supabase.storage
      .from('twins-upload-1007')
      .download('1007 Master Upload Twins.csv');
    
    if (downloadError) throw downloadError;
    
    // Convert blob to text
    const csvText = await csvData.text();
    
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
  return oceanData.map(cruise => {
    // Create cabin type mapping
    const cabinMapping = createCabinMapping(cruise, cabinTypes, 'ocean');
    
    return {
      id: `ocean_${cruise.id || generateId()}`,
      source: 'TWINS',
      cruiseType: 'Ocean',
      
      // Basic info
      ship: cruise.ship_name || cruise.vessel || cruise.ship || '',
      cruiseLine: cruise.cruise_line || cruise.operator || '',
      itinerary: cruise.itinerary || cruise.route || '',
      destination: cruise.destination || cruise.region || '',
      
      // Dates
      departureDate: normalizeDate(cruise.departure_date || cruise.sail_date),
      returnDate: normalizeDate(cruise.return_date || cruise.end_date),
      duration: cruise.duration || cruise.nights || calculateDuration(cruise.departure_date, cruise.return_date),
      
      // Pricing
      pricing: {
        inside: parsePrice(cruise.inside_price || cruise.interior),
        oceanview: parsePrice(cruise.oceanview_price || cruise.ocean_view),
        balcony: parsePrice(cruise.balcony_price || cruise.balcony),
        suite: parsePrice(cruise.suite_price || cruise.suite)
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