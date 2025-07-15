// Enhanced Deals Loader - Comprehensive CSV Data Integration
// Handles all CSV files with proper normalization and cruise type detection

class EnhancedDealsLoader {
    constructor() {
        this.allDeals = [];
        this.csvFiles = [
            '0807 Master Upload RIVER.csv',
            '1007 Master Upload Twins.csv', 
            '0807 CABIN TYPES.csv'
        ];
        this.cruiseTypeMap = {
            'river': 'River Cruise',
            'ocean': 'Ocean Cruise', 
            'expedition': 'Expedition Cruise'
        };
    }

    // Main loading function
    async loadAllDeals() {
        console.log('🚢 ENHANCED LOADER: Starting comprehensive data load...');
        
        try {
            let allDeals = [];
            
            // Load from CSV files first (priority)
            const csvDeals = await this.loadFromCSVFiles();
            if (csvDeals.length > 0) {
                allDeals = csvDeals;
                console.log(`✅ Loaded ${allDeals.length} deals from CSV files`);
            }
            
            // Fallback to other sources if needed
            if (allDeals.length === 0) {
                allDeals = await this.loadFromFallbackSources();
            }
            
            // Normalize and enhance all deals
            allDeals = this.normalizeDeals(allDeals);
            
            // Add cruise types
            allDeals = this.addCruiseTypes(allDeals);
            
            this.allDeals = allDeals;
            console.log(`🎯 FINAL: ${allDeals.length} deals ready for display`);
            
            return allDeals;
            
        } catch (error) {
            console.error('❌ Enhanced loader error:', error);
            return this.getSampleDeals();
        }
    }

    // Load from CSV files with proper parsing
    async loadFromCSVFiles() {
        console.log('📊 Loading from CSV files...');
        let allDeals = [];
        
        try {
            // Try to load from Supabase storage first
            if (window.supabaseClient && window.supabaseClient.supabase) {
                const csvDeals = await this.loadFromSupabaseStorage();
                if (csvDeals.length > 0) {
                    return csvDeals;
                }
            }
            
            // Fallback to local CSV processing
            for (const fileName of this.csvFiles) {
                try {
                    const response = await fetch(`/${fileName}`);
                    if (response.ok) {
                        const csvText = await response.text();
                        const deals = this.parseCSV(csvText, fileName);
                        allDeals = allDeals.concat(deals);
                        console.log(`✅ Loaded ${deals.length} deals from ${fileName}`);
                    }
                } catch (fileError) {
                    console.warn(`⚠️ Failed to load ${fileName}:`, fileError);
                }
            }
            
        } catch (error) {
            console.error('❌ CSV loading error:', error);
        }
        
        return allDeals;
    }

    // Load from Supabase storage
    async loadFromSupabaseStorage() {
        console.log('☁️ Loading from Supabase storage...');
        let allDeals = [];
        
        try {
            const { data: files, error } = await window.supabaseClient.supabase.storage
                .from('cruise-data')
                .list('', { limit: 100 });
            
            if (error || !files) {
                throw new Error('No files found in storage');
            }
            
            for (const file of files) {
                if (file.name.endsWith('.csv')) {
                    try {
                        const { data: csvData, error: downloadError } = await window.supabaseClient.supabase.storage
                            .from('cruise-data')
                            .download(file.name);
                        
                        if (!downloadError && csvData) {
                            const csvText = await csvData.text();
                            const deals = this.parseCSV(csvText, file.name);
                            allDeals = allDeals.concat(deals);
                            console.log(`✅ Loaded ${deals.length} deals from ${file.name}`);
                        }
                    } catch (fileError) {
                        console.warn(`⚠️ Failed to process ${file.name}:`, fileError);
                    }
                }
            }
            
        } catch (storageError) {
            console.warn('⚠️ Supabase storage error:', storageError);
        }
        
        return allDeals;
    }

