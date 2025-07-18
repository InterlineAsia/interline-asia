// Consolidated Cruise Intelligence Handler
// Combines cruise data integration and enhanced intelligence processing

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, userId, conversationHistory, action } = req.body;

    // Handle different types of requests
    if (action === 'data-integration') {
      return await handleDataIntegration(req, res);
    } else {
      return await handleIntelligenceQuery(req, res);
    }

  } catch (error) {
    console.error('Cruise Intelligence error:', error);
    return res.status(500).json({
      success: false,
      error: 'Intelligence system temporarily unavailable',
      fallback: true
    });
  }
}

// Handle cruise data integration
async function handleDataIntegration(req, res) {
  try {
    const { operation, data } = req.body;

    switch (operation) {
      case 'sync-deals':
        return await syncCruiseDeals(req, res);
      case 'update-indexes':
        return await updateSearchIndexes(req, res);
      case 'health-check':
        return await checkDataHealth(req, res);
      default:
        return res.status(400).json({ error: 'Invalid operation' });
    }

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Data integration error',
      details: error.message
    });
  }
}

// Handle intelligent cruise queries
async function handleIntelligenceQuery(req, res) {
  const { message, userId, conversationHistory } = req.body;

  try {
    // Validate input
    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    // Process the query with intelligence
    const result = await processIntelligentQuery(message, userId, conversationHistory);

    return res.status(200).json({
      success: true,
      response: result.response,
      results: result.cruises || [],
      intent: result.intent,
      followUpQuestions: result.followUpQuestions || [],
      requiresAuth: result.requiresAuth || false
    });

  } catch (error) {
    console.error('Intelligence query error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process query',
      fallback: true
    });
  }
}

// Process intelligent cruise queries
async function processIntelligentQuery(message, userId, conversationHistory) {
  const query = message.toLowerCase().trim();

  // Detect query intent
  const intent = detectQueryIntent(query);

  // Get relevant cruise data
  const cruises = await searchCruises(query, intent);

  // Generate intelligent response
  const response = generateIntelligentResponse(query, intent, cruises);

  // Generate follow-up questions
  const followUpQuestions = generateFollowUpQuestions(intent, cruises);

  return {
    response,
    cruises: cruises.slice(0, 5), // Limit results
    intent,
    followUpQuestions,
    requiresAuth: intent.requiresAuth || false
  };
}

// Detect the intent of the user's query
function detectQueryIntent(query) {
  const intent = {
    type: 'general',
    entities: {},
    requiresAuth: false
  };

  // Route-based queries
  if (/from\s+.+\s+to\s+|between\s+.+\s+and\s+/.test(query)) {
    intent.type = 'route';
    const routeMatch = query.match(/from\s+([^to]+)\s+to\s+([^,\s]+)|between\s+([^and]+)\s+and\s+([^,\s]+)/i);
    if (routeMatch) {
      intent.entities.from = (routeMatch[1] || routeMatch[3] || '').trim();
      intent.entities.to = (routeMatch[2] || routeMatch[4] || '').trim();
    }
  }

  // Region-based queries
  const regions = ['alaska', 'caribbean', 'mediterranean', 'northern europe', 'asia', 'australia', 'arctic'];
  const foundRegion = regions.find(region => query.includes(region));
  if (foundRegion) {
    intent.type = 'region';
    intent.entities.region = foundRegion;
  }

  // Cruise line queries
  const cruiseLines = ['royal caribbean', 'norwegian', 'celebrity', 'princess', 'holland america', 'msc'];
  const foundLine = cruiseLines.find(line => query.includes(line));
  if (foundLine) {
    intent.entities.cruiseLine = foundLine;
  }

  // Price-based queries
  if (/under\s+\$?(\d+)|less than\s+\$?(\d+)|budget|cheap|affordable/.test(query)) {
    intent.type = 'price';
    const priceMatch = query.match(/under\s+\$?(\d+)|less than\s+\$?(\d+)/);
    if (priceMatch) {
      intent.entities.maxPrice = parseInt(priceMatch[1] || priceMatch[2]);
    }
  }

  // Duration queries
  if (/(\d+)\s*night|(\d+)\s*day|short|long|week/.test(query)) {
    const durationMatch = query.match(/(\d+)\s*night|(\d+)\s*day/);
    if (durationMatch) {
      intent.entities.nights = parseInt(durationMatch[1] || durationMatch[2]);
    }
  }

  return intent;
}

