// API endpoint to process CSV files from Supabase Storage and populate deals table
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
    console.log('Starting CSV processing...');
    
    // 1. Download and parse both CSV files from Supabase Storage
    const cabinTypesData = await downloadAndParseCSV('uploads/2604 Cabin Types Upload.csv');
    const masterData = await downloadAndParseCSV('uploads/2906 Master Upload Twins.csv');
    
    console.log(`Parsed ${cabinTypesData.length} cabin types and ${masterData.length} master records`);
    
    // 2. Create cabin types lookup map
    const cabinTypesMap = createCabinTypesMap(cabinTypesData);
    
    // 3. Process and categorize deals
    const processedDeals = processMasterData(masterData, cabinTypesMap);
    
    console.log(`Processed ${processedDeals.length} deals`);
    
    // 4. Clear existing deals and insert new ones
    await clearAndInsertDeals(processedDeals);
    
    console.log('Successfully updated deals table');
    
    res.status(200).json({ 
      success: true, 
      message: `Processed ${processedDeals.length} deals successfully`,
      deals_count: processedDeals.length
    });
    
  } catch (error) {
    console.error('Error processing CSV files:', error);
    res.status(500).json({ 
      error: 'Failed to process CSV files', 
      details: error.message 
    });
  }
}

async function downloadAndParseCSV(filePath) {
  try {
    // Download file from Supabase Storage
    const { data, error } = await supabase.storage
      .from('uploads')
      .download(filePath);
    
    if (error) {
      throw new Error(`Failed to download ${filePath}: ${error.message}`);
    }
    
    // Convert blob to text
    const csvText = await data.text();
    
    // Parse CSV
    return parseCSV(csvText);
    
  } catch (error) {
    console.error(`Error downloading/parsing ${filePath}:`, error);
    throw error;
  }
}

function parseCSV(csvText) {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const rows = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === headers.length) {
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index]?.trim().replace(/"/g, '') || '';
      });
      rows.push(row);
    }
  }
  
  return rows;
}

function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  values.push(current);
  return values;
}

function createCabinTypesMap(cabinTypesData) {
  const map = new Map();
  
  cabinTypesData.forEach(row => {
    // Assuming cabin types CSV has columns like: cabin_code, cabin_type, category, description
    const cabinCode = row.cabin_code || row.code || row.type_code;
    const cabinType = row.cabin_type || row.type || row.name;
    const category = row.category || categorizeByType(cabinType);
    
    if (cabinCode) {
      map.set(cabinCode, {
        cabin_type: cabinType,
        category: category,
        description: row.description || ''
      });
    }
  });
  
  return map;
}

function categorizeByType(cabinType) {
  if (!cabinType) return 'standard';
  
  const type = cabinType.toLowerCase();
  
  if (type.includes('suite') || type.includes('penthouse')) return 'suite';
  if (type.includes('balcony') || type.includes('veranda')) return 'balcony';
  if (type.includes('oceanview') || type.includes('ocean view')) return 'oceanview';
  if (type.includes('interior') || type.includes('inside')) return 'interior';
  
  return 'standard';
}

function processMasterData(masterData, cabinTypesMap) {
  return masterData.map(row => {
    // Extract cabin type information
    const cabinCode = row.cabin_code || row.cabin_type_code || row.type_code;
    const cabinInfo = cabinTypesMap.get(cabinCode) || {};
    
    // Process dates
    const departureDate = parseDate(row.departure_date || row.depart_date || row.sailing_date);
    const returnDate = parseDate(row.return_date || row.arrival_date || row.end_date);
    
    // Process price
    const price = parsePrice(row.price || row.cost || row.rate || row.from_price);
    
    // Determine region
    const region = determineRegion(row.itinerary || row.destination || row.ports || '');
    
    return {
      cruise_line: cleanText(row.cruise_line || row.line || ''),
      ship_name: cleanText(row.ship_name || row.ship || row.vessel || ''),
      cruise_name: cleanText(row.cruise_name || row.title || row.name || `${row.ship_name} Cruise`),
      departure_date: departureDate,
      return_date: returnDate,
      price: price,
      cabin_type: cabinInfo.cabin_type || cleanText(row.cabin_type || ''),
      category: cabinInfo.category || categorizeByType(row.cabin_type),
      itinerary: cleanText(row.itinerary || row.route || row.ports || ''),
      region: region,
      duration: calculateDuration(departureDate, returnDate),
      link_to_pdf: cleanText(row.link_to_pdf || row.pdf_link || row.brochure || ''),
      description: cleanText(row.description || row.details || ''),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }).filter(deal => deal.cruise_line && deal.ship_name && deal.price > 0);
}

function parseDate(dateStr) {
  if (!dateStr) return null;
  
  try {
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
  } catch {
    return null;
  }
}

function parsePrice(priceStr) {
  if (!priceStr) return 0;
  
  // Remove currency symbols and commas, extract number
  const numStr = priceStr.toString().replace(/[$,£€]/g, '').trim();
  const price = parseFloat(numStr);
  
  return isNaN(price) ? 0 : Math.round(price);
}

function determineRegion(itinerary) {
  if (!itinerary) return 'Other';
  
  const text = itinerary.toLowerCase();
  
  if (text.includes('caribbean') || text.includes('bahamas') || text.includes('jamaica')) return 'Caribbean';
  if (text.includes('mediterranean') || text.includes('italy') || text.includes('spain')) return 'Mediterranean';
  if (text.includes('alaska') || text.includes('glacier')) return 'Alaska';
  if (text.includes('norway') || text.includes('fjord') || text.includes('scandinavia')) return 'Northern Europe';
  if (text.includes('asia') || text.includes('japan') || text.includes('singapore')) return 'Asia';
  if (text.includes('australia') || text.includes('new zealand') || text.includes('pacific')) return 'Pacific';
  if (text.includes('transatlantic') || text.includes('crossing')) return 'Transatlantic';
  
  return 'Other';
}

function calculateDuration(departureDate, returnDate) {
  if (!departureDate || !returnDate) return null;
  
  try {
    const start = new Date(departureDate);
    const end = new Date(returnDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : null;
  } catch {
    return null;
  }
}

function cleanText(text) {
  if (!text) return '';
  return text.toString().trim().replace(/\s+/g, ' ');
}

async function clearAndInsertDeals(deals) {
  try {
    // Clear existing deals
    const { error: deleteError } = await supabase
      .from('deals')
      .delete()
      .neq('id', 0); // Delete all records
    
    if (deleteError) {
      console.warn('Warning clearing existing deals:', deleteError);
    }
    
    // Insert new deals in batches
    const batchSize = 100;
    for (let i = 0; i < deals.length; i += batchSize) {
      const batch = deals.slice(i, i + batchSize);
      
      const { error: insertError } = await supabase
        .from('deals')
        .insert(batch);
      
      if (insertError) {
        console.error(`Error inserting batch ${i / batchSize + 1}:`, insertError);
        throw insertError;
      }
      
      console.log(`Inserted batch ${i / batchSize + 1}/${Math.ceil(deals.length / batchSize)}`);
    }
    
  } catch (error) {
    console.error('Error in clearAndInsertDeals:', error);
    throw error;
  }
}