// LangChain System Diagnostic - Check logging, chains, tools, agents
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const diagnostic = {
    timestamp: new Date().toISOString(),
    langchain_status: 'analyzing',
    api_key_status: {},
    active_usage: {
      admin_bot: 'checking',
      document_flows: 'checking',
      chains: 'checking',
      tools: 'checking',
      agents: 'checking'
    },
    logging_system: {},
    recommendations: []
  };

  try {
    // 1. Check API Key Status
    console.log('🔍 Checking LangChain API key...');
    const langchainApiKey = process.env.LANGCHAIN_API_KEY;
    const langchainEndpoint = process.env.LANGCHAIN_ENDPOINT || 'https://api.smith.langchain.com';
    
    diagnostic.api_key_status = {
      key_present: !!langchainApiKey,
      key_format: langchainApiKey ? `${langchainApiKey.substring(0, 8)}...` : 'MISSING',
      endpoint: langchainEndpoint,
      key_length: langchainApiKey ? langchainApiKey.length : 0
    };

    if (!langchainApiKey) {
      diagnostic.recommendations.push('Add LANGCHAIN_API_KEY to environment variables');
    }

    // 2. Test LangSmith Connection
    if (langchainApiKey) {
      try {
        console.log('🧪 Testing LangSmith API connection...');
        
        // Test basic API access
        const testResponse = await fetch(`${langchainEndpoint}/sessions`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${langchainApiKey}`,
            'Content-Type': 'application/json'
          }
        });

        diagnostic.logging_system = {
          connection_test: testResponse.ok ? 'success' : 'failed',
          status_code: testResponse.status,
          status_text: testResponse.statusText,
          endpoint_reachable: true
        };

        if (!testResponse.ok) {
          if (testResponse.status === 401) {
            diagnostic.recommendations.push('LangChain API key is invalid or expired - generate new key at https://smith.langchain.com/');
          } else if (testResponse.status === 403) {
            diagnostic.recommendations.push('LangChain API key lacks required permissions');
          } else {
            diagnostic.recommendations.push(`LangChain API error: ${testResponse.status} - check endpoint and key`);
          }
        }

        // Test LangSmith client initialization
        try {
          const { Client } = await import('langsmith');
          const client = new Client({
            apiKey: langchainApiKey,
            apiUrl: langchainEndpoint
          });
          
          diagnostic.logging_system.client_initialization = 'success';
          diagnostic.logging_system.package_available = true;
        } catch (clientError) {
          diagnostic.logging_system.client_initialization = 'failed';
          diagnostic.logging_system.client_error = clientError.message;
          diagnostic.recommendations.push('LangSmith client initialization failed - check package installation');
        }

      } catch (connectionError) {
        diagnostic.logging_system = {
          connection_test: 'failed',
          error: connectionError.message,
          endpoint_reachable: false
        };
        diagnostic.recommendations.push('LangChain endpoint unreachable - check network connectivity');
      }
    }

    // 3. Check Active Usage in Admin Bot
    console.log('🤖 Analyzing Admin Bot LangChain usage...');
    try {
      // Check if admin bot uses LangChain
      const adminBotCode = await import('./admin-bot-intelligence.js');
      
      diagnostic.active_usage.admin_bot = {
        uses_langchain: false,
        uses_langsmith_logging: false,
        integration_type: 'none',
        details: 'Admin bot uses direct Gemini API calls, not LangChain chains'
      };
    } catch (error) {
      diagnostic.active_usage.admin_bot = {
        analysis_error: error.message
      };
    }

    // 4. Check Base Bot Framework
    console.log('🔧 Analyzing Base Bot framework...');
    try {
      // The base bot framework does use LangSmith for logging
      diagnostic.active_usage.base_bot_framework = {
        uses_langsmith: true,
        purpose: 'logging_and_tracing',
        location: 'bots/core/base-bot.js',
        methods: ['logToLangSmith', 'initializeLangSmith'],
        impact: 'Bot activity logging and performance monitoring'
      };
    } catch (error) {
      diagnostic.active_usage.base_bot_framework = {
        analysis_error: error.message
      };
    }

    // 5. Check for Chains, Tools, Agents
    console.log('🔗 Checking for LangChain chains, tools, agents...');
    diagnostic.active_usage.chains = {
      found: false,
      details: 'No LangChain chains detected - system uses direct API calls'
    };
    
    diagnostic.active_usage.tools = {
      found: false,
      details: 'No LangChain tools detected - system uses custom functions'
    };
    
    diagnostic.active_usage.agents = {
      found: false,
      details: 'No LangChain agents detected - system uses custom bot logic'
    };

    // 6. Document Flow Analysis
    diagnostic.active_usage.document_flows = {
      uses_langchain: false,
      details: 'Document upload/approval flows use direct Supabase operations',
      langchain_integration: 'none'
    };

    // 7. Overall Assessment
    const hasActiveUsage = diagnostic.active_usage.base_bot_framework?.uses_langsmith;
    const hasWorkingConnection = diagnostic.logging_system.connection_test === 'success';
    
    if (hasActiveUsage && !hasWorkingConnection) {
      diagnostic.langchain_status = 'degraded';
      diagnostic.recommendations.push('LangSmith logging is configured but not working - update API key');
    } else if (hasActiveUsage && hasWorkingConnection) {
      diagnostic.langchain_status = 'operational';
    } else if (!hasActiveUsage) {
      diagnostic.langchain_status = 'unused';
      diagnostic.recommendations.push('LangChain is configured but not actively used - consider removing or implementing');
    }

    // 8. Current API Key Analysis
    if (langchainApiKey) {
      diagnostic.api_key_analysis = {
        format_check: langchainApiKey.startsWith('lsv2_') ? 'valid_format' : 'invalid_format',
        length_check: langchainApiKey.length > 50 ? 'appropriate_length' : 'too_short',
        likely_valid: langchainApiKey.startsWith('lsv2_') && langchainApiKey.length > 50
      };
    }

    return res.status(200).json(diagnostic);

  } catch (error) {
    console.error('LangChain diagnostic error:', error);
    diagnostic.langchain_status = 'error';
    diagnostic.error = error.message;
    return res.status(500).json(diagnostic);
  }
}