// 🧠 Smart Route-Based Cruise Intelligence System
// Enhanced with Google Gemini AI and sophisticated route matching

class CruiseIntelligenceSystem {
  constructor() {
    this.geminiApiKey = null;
    this.cruiseData = [];
    this.regionMappings = this.initializeRegionMappings();
    this.routePatterns = this.initializeRoutePatterns();
    this.init();
  }

  async init() {
    console.log('🧠 CRUISE_INTELLIGENCE: Initializing Smart Route-Based System...');
    await this.loadCruiseData();
    console.log('🧠 CRUISE_INTELLIGENCE: System ready with', this.cruiseData.length, 'cruise records');
  }

  initializeRegionMappings() {
    return {
      // Countries to Regions
      'japan': ['Asia', 'Far East', 'Pacific'],
      'china': ['Asia', 'Far East', 'Pacific'],
      'singapore': ['Asia', 'Southeast Asia', 'Pacific'],
      'thailand': ['Asia', 'Southeast Asia'],
      'vietnam': ['Asia', 'Southeast Asia'],
      'south korea': ['Asia', 'Far East', 'Pacific'],
      'taiwan': ['Asia', 'Far East', 'Pacific'],
      'philippines': ['Asia', 'Southeast Asia', 'Pacific'],
      'indonesia': ['Asia', 'Southeast Asia', 'Pacific'],
      'malaysia': ['Asia', 'Southeast Asia'],
      'india': ['Asia', 'Indian Ocean'],
      'sri lanka': ['Asia', 'Indian Ocean'],
      'maldives': ['Asia', 'Indian Ocean'],
      
      // Middle East
      'uae': ['Middle East', 'Arabian Gulf', 'Persian Gulf'],
      'dubai': ['Middle East', 'Arabian Gulf', 'Persian Gulf'],
      'abu dhabi': ['Middle East', 'Arabian Gulf', 'Persian Gulf'],
      'qatar': ['Middle East', 'Arabian Gulf', 'Persian Gulf'],
      'oman': ['Middle East', 'Arabian Gulf', 'Indian Ocean'],
      'bahrain': ['Middle East', 'Arabian Gulf', 'Persian Gulf'],
      'kuwait': ['Middle East', 'Arabian Gulf', 'Persian Gulf'],
      'saudi arabia': ['Middle East', 'Arabian Gulf', 'Red Sea'],
      'israel': ['Middle East', 'Mediterranean'],
      'jordan': ['Middle East', 'Red Sea'],
      'egypt': ['Middle East', 'Mediterranean', 'Red Sea', 'Africa'],
      
      // Europe
      'italy': ['Europe', 'Mediterranean', 'Western Europe'],
      'spain': ['Europe', 'Mediterranean', 'Western Europe'],
      'france': ['Europe', 'Mediterranean', 'Western Europe'],
      'greece': ['Europe', 'Mediterranean', 'Eastern Europe'],
      'turkey': ['Europe', 'Mediterranean', 'Eastern Europe'],
      'croatia': ['Europe', 'Mediterranean', 'Eastern Europe'],
      'montenegro': ['Europe', 'Mediterranean', 'Eastern Europe'],
      'norway': ['Europe', 'Northern Europe', 'Scandinavia'],
      'sweden': ['Europe', 'Northern Europe', 'Scandinavia'],
      'denmark': ['Europe', 'Northern Europe', 'Scandinavia'],
      'finland': ['Europe', 'Northern Europe', 'Scandinavia'],
      'iceland': ['Europe', 'Northern Europe', 'Atlantic'],
      'uk': ['Europe', 'Northern Europe', 'British Isles'],
      'ireland': ['Europe', 'Northern Europe', 'British Isles'],
      'portugal': ['Europe', 'Western Europe', 'Atlantic'],
      'netherlands': ['Europe', 'Northern Europe', 'Western Europe'],
      'germany': ['Europe', 'Northern Europe', 'Central Europe'],
      'poland': ['Europe', 'Northern Europe', 'Eastern Europe'],
      'russia': ['Europe', 'Northern Europe', 'Eastern Europe'],
      
      // Americas
      'usa': ['North America', 'Americas'],
      'canada': ['North America', 'Americas'],
      'alaska': ['North America', 'Alaska', 'Pacific'],
      'mexico': ['North America', 'Americas', 'Caribbean'],
      'brazil': ['South America', 'Americas'],
      'argentina': ['South America', 'Americas'],
      'chile': ['South America', 'Americas', 'Pacific'],
      'peru': ['South America', 'Americas', 'Pacific'],
      'ecuador': ['South America', 'Americas', 'Pacific'],
      'colombia': ['South America', 'Americas', 'Caribbean'],
      'venezuela': ['South America', 'Americas', 'Caribbean'],
      
      // Caribbean
      'bahamas': ['Caribbean', 'Americas'],
      'jamaica': ['Caribbean', 'Americas'],
      'barbados': ['Caribbean', 'Americas'],
      'st lucia': ['Caribbean', 'Americas'],
      'antigua': ['Caribbean', 'Americas'],
      'dominican republic': ['Caribbean', 'Americas'],
      'puerto rico': ['Caribbean', 'Americas'],
      'aruba': ['Caribbean', 'Americas'],
      'curacao': ['Caribbean', 'Americas'],
      
      // Africa
      'south africa': ['Africa', 'Southern Africa', 'Indian Ocean'],
      'morocco': ['Africa', 'North Africa', 'Mediterranean'],
      'egypt': ['Africa', 'North Africa', 'Mediterranean', 'Red Sea'],
      'tunisia': ['Africa', 'North Africa', 'Mediterranean'],
      'kenya': ['Africa', 'East Africa', 'Indian Ocean'],
      'tanzania': ['Africa', 'East Africa', 'Indian Ocean'],
      'madagascar': ['Africa', 'Indian Ocean'],
      'mauritius': ['Africa', 'Indian Ocean'],
      'seychelles': ['Africa', 'Indian Ocean'],
      
      // Australia & Pacific
      'australia': ['Australia', 'Pacific', 'Oceania'],
      'new zealand': ['Pacific', 'Oceania'],
      'fiji': ['Pacific', 'Oceania'],
      'tahiti': ['Pacific', 'Oceania'],
      'hawaii': ['Pacific', 'Americas'],
      'papua new guinea': ['Pacific', 'Oceania'],
      'vanuatu': ['Pacific', 'Oceania'],
      'new caledonia': ['Pacific', 'Oceania']
    };
  }

