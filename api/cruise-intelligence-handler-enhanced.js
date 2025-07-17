// 🧠 Enhanced Cruise Intelligence API Handler
// Smart Route-Based Cruise Matching with Google Gemini Integration

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Google Gemini API configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, userId, conversationHistory } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    console.log('🧠 CRUISE_INTELLIGENCE_API: Processing message:', message);

    // Check authentication
    const authResult = await checkAuthentication(req);
    console.log('🧠 CRUISE_INTELLIGENCE_API: Auth result:', authResult);

    // Initialize the intelligence system
    const intelligenceSystem = new CruiseIntelligenceSystem();
    await intelligenceSystem.init();

    // Configure Gemini if API key is available
    if (GEMINI_API_KEY) {
      intelligenceSystem.setGeminiApiKey(GEMINI_API_KEY);
    }

    // Determine if this is a route-based query
    const isRouteQuery = detectRouteQuery(message);
    console.log('🧠 CRUISE_INTELLIGENCE_API: Is route query:', isRouteQuery);

    let result;

    if (isRouteQuery) {
      // Process as route-based query
      result = await intelligenceSystem.processRouteQuery(message);
    } else {
      // Process as general cruise query
      result = await processGeneralQuery(message, intelligenceSystem, authResult.isAuthenticated);
    }

    // Enhance with Gemini if available and authenticated
    if (GEMINI_API_KEY && authResult.isAuthenticated && result.success) {
      try {
        const geminiEnhancement = await enhanceWithGemini(message, result);
        if (geminiEnhancement) {
          result.response = geminiEnhancement;
        }
      } catch (error) {
        console.error('🧠 CRUISE_INTELLIGENCE_API: Gemini enhancement failed:', error);
        // Continue with original response
      }
    }

    // Add authentication requirement if user is not signed in
    if (!authResult.isAuthenticated) {
      result.requiresAuth = true;
    }

    // Log conversation for analytics
    if (authResult.user) {
      await logConversation(authResult.user.id, message, result);
    }

    console.log('🧠 CRUISE_INTELLIGENCE_API: Returning result:', {
      success: result.success,
      hasResults: result.results?.length || 0,
      requiresAuth: result.requiresAuth
    });

    return res.status(200).json(result);

  } catch (error) {
    console.error('🧠 CRUISE_INTELLIGENCE_API: Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      response: "I'm having trouble processing your request right now. Let me connect you with our team for assistance!"
    });
  }
}

// 🔐 Authentication Check
async function checkAuthentication(req) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { isAuthenticated: false, user: null };
    }

    const token = authHeader.substring(7);
    
    // Verify the JWT token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      console.log('🧠 CRUISE_INTELLIGENCE_API: Authentication failed:', error?.message);
      return { isAuthenticated: false, user: null };
    }

    console.log('🧠 CRUISE_INTELLIGENCE_API: User authenticated:', user.email);
    return { isAuthenticated: true, user };

  } catch (error) {
    console.error('🧠 CRUISE_INTELLIGENCE_API: Auth check error:', error);
    return { isAuthenticated: false, user: null };
  }
}

// 🎯 Route Query Detection
function detectRouteQuery(message) {
  const routePatterns = [
    /from\s+.+\s+to\s+/i,
    /\w+\s+to\s+\w+/i,
    /between\s+.+\s+and\s+/i,
    /departing\s+from\s+/i,
    /sailing\s+to\s+/i,
    /vice\s+versa/i,
    /other\s+way\s+around/i,
    /cruises?\s+from\s+/i,
    /sailings?\s+from\s+/i
  ];

  return routePatterns.some(pattern => pattern.test(message));
}

