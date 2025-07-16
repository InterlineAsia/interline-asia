// Enhanced CSV Loader for Deal Details
// Loads and parses cruise deal data from CSV files

class EnhancedCSVLoader {
  constructor() {
    this.csvData = [];
    this.isLoaded = false;
  }

  async loadCSVData() {
    if (this.isLoaded && this.csvData.length > 0) {
      return this.csvData;
    }

    try {
      console.log('CSV LOADER: Loading cruise data from CSV files...');
      
      const allDeals = [];

      // Load river cruise data
      try {
        const riverResponse = await fetch('/river.csv?v=' + Date.now());
        if (riverResponse.ok) {
          const riverCSV = await riverResponse.text();
          const riverDeals = this.parseCSV(riverCSV, 'River Cruise');
          allDeals.push(...riverDeals);
          console.log(`CSV LOADER: Loaded ${riverDeals.length} river cruise deals`);
        }
      } catch (error) {
        console.warn('CSV LOADER: Failed to load river.csv:', error);
      }

      // Load ocean cruise data from data directory
      try {
        const oceanResponse = await fetch('/data/twins.csv?v=' + Date.now());
        if (oceanResponse.ok) {
          const oceanCSV = await oceanResponse.text();
          const oceanDeals = this.parseCSV(oceanCSV, 'Ocean Cruise');
          allDeals.push(...oceanDeals);
          console.log(`CSV LOADER: Loaded ${oceanDeals.length} ocean cruise deals`);
        }
      } catch (error) {
        console.warn('CSV LOADER: Failed to load data/twins.csv:', error);
      }

      this.csvData = allDeals;
      this.isLoaded = true;
      
      console.log(`CSV LOADER: Total deals loaded: ${allDeals.length}`);
      return allDeals;

    } catch (error) {
      console.error('CSV LOADER: Failed to load CSV data:', error);
      return [];
    }
  }

  parseCSV(csvText, cruiseType) {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const deals = [];

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = this.parseCSVLine(lines[i]);
        const deal = this.createDeal(headers, values, cruiseType);
        if (deal && deal.cruiseLine && deal.shipName) {
          deals.push(deal);
        }
      } catch (error) {
        console.warn(`CSV LOADER: Skipping row ${i}:`, error);
      }
    }

    return deals;
  }

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

  createDeal(headers, values, cruiseType) {
    const deal = {};
    headers.forEach((header, index) => {
      deal[header] = values[index] || '';
    });

    // Determine actual cruise type
    let actualType = cruiseType;
    const region = (deal.Region || '').toLowerCase();
    const itinerary = (deal.Itinerary || '').toLowerCase();

    if (region.includes('arctic') || region.includes('antarctic') ||
        itinerary.includes('expedition') || itinerary.includes('polar')) {
      actualType = 'Expedition Cruise';
    }

    // Generate consistent ID based on SEQ field
    const seq = deal.SEQ || deal.seq || Math.random().toString(36).substr(2, 9);
    const dealId = `${actualType.toLowerCase().replace(/\s+/g, '_')}_${seq}`;

    return {
      id: dealId,
      seq: seq,
      cruiseType: actualType,
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
      shipMap: deal.Shipmap || '',
      cruiseOfferUrl: deal['Cruise Offer URL'] || '',
      price: this.parsePrice(deal.Inside) || this.parsePrice(deal.Oceanview) || this.parsePrice(deal.Balcony) || 0,
      cabinTypes: this.getCabinTypes(deal)
    };
  }

  parseDate(dateStr) {
    if (!dateStr) return null;

    if (dateStr.includes('-') && dateStr.length <= 9) {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const day = parseInt(parts[0]);
        const month = parts[1];
        const year = parts[2].length === 2 ? parseInt('20' + parts[2]) : parseInt(parts[2]);
        const monthMap = {
          'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
          'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
        };
        const monthNum = monthMap[month];
        if (!isNaN(day) && monthNum !== undefined && !isNaN(year)) {
          return new Date(year, monthNum, day);
        }
      }
    }

    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  }

  parsePrice(priceStr) {
    if (!priceStr || priceStr.toLowerCase().includes('quote')) return 0;
    const cleaned = priceStr.replace(/[$,]/g, '');
    const price = parseFloat(cleaned);
    return isNaN(price) ? 0 : price;
  }

  getCabinTypes(deal) {
    const cabinTypes = [];
    if (deal.Inside && deal.Inside !== 'Quote Available' && deal.Inside !== '') cabinTypes.push('Interior');
    if (deal.Oceanview && deal.Oceanview !== 'Quote Available' && deal.Oceanview !== '') cabinTypes.push('Oceanview');
    if (deal.Balcony && deal.Balcony !== 'Quote Available' && deal.Balcony !== '') cabinTypes.push('Balcony');
    if (deal.Suite && deal.Suite !== 'Quote Available' && deal.Suite !== '') cabinTypes.push('Suite');
    return cabinTypes;
  }

  async findDealById(dealId) {
    const allDeals = await this.loadCSVData();
    return allDeals.find(deal => deal.id === dealId);
  }

  async findDealsByFilters(filters = {}) {
    const allDeals = await this.loadCSVData();
    
    return allDeals.filter(deal => {
      if (filters.cruiseLine && !deal.cruiseLine.toLowerCase().includes(filters.cruiseLine.toLowerCase())) {
        return false;
      }
      if (filters.cruiseType && deal.cruiseType !== filters.cruiseType) {
        return false;
      }
      if (filters.region && !deal.region.toLowerCase().includes(filters.region.toLowerCase())) {
        return false;
      }
      if (filters.minPrice && deal.price < filters.minPrice) {
        return false;
      }
      if (filters.maxPrice && deal.price > filters.maxPrice) {
        return false;
      }
      return true;
    });
  }
}

// Create global instance
window.csvLoader = new EnhancedCSVLoader();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EnhancedCSVLoader;
}