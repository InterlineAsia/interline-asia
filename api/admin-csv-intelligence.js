// Admin CSV Intelligence System
// Auto-detects, ingests, and learns from new cruise CSV uploads

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nxreyyxbuwxjfmtvdkji.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

class AdminCSVIntelligence {
  constructor() {
    this.watchDirectories = [
      './uploads/',
      './public/data/',
      './public/',
      './'
    ];
    this.supportedFormats = ['river.csv', 'twins.csv', 'deals.csv', 'cruise-deals.csv'];
    this.isProcessing = false;
    this.lastProcessed = new Map();
  }

  // Main API handler
  async handleRequest(req, res) {
    const { action } = req.body;

    try {
      switch (action) {
        case 'scan-for-new-csvs':
          return await this.scanForNewCSVs(req, res);
        case 'process-csv':
          return await this.processSpecificCSV(req, res);
        case 'get-learning-status':
          return await this.getLearningStatus(req, res);
        case 'force-relearn':
          return await this.forceRelearn(req, res);
        default:
          return res.status(400).json({ error: 'Invalid action' });
      }
    } catch (error) {
      console.error('Admin CSV Intelligence error:', error);
      return res.status(500).json({ 
        error: 'CSV Intelligence system error',
        details: error.message 
      });
    }
  }