// 🚢 General Query Processing
async function processGeneralQuery(message, intelligenceSystem, isAuthenticated) {
  const messageLower = message.toLowerCase();

  // Handle different types of general queries
  if (messageLower.includes('price') || messageLower.includes('cost') || messageLower.includes('how much')) {
    return await handlePricingQuery(message, intelligenceSystem, isAuthenticated);
  }

  if (messageLower.includes('when') || messageLower.includes('date') || messageLower.includes('departure')) {
    return await handleDateQuery(message, intelligenceSystem, isAuthenticated);
  }

  if (messageLower.includes('destination') || messageLower.includes('where') || messageLower.includes('region')) {
    return await handleDestinationQuery(message, intelligenceSystem, isAuthenticated);
  }

  if (messageLower.includes('cruise line') || messageLower.includes('ship') || messageLower.includes('company')) {
    return await handleCruiseLineQuery(message, intelligenceSystem, isAuthenticated);
  }

  // Default general response
  return {
    success: true,
    response: `🚢 **I'm here to help you find the perfect cruise!**

I specialize in **route-based cruise matching** and can help you with:

🎯 **Smart Route Queries:**
• "Cruises from Japan to Alaska"
• "Any sailings from Middle East to Europe?"
• "Between Asia and Australia - or vice versa"

🔍 **General Cruise Information:**
• Pricing and cabin types
• Departure dates and schedules
• Destinations and regions
• Cruise lines and ships

**Try asking me about a specific route you're interested in!**`,
    results: [],
    intent: { type: 'general_help' },
    followUpQuestions: [
      "Show me cruises from Asia to Europe",
      "What cruise lines sail from Singapore?",
      "Any Mediterranean to Caribbean routes?"
    ]
  };
}

// 💰 Pricing Query Handler
async function handlePricingQuery(message, intelligenceSystem, isAuthenticated) {
  if (!isAuthenticated) {
    return {
      success: true,
      response: `💰 **Cruise Pricing Information**

**Typical Price Ranges (per person):**
• Interior Cabins: $800 - $2,500
• Oceanview Cabins: $1,200 - $3,500
• Balcony Cabins: $1,800 - $5,000
• Suite Cabins: $3,500 - $15,000+

**Pricing varies by:**
• Route and destination
• Cruise length and season
• Cabin category and location
• Cruise line and ship

**Sign in to see exact pricing for specific routes and get member-only rates!**`,
      results: [],
      intent: { type: 'pricing_query' },
      requiresAuth: true
    };
  }

  // For authenticated users, provide more detailed pricing
  const cruiseData = intelligenceSystem.cruiseData.slice(0, 10);
  const avgPrices = calculateAveragePrices(cruiseData);

  return {
    success: true,
    response: `💰 **Current Cruise Pricing (Member Rates)**

**Average Prices from our deals:**
• Interior: $${avgPrices.inside.toLocaleString()} per person
• Oceanview: $${avgPrices.oceanview.toLocaleString()} per person  
• Balcony: $${avgPrices.balcony.toLocaleString()} per person
• Suite: $${avgPrices.suite.toLocaleString()} per person

**Best Value Routes:**
${cruiseData.slice(0, 3).map((cruise, i) => 
  `${i + 1}. ${cruise.shipName} - ${cruise.region} (${getDisplayPrice(cruise)})`
).join('\n')}

Ask me about specific routes for exact pricing!`,
    results: cruiseData.slice(0, 3),
    intent: { type: 'pricing_query' }
  };
}

// 📅 Date Query Handler
async function handleDateQuery(message, intelligenceSystem, isAuthenticated) {
  const upcomingCruises = intelligenceSystem.cruiseData
    .filter(cruise => cruise.departureDate)
    .slice(0, 5);

  return {
    success: true,
    response: `📅 **Upcoming Cruise Departures**

${upcomingCruises.map((cruise, i) => 
  `**${i + 1}. ${cruise.shipName}** - ${cruise.departureDate}
  ${cruise.cruiseLine} • ${cruise.region} • ${cruise.nights} nights`
).join('\n\n')}

${!isAuthenticated ? '\n**Sign in to see all available dates and book directly!**' : ''}`,
    results: upcomingCruises,
    intent: { type: 'date_query' },
    requiresAuth: !isAuthenticated
  };
}

