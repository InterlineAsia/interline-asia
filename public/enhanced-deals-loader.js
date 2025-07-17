// Enhanced Deals Loader - Production Ready
// Loads cruise deals from Supabase with advanced filtering and caching

class EnhancedDealsLoader {
  constructor() {
    this.supabase = null;
    this.dealsCache = null;
    this.lastUpdated = null;
    this.isLoading = false;
  }

  async initialize() {
    if (!window.supabase || !window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
      throw new Error('Supabase not available');
    }

    this.supabase = window.supabase.createClient(
      window.SUPABASE_URL,
      window.SUPABASE_ANON_KEY
    );

    console.log('DEALS LOADER: Initialized successfully');
    return true;
  }

  async loadAllDeals(forceRefresh = false) {
    if (this.isLoading) {
      console.log('DEALS LOADER: Already loading, returning cached data');
      return this.dealsCache || [];
    }

    if (!forceRefresh && this.dealsCache && this.lastUpdated) {
      const cacheAge = Date.now() - this.lastUpdated;
      if (cacheAge < 5 * 60 * 1000) {
        console.log('DEALS LOADER: Using cached data');
        return this.dealsCache;
      }
    }

    this.isLoading = true;

    try {
      if (!this.supabase) {
        await this.initialize();
      }

      console.log('SUPABASE: Searching for cruise deals table...');

      const tableNames = ['cruise_deals', 'deals', 'cruises', 'cruise_data', 'bookings'];
      let selectedTable = null;
      let data = [];

      for (const table of tableNames) {
        try {
          const result = await this.supabase
            .from(table)
            .select('*')
            .eq('is_active', true)
            .limit(5);

          if (result?.data?.length) {
            console.log(`SUPABASE: Found table "${table}" with ${result.data.length} records`);
            console.log('SUPABASE: Sample record:', result.data[0]);
            selectedTable = table;
            data = result.data;
            break;
          } else {
            console.warn(`SUPABASE: Table "${table}" not found or empty.`);
          }
        } catch (err) {
          console.error(`SUPABASE: Error querying "${table}":`, err.message);
        }
      }

      if (!selectedTable || data.length === 0) {
        console.warn('SUPABASE: No valid deals table found, falling back to sample deals.');
        return this.getSampleDeals();
      }

      let processedDeals = this.processDeals(data);
      
      // 🔁 FILTER OUT PAST CRUISES
      const now = new Date();
      const beforeFiltering = processedDeals.length;
      processedDeals = processedDeals.filter(deal => {
        if (!deal.departure_date_obj) return true; // Keep deals without dates
        return deal.departure_date_obj >= now;
      });
      console.log(`🗓️ FILTERED: Removed ${beforeFiltering - processedDeals.length} past cruises, ${processedDeals.length} upcoming deals remain`);

      // 🎲 RANDOMIZE DEAL ORDER
      processedDeals = processedDeals.sort(() => 0.5 - Math.random());
      console.log(`🎲 RANDOMIZED: Shuffled ${processedDeals.length} deals for varied display`);
      
      this.dealsCache = processedDeals;
      this.lastUpdated = Date.now();
      return processedDeals;

    } catch (error) {
      console.error('DEALS LOADER: Error loading deals:', error);
      console.log('DEALS LOADER: Using fallback sample data');
      return this.getSampleDeals();
    } finally {
      this.isLoading = false;
    }
  }

  processDeals(rawDeals) {
    return rawDeals.map(deal => {
      // Calculate lowest price from available cabin types
      const prices = [
        deal.cabin_1 ? parseFloat(deal.cabin_1) : null,
        deal.cabin_2 ? parseFloat(deal.cabin_2) : null,
        deal.cabin_3 ? parseFloat(deal.cabin_3) : null,
        deal.cabin_4 ? parseFloat(deal.cabin_4) : null,
        deal.price ? parseFloat(deal.price) : null
      ].filter(p => p && p > 0);

      const fromPrice = prices.length > 0 ? Math.min(...prices) : null;

      // Determine cruise type
      let cruiseType = deal.cruise_type || 'Ocean Cruise';
      if (deal.ship && deal.ship.toLowerCase().includes('river')) {
        cruiseType = 'River Cruise';
      }

      // Format departure date
      const departureDate = deal.departure_date ? new Date(deal.departure_date) : null;

      // Calculate duration
      let duration = deal.nights || deal.duration || null;
      if (!duration && deal.departure_date && deal.arrival_date) {
        const start = new Date(deal.departure_date);
        const end = new Date(deal.arrival_date);
        duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      }

      return {
        ...deal,
        cruise_type: cruiseType,
        from_price: fromPrice,
        departure_date_formatted: departureDate ? departureDate.toLocaleDateString() : 'TBA',
        departure_date_obj: departureDate,
        duration_nights: duration,
        cruise_line_normalized: deal.cruise_line ? deal.cruise_line.toLowerCase().replace(/\s+/g, '-') : 'unknown',
        search_text: [
          deal.ship,
          deal.cruise_line,
          deal.destination,
          deal.itinerary,
          cruiseType
        ].filter(Boolean).join(' ').toLowerCase()
      };
    });
  }