  // Scan for new CSV files
  async scanForNewCSVs(req, res) {
    if (this.isProcessing) {
      return res.status(200).json({
        success: false,
        message: 'CSV processing already in progress',
        status: 'busy'
      });
    }

    try {
      console.log('🔍 Admin CSV Intelligence: Scanning for new files...');
      
      const foundFiles = [];
      const processedFiles = [];
      const errors = [];

      // Scan all watch directories
      for (const dir of this.watchDirectories) {
        try {
          if (fs.existsSync(dir)) {
            const files = fs.readdirSync(dir);
            const csvFiles = files.filter(file => 
              file.endsWith('.csv') && this.isSupportedFormat(file)
            );

            for (const file of csvFiles) {
              const filePath = path.join(dir, file);
              const stats = fs.statSync(filePath);
              const lastModified = stats.mtime.getTime();
              
              foundFiles.push({
                file: file,
                path: filePath,
                size: stats.size,
                lastModified: lastModified,
                isNew: !this.lastProcessed.has(filePath) || 
                       this.lastProcessed.get(filePath) < lastModified
              });
            }
          }
        } catch (dirError) {
          console.warn(`Could not scan directory ${dir}:`, dirError.message);
        }
      }

      // Process new files
      this.isProcessing = true;
      
      for (const fileInfo of foundFiles.filter(f => f.isNew)) {
        try {
          console.log(`📥 Processing new CSV: ${fileInfo.file}`);
          const result = await this.ingestCSVFile(fileInfo);
          processedFiles.push(result);
          this.lastProcessed.set(fileInfo.path, fileInfo.lastModified);
        } catch (fileError) {
          console.error(`Error processing ${fileInfo.file}:`, fileError);
          errors.push({
            file: fileInfo.file,
            error: fileError.message
          });
        }
      }

      this.isProcessing = false;

      // Generate learning summary
      const summary = await this.generateLearningSummary(processedFiles);

      return res.status(200).json({
        success: true,
        message: `Scanned ${foundFiles.length} CSV files, processed ${processedFiles.length} new files`,
        foundFiles: foundFiles.length,
        processedFiles: processedFiles.length,
        errors: errors.length,
        summary: summary,
        details: {
          processed: processedFiles,
          errors: errors
        }
      });

    } catch (error) {
      this.isProcessing = false;
      console.error('CSV scan error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to scan for CSV files',
        details: error.message
      });
    }
  }

  // Check if file format is supported
  isSupportedFormat(filename) {
    return this.supportedFormats.some(format => 
      filename.toLowerCase().includes(format.toLowerCase().replace('.csv', ''))
    );
  }

  // Ingest a specific CSV file
  async ingestCSVFile(fileInfo) {
    console.log(`🧠 Learning from: ${fileInfo.file}`);
    
    const csvContent = fs.readFileSync(fileInfo.path, 'utf8');
    const deals = this.parseCSVContent(csvContent, fileInfo.file);
    
    if (deals.length === 0) {
      throw new Error('No valid deals found in CSV');
    }

    // Store deals in database
    const insertResult = await this.storeDealsinDatabase(deals, fileInfo.file);
    
    // Update intelligence indexes
    await this.updateIntelligenceIndexes(deals);

    return {
      file: fileInfo.file,
      dealsFound: deals.length,
      dealsInserted: insertResult.inserted,
      dealsUpdated: insertResult.updated,
      dealsSkipped: insertResult.skipped,
      cruiseLines: [...new Set(deals.map(d => d.cruiseLine))],
      regions: [...new Set(deals.map(d => d.region))],
      priceRange: {
        min: Math.min(...deals.map(d => d.minPrice).filter(p => p > 0)),
        max: Math.max(...deals.map(d => d.maxPrice).filter(p => p > 0))
      }
    };
  }

  // Parse CSV content into deal objects
  parseCSVContent(csvContent, filename) {
    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const deals = [];
    
    for (let i = 1; i < lines.length; i++) {
      try {
        const values = this.parseCSVLine(lines[i]);
        const deal = this.createDealObject(headers, values, filename);
        
        if (deal && deal.cruiseLine && deal.shipName) {
          deals.push(deal);
        }
      } catch (error) {
        console.warn(`Skipping row ${i} in ${filename}:`, error.message);
      }
    }
    
    return deals;
  }

  // Parse CSV line handling quotes and commas
  parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim().replace(/"/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim().replace(/"/g, ''));
    return result;
  }

  // Create deal object from CSV row
  createDealObject(headers, values, filename) {
    const deal = {};
    headers.forEach((header, index) => {
      deal[header] = values[index] || '';
    });

    // Determine cruise type from filename
    const cruiseType = filename.toLowerCase().includes('river') ? 'River Cruise' : 'Ocean Cruise';

    // Extract and clean data
    const cleanDeal = {
      seq: deal.seq || `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      cruiseLine: deal['Cruise Line'] || deal.cruiseLine || '',
      shipName: deal.Ship || deal.shipName || '',
      departureDate: deal.Date || deal.departureDate || '',
      region: deal.Region || deal.region || '',
      nights: parseInt(deal.Nights || deal.nights || 0),
      from: deal.From || deal.from || '',
      to: deal.To || deal.to || '',
      itinerary: deal.Itinerary || deal.itinerary || '',
      year: deal.year || new Date().getFullYear().toString(),
      cruiseType: cruiseType,
      
      // Pricing
      insidePrice: this.parsePrice(deal.Inside || deal.insidePrice),
      oceanviewPrice: this.parsePrice(deal.Oceanview || deal.oceanviewPrice),
      balconyPrice: this.parsePrice(deal.Balcony || deal.balconyPrice),
      suitePrice: this.parsePrice(deal.Suite || deal.suitePrice),
      
      // Additional fields
      maxPax: parseInt(deal.maxPax || 4),
      cruiseOfferURL: deal.cruiseOfferURL || '',
      shipmap: deal.shipmap || '',
      
      // Metadata
      sourceFile: filename,
      lastUpdated: new Date().toISOString()
    };

    // Calculate price range for indexing
    const prices = [
      cleanDeal.insidePrice,
      cleanDeal.oceanviewPrice, 
      cleanDeal.balconyPrice,
      cleanDeal.suitePrice
    ].filter(p => p > 0);

    cleanDeal.minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    cleanDeal.maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

    return cleanDeal;
  }

  // Parse price string to number
  parsePrice(priceStr) {
    if (!priceStr || priceStr.toLowerCase().includes('quote')) return 0;
    
    // Handle different price formats
    const cleaned = priceStr.toString().replace(/[$,\s]/g, '');
    const price = parseFloat(cleaned);
    return isNaN(price) ? 0 : price;
  }

  // Store deals in database
  async storeDealsinDatabase(deals, sourceFile) {
    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    console.log(`💾 Storing ${deals.length} deals from ${sourceFile}...`);

    // Process in batches to avoid overwhelming the database
    const batchSize = 50;
    for (let i = 0; i < deals.length; i += batchSize) {
      const batch = deals.slice(i, i + batchSize);
      
      for (const deal of batch) {
        try {
          // Check if deal already exists
          const { data: existing } = await supabase
            .from('cruise_deals')
            .select('seq')
            .eq('seq', deal.seq)
            .single();

          if (existing) {
            // Update existing deal
            const { error: updateError } = await supabase
              .from('cruise_deals')
              .update(deal)
              .eq('seq', deal.seq);

            if (updateError) {
              console.warn(`Update error for deal ${deal.seq}:`, updateError);
              skipped++;
            } else {
              updated++;
            }
          } else {
            // Insert new deal
            const { error: insertError } = await supabase
              .from('cruise_deals')
              .insert([deal]);

            if (insertError) {
              console.warn(`Insert error for deal ${deal.seq}:`, insertError);
              skipped++;
            } else {
              inserted++;
            }
          }
        } catch (dealError) {
          console.warn(`Error processing deal ${deal.seq}:`, dealError);
          skipped++;
        }
      }
    }

    console.log(`✅ Database update complete: ${inserted} inserted, ${updated} updated, ${skipped} skipped`);

    return { inserted, updated, skipped };
  }

  // Update intelligence indexes for immediate bot learning
  async updateIntelligenceIndexes(deals) {
    console.log('🧠 Updating intelligence indexes...');

    try {
      // Update cruise lines index
      const cruiseLines = [...new Set(deals.map(d => d.cruiseLine))];
      await this.updateIndex('cruise_lines', cruiseLines);

      // Update regions index
      const regions = [...new Set(deals.map(d => d.region))];
      await this.updateIndex('regions', regions);

      // Update price ranges
      const priceRanges = this.calculatePriceRanges(deals);
      await this.updateIndex('price_ranges', priceRanges);

      // Update duration ranges
      const durationRanges = this.calculateDurationRanges(deals);
      await this.updateIndex('duration_ranges', durationRanges);

      // Update departure ports
      const departurePorts = [...new Set(deals.map(d => d.from).filter(Boolean))];
      await this.updateIndex('departure_ports', departurePorts);

      console.log('✅ Intelligence indexes updated');

    } catch (error) {
      console.error('Error updating intelligence indexes:', error);
    }
  }

  // Update specific index in database
  async updateIndex(indexName, data) {
    try {
      const { error } = await supabase
        .from('intelligence_indexes')
        .upsert({
          index_name: indexName,
          index_data: data,
          last_updated: new Date().toISOString()
        });

      if (error) {
        console.warn(`Error updating ${indexName} index:`, error);
      }
    } catch (error) {
      console.warn(`Failed to update ${indexName} index:`, error);
    }
  }

  // Calculate price ranges for indexing
  calculatePriceRanges(deals) {
    const ranges = {
      'under-1000': 0,
      '1000-2000': 0,
      '2000-3000': 0,
      '3000-5000': 0,
      'luxury-5000+': 0
    };

    deals.forEach(deal => {
      if (deal.minPrice > 0) {
        if (deal.minPrice < 1000) ranges['under-1000']++;
        else if (deal.minPrice < 2000) ranges['1000-2000']++;
        else if (deal.minPrice < 3000) ranges['2000-3000']++;
        else if (deal.minPrice < 5000) ranges['3000-5000']++;
        else ranges['luxury-5000+']++;
      }
    });

    return ranges;
  }

  // Calculate duration ranges for indexing
  calculateDurationRanges(deals) {
    const ranges = {
      'short-7-or-less': 0,
      'medium-7-14': 0,
      'long-14-plus': 0,
      'expedition-21-plus': 0
    };

    deals.forEach(deal => {
      if (deal.nights > 0) {
        if (deal.nights <= 7) ranges['short-7-or-less']++;
        else if (deal.nights <= 14) ranges['medium-7-14']++;
        else if (deal.nights >= 21) ranges['expedition-21-plus']++;
        else ranges['long-14-plus']++;
      }
    });

    return ranges;
  }

  // Generate learning summary
  async generateLearningSummary(processedFiles) {
    if (processedFiles.length === 0) {
      return {
        message: 'No new files processed',
        totalDeals: 0,
        newCruiseLines: [],
        newRegions: []
      };
    }

    const totalDeals = processedFiles.reduce((sum, file) => sum + file.dealsFound, 0);
    const totalInserted = processedFiles.reduce((sum, file) => sum + file.dealsInserted, 0);
    const totalUpdated = processedFiles.reduce((sum, file) => sum + file.dealsUpdated, 0);

    const allCruiseLines = [...new Set(processedFiles.flatMap(file => file.cruiseLines))];
    const allRegions = [...new Set(processedFiles.flatMap(file => file.regions))];

    return {
      message: `Successfully learned from ${processedFiles.length} CSV file(s)`,
      totalDeals: totalDeals,
      dealsInserted: totalInserted,
      dealsUpdated: totalUpdated,
      filesProcessed: processedFiles.map(f => f.file),
      newCruiseLines: allCruiseLines,
      newRegions: allRegions,
      priceRanges: processedFiles.map(f => f.priceRange),
      timestamp: new Date().toISOString()
    };
  }

  // Get current learning status
  async getLearningStatus(req, res) {
    try {
      // Get total deals count
      const { count: totalDeals } = await supabase
        .from('cruise_deals')
        .select('*', { count: 'exact', head: true });

      // Get latest indexes
      const { data: indexes } = await supabase
        .from('intelligence_indexes')
        .select('*')
        .order('last_updated', { ascending: false });

      return res.status(200).json({
        success: true,
        status: {
          totalDeals: totalDeals || 0,
          isProcessing: this.isProcessing,
          lastProcessedFiles: Array.from(this.lastProcessed.keys()),
          intelligenceIndexes: indexes || [],
          watchDirectories: this.watchDirectories,
          supportedFormats: this.supportedFormats
        }
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to get learning status',
        details: error.message
      });
    }
  }

  // Force relearn from all CSV files
  async forceRelearn(req, res) {
    try {
      console.log('🔄 Force relearning from all CSV files...');
      
      // Clear last processed cache
      this.lastProcessed.clear();
      
      // Trigger full scan
      return await this.scanForNewCSVs(req, res);

    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to force relearn',
        details: error.message
      });
    }
  }
}

// Export handler
const csvIntelligence = new AdminCSVIntelligence();

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  return await csvIntelligence.handleRequest(req, res);
}