// 🌍 Destination Query Handler
async function handleDestinationQuery(message, intelligenceSystem, isAuthenticated) {
  const regions = [...new Set(intelligenceSystem.cruiseData.map(cruise => cruise.region))].filter(Boolean);
  
  return {
    success: true,
    response: `🌍 **Popular Cruise Destinations**

${regions.slice(0, 8).map(region => {
  const count = intelligenceSystem.cruiseData.filter(cruise => cruise.region === region).length;
  return `• **${region}** (${count} cruises available)`;
}).join('\n')}

**Ask me about specific routes like:**
• "Cruises from Singapore to Japan"
• "Mediterranean to Caribbean routes"
• "Alaska to Asia sailings"

I'll find the perfect route for you!`,
    results: [],
    intent: { type: 'destination_query' }
  };
}

// 🚢 Cruise Line Query Handler
async function handleCruiseLineQuery(message, intelligenceSystem, isAuthenticated) {
  const cruiseLines = [...new Set(intelligenceSystem.cruiseData.map(cruise => cruise.cruiseLine))].filter(Boolean);
  
  return {
    success: true,
    response: `🚢 **Available Cruise Lines**

${cruiseLines.slice(0, 10).map(line => {
  const count = intelligenceSystem.cruiseData.filter(cruise => cruise.cruiseLine === line).length;
  return `• **${line}** (${count} ships in our database)`;
}).join('\n')}

**Ask me about specific cruise lines:**
• "Show me Royal Caribbean routes to Alaska"
• "What Norwegian cruises go from Europe to Caribbean?"
• "Celebrity cruises between Asia and Australia"`,
    results: [],
    intent: { type: 'cruise_line_query' }
  };
}