    // Parse CSV with intelligent field mapping
    parseCSV(csvText, fileName) {
        const lines = csvText.split('\n').filter(line => line.trim());
        if (lines.length < 2) return [];
        
        const headers = this.parseCSVLine(lines[0]);
        const deals = [];
        
        for (let i = 1; i < lines.length; i++) {
            const values = this.parseCSVLine(lines[i]);
            if (values.length < headers.length / 2) continue; // Skip incomplete rows
            
            const deal = {};
            headers.forEach((header, index) => {
                deal[header.toLowerCase().trim()] = values[index] || '';
            });
            
            // Add source file info
            deal._source_file = fileName;
            deal._source_type = this.detectSourceType(fileName);
            
            deals.push(deal);
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
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current.trim());
        return result;
    }

    // Detect source type from filename
    detectSourceType(fileName) {
        if (fileName.toLowerCase().includes('river')) return 'river';
        if (fileName.toLowerCase().includes('cabin')) return 'cabin_types';
        if (fileName.toLowerCase().includes('twins')) return 'ocean';
        return 'unknown';
    }

    // Normalize deals to consistent format
    normalizeDeals(deals) {
        return deals.map(deal => {
            const normalized = {
                id: deal.seq || deal.id || this.generateId(),
                ship_name: deal.ship || deal.ship_name || 'Unknown Ship',
                cruise_line: deal['cruise line'] || deal.cruise_line || deal.cruiseline || 'Unknown Cruise Line',
                destination: deal.region || deal.destination || deal.itinerary || 'Unknown Destination',
                duration: this.parseNumber(deal.nights) || this.parseNumber(deal.duration) || 7,
                departure_date: this.parseDate(deal.date || deal.departure_date),
                departure_port: deal.from || deal.departure_port || 'Various Ports',
                arrival_port: deal.to || deal.arrival_port || 'Round Trip',
                itinerary: deal.itinerary || '',
                inside_price: this.parsePrice(deal.inside || deal['retail in']),
                oceanview_price: this.parsePrice(deal.oceanview || deal.retailout),
                balcony_price: this.parsePrice(deal.balcony || deal.retailbalc),
                suite_price: this.parsePrice(deal.suite || deal.retailsuite),
                ship_map: deal.shipmap || '',
                cruise_url: deal['cruise offer url'] || '',
                _source_file: deal._source_file,
                _source_type: deal._source_type
            };
            
            // Clean up cruise line names
            normalized.cruise_line = this.normalizeCruiseLine(normalized.cruise_line);
            
            return normalized;
        });
    }

    // Add cruise types based on data analysis
    addCruiseTypes(deals) {
        return deals.map(deal => {
            let cruiseType = 'Ocean Cruise'; // Default
            
            // Detect river cruises
            if (deal._source_type === 'river' || 
                deal.cruise_line.toLowerCase().includes('ama') ||
                deal.cruise_line.toLowerCase().includes('emerald') ||
                deal.cruise_line.toLowerCase().includes('scenic') ||
                deal.cruise_line.toLowerCase().includes('amadeus') ||
                deal.destination.toLowerCase().includes('danube') ||
                deal.destination.toLowerCase().includes('rhine') ||
                deal.destination.toLowerCase().includes('river')) {
                cruiseType = 'River Cruise';
            }
            
            // Detect expedition cruises
            if (deal.cruise_line.toLowerCase().includes('expedition') ||
                deal.cruise_line.toLowerCase().includes('heritage') ||
                deal.cruise_line.toLowerCase().includes('coral') ||
                deal.cruise_line.toLowerCase().includes('hurtigruten') ||
                deal.destination.toLowerCase().includes('arctic') ||
                deal.destination.toLowerCase().includes('antarctica') ||
                deal.destination.toLowerCase().includes('expedition')) {
                cruiseType = 'Expedition Cruise';
            }
            
            deal.cruise_type = cruiseType;
            return deal;
        });
    }

    // Normalize cruise line names
    normalizeCruiseLine(name) {
        const normalizations = {
            'amawaterways': 'AmaWaterways',
            'ama waterways': 'AmaWaterways',
            'emerald cruises': 'Emerald Cruises',
            'scenic cruises': 'Scenic Cruises',
            'regent seven seas cruises': 'Regent Seven Seas Cruises',
            'royal caribbean': 'Royal Caribbean',
            'princess cruises': 'Princess Cruises',
            'celebrity cruises': 'Celebrity Cruises',
            'norwegian cruise line': 'Norwegian Cruise Line',
            'msc cruises': 'MSC Cruises',
            'carnival cruise line': 'Carnival Cruise Line',
            'holland america line': 'Holland America Line',
            'cunard line': 'Cunard Line',
            'crystal cruises': 'Crystal Cruises',
            'atlas ocean voyages': 'Atlas Ocean Voyages',
            'coral expeditions': 'Coral Expeditions',
            'heritage expeditions': 'Heritage Expeditions'
        };
        
        const key = name.toLowerCase().trim();
        return normalizations[key] || name;
    }

