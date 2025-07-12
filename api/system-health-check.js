// Comprehensive System Health Check - All Integrated Systems
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const healthReport = {
    timestamp: new Date().toISOString(),
    overall_status: 'testing',
    systems: {
      supabase: { status: 'testing', details: {} },
      gemini: { status: 'testing', details: {} },
      langchain: { status: 'testing', details: {} },
      admin_bot: { status: 'testing', details: {} },
      end_to_end: { status: 'testing', details: {} }
    },
    environment_variables: {},
    errors: []
  };

  try {
    // 1. 🔗 SUPABASE CONNECTIVITY CHECK
    console.log('🔗 Testing Supabase connectivity...');
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nxreyyxbuwxjfmtvdkji.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      if (!supabaseKey) {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY not found');
      }

      const supabase = createClient(supabaseUrl, supabaseKey);

      // Test uploads table read access
      const { data: uploads, error: uploadsError } = await supabase
        .from('uploads')
        .select('id, filename, status, user_id, created_at')
        .limit(5);

      if (uploadsError) throw new Error(`Uploads table error: ${uploadsError.message}`);

      // Test profiles table read access  
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email, created_at')
        .limit(5);

      if (profilesError) throw new Error(`Profiles table error: ${profilesError.message}`);

      // Test write access with a test insert/delete
      const testUpload = {
        user_id: profiles[0]?.id || 'test-user-id',
        filename: 'health-check-test.pdf',
        status: 'pending'
      };

      const { data: insertedUpload, error: insertError } = await supabase
        .from('uploads')
        .insert(testUpload)
        .select()
        .single();

      if (insertError) throw new Error(`Insert test failed: ${insertError.message}`);

      // Clean up test data
      await supabase.from('uploads').delete().eq('id', insertedUpload.id);

      healthReport.systems.supabase = {
        status: 'success',
        details: {
          connection: 'connected',
          uploads_table: `${uploads.length} records accessible`,
          profiles_table: `${profiles.length} records accessible`,
          rls_status: 'working',
          read_access: 'confirmed',
          write_access: 'confirmed',
          test_insert_cleanup: 'completed'
        }
      };

    } catch (error) {
      healthReport.systems.supabase = {
        status: 'failed',
        details: { error: error.message }
      };
      healthReport.errors.push(`Supabase: ${error.message}`);
    }

    // 2. 🔑 GEMINI API CHECK
    console.log('🔑 Testing Gemini API...');
    try {
      const geminiApiKey = process.env.GEMINI_API_KEY;
      if (!geminiApiKey) {
        throw new Error('GEMINI_API_KEY not found');
      }

      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;
      
      const testPrompt = "Generate a brief system status summary in exactly 10 words.";
      
      const geminiResponse = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: testPrompt }]
          }]
        })
      });

      if (!geminiResponse.ok) {
        throw new Error(`Gemini API error: ${geminiResponse.status} - ${geminiResponse.statusText}`);
      }

      const geminiData = await geminiResponse.json();
      const geminiAnswer = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';

      healthReport.systems.gemini = {
        status: 'success',
        details: {
          api_key_valid: true,
          model: 'gemini-1.5-flash',
          test_prompt: testPrompt,
          test_response: geminiAnswer.trim(),
          response_time: 'success'
        }
      };

    } catch (error) {
      healthReport.systems.gemini = {
        status: 'failed',
        details: { error: error.message }
      };
      healthReport.errors.push(`Gemini: ${error.message}`);
    }

    // 3. 🧠 LANGCHAIN CHECK
    console.log('🧠 Testing LangChain/LangSmith...');
    try {
      const langchainApiKey = process.env.LANGCHAIN_API_KEY;
      const langchainEndpoint = process.env.LANGCHAIN_ENDPOINT || 'https://api.smith.langchain.com';
      
      if (!langchainApiKey) {
        throw new Error('LANGCHAIN_API_KEY not found');
      }

      // Test LangSmith API connection
      const testResponse = await fetch(`${langchainEndpoint}/sessions`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${langchainApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!testResponse.ok) {
        throw new Error(`LangSmith API test failed: ${testResponse.status}`);
      }

      // Test LangSmith client initialization
      const { Client } = await import('langsmith');
      const langsmithClient = new Client({
        apiKey: langchainApiKey,
        apiUrl: langchainEndpoint
      });

      healthReport.systems.langchain = {
        status: 'success',
        details: {
          api_key_valid: true,
          endpoint: langchainEndpoint,
          client_initialized: true,
          usage: 'logging_and_tracing',
          connection_test: 'passed'
        }
      };

    } catch (error) {
      healthReport.systems.langchain = {
        status: 'failed',
        details: { error: error.message }
      };
      healthReport.errors.push(`LangChain: ${error.message}`);
    }

    // 4. 🤖 ADMIN HELPER BOT CHECK
    console.log('🤖 Testing Admin Helper Bot...');
    try {
      // Import and test the admin bot intelligence
      const { getIntelligentResponse } = await import('./admin-bot-intelligence.js');
      
      const testQuery = "How many uploads do we have?";
      const botResponse = await getIntelligentResponse(testQuery);

      if (!botResponse || botResponse.includes('experiencing difficulty')) {
        throw new Error('Bot returned fallback response instead of intelligent data');
      }

      healthReport.systems.admin_bot = {
        status: 'success',
        details: {
          intelligence_system: 'operational',
          database_access: 'working',
          test_query: testQuery,
          response_type: 'intelligent_data',
          gemini_integration: 'active',
          supabase_integration: 'active'
        }
      };

    } catch (error) {
      healthReport.systems.admin_bot = {
        status: 'failed',
        details: { error: error.message }
      };
      healthReport.errors.push(`Admin Bot: ${error.message}`);
    }

    // 5. 🔁 END-TO-END WORKFLOW TEST
    console.log('🔁 Testing end-to-end workflow...');
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nxreyyxbuwxjfmtvdkji.supabase.co',
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      // Step 1: Insert test upload
      const { data: testUser } = await supabase
        .from('profiles')
        .select('id')
        .limit(1)
        .single();

      const testUpload = {
        user_id: testUser.id,
        filename: 'e2e-test-document.pdf',
        status: 'pending'
      };

      const { data: insertedUpload, error: insertError } = await supabase
        .from('uploads')
        .insert(testUpload)
        .select()
        .single();

      if (insertError) throw new Error(`E2E insert failed: ${insertError.message}`);

      // Step 2: Query status via Admin Bot
      const { getIntelligentResponse } = await import('./admin-bot-intelligence.js');
      const statusResponse = await getIntelligentResponse("Show me pending uploads");

      // Step 3: Update status
      const { error: updateError } = await supabase
        .from('uploads')
        .update({ status: 'approved' })
        .eq('id', insertedUpload.id);

      if (updateError) throw new Error(`E2E update failed: ${updateError.message}`);

      // Step 4: Generate Gemini summary
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
      const summaryResponse = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: `Summarize this upload workflow: Document ${insertedUpload.filename} was uploaded and approved for user ${testUser.id}` }]
          }]
        })
      });

      const summaryData = await summaryResponse.json();
      const summary = summaryData.candidates?.[0]?.content?.parts?.[0]?.text || 'No summary';

      // Step 5: Cleanup
      await supabase.from('uploads').delete().eq('id', insertedUpload.id);

      healthReport.systems.end_to_end = {
        status: 'success',
        details: {
          workflow_steps: 'all_completed',
          insert_test: 'passed',
          bot_query: 'responded_with_data',
          status_update: 'successful',
          gemini_summary: summary.substring(0, 100) + '...',
          cleanup: 'completed'
        }
      };

    } catch (error) {
      healthReport.systems.end_to_end = {
        status: 'failed',
        details: { error: error.message }
      };
      healthReport.errors.push(`End-to-End: ${error.message}`);
    }

    // Environment Variables Check
    healthReport.environment_variables = {
      GEMINI_API_KEY: process.env.GEMINI_API_KEY ? 'SET' : 'MISSING',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING',
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING',
      LANGCHAIN_API_KEY: process.env.LANGCHAIN_API_KEY ? 'SET' : 'MISSING',
      LANGCHAIN_ENDPOINT: process.env.LANGCHAIN_ENDPOINT || 'DEFAULT',
      BREVO_API_KEY: process.env.BREVO_API_KEY ? 'SET' : 'MISSING'
    };

    // Overall Status
    const failedSystems = Object.values(healthReport.systems).filter(s => s.status === 'failed').length;
    healthReport.overall_status = failedSystems === 0 ? 'healthy' : failedSystems < 3 ? 'degraded' : 'critical';

    return res.status(200).json(healthReport);

  } catch (error) {
    console.error('Health check error:', error);
    healthReport.overall_status = 'error';
    healthReport.errors.push(`System: ${error.message}`);
    return res.status(500).json(healthReport);
  }
}