// 🤖 Google Gemini Enhancement
async function enhanceWithGemini(userMessage, result) {
  if (!GEMINI_API_KEY) return null;

  try {
    const prompt = `You are a cruise expert helping travel industry professionals. 

User asked: "${userMessage}"

Current response: "${result.response}"

Found ${result.results?.length || 0} matching cruises.

Please enhance this response to be more helpful and professional for travel industry staff. Keep it concise but informative. Focus on practical details they would need.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
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

    const geminiResult = await response.json();
    
    if (geminiResult.candidates && geminiResult.candidates[0] && geminiResult.candidates[0].content) {
      return geminiResult.candidates[0].content.parts[0].text;
    }

    return null;

  } catch (error) {
    console.error('🧠 CRUISE_INTELLIGENCE_API: Gemini enhancement error:', error);
    return null;
  }
}

// 📊 Conversation Logging
async function logConversation(userId, message, result) {
  try {
    await supabase
      .from('cruise_bot_conversations')
      .insert({
        user_id: userId,
        message: message,
        response: result.response,
        intent_type: result.intent?.type || 'unknown',
        results_count: result.results?.length || 0,
        created_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('🧠 CRUISE_INTELLIGENCE_API: Logging error:', error);
    // Don't fail the request if logging fails
  }
}

// 🧮 Utility Functions
function calculateAveragePrices(cruiseData) {
  const prices = {
    inside: [],
    oceanview: [],
    balcony: [],
    suite: []
  };
  
  cruiseData.forEach(cruise => {
    if (cruise.insidePrice > 0) prices.inside.push(cruise.insidePrice);
    if (cruise.oceanviewPrice > 0) prices.oceanview.push(cruise.oceanviewPrice);
    if (cruise.balconyPrice > 0) prices.balcony.push(cruise.balconyPrice);
    if (cruise.suitePrice > 0) prices.suite.push(cruise.suitePrice);
  });
  
  return {
    inside: prices.inside.length ? Math.round(prices.inside.reduce((a, b) => a + b) / prices.inside.length) : 1500,
    oceanview: prices.oceanview.length ? Math.round(prices.oceanview.reduce((a, b) => a + b) / prices.oceanview.length) : 2000,
    balcony: prices.balcony.length ? Math.round(prices.balcony.reduce((a, b) => a + b) / prices.balcony.length) : 2500,
    suite: prices.suite.length ? Math.round(prices.suite.reduce((a, b) => a + b) / prices.suite.length) : 4000
  };
}

function getDisplayPrice(cruise) {
  const priceFields = ['insidePrice', 'oceanviewPrice', 'balconyPrice', 'suitePrice'];
  
  for (const field of priceFields) {
    const price = cruise[field];
    if (price && price > 0) {
      return `from $${price.toLocaleString()}`;
    }
  }
  
  return 'Quote Available';
}

// 🧠 Cruise Intelligence System Class (Server-side version)
class CruiseIntelligenceSystem {
  constructor() {
    this.cruiseData = [];
    this.regionMappings = this.initializeRegionMappings();
    this.routePatterns = this.initializeRoutePatterns();
  }

  async init() {
    // Load cruise data from CSV files or database
    // This is a simplified version for the API
    console.log('🧠 CRUISE_INTELLIGENCE_SYSTEM: Initializing...');
  }

  initializeRegionMappings() {
    return {
      'japan': ['Asia', 'Far East', 'Pacific'],
      'china': ['Asia', 'Far East', 'Pacific'],
      'singapore': ['Asia', 'Southeast Asia', 'Pacific'],
      'alaska': ['North America', 'Alaska', 'Pacific'],
      'uae': ['Middle East', 'Arabian Gulf', 'Persian Gulf'],
      'dubai': ['Middle East', 'Arabian Gulf', 'Persian Gulf'],
      'italy': ['Europe', 'Mediterranean', 'Western Europe'],
      'spain': ['Europe', 'Mediterranean', 'Western Europe'],
      'greece': ['Europe', 'Mediterranean', 'Eastern Europe'],
      'norway': ['Europe', 'Northern Europe', 'Scandinavia'],
      'caribbean': ['Caribbean', 'Americas'],
      'mediterranean': ['Europe', 'Mediterranean'],
      'baltic': ['Europe', 'Northern Europe', 'Baltic'],
      'africa': ['Africa'],
      'australia': ['Australia', 'Pacific', 'Oceania']
    };
  }

  initializeRoutePatterns() {
    return [
      /from\s+([^to]+?)\s+to\s+([^,.!?]+)/i,
      /([^to]+?)\s+to\s+([^,.!?]+)/i,
      /between\s+([^and]+?)\s+and\s+([^,.!?]+)/i,
      /departing\s+from\s+([^,.!?]+)/i,
      /sailing\s+to\s+([^,.!?]+)/i,
      /([^to]+?)\s+to\s+([^,.!?]+?)(?:\s+or\s+(?:vice\s+versa|the\s+other\s+way\s+around))/i
    ];
  }

  async processRouteQuery(message) {
    // Simplified route processing for API
    const routeInfo = this.extractRouteInformation(message);
    
    return {
      success: true,
      response: `🚢 **Route-based search processed!**\n\nI understand you're looking for cruises ${routeInfo.origin ? `from ${routeInfo.origin}` : ''} ${routeInfo.destination ? `to ${routeInfo.destination}` : ''}.\n\nFor detailed route matching, please use our enhanced cruise search on the website!`,
      results: [],
      intent: {
        type: 'route_query',
        origin: routeInfo.origin,
        destination: routeInfo.destination,
        viceVersa: routeInfo.viceVersa
      }
    };
  }

  extractRouteInformation(message) {
    const messageLower = message.toLowerCase();
    const routeInfo = {
      origin: null,
      destination: null,
      viceVersa: false,
      confidence: 0
    };

    // Check for vice versa
    if (messageLower.includes('vice versa') || messageLower.includes('other way around')) {
      routeInfo.viceVersa = true;
    }

    // Try route patterns
    for (const pattern of this.routePatterns) {
      const match = message.match(pattern);
      if (match) {
        if (match[1] && match[2]) {
          routeInfo.origin = match[1].trim().toLowerCase();
          routeInfo.destination = match[2].trim().toLowerCase();
          routeInfo.confidence = 0.8;
          break;
        }
      }
    }

    return routeInfo;
  }

  setGeminiApiKey(apiKey) {
    this.geminiApiKey = apiKey;
  }
}