  async filterDeals(filters = {}) {
    const allDeals = await this.loadAllDeals();
    
    let filtered = [...allDeals];

    // Apply filters
    if (filters.cruiseLine && filters.cruiseLine !== 'all') {
      filtered = filtered.filter(deal => 
        deal.cruise_line && deal.cruise_line.toLowerCase().includes(filters.cruiseLine.toLowerCase())
      );
    }

    if (filters.cruiseType && filters.cruiseType !== 'all') {
      filtered = filtered.filter(deal => 
        deal.cruise_type && deal.cruise_type.toLowerCase() === filters.cruiseType.toLowerCase()
      );
    }

    if (filters.destination && filters.destination !== 'all') {
      filtered = filtered.filter(deal => 
        deal.destination && deal.destination.toLowerCase().includes(filters.destination.toLowerCase())
      );
    }

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(deal => 
        deal.search_text.includes(searchTerm)
      );
    }

    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filtered = filtered.filter(deal => 
        deal.departure_date_obj && deal.departure_date_obj >= fromDate
      );
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      filtered = filtered.filter(deal => 
        deal.departure_date_obj && deal.departure_date_obj <= toDate
      );
    }

    console.log(`DEALS LOADER: Filtered ${filtered.length} deals from ${allDeals.length} total`);
    return filtered;
  }

  getFilterOptions(deals) {
    const cruiseLines = new Set();
    const cruiseTypes = new Set();
    const destinations = new Set();

    deals.forEach(deal => {
      if (deal.cruise_line) cruiseLines.add(deal.cruise_line);
      if (deal.cruise_type) cruiseTypes.add(deal.cruise_type);
      if (deal.destination) destinations.add(deal.destination);
    });

    return {
      cruiseLines: Array.from(cruiseLines).sort(),
      cruiseTypes: Array.from(cruiseTypes).sort(),
      destinations: Array.from(destinations).sort()
    };
  }

  getSampleDeals() {
    const sampleDeals = [
      {
        id: 'sample-1',
        ship: 'AmaBella',
        cruise_line: 'AmaWaterways',
        destination: 'Danube River',
        cruise_type: 'River Cruise',
        departure_date: '2025-08-15',
        departure_date_formatted: '8/15/2025',
        departure_date_obj: new Date('2025-08-15'),
        duration_nights: 7,
        from_price: 3440,
        itinerary: 'Budapest - Bratislava - Vienna - Melk - Passau',
        cruise_line_normalized: 'amawaterways',
        search_text: 'amabella amawaterways danube river river cruise'
      },
      {
        id: 'sample-2',
        ship: 'Seven Seas Explorer',
        cruise_line: 'Regent Seven Seas Cruises',
        destination: 'Mediterranean',
        cruise_type: 'Ocean Cruise',
        departure_date: '2025-09-10',
        departure_date_formatted: '9/10/2025',
        departure_date_obj: new Date('2025-09-10'),
        duration_nights: 14,
        from_price: 4999,
        itinerary: 'Barcelona - Monaco - Florence - Rome - Naples',
        cruise_line_normalized: 'regent-seven-seas-cruises',
        search_text: 'seven seas explorer regent seven seas cruises mediterranean ocean cruise'
      },
      {
        id: 'sample-3',
        ship: 'World Explorer',
        cruise_line: 'Atlas Ocean Voyages',
        destination: 'Arctic',
        cruise_type: 'Expedition Cruise',
        departure_date: '2025-07-25',
        departure_date_formatted: '7/25/2025',
        departure_date_obj: new Date('2025-07-25'),
        duration_nights: 11,
        from_price: 6879,
        itinerary: 'Reykjavik - Isafjordur - Akureyri - Bergen - Oslo',
        cruise_line_normalized: 'atlas-ocean-voyages',
        search_text: 'world explorer atlas ocean voyages arctic expedition cruise'
      },
      {
        id: 'sample-4',
        ship: 'Symphony of the Seas',
        cruise_line: 'Royal Caribbean',
        destination: 'Caribbean',
        cruise_type: 'Ocean Cruise',
        departure_date: '2025-08-20',
        departure_date_formatted: '8/20/2025',
        departure_date_obj: new Date('2025-08-20'),
        duration_nights: 7,
        from_price: 2890,
        itinerary: 'Miami - Perfect Day at CocoCay - St. Thomas - St. Maarten',
        cruise_line_normalized: 'royal-caribbean',
        search_text: 'symphony of the seas royal caribbean caribbean ocean cruise'
      }
    ];

    // 🔁 FILTER OUT PAST CRUISES
    const now = new Date();
    const upcomingDeals = sampleDeals.filter(deal => deal.departure_date_obj >= now);
    console.log(`🗓️ SAMPLE DEALS: Filtered to ${upcomingDeals.length} upcoming deals`);

    // 🎲 RANDOMIZE DEAL ORDER
    const shuffledDeals = upcomingDeals.sort(() => 0.5 - Math.random());
    console.log(`🎲 SAMPLE DEALS: Randomized ${shuffledDeals.length} deals`);

    return shuffledDeals;
  }

  getLastUpdated() {
    return this.lastUpdated;
  }

  getTotalDealsCount() {
    return this.dealsCache ? this.dealsCache.length : 0;
  }
}

// Export for global use
window.EnhancedDealsLoader = EnhancedDealsLoader;