  initializeRoutePatterns() {
    return [
      // Direct route patterns
      /from\s+([^to]+?)\s+to\s+([^,.!?]+)/i,
      /([^to]+?)\s+to\s+([^,.!?]+)/i,
      /between\s+([^and]+?)\s+and\s+([^,.!?]+)/i,
      /departing\s+from\s+([^,.!?]+)/i,
      /sailing\s+to\s+([^,.!?]+)/i,
      /stopping\s+at\s+([^,.!?]+)/i,
      
      // Vice versa patterns
      /([^to]+?)\s+to\s+([^,.!?]+?)(?:\s+or\s+(?:vice\s+versa|the\s+other\s+way\s+around|reverse))/i,
      /([^to]+?)\s+to\s+([^,.!?]+?)(?:\s+—\s+or\s+the\s+other\s+way\s+around)/i,
      
      // Regional patterns
      /cruises?\s+in\s+([^,.!?]+)/i,
      /([^,.!?]+)\s+region/i,
      /([^,.!?]+)\s+cruises?/i
    ];
  }

  async loadCruiseData() {
    try {
      // Load river cruise data
      const riverResponse = await fetch('/river.csv');
      if (riverResponse.ok) {
        const riverCSV = await riverResponse.text();
        const riverDeals = this.parseCSV(riverCSV, 'River Cruise');
        this.cruiseData = this.cruiseData.concat(riverDeals);
      }

      // Load ocean cruise data
      const oceanResponse = await fetch('/twins.csv');
      if (oceanResponse.ok) {
        const oceanCSV = await oceanResponse.text();
        const oceanDeals = this.parseCSV(oceanCSV, 'Ocean Cruise');
        this.cruiseData = this.cruiseData.concat(oceanDeals);
      }

      console.log(`🧠 CRUISE_INTELLIGENCE: Loaded ${this.cruiseData.length} cruise records for intelligent matching`);
      
    } catch (error) {
      console.error('🧠 CRUISE_INTELLIGENCE: Error loading cruise data:', error);
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
        console.warn(`🧠 CRUISE_INTELLIGENCE: Skipping row ${i}:`, error);
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

    return {
      id: `${cruiseType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      cruiseType: cruiseType,
      cruiseLine: deal['Cruise Line'] || '',
      shipName: deal.Ship || '',
      region: deal.Region || '',
      nights: parseInt(deal.Nights || 0),
      departureDate: deal.Date || '',
      departurePort: deal.From || '',
      arrivalPort: deal.To || '',
      itinerary: deal.Itinerary || '',
      insidePrice: this.parsePrice(deal.Inside),
      oceanviewPrice: this.parsePrice(deal.Oceanview),
      balconyPrice: this.parsePrice(deal.Balcony),
      suitePrice: this.parsePrice(deal.Suite),
      // Enhanced fields for route matching
      ports: this.extractPorts(deal.Itinerary || ''),
      regions: this.extractRegions(deal.Region || '', deal.Itinerary || ''),
      searchableText: this.createSearchableText(deal)
    };
  }

  parsePrice(priceStr) {
    if (!priceStr || priceStr.toLowerCase().includes('quote')) return 0;
    const cleaned = priceStr.replace(/[$,]/g, '');
    const price = parseFloat(cleaned);
    return isNaN(price) ? 0 : price;
  }

  extractPorts(itinerary) {
    if (!itinerary) return [];
    
    // Extract port names from itinerary string
    const ports = [];
    const portPatterns = [
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),?\s*(?:[A-Z]{2,3})?/g,
      /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\b/g
    ];
    
    portPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(itinerary)) !== null) {
        const port = match[1].trim();
        if (port.length > 2 && !ports.includes(port.toLowerCase())) {
          ports.push(port.toLowerCase());
        }
      }
    });
    
    return ports;
  }

  extractRegions(region, itinerary) {
    const regions = [];
    
    // Add primary region
    if (region) {
      regions.push(region.toLowerCase());
    }
    
    // Extract regions from itinerary
    const text = `${region} ${itinerary}`.toLowerCase();
    
    Object.keys(this.regionMappings).forEach(location => {
      if (text.includes(location)) {
        this.regionMappings[location].forEach(mappedRegion => {
          if (!regions.includes(mappedRegion.toLowerCase())) {
            regions.push(mappedRegion.toLowerCase());
          }
        });
      }
    });
    
    return regions;
  }

  createSearchableText(deal) {
    return [
      deal['Cruise Line'] || '',
      deal.Ship || '',
      deal.Region || '',
      deal.From || '',
      deal.To || '',
      deal.Itinerary || ''
    ].join(' ').toLowerCase();
  }

  // 🎯 SMART ROUTE-BASED QUERY PROCESSING
  async processRouteQuery(userMessage) {
    console.log('🧠 CRUISE_INTELLIGENCE: Processing route query:', userMessage);
    
    try {
      // Extract route information from user message
      const routeInfo = this.extractRouteInformation(userMessage);
      console.log('🧠 CRUISE_INTELLIGENCE: Extracted route info:', routeInfo);
      
      // Find matching cruises based on route
      const matchingCruises = this.findRouteMatches(routeInfo);
      console.log('🧠 CRUISE_INTELLIGENCE: Found', matchingCruises.length, 'matching cruises');
      
      // Generate intelligent response
      const response = await this.generateRouteResponse(userMessage, routeInfo, matchingCruises);
      
      return {
        success: true,
        response: response.text,
        results: matchingCruises.slice(0, 5),
        intent: {
          type: 'route_query',
          origin: routeInfo.origin,
          destination: routeInfo.destination,
          viceVersa: routeInfo.viceVersa,
          confidence: routeInfo.confidence
        },
        followUpQuestions: this.generateFollowUpQuestions(routeInfo, matchingCruises)
      };
      
    } catch (error) {
      console.error('🧠 CRUISE_INTELLIGENCE: Error processing route query:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  extractRouteInformation(message) {
    const messageLower = message.toLowerCase();
    const routeInfo = {
      origin: null,
      destination: null,
      viceVersa: false,
      confidence: 0,
      type: 'unknown'
    };

    // Check for vice versa patterns
    if (messageLower.includes('vice versa') || 
        messageLower.includes('other way around') || 
        messageLower.includes('or reverse') ||
        messageLower.includes('— or the other way around')) {
      routeInfo.viceVersa = true;
    }

    // Try each route pattern
    for (const pattern of this.routePatterns) {
      const match = message.match(pattern);
      if (match) {
        if (pattern.source.includes('from') && pattern.source.includes('to')) {
          // "from X to Y" pattern
          routeInfo.origin = this.cleanLocationName(match[1]);
          routeInfo.destination = this.cleanLocationName(match[2]);
          routeInfo.type = 'origin_destination';
          routeInfo.confidence = 0.9;
          break;
        } else if (pattern.source.includes('between') && pattern.source.includes('and')) {
          // "between X and Y" pattern
          routeInfo.origin = this.cleanLocationName(match[1]);
          routeInfo.destination = this.cleanLocationName(match[2]);
          routeInfo.type = 'between';
          routeInfo.confidence = 0.85;
          break;
        } else if (pattern.source.includes('departing')) {
          // "departing from X" pattern
          routeInfo.origin = this.cleanLocationName(match[1]);
          routeInfo.type = 'origin_only';
          routeInfo.confidence = 0.7;
          break;
        } else if (pattern.source.includes('sailing')) {
          // "sailing to Y" pattern
          routeInfo.destination = this.cleanLocationName(match[1]);
          routeInfo.type = 'destination_only';
          routeInfo.confidence = 0.7;
          break;
        } else if (match[1] && match[2]) {
          // Generic "X to Y" pattern
          routeInfo.origin = this.cleanLocationName(match[1]);
          routeInfo.destination = this.cleanLocationName(match[2]);
          routeInfo.type = 'origin_destination';
          routeInfo.confidence = 0.8;
          break;
        }
      }
    }

    // If no specific route found, check for regional queries
    if (routeInfo.confidence === 0) {
      const regionMatch = messageLower.match(/cruises?\s+in\s+([^,.!?]+)/i) ||
                         messageLower.match(/([^,.!?]+)\s+region/i) ||
                         messageLower.match(/([^,.!?]+)\s+cruises?/i);
      
      if (regionMatch) {
        routeInfo.origin = this.cleanLocationName(regionMatch[1]);
        routeInfo.type = 'regional';
        routeInfo.confidence = 0.6;
      }
    }

    return routeInfo;
  }

  cleanLocationName(location) {
    if (!location) return null;
    
    return location
      .trim()
      .replace(/^(the|a|an)\s+/i, '')
      .replace(/\s+(area|region|coast)$/i, '')
      .toLowerCase();
  }

  findRouteMatches(routeInfo) {
    if (!routeInfo.origin && !routeInfo.destination) {
      return [];
    }

    let matches = [];

    this.cruiseData.forEach(cruise => {
      const score = this.calculateRouteMatchScore(cruise, routeInfo);
      if (score > 0) {
        matches.push({
          ...cruise,
          matchScore: score,
          matchReason: this.getMatchReason(cruise, routeInfo, score)
        });
      }
    });

    // Sort by match score (highest first)
    matches.sort((a, b) => b.matchScore - a.matchScore);

    // Filter out low-confidence matches if we have good ones
    if (matches.length > 0 && matches[0].matchScore >= 0.7) {
      matches = matches.filter(match => match.matchScore >= 0.5);
    }

    return matches;
  }

  calculateRouteMatchScore(cruise, routeInfo) {
    let score = 0;
    const maxScore = 1.0;

    // Direct port matching (highest priority)
    if (routeInfo.origin) {
      if (this.matchesLocation(cruise.departurePort, routeInfo.origin)) {
        score += 0.4;
      }
      if (this.matchesLocation(cruise.arrivalPort, routeInfo.origin)) {
        score += 0.3;
      }
      // Check if origin appears in itinerary
      if (cruise.ports.some(port => this.matchesLocation(port, routeInfo.origin))) {
        score += 0.2;
      }
    }

    if (routeInfo.destination) {
      if (this.matchesLocation(cruise.arrivalPort, routeInfo.destination)) {
        score += 0.4;
      }
      if (this.matchesLocation(cruise.departurePort, routeInfo.destination)) {
        score += 0.3;
      }
      // Check if destination appears in itinerary
      if (cruise.ports.some(port => this.matchesLocation(port, routeInfo.destination))) {
        score += 0.2;
      }
    }

    // Regional matching (medium priority)
    if (routeInfo.origin) {
      const originRegions = this.getRegionsForLocation(routeInfo.origin);
      if (originRegions.some(region => cruise.regions.includes(region.toLowerCase()))) {
        score += 0.15;
      }
    }

    if (routeInfo.destination) {
      const destRegions = this.getRegionsForLocation(routeInfo.destination);
      if (destRegions.some(region => cruise.regions.includes(region.toLowerCase()))) {
        score += 0.15;
      }
    }

    // Itinerary text matching (lower priority)
    if (routeInfo.origin && cruise.searchableText.includes(routeInfo.origin)) {
      score += 0.1;
    }
    if (routeInfo.destination && cruise.searchableText.includes(routeInfo.destination)) {
      score += 0.1;
    }

    // Handle vice versa logic
    if (routeInfo.viceVersa && routeInfo.origin && routeInfo.destination) {
      // Check reverse direction
      let reverseScore = 0;
      if (this.matchesLocation(cruise.departurePort, routeInfo.destination) &&
          this.matchesLocation(cruise.arrivalPort, routeInfo.origin)) {
        reverseScore = 0.8;
      }
      score = Math.max(score, reverseScore);
    }

    return Math.min(score, maxScore);
  }

  matchesLocation(cruiseLocation, queryLocation) {
    if (!cruiseLocation || !queryLocation) return false;
    
    const cruise = cruiseLocation.toLowerCase();
    const query = queryLocation.toLowerCase();
    
    // Exact match
    if (cruise === query) return true;
    
    // Partial match
    if (cruise.includes(query) || query.includes(cruise)) return true;
    
    // Check if they map to the same regions
    const cruiseRegions = this.getRegionsForLocation(cruise);
    const queryRegions = this.getRegionsForLocation(query);
    
    return cruiseRegions.some(region => queryRegions.includes(region));
  }

  getRegionsForLocation(location) {
    if (!location) return [];
    
    const locationLower = location.toLowerCase();
    
    // Direct mapping
    if (this.regionMappings[locationLower]) {
      return this.regionMappings[locationLower];
    }
    
    // Partial matching
    for (const [key, regions] of Object.entries(this.regionMappings)) {
      if (locationLower.includes(key) || key.includes(locationLower)) {
        return regions;
      }
    }
    
    return [];
  }

  getMatchReason(cruise, routeInfo, score) {
    const reasons = [];
    
    if (routeInfo.origin && this.matchesLocation(cruise.departurePort, routeInfo.origin)) {
      reasons.push(`Departs from ${cruise.departurePort}`);
    }
    
    if (routeInfo.destination && this.matchesLocation(cruise.arrivalPort, routeInfo.destination)) {
      reasons.push(`Arrives at ${cruise.arrivalPort}`);
    }
    
    if (routeInfo.origin && cruise.ports.some(port => this.matchesLocation(port, routeInfo.origin))) {
      reasons.push(`Visits ${routeInfo.origin} region`);
    }
    
    if (routeInfo.destination && cruise.ports.some(port => this.matchesLocation(port, routeInfo.destination))) {
      reasons.push(`Visits ${routeInfo.destination} region`);
    }
    
    if (reasons.length === 0) {
      reasons.push(`Matches ${cruise.region} region`);
    }
    
    return reasons.join(', ');
  }

  async generateRouteResponse(userMessage, routeInfo, matchingCruises) {
    if (matchingCruises.length === 0) {
      return {
        text: this.generateNoMatchResponse(routeInfo)
      };
    }

    let response = '';

    // Generate contextual opening
    if (routeInfo.origin && routeInfo.destination) {
      response += `🚢 **Great choice! I found ${matchingCruises.length} cruise${matchingCruises.length > 1 ? 's' : ''} `;
      if (routeInfo.viceVersa) {
        response += `between ${this.capitalizeLocation(routeInfo.origin)} and ${this.capitalizeLocation(routeInfo.destination)} (both directions)**\n\n`;
      } else {
        response += `from ${this.capitalizeLocation(routeInfo.origin)} to ${this.capitalizeLocation(routeInfo.destination)}**\n\n`;
      }
    } else if (routeInfo.origin) {
      response += `🚢 **Perfect! I found ${matchingCruises.length} cruise${matchingCruises.length > 1 ? 's' : ''} departing from the ${this.capitalizeLocation(routeInfo.origin)} region**\n\n`;
    } else if (routeInfo.destination) {
      response += `🚢 **Excellent! I found ${matchingCruises.length} cruise${matchingCruises.length > 1 ? 's' : ''} sailing to the ${this.capitalizeLocation(routeInfo.destination)} region**\n\n`;
    }

    // Add top matches
    const topMatches = matchingCruises.slice(0, 3);
    topMatches.forEach((cruise, index) => {
      const price = this.getDisplayPrice(cruise);
      response += `**${index + 1}. ${cruise.shipName}** (${cruise.cruiseLine})\n`;
      response += `📍 ${cruise.region} • ${cruise.nights} nights\n`;
      response += `🛳️ ${cruise.departurePort} → ${cruise.arrivalPort}\n`;
      response += `💰 ${price}\n`;
      if (cruise.departureDate) {
        response += `📅 ${cruise.departureDate}\n`;
      }
      response += `✨ *${cruise.matchReason}*\n\n`;
    });

    if (matchingCruises.length > 3) {
      response += `*...and ${matchingCruises.length - 3} more options available!*\n\n`;
    }

    return { text: response };
  }

  generateNoMatchResponse(routeInfo) {
    let response = "🤔 **I couldn't find any cruises matching that specific route.**\n\n";
    
    if (routeInfo.origin && routeInfo.destination) {
      response += `I searched for cruises between **${this.capitalizeLocation(routeInfo.origin)}** and **${this.capitalizeLocation(routeInfo.destination)}**`;
      if (routeInfo.viceVersa) {
        response += " (both directions)";
      }
      response += ", but didn't find any exact matches.\n\n";
    } else if (routeInfo.origin) {
      response += `I searched for cruises departing from **${this.capitalizeLocation(routeInfo.origin)}**, but didn't find any matches.\n\n`;
    } else if (routeInfo.destination) {
      response += `I searched for cruises sailing to **${this.capitalizeLocation(routeInfo.destination)}**, but didn't find any matches.\n\n`;
    }

    response += "**Here are some alternatives:**\n";
    response += "• Try broader regions (e.g., 'Asia to Europe' instead of specific cities)\n";
    response += "• Check our deals page for all available routes\n";
    response += "• Ask about specific cruise lines or regions\n";
    response += "• Let me connect you with our team for personalized assistance\n\n";
    response += "*I only show relevant results - no random cruises!* 🎯";

    return response;
  }

  generateFollowUpQuestions(routeInfo, matchingCruises) {
    const questions = [];
    
    if (matchingCruises.length > 0) {
      // Get unique cruise lines from results
      const cruiseLines = [...new Set(matchingCruises.map(c => c.cruiseLine))];
      if (cruiseLines.length > 1) {
        questions.push(`Show me only ${cruiseLines[0]} cruises on this route`);
      }
      
      // Get unique regions
      const regions = [...new Set(matchingCruises.map(c => c.region))];
      if (regions.length > 1) {
        questions.push(`What about ${regions[1]} cruises?`);
      }
      
      // Price-related questions
      questions.push("What are the cheapest options for this route?");
      questions.push("Show me luxury cruises for this route");
    }
    
    if (routeInfo.origin && routeInfo.destination) {
      questions.push(`What about cruises from ${routeInfo.destination} to ${routeInfo.origin}?`);
    }
    
    return questions.slice(0, 3);
  }

  capitalizeLocation(location) {
    if (!location) return '';
    return location.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  getDisplayPrice(cruise) {
    // Check for actual prices in order of preference
    const priceFields = ['insidePrice', 'oceanviewPrice', 'balconyPrice', 'suitePrice'];
    
    for (const field of priceFields) {
      const price = cruise[field];
      if (price && price > 0) {
        return `from $${price.toLocaleString()}`;
      }
    }
    
    return 'Quote Available';
  }

  // 🤖 GOOGLE GEMINI INTEGRATION
  async enhanceWithGemini(userMessage, routeInfo, matchingCruises) {
    try {
      if (!this.geminiApiKey) {
        console.log('🧠 CRUISE_INTELLIGENCE: Gemini API key not configured, using built-in intelligence');
        return null;
      }

      const prompt = this.buildGeminiPrompt(userMessage, routeInfo, matchingCruises);
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.geminiApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.candidates && result.candidates[0] && result.candidates[0].content) {
        return result.candidates[0].content.parts[0].text;
      }

      return null;
      
    } catch (error) {
      console.error('🧠 CRUISE_INTELLIGENCE: Gemini enhancement error:', error);
      return null;
    }
  }

  buildGeminiPrompt(userMessage, routeInfo, matchingCruises) {
    return `You are a cruise expert helping travel industry professionals find the perfect cruise routes.

User Query: "${userMessage}"

Route Analysis:
- Origin: ${routeInfo.origin || 'Not specified'}
- Destination: ${routeInfo.destination || 'Not specified'}
- Vice Versa: ${routeInfo.viceVersa ? 'Yes' : 'No'}
- Query Type: ${routeInfo.type}

Found ${matchingCruises.length} matching cruises.

Please provide a helpful, professional response that:
1. Acknowledges their specific route request
2. Explains why these cruises match their criteria
3. Highlights the best options
4. Suggests related routes they might consider
5. Maintains a professional tone for travel industry staff

Keep the response concise but informative, focusing on route-specific details.`;
  }

  // 🔧 UTILITY METHODS
  setGeminiApiKey(apiKey) {
    this.geminiApiKey = apiKey;
    console.log('🧠 CRUISE_INTELLIGENCE: Gemini API key configured');
  }

  // Test method for development
  async testRouteQuery(query) {
    console.log('🧠 CRUISE_INTELLIGENCE: Testing query:', query);
    const result = await this.processRouteQuery(query);
    console.log('🧠 CRUISE_INTELLIGENCE: Test result:', result);
    return result;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CruiseIntelligenceSystem;
} else if (typeof window !== 'undefined') {
  window.CruiseIntelligenceSystem = CruiseIntelligenceSystem;
}