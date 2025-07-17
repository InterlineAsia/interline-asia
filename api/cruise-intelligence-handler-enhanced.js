// Enhanced Cruise Intelligence API Handler
// Properly handles complex queries like "Cruise either from Japan to Canada/Alaska or VV any date"

const EnhancedCruiseIntelligence = require('./enhanced-cruise-intelligence.js');

// Global enhanced intelligence instance
let enhancedIntelligence = null;

// Initialize enhanced intelligence system
async function initializeEnhancedIntelligence() {
  if (!enhancedIntelligence) {
    console.log('🧠 Initializing Enhanced Cruise Intelligence...');
    enhancedIntelligence = new EnhancedCruiseIntelligence();
    console.log('✅ Enhanced Cruise Intelligence ready');
    return true;
  }
  return true;
}

// Member Authentication Check (simplified for now)
async function checkMemberAuthentication(req) {
  // For testing, let's allow all requests
  // In production, this would check Supabase auth
  return {
    isAuthenticated: true,
    user: { id: 'test-user' },
    profile: { verification_status: 'verified' }
  };
}

// Main API handler
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST.'
    });
  }

  try {
    const { message, userId, conversationHistory } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    console.log(`🔍 Enhanced Handler Processing: "${message}"`);

    // MEMBER-ONLY AUTHENTICATION CHECK (simplified for testing)
    const authResult = await checkMemberAuthentication(req);
    if (!authResult.isAuthenticated) {
      return res.status(200).json({
        success: true,
        response: "This feature is available to members only. Please sign in to access cruise search.",
        requiresAuth: true,
        authError: authResult.error
      });
    }

    // Initialize enhanced intelligence
    const isReady = await initializeEnhancedIntelligence();
    if (!isReady) {
      return res.status(500).json({
        success: false,
        error: 'Enhanced intelligence system not available',
        response: "I'm currently learning about cruise deals. Please try again in a moment."
      });
    }

    // Check if this is a complex query that needs enhanced processing
    const messageLower = message.toLowerCase();
    const isComplexQuery = messageLower.includes('regent') || 
                          messageLower.includes('japan') ||
                          messageLower.includes('vv') ||
                          messageLower.includes('vice versa') ||
                          messageLower.includes('to canada') ||
                          messageLower.includes('to alaska') ||
                          messageLower.includes('transpacific') ||
                          messageLower.includes('from japan') ||
                          messageLower.includes('either from') ||
                          messageLower.includes('cruise either');

    console.log(`🧠 Query Analysis: Complex Query = ${isComplexQuery}`);

    if (isComplexQuery) {
      console.log('🚀 Using Enhanced Intelligence System');
      try {
        const result = await enhancedIntelligence.processEnhancedQuery(message, userId || 'anonymous');
        console.log('✅ Enhanced Intelligence Result:', result);
        
        if (result.success) {
          return res.status(200).json({
            success: true,
            response: result.response,
            results: result.results,
            intent: result.analysis,
            followUpQuestions: [],
            metadata: result.metadata,
            enhanced: true
          });
        }
      } catch (enhancedError) {
        console.error('❌ Enhanced Intelligence Error:', enhancedError);
      }
    }

    // Fallback response for non-complex queries or if enhanced fails
    console.log('🔄 Using Fallback Response');
    return res.status(200).json({
      success: true,
      response: `I understand you're looking for cruise options. For complex routing requests like transpacific cruises from Japan to Canada/Alaska, I recommend contacting our team directly for the best availability and pricing. 

In the meantime, I can help you with:
• General cruise information
• Popular destinations
• Cruise line details
• Pricing estimates

What specific information would you like to know?`,
      fallback: true,
      enhanced: false
    });

  } catch (error) {
    console.error('Enhanced Cruise Intelligence Handler Error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      response: "I'm experiencing technical difficulties. Please try again later."
    });
  }
}

// Health check endpoint
export async function healthCheck() {
  try {
    const isReady = await initializeEnhancedIntelligence();
    return {
      status: 'ok',
      ready: isReady,
      enhanced: true,
      version: '2.0'
    };
  } catch (error) {
    return {
      status: 'error',
      ready: false,
      error: error.message
    };
  }
}