#!/usr/bin/env node
// Process CSV files directly from local repository
// Usage: node scripts/process-local-csv.js [filename]

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nxreyyxbuwxjfmtvdkji.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function processCSVFile(filename) {
  try {
    const filePath = path.join(process.cwd(), 'public', filename);
    
    if (!fs.existsSync(filePath)) {
      console.error(`❌ File not found: ${filePath}`);
      return;
    }
    
    console.log(`📁 Processing: ${filename}`);
    console.log(`📏 File size: ${(fs.statSync(filePath).size / 1024 / 1024).toFixed(2)}MB`);
    
    const csvContent = fs.readFileSync(filePath, 'utf8');
    const deals = parseCSV(csvContent);
    
    console.log(`📊 Parsed ${deals.length} deals from CSV`);
    
    if (deals.length === 0) {
      console.error('❌ No valid deals found in CSV');
      return;
    }
    
    // Clear existing data
    console.log('🗑️  Clearing existing cruise deals...');
    const { error: deleteError } = await supabase
      .from('cruise_deals')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (deleteError) {
      console.warn('⚠️  Warning clearing existing data:', deleteError.message);
    }
    
    // Insert in batches
    const batchSize = 100;
    let insertedCount = 0;
    
    for (let i = 0; i < deals.length; i += batchSize) {
      const batch = deals.slice(i, i + batchSize);
      
      console.log(`📤 Inserting batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(deals.length/batchSize)} (${batch.length} deals)...`);
      
      const { error: insertError } = await supabase
        .from('cruise_deals')
        .insert(batch);
      
      if (insertError) {
        console.error(`❌ Batch ${Math.floor(i/batchSize) + 1} failed:`, insertError.message);
      } else {
        insertedCount += batch.length;
        console.log(`✅ Batch ${Math.floor(i/batchSize) + 1} inserted successfully`);
      }
    }
    
    console.log(`\n🎉 Processing complete!`);
    console.log(`📊 Total deals processed: ${insertedCount}/${deals.length}`);
    
    // Show sample of what was inserted
    const { data: sampleDeals } = await supabase
      .from('cruise_deals')
      .select('cruise_line, ship_name, departure_date')
      .limit(5);
    
    if (sampleDeals && sampleDeals.length > 0) {
      console.log('\n📋 Sample of inserted deals:');
      sampleDeals.forEach(deal => {
        console.log(`  • ${deal.cruise_line} - ${deal.ship_name} (${deal.departure_date})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Processing error:', error.message);
  }
}

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
        id: `${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}`,
        cruise_line: deal['Cruise Line'] || deal.cruise_line || '',
        ship_name: deal.Ship || deal.ship_name || '',
        departure_date: formatDate(deal.Date || deal.departure_date || ''),
        region: deal.Region || deal.region || '',
        nights: parseInt(deal.Nights || deal.nights || 0) || null,
        itinerary: deal.Itinerary || deal.itinerary || '',
        inside_price: parsePrice(deal.Inside || deal.inside_price),
        oceanview_price: parsePrice(deal.Oceanview || deal.oceanview_price),
        balcony_price: parsePrice(deal.Balcony || deal.balcony_price),
        suite_price: parsePrice(deal.Suite || deal.suite_price),
        departure_port: deal.From || deal.departure_port || '',
        arrival_port: deal.To || deal.arrival_port || '',
        seq_number: deal.SEQ || deal.seq_number || '',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Only add deals with required fields
      if (transformedDeal.cruise_line && transformedDeal.ship_name) {
        deals.push(transformedDeal);
      }
    } catch (lineError) {
      console.warn(`⚠️  Skipping line ${i}:`, lineError.message);
    }
  }
  
  return deals;
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
  return result.map(val => val.trim().replace(/"/g, ''));
}

function parsePrice(price) {
  if (!price) return null;
  if (typeof price === 'string' && price.toLowerCase().includes('quote')) return null;
  
  const cleaned = price.toString().replace(/[^0-9.]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
}

function formatDate(dateStr) {
  if (!dateStr) return null;
  
  try {
    // Handle DD-MMM-YY format (e.g., "07-Jul-25")
    if (dateStr.includes('-') && dateStr.length <= 9) {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const day = parseInt(parts[0]);
        const monthMap = {
          'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
          'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
        };
        const month = monthMap[parts[1].toLowerCase()];
        let year = parseInt(parts[2]);
        if (year < 100) year += 2000;
        
        if (!isNaN(day) && month !== undefined && !isNaN(year)) {
          return new Date(year, month, day).toISOString().split('T')[0];
        }
      }
    }
    
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
  } catch (error) {
    return null;
  }
}

// Main execution
const filename = process.argv[2];

if (!filename) {
  console.log('📁 Available CSV files in public/:');
  const files = fs.readdirSync('public').filter(f => f.endsWith('.csv') || f.endsWith('.CSV'));
  files.forEach(file => {
    const size = (fs.statSync(path.join('public', file)).size / 1024 / 1024).toFixed(2);
    console.log(`  • ${file} (${size}MB)`);
  });
  console.log('\n💡 Usage: node scripts/process-local-csv.js <filename>');
  console.log('💡 Example: node scripts/process-local-csv.js twins.csv');
} else {
  processCSVFile(filename);
}