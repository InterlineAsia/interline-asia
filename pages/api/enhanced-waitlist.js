// Enhanced Waitlist API with Comprehensive Error Handling
export default async function handler(req, res) {
  // Enhanced logging for debugging
  console.log('=== ENHANCED WAITLIST API START ===');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Method:', req.method);
  console.log('User-Agent:', req.headers['user-agent']);

  try {
    // Step 1: CORS Setup
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      console.log('OPTIONS request handled successfully');
      return res.status(200).end();
    }

    if (req.method !== 'POST') {
      console.log('Invalid method received:', req.method);
      return res.status(405).json({ 
        success: false, 
        message: 'Method not allowed',
        receivedMethod: req.method
      });
    }

    // Step 2: Environment Variable Validation
    console.log('Checking environment variables...');
    
    const envErrors = [];
    const envStatus = {};

    // Check NEXT_PUBLIC_SUPABASE_URL
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      envErrors.push('NEXT_PUBLIC_SUPABASE_URL is missing');
      envStatus.NEXT_PUBLIC_SUPABASE_URL = 'MISSING';
    } else if (!process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith('https://')) {
      envErrors.push('NEXT_PUBLIC_SUPABASE_URL appears invalid (should start with https://)');
      envStatus.NEXT_PUBLIC_SUPABASE_URL = 'INVALID_FORMAT';
    } else {
      envStatus.NEXT_PUBLIC_SUPABASE_URL = 'PRESENT';
      console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 30) + '...');
    }

    // Check SUPABASE_SERVICE_ROLE_KEY
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      envErrors.push('SUPABASE_SERVICE_ROLE_KEY is missing');
      envStatus.SUPABASE_SERVICE_ROLE_KEY = 'MISSING';
    } else if (process.env.SUPABASE_SERVICE_ROLE_KEY.length < 100) {
      envErrors.push('SUPABASE_SERVICE_ROLE_KEY appears too short (should be a JWT token)');
      envStatus.SUPABASE_SERVICE_ROLE_KEY = 'INVALID_LENGTH';
    } else {
      envStatus.SUPABASE_SERVICE_ROLE_KEY = 'PRESENT';
      console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 20) + '...');
    }

    // Check BREVO_API_KEY
    if (!process.env.BREVO_API_KEY) {
      envErrors.push('BREVO_API_KEY is missing');
      envStatus.BREVO_API_KEY = 'MISSING';
    } else if (!process.env.BREVO_API_KEY.startsWith('xkeysib-')) {
      envErrors.push('BREVO_API_KEY appears invalid (should start with xkeysib-)');
      envStatus.BREVO_API_KEY = 'INVALID_FORMAT';
    } else {
      envStatus.BREVO_API_KEY = 'PRESENT';
      console.log('BREVO_API_KEY:', process.env.BREVO_API_KEY.substring(0, 20) + '...');
    }

    // If environment variables are missing, return detailed error
    if (envErrors.length > 0) {
      console.error('Environment variable errors:', envErrors);
      return res.status(500).json({
        success: false,
        error: 'Environment configuration error',
        details: envErrors,
        environmentStatus: envStatus,
        message: 'Required environment variables are missing or invalid. Please check Vercel dashboard settings.',
        timestamp: new Date().toISOString()
      });
    }

    console.log('All environment variables present and valid');

    // Step 3: Input Validation
    console.log('Parsing request body...');
    const { email, firstName, lastName, company, source } = req.body;

    if (!email) {
      console.log('Email validation failed - missing email');
      return res.status(400).json({
        success: false,
        message: 'Email address is required'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('Email validation failed - invalid format:', email);
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address'
      });
    }

    console.log('Input validation passed for:', email);

    // Step 4: Supabase Import and Client Creation
    console.log('Importing Supabase...');
    let createClient, supabase;
    
    try {
      const supabaseModule = await import('@supabase/supabase-js');
      createClient = supabaseModule.createClient;
      console.log('Supabase import successful');
    } catch (importError) {
      console.error('Supabase import failed:', importError);
      return res.status(500).json({
        success: false,
        error: 'Supabase import failed',
        details: importError.message,
        timestamp: new Date().toISOString()
      });
    }

    try {
      supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
      console.log('Supabase client created successfully');
    } catch (clientError) {
      console.error('Supabase client creation failed:', clientError);
      return res.status(500).json({
        success: false,
        error: 'Supabase client creation failed',
        details: clientError.message,
        timestamp: new Date().toISOString()
      });
    }

    // Step 5: Database Operations
    console.log('Checking for existing email...');
    try {
      const { data: existingContact, error: selectError } = await supabase
        .from('waitlist')
        .select('email')
        .eq('email', email.toLowerCase())
        .single();

      if (selectError && selectError.code !== 'PGRST116') {
        console.error('Database query error:', selectError);
        return res.status(500).json({
          success: false,
          error: 'Database query failed',
          details: selectError.message,
          timestamp: new Date().toISOString()
        });
      }

      if (existingContact) {
        console.log('Email already exists in waitlist');
        return res.status(200).json({
          success: true,
          message: 'You are already on our waitlist! We\'ll notify you when spots become available.',
          alreadyExists: true
        });
      }

      console.log('Email not found, proceeding with insert...');
    } catch (dbError) {
      console.error('Database operation failed:', dbError);
      return res.status(500).json({
        success: false,
        error: 'Database operation failed',
        details: dbError.message,
        timestamp: new Date().toISOString()
      });
    }

    // Step 6: Insert New Entry
    console.log('Inserting new waitlist entry...');
    try {
      const { error: insertError } = await supabase
        .from('waitlist')
        .insert([
          {
            email: email.toLowerCase(),
            first_name: firstName || null,
            last_name: lastName || null,
            company: company || null,
            source: source || 'enhanced_api',
            created_at: new Date().toISOString()
          }
        ]);

      if (insertError) {
        console.error('Database insert failed:', insertError);
        return res.status(500).json({
          success: false,
          error: 'Database insert failed',
          details: insertError.message,
          timestamp: new Date().toISOString()
        });
      }

      console.log('Database insert successful');
    } catch (insertError) {
      console.error('Insert operation failed:', insertError);
      return res.status(500).json({
        success: false,
        error: 'Insert operation failed',
        details: insertError.message,
        timestamp: new Date().toISOString()
      });
    }

    // Step 7: Brevo Integration
    console.log('Starting Brevo integration...');
    try {
      const contactData = {
        email: email.toLowerCase(),
        attributes: {
          FIRSTNAME: firstName || '',
          LASTNAME: lastName || '',
          COMPANY: company || '',
          SOURCE: source || 'enhanced_api',
          SIGNUP_DATE: new Date().toISOString(),
          STATUS: 'waitlist'
        },
        listIds: [2],
        updateEnabled: true
      };

      const brevoResponse = await fetch('https://api.brevo.com/v3/contacts', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'api-key': process.env.BREVO_API_KEY
        },
        body: JSON.stringify(contactData)
      });

      const brevoResult = await brevoResponse.json();
      console.log('Brevo response status:', brevoResponse.status);
      console.log('Brevo response:', brevoResult);

      if (!brevoResponse.ok && brevoResponse.status !== 400) {
        console.error('Brevo API error:', brevoResult);
        // Don't fail the request for Brevo errors
      }

      // Send welcome email
      if (brevoResponse.ok || brevoResponse.status === 400) {
        console.log('Sending welcome email...');
        await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'api-key': process.env.BREVO_API_KEY
          },
          body: JSON.stringify({
            to: [{ email: email.toLowerCase(), name: `${firstName} ${lastName}`.trim() || email }],
            templateId: 1,
            params: {
              FIRSTNAME: firstName || 'Travel Professional',
              COMPANY: company || ''
            },
            tags: ['waitlist', 'welcome', 'enhanced_api']
          })
        });
        console.log('Welcome email sent');
      }

    } catch (brevoError) {
      console.error('Brevo integration error:', brevoError);
      // Don't fail the request for Brevo errors
    }

    // Step 8: Success Response
    console.log('=== ENHANCED WAITLIST API SUCCESS ===');
    return res.status(200).json({
      success: true,
      message: 'Successfully joined the waitlist! Check your email for confirmation.',
      timestamp: new Date().toISOString(),
      environmentStatus: envStatus
    });

  } catch (error) {
    console.error('=== ENHANCED WAITLIST API ERROR ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);

    return res.status(500).json({
      success: false,
      error: error.message,
      errorName: error.name,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      message: 'An unexpected error occurred. Please check the server logs for details.'
    });
  }
}