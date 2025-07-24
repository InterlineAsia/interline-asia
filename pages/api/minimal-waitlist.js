// Minimal Waitlist API - Step by step debugging
export default async function handler(req, res) {
  try {
    console.log('=== MINIMAL WAITLIST API START ===');
    console.log('Method:', req.method);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      console.log('OPTIONS request handled');
      return res.status(200).end();
    }

    if (req.method !== 'POST') {
      console.log('Invalid method:', req.method);
      return res.status(405).json({ 
        success: false, 
        message: 'Method not allowed' 
      });
    }

    console.log('Processing POST request...');
    console.log('Body:', JSON.stringify(req.body, null, 2));

    // Basic validation without external dependencies
    const { email, firstName, lastName, company, source } = req.body;
    
    if (!email) {
      console.log('Email validation failed');
      return res.status(400).json({
        success: false,
        message: 'Email address is required'
      });
    }

    console.log('Email validation passed:', email);

    // Test environment variables
    const envStatus = {
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      brevoKey: !!process.env.BREVO_API_KEY
    };
    
    console.log('Environment variables:', envStatus);

    // If we get this far, basic processing works
    console.log('=== MINIMAL WAITLIST API SUCCESS ===');
    
    return res.status(200).json({
      success: true,
      message: 'Minimal waitlist API working - environment check passed',
      timestamp: new Date().toISOString(),
      received: {
        email,
        firstName,
        lastName,
        company,
        source: source || 'minimal_test'
      },
      environment: envStatus
    });

  } catch (error) {
    console.error('=== MINIMAL WAITLIST API ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }
}