// Unified Deals Loader - Consolidates all deal loading functionality
// Replaces: deals-error-fix.js, deals-loader-fix.js, deals-unified-loader.js, etc.

class UnifiedDealsLoader {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    this.retryAttempts = 3;
    this.retryDelay = 1000;
    this.isLoading = false;
    this.loadPromise = null;
  }

  // Main method to load all deals
  async loadAllDeals() {
    // Return cached data if available and fresh
    const cached = this.getCachedData('allDeals');
    if (cached) {
      console.log('DEALS: Using cached data');
      return cached;
    }

    // Prevent multiple simultaneous loads
    if (this.isLoading && this.loadPromise) {
      console.log('DEALS: Load already in progress, waiting...');
      return await this.loadPromise;
    }

    this.isLoading = true;
    this.loadPromise = this._loadDealsWithRetry();

    try {
      const deals = await this.loadPromise;
      this.setCachedData('allDeals', deals);
      return deals;
    } finally {
      this.isLoading = false;
      this.loadPromise = null;
    }
  }

  // Load deals with retry logic
  async _loadDealsWithRetry() {
    let lastError;
    
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        console.log(`DEALS: Loading attempt ${attempt}/${this.retryAttempts}`);
        return await this._loadDealsFromSources();
      } catch (error) {
        lastError = error;
        console.warn(`DEALS: Attempt ${attempt} failed:`, error.message);
        
        if (attempt < this.retryAttempts) {
          await this.delay(this.retryDelay * attempt);
        }
      }
    }
    
    throw new Error(`Failed to load deals after ${this.retryAttempts} attempts: ${lastError.message}`);
  }

  // Load deals from multiple sources
  async _loadDealsFromSources() {
    const deals = [];
    
    // Try Supabase first (fastest)
    try {
      const supabaseDeals = await this.loadFromSupabase();
      if (supabaseDeals.length > 0) {
        console.log(`DEALS: Loaded ${supabaseDeals.length} deals from Supabase`);
        return supabaseDeals;
      }
    } catch (error) {
      console.warn('DEALS: Supabase failed, trying CSV files:', error.message);
    }

    // Fallback to CSV files
    try {
      const csvDeals = await this.loadFromCSV();
      if (csvDeals.length > 0) {
        console.log(`DEALS: Loaded ${csvDeals.length} deals from CSV files`);
        return csvDeals;
      }
    } catch (error) {
      console.warn('DEALS: CSV loading failed, trying JSON chunks:', error.message);
    }

    // Fallback to JSON chunks
    try {
      const jsonDeals = await this.loadFromJSONChunks();
      if (jsonDeals.length > 0) {
        console.log(`DEALS: Loaded ${jsonDeals.length} deals from JSON chunks`);
        return jsonDeals;
      }
    } catch (error) {
      console.warn('DEALS: JSON chunks failed:', error.message);
    }

    // Final fallback to sample data
    console.warn('DEALS: All sources failed, using sample data');
    return this.getSampleDeals();
  }

  // Load from Supabase database
  async loadFromSupabase() {
    if (!window.supabaseClient) {
      throw new Error('Supabase client not available');
    }

    await window.supabaseClient.readyPromise;
    
    const { data, error } = await window.supabaseClient.supabase
      .from('cruise_deals')
      .select('*')
      .eq('is_active', true)
      .order('departure_date', { ascending: true });

    if (error) throw error;
    
    return (data || []).map(deal => this.transformSupabaseDeal(deal));
  }

  // Load from CSV files
  async loadFromCSV() {
    const deals = [];
    
    // Load twins.csv (ocean cruises)
    try {
      const twinsResponse = await fetch('/twins.csv');
      if (twinsResponse.ok) {
        const twinsCSV = await twinsResponse.text();
        const twinsDeals = this.parseCSV(twinsCSV, 'Ocean Cruise');
        deals.push(...twinsDeals);
      }
    } catch (error) {
      console.warn('DEALS: Failed to load twins.csv:', error.message);
    }

    // Load river.csv (river cruises)
    try {
      const riverResponse = await fetch('/river.csv');
      if (riverResponse.ok) {
        const riverCSV = await riverResponse.text();
        const riverDeals = this.parseCSV(riverCSV, 'River Cruise');
        deals.push(...riverDeals);
      }
    } catch (error) {
      console.warn('DEALS: Failed to load river.csv:', error.message);
    }

    return deals;
  }

  // Load from JSON chunks
  async loadFromJSONChunks() {
    const deals = [];
    
    for (let i = 1; i <= 25; i++) {
      try {
        const response = await fetch(`/data/cruise-deals-${i}.json`);
        if (response.ok) {
          const chunkData = await response.json();
          if (Array.isArray(chunkData)) {
            deals.push(...chunkData);
          }
        }
      } catch (error) {
        // Silently continue if chunk doesn't exist
        continue;
      }
    }

    return deals;
  }

  // Parse CSV content
  parseCSV(csvText, cruiseType) {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = this.parseCSVLine(lines[0]);
    const deals = [];

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = this.parseCSVLine(lines[i]);
        if (values.length >= 10) {
          const deal = this.createDealFromCSV(headers, values, cruiseType);
          if (deal.cruiseLine && deal.shipName) {
            deals.push(deal);
          }
        }
      } catch (error) {
        console.warn(`DEALS: Error parsing line ${i}:`, error.message);
      }
    }

    return deals;
  }

  // Parse CSV line handling quotes
  parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  }

  // Create deal object from CSV data
  createDealFromCSV(headers, values, cruiseType) {
    const deal = {};
    headers.forEach((header, index) => {
      deal[header] = values[index] || '';
    });

    // Determine actual cruise type
    let actualCruiseType = cruiseType;
    const region = (deal.Region || '').toLowerCase();
    const itinerary = (deal.Itinerary || '').toLowerCase();
    
    if (region.includes('arctic') || region.includes('antarctic') || 
        itinerary.includes('expedition') || itinerary.includes('polar')) {
      actualCruiseType = 'Expedition Cruise';
    }

    return {
      id: `${actualCruiseType.toLowerCase().replace(/\s+/g, '_')}_${deal.SEQ || Math.random().toString(36).substr(2, 9)}`,
      cruiseType: actualCruiseType,
      cruiseLine: deal['Cruise Line'] || '',
      shipName: deal.Ship || '',
      region: deal.Region || '',
      nights: parseInt(deal.Nights || 0),
      departureDate: this.parseDate(deal.Date),
      departurePort: deal.From || '',
      arrivalPort: deal.To || '',
      itinerary: deal.Itinerary || '',
      insidePrice: this.parsePrice(deal.Inside),
      oceanviewPrice: this.parsePrice(deal.Oceanview),
      balconyPrice: this.parsePrice(deal.Balcony),
      suitePrice: this.parsePrice(deal.Suite),
      saleEndDate: this.parseDate(deal.Sale),
      shipMap: deal.Shipmap || ''
    };
  }

  // Transform Supabase deal to standard format
  transformSupabaseDeal(deal) {
    return {
      id: deal.id,
      cruiseType: this.determineCruiseType(deal),
      cruiseLine: deal.cruise_line || '',
      shipName: deal.ship_name || '',
      region: deal.region || '',
      nights: deal.nights || 0,
      departureDate: deal.departure_date ? new Date(deal.departure_date) : null,
      departurePort: deal.departure_port || '',
      arrivalPort: deal.arrival_port || '',
      itinerary: deal.itinerary || '',
      insidePrice: parseFloat(deal.inside_price) || 0,
      oceanviewPrice: parseFloat(deal.oceanview_price) || 0,
      balconyPrice: parseFloat(deal.balcony_price) || 0,
      suitePrice: parseFloat(deal.suite_price) || 0,
      saleEndDate: deal.sale_end_date ? new Date(deal.sale_end_date) : null,
      shipMap: deal.ship_map || ''
    };
  }

  // Determine cruise type from deal data
  determineCruiseType(deal) {
    const region = (deal.region || '').toLowerCase();
    const itinerary = (deal.itinerary || '').toLowerCase();
    
    if (region.includes('arctic') || region.includes('antarctic') || 
        itinerary.includes('expedition') || itinerary.includes('polar')) {
      return 'Expedition Cruise';
    } else if (region.includes('river') || itinerary.includes('river')) {
      return 'River Cruise';
    } else {
      return 'Ocean Cruise';
    }
  }

  // Parse date from various formats
  parseDate(dateStr) {
    if (!dateStr) return null;
    
    // Handle DD-MMM-YY format
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
          return new Date(year, month, day);
        }
      }
    }
    
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  }

  // Parse price from string
  parsePrice(priceStr) {
    if (!priceStr || priceStr === 'Quote Available') return 0;
    const price = parseFloat(priceStr.replace(/[$,]/g, ''));
    return isNaN(price) ? 0 : price;
  }

  // Find deal by ID
  async findDealById(dealId) {
    const deals = await this.loadAllDeals();
    return deals.find(deal => deal.id === dealId);
  }

  // Get sample deals for fallback
  getSampleDeals() {
    return [
      {
        id: 'sample_1',
        cruiseType: 'Ocean Cruise',
        cruiseLine: 'Sample Cruise Line',
        shipName: 'Sample Ship',
        region: 'Caribbean',
        nights: 7,
        departureDate: new Date('2025-08-15'),
        departurePort: 'Miami',
        arrivalPort: 'Miami',
        itinerary: 'Sample Caribbean Itinerary',
        insidePrice: 1299,
        oceanviewPrice: 1499,
        balconyPrice: 1799,
        suitePrice: 2499,
        saleEndDate: new Date('2025-07-31'),
        shipMap: ''
      }
    ];
  }

  // Cache management
  getCachedData(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  setCachedData(key, data) {
    this.cache.set(key, {
      data: data,
      timestamp: Date.now()
    });
  }

  clearCache() {
    this.cache.clear();
  }

  // Utility delay function
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Create global instance
window.unifiedDealsLoader = new UnifiedDealsLoader();

// Backward compatibility
window.csvLoader = {
  loadAllDeals: () => window.unifiedDealsLoader.loadAllDeals(),
  loadCSVData: () => window.unifiedDealsLoader.loadAllDeals(),
  findDealById: (id) => window.unifiedDealsLoader.findDealById(id)
};

console.log('✅ Unified Deals Loader initialized');