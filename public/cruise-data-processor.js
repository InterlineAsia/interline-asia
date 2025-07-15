// Cruise Data Processor - Production Ready
// Processes CSV data and creates unified cruise deals structure

class CruiseDataProcessor {
  constructor() {
    this.riverDeals = [];
    this.oceanDeals = [];
    this.cabinTypes = [];
    this.processedDeals = [];
  }

  // Process river cruise data from CSV
  processRiverData(csvData) {
    const lines = csvData.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = this.parseCSVLine(line);
      if (values.length < headers.length) continue;
      
      const deal = {};
      headers.forEach((header, index) => {
        deal[header] = values[index] ? values[index].replace(/"/g, '').trim() : '';
      });
      
      // Process river deal
      const processedDeal = {
        id: `river_${deal.SEQ || Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        seq: deal.SEQ,
        cruise_type: 'River Cruise',
        year: deal.Year,
        region: deal.Region,
        nights: parseInt(deal.Nights) || null,
        departure_date: this.parseDate(deal.Date),
        departure_port: deal.From,
        arrival_port: deal.To,
        itinerary: deal.Itinerary,
        cruise_line: deal['Cruise Line'],
        ship: deal.Ship,
        sale_date: this.parseDate(deal.Sale),
        cabin_1: this.parsePrice(deal.Inside),
        cabin_2: this.parsePrice(deal.Oceanview),
        cabin_3: this.parsePrice(deal.Balcony),
        cabin_4: this.parsePrice(deal.Suite),
        ship_map_url: deal.Shipmap,
        cruise_offer_url: deal['Cruise Offer URL'],
        destination: deal.Region,
        duration: parseInt(deal.Nights) || null,
        price: this.getLowestPrice([deal.Inside, deal.Oceanview, deal.Balcony, deal.Suite]),
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      this.riverDeals.push(processedDeal);
    }
    
    console.log(`Processed ${this.riverDeals.length} river cruise deals`);
    return this.riverDeals;
  }

  // Process ocean cruise data from CSV
  processOceanData(csvData) {
    const lines = csvData.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = this.parseCSVLine(line);
      if (values.length < headers.length) continue;
      
      const deal = {};
      headers.forEach((header, index) => {
        deal[header] = values[index] ? values[index].replace(/"/g, '').trim() : '';
      });
      
      // Process ocean deal (structure may be different)
      const processedDeal = {
        id: `ocean_${deal.SEQ || Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        seq: deal.SEQ,
        cruise_type: 'Ocean Cruise',
        year: deal.Year,
        region: deal.Region,
        nights: parseInt(deal.Nights) || null,
        departure_date: this.parseDate(deal.Date),
        departure_port: deal.From,
        arrival_port: deal.To,
        itinerary: deal.Itinerary,
        cruise_line: deal['Cruise Line'],
        ship: deal.Ship,
        sale_date: this.parseDate(deal.Sale),
        cabin_1: this.parsePrice(deal.Inside),
        cabin_2: this.parsePrice(deal.Oceanview),
        cabin_3: this.parsePrice(deal.Balcony),
        cabin_4: this.parsePrice(deal.Suite),
        ship_map_url: deal.Shipmap,
        cruise_offer_url: deal['Cruise Offer URL'],
        destination: deal.Region,
        duration: parseInt(deal.Nights) || null,
        price: this.getLowestPrice([deal.Inside, deal.Oceanview, deal.Balcony, deal.Suite]),
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      this.oceanDeals.push(processedDeal);
    }
    
    console.log(`Processed ${this.oceanDeals.length} ocean cruise deals`);
    return this.oceanDeals;
  }

  // Process cabin types data
  processCabinTypes(csvData) {
    const lines = csvData.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = this.parseCSVLine(line);
      if (values.length < headers.length) continue;
      
      const cabinType = {};
      headers.forEach((header, index) => {
        cabinType[header] = values[index] ? values[index].replace(/"/g, '').trim() : '';
      });
      
      this.cabinTypes.push(cabinType);
    }
    
    console.log(`Processed ${this.cabinTypes.length} cabin type definitions`);
    return this.cabinTypes;
  }

  // Get all processed deals
  getAllDeals() {
    this.processedDeals = [...this.riverDeals, ...this.oceanDeals];
    return this.processedDeals;
  }

  // Utility functions
  parseCSVLine(line) {
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

  parseDate(dateStr) {
    if (!dateStr || dateStr === '') return null;
    
    // Handle various date formats
    const cleanDate = dateStr.replace(/"/g, '').trim();
    
    // Try DD-MMM-YY format (e.g., "07-Jul-25")
    const ddMmmYy = cleanDate.match(/(\d{1,2})-([A-Za-z]{3})-(\d{2})/);
    if (ddMmmYy) {
      const day = ddMmmYy[1].padStart(2, '0');
      const month = this.getMonthNumber(ddMmmYy[2]);
      const year = `20${ddMmmYy[3]}`;
      return `${year}-${month}-${day}`;
    }
    
    // Try other formats
    const date = new Date(cleanDate);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
    
    return null;
  }

  getMonthNumber(monthAbbr) {
    const months = {
      'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
      'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
      'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
    };
    return months[monthAbbr] || '01';
  }

  parsePrice(priceStr) {
    if (!priceStr || priceStr === '' || priceStr.toLowerCase().includes('quote')) {
      return null;
    }
    
    // Remove currency symbols and commas
    const cleanPrice = priceStr.replace(/[$,"\s]/g, '');
    const price = parseFloat(cleanPrice);
    
    return isNaN(price) ? null : price;
  }

  getLowestPrice(prices) {
    const validPrices = prices
      .map(p => this.parsePrice(p))
      .filter(p => p !== null && p > 0);
    
    return validPrices.length > 0 ? Math.min(...validPrices) : null;
  }

  // Get cruise line logo filename
  getCruiseLineSlug(cruiseLine) {
    if (!cruiseLine) return 'placeholder';
    
    return cruiseLine
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // Get sample deals for fallback
  getSampleDeals() {
    return [
      {
        id: 'sample-river-1',
        cruise_type: 'River Cruise',
        ship: 'AmaBella',
        cruise_line: 'AmaWaterways',
        destination: 'Europe',
        region: 'Europe',
        departure_date: '2025-07-07',
        departure_port: 'Budapest, Hungary',
        arrival_port: 'Vilshofen, Germany',
        itinerary: 'Melodies of the Danube 2025',
        nights: 7,
        duration: 7,
        cabin_1: 3440,
        cabin_2: 4040,
        cabin_3: 4640,
        cabin_4: null,
        price: 3440,
        is_active: true
      },
      {
        id: 'sample-ocean-1',
        cruise_type: 'Ocean Cruise',
        ship: 'Seven Seas Explorer',
        cruise_line: 'Regent Seven Seas Cruises',
        destination: 'Mediterranean',
        region: 'Mediterranean',
        departure_date: '2025-08-15',
        departure_port: 'Barcelona, Spain',
        arrival_port: 'Rome, Italy',
        itinerary: 'Barcelona - Monaco - Florence - Rome - Naples',
        nights: 14,
        duration: 14,
        cabin_1: 4999,
        cabin_2: 5999,
        cabin_3: 7999,
        cabin_4: 12999,
        price: 4999,
        is_active: true
      },
      {
        id: 'sample-ocean-2',
        cruise_type: 'Ocean Cruise',
        ship: 'World Explorer',
        cruise_line: 'Atlas Ocean Voyages',
        destination: 'Arctic',
        region: 'Arctic',
        departure_date: '2025-07-20',
        departure_port: 'Reykjavik, Iceland',
        arrival_port: 'Oslo, Norway',
        itinerary: 'Reykjavik - Isafjordur - Akureyri - Bergen - Oslo',
        nights: 11,
        duration: 11,
        cabin_1: 6879,
        cabin_2: null,
        cabin_3: null,
        cabin_4: null,
        price: 6879,
        is_active: true
      }
    ];
  }
}

// Export for global use
window.CruiseDataProcessor = CruiseDataProcessor;