    // Parse price from various formats
    parsePrice(priceStr) {
        if (!priceStr || priceStr === 'Quote Available' || priceStr === 'TBA') {
            return null;
        }
        
        // Remove currency symbols and commas
        const cleaned = priceStr.toString().replace(/[$,]/g, '');
        const number = parseFloat(cleaned);
        
        return isNaN(number) ? null : number;
    }

    // Parse date from various formats
    parseDate(dateStr) {
        if (!dateStr) return '';
        
        try {
            // Handle various date formats
            const date = new Date(dateStr);
            if (!isNaN(date.getTime())) {
                return date.toISOString().split('T')[0];
            }
        } catch (e) {
            // Return original string if parsing fails
        }
        
        return dateStr.toString();
    }

    // Parse number from string
    parseNumber(str) {
        if (!str) return null;
        const num = parseInt(str.toString().replace(/[^0-9]/g, ''));
        return isNaN(num) ? null : num;
    }

    // Generate unique ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Fallback data sources
    async loadFromFallbackSources() {
        console.log('🔄 Loading from fallback sources...');
        
        try {
            // Try Supabase database
            if (window.supabaseClient) {
                const { data, error } = await window.supabaseClient.supabase
                    .from('cruise_deals')
                    .select('*')
                    .eq('is_active', true);
                
                if (!error && data && data.length > 0) {
                    return data;
                }
            }
            
            // Try API
            const response = await fetch('/api/unified-api?endpoint=cruise-data');
            if (response.ok) {
                const result = await response.json();
                if (result.success && result.deals) {
                    return result.deals;
                }
            }
            
            // Try JSON files
            const jsonResponse = await fetch('/deals.json');
            if (jsonResponse.ok) {
                return await jsonResponse.json();
            }
            
        } catch (error) {
            console.warn('⚠️ Fallback sources failed:', error);
        }
        
        return this.getSampleDeals();
    }

    // Sample deals with proper cruise types
    getSampleDeals() {
        return [
            {
                id: 'sample-1',
                ship_name: 'AmaBella',
                cruise_line: 'AmaWaterways',
                destination: 'Danube River',
                cruise_type: 'River Cruise',
                duration: 7,
                departure_date: '2025-07-15',
                departure_port: 'Budapest',
                arrival_port: 'Vienna',
                itinerary: 'Budapest → Bratislava → Vienna → Melk → Passau',
                inside_price: 3440,
                oceanview_price: 4040,
                balcony_price: 4640,
                suite_price: null
            },
            {
                id: 'sample-2',
                ship_name: 'Seven Seas Explorer',
                cruise_line: 'Regent Seven Seas Cruises',
                destination: 'Mediterranean',
                cruise_type: 'Ocean Cruise',
                duration: 14,
                departure_date: '2025-08-10',
                departure_port: 'Barcelona',
                arrival_port: 'Rome',
                itinerary: 'Barcelona → Monaco → Florence → Rome → Naples',
                inside_price: 4999,
                oceanview_price: 5999,
                balcony_price: 7999,
                suite_price: 12999
            },
            {
                id: 'sample-3',
                ship_name: 'World Explorer',
                cruise_line: 'Atlas Ocean Voyages',
                destination: 'Arctic',
                cruise_type: 'Expedition Cruise',
                duration: 11,
                departure_date: '2025-07-20',
                departure_port: 'Reykjavik',
                arrival_port: 'Oslo',
                itinerary: 'Reykjavik → Isafjordur → Akureyri → Bergen → Oslo',
                inside_price: 6879,
                oceanview_price: null,
                balcony_price: null,
                suite_price: null
            }
        ];
    }
}

// Export for use
window.EnhancedDealsLoader = EnhancedDealsLoader;