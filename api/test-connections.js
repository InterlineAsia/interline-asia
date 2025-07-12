// Test all backend connections for Admin Helper Bot
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const results = {
    timestamp: new Date().toISOString(),
    gemini: { status: 'testing', details: {} },
    langchain: { status: 'testing', details: {} },
    supabase: { status: 'testing', details: {} }
  };

  // 1. TEST GOOGLE GEMINI
  try {
    console.log('🧪 Testing Google Gemini connection...');
    
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not found in environment');
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;
    
    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: "What is 2 + 2? Answer with just the number." }]
        }]
      })
    });

    if (!geminiResponse.ok) {
      throw new Error(`Gemini API error: ${geminiResponse.status} - ${geminiResponse.statusText}`);
    }

    const geminiData = await geminiResponse.json();
    const geminiAnswer = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';
    
    results.gemini = {
      status: 'connected',
      details: {
        apiKeyPresent: true,
        testPrompt: 'What is 2 + 2?',
        response: geminiAnswer.trim(),
        responseTime: 'success'
      }
    };
    
    console.log('✅ Gemini test successful:', geminiAnswer);

  } catch (error) {
    console.error('❌ Gemini test failed:', error);
    results.gemini = {
      status: 'failed',
      details: {
        error: error.message,
        apiKeyPresent: !!process.env.GEMINI_API_KEY
      }
    };
  }

  // 2. TEST LANGCHAIN/LANGSMITH
  try {
    console.log('🧪 Testing LangChain/LangSmith connection...');
    
    const langchainApiKey = process.env.LANGCHAIN_API_KEY;
    const langchainEndpoint = process.env.LANGCHAIN_ENDPOINT || 'https://api.smith.langchain.com';
    
    if (!langchainApiKey) {
      throw new Error('LANGCHAIN_API_KEY not found in environment');
    }

    // Test LangSmith API connection
    const { Client } = await import('langsmith');
    const langsmithClient = new Client({
      apiKey: langchainApiKey,
      apiUrl: langchainEndpoint
    });

    // Test LangSmith connection with a simple ping
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

    results.langchain = {
      status: 'connected',
      details: {
        apiKeyPresent: true,
        endpoint: langchainEndpoint,
        usage: 'LangSmith logging only (not model calls)',
        connectionTest: 'success',
        loggingEnabled: true
      }
    };
    
    console.log('✅ LangChain/LangSmith test successful');

  } catch (error) {
    console.error('❌ LangChain test failed:', error);
    results.langchain = {
      status: 'failed',
      details: {
        error: error.message,
        apiKeyPresent: !!process.env.LANGCHAIN_API_KEY,
        endpoint: process.env.LANGCHAIN_ENDPOINT || 'https://api.smith.langchain.com'
      }
    };
  }

  // 3. TEST SUPABASE
  try {
    console.log('🧪 Testing Supabase connection...');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nxreyyxbuwxjfmtvdkji.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY not found in environment');
    }

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Test 1: Count users
    const { count: userCount, error: userError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    console.log('User count result:', { userCount, userError });

    // Test 2: Get sample users
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, email, full_name, created_at')
      .limit(3);

    console.log('Users query result:', { users, usersError });

    // Test 3: Get sample document
    const { data: documents, error: docError } = await supabase
      .from('uploads')
      .select('id, filename, status')
      .limit(1);

    console.log('Documents query result:', { documents, docError });

    if (docError) {
      console.warn('Document query warning:', docError.message);
    }

    results.supabase = {
      status: 'connected',
      details: {
        url: supabaseUrl,
        serviceKeyPresent: true,
        userCountQuery: userCount ? 'success' : 'no data',
        documentQuery: documents ? `${documents.length} records` : 'no data',
        tables: {
          profiles: userError ? 'error' : 'accessible',
          uploads: docError ? 'error' : 'accessible'
        }
      }
    };
    
    console.log('✅ Supabase test successful');

  } catch (error) {
    console.error('❌ Supabase test failed:', error);
    results.supabase = {
      status: 'failed',
      details: {
        error: error.message,
        url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nxreyyxbuwxjfmtvdkji.supabase.co',
        serviceKeyPresent: !!process.env.SUPABASE_SERVICE_ROLE_KEY
      }
    };
  }

  // Return comprehensive results
  return res.status(200).json(results);
}