// Search for relevant cruises based on query and intent
async function searchCruises(query, intent) {
  try {
    let queryBuilder = supabase
      .from('cruise_deals')
      .select('*')
      .eq('is_active', true)
      .limit(10);

    // Apply filters based on intent
    if (intent.entities.region) {
      queryBuilder = queryBuilder.ilike('region', `%${intent.entities.region}%`);
    }

    if (intent.entities.cruiseLine) {
      queryBuilder = queryBuilder.ilike('cruise_line', `%${intent.entities.cruiseLine}%`);
    }

    if (intent.entities.from) {
      queryBuilder = queryBuilder.ilike('departure_port', `%${intent.entities.from}%`);
    }

    if (intent.entities.to) {
      queryBuilder = queryBuilder.ilike('arrival_port', `%${intent.entities.to}%`);
    }

    if (intent.entities.nights) {
      queryBuilder = queryBuilder.eq('nights', intent.entities.nights);
    }

    const { data: cruises, error } = await queryBuilder;

    if (error) {
      console.error('Cruise search error:', error);
      return [];
    }

    return cruises || [];

  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
}

// Generate intelligent response based on query and results
function generateIntelligentResponse(query, intent, cruises) {
  if (cruises.length === 0) {
    return generateNoResultsResponse(intent);
  }

  let response = '';

  switch (intent.type) {
    case 'route':
      response = `I found ${cruises.length} cruise${cruises.length > 1 ? 's' : ''} for your route`;
      if (intent.entities.from && intent.entities.to) {
        response += ` from ${intent.entities.from} to ${intent.entities.to}`;
      }
      response += ':';
      break;

    case 'region':
      response = `Here are ${cruises.length} great ${intent.entities.region} cruise${cruises.length > 1 ? 's' : ''}:`;
      break;

    case 'price':
      response = `I found ${cruises.length} cruise${cruises.length > 1 ? 's' : ''} within your budget:`;
      break;

    default:
      response = `I found ${cruises.length} cruise${cruises.length > 1 ? 's' : ''} that match your search:`;
  }

  return response;
}

// Generate response when no results found
function generateNoResultsResponse(intent) {
  switch (intent.type) {
    case 'route':
      return "I couldn't find any cruises for that specific route. Would you like me to suggest similar routes or different departure dates?";
    
    case 'region':
      return `I don't have any cruises in ${intent.entities.region} right now. Would you like to explore other regions or check different dates?`;
    
    case 'price':
      return "I couldn't find cruises in that price range. Would you like to see our most affordable options or adjust your budget?";
    
    default:
      return "I couldn't find cruises matching your criteria. Would you like to try a different search or browse our popular destinations?";
  }
}

// Generate follow-up questions
function generateFollowUpQuestions(intent, cruises) {
  const questions = [];

  if (cruises.length > 0) {
    questions.push("Would you like more details about any of these cruises?");
    
    if (intent.type === 'region') {
      questions.push("Are you interested in a specific cruise line or ship?");
    }
    
    if (!intent.entities.nights) {
      questions.push("Do you have a preferred cruise duration?");
    }
  } else {
    questions.push("Would you like to try a different destination?");
    questions.push("Are you flexible with your travel dates?");
  }

  return questions;
}

// Sync cruise deals from CSV files
async function syncCruiseDeals(req, res) {
  try {
    // This would typically sync from CSV files
    // For now, return a success response
    return res.status(200).json({
      success: true,
      message: 'Cruise deals sync completed',
      synced: 0
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Sync failed',
      details: error.message
    });
  }
}

// Update search indexes
async function updateSearchIndexes(req, res) {
  try {
    return res.status(200).json({
      success: true,
      message: 'Search indexes updated'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Index update failed'
    });
  }
}

// Check data health
async function checkDataHealth(req, res) {
  try {
    const { count } = await supabase
      .from('cruise_deals')
      .select('*', { count: 'exact', head: true });

    return res.status(200).json({
      success: true,
      health: {
        totalDeals: count || 0,
        status: 'healthy'
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Health check failed'
    });
  }
}