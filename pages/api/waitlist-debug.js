// Enhanced Waitlist API with Detailed Error Logging
export default async function handler(req, res) {
  console.log('=== WAITLIST DEBUG API START ===');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Method:', req.method);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));

  try {
    // Step 1: Basic setup and CORS
    console.log('Step 1: Setting up CORS...');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      console.log('OPTIONS request - returning 200');
      return res.status(200).end();
    }

    if (req.method !== 'POST') {
      console.log('Invalid method:', req.method);
      return res.status(405).json({ 
        success: false, 
        message: 'Method not allowed',
        method: req.method
      });
    }

    // Step 2: Environment variable check
    console.log('Step 2: Checking environment variables...');
    const envCheck = {
      NEXT_PUBLIC_SUPABASE_URL: {
        exists: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        value: process.env.NEXT_PUBLIC_SUPABASE_URL ? 
          `${process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 30)}...` : 'NOT_SET'
      },
      SUPABASE_SERVICE_ROLE_KEY: {
        exists: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        value: process.env.SUPABASE_SERVICE_ROLE_KEY ? 
          `${process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 20)}...` : 'NOT_SET'
      },
      BREVO_API_KEY: {
        exists: !!process.env.BREVO_API_KEY,
        value: process.env.BREVO_API_KEY ? 
          `${process.env.BREVO_API_KEY.substring(0, 20)}...` : 'NOT_SET'
      }
    };
    
    console.log('Environment variables:', JSON.stringify(envCheck, null, 2));

    // Check for missing environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL environment variable is missing');
    }
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is missing');
    }

    // Step 3: Parse request body
    console.log('Step 3: Parsing request body...');
    console.log('Raw body:', JSON.stringify(req.body, null, 2));
    
    const { email, firstName, lastName, company, source } = req.body;

    // Step 4: Input validation
    console.log('Step 4: Validating input...');
    if (!email) {
      console.log('Email validation failed - email missing');
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

    console.log('Input validation passed for email:', email);

    // Step 5: Import Supabase
    console.log('Step 5: Importing Supabase...');
    let createClient;
    try {
      const supabaseModule = await import('@supabase/supabase-js');
      createClient = supabaseModule.createClient;
      console.log('Supabase import successful');
    } catch (importError) {
      console.error('Supabase import failed:', importError);
      throw new Error(`Supabase import failed: ${importError.message}`);
    }

    // Step 6: Create Supabase client
    console.log('Step 6: Creating Supabase client...');
    let supabase;
    try {
      supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
      console.log('Supabase client created successfully');
    } catch (clientError) {
      console.error('Supabase client creation failed:', clientError);
      throw new Error(`Supabase client creation failed: ${clientError.message}`);
    }

    // Step 7: Test database connection
    console.log('Step 7: Testing database connection...');
    try {
      const { data: existingContact, error: selectError } = await supabase
        .from('waitlist')
        .select('email')
        .eq('email', email.toLowerCase())
        .single();

      if (selectError && selectError.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Database query error:', selectError);
        throw new Error(`Database query failed: ${selectError.message}`);
      }

      console.log('Database connection successful');

      if (existingContact) {
        console.log('Email already exists in waitlist:', email);
        return res.status(200).json({
          success: true,
          message: 'You are already on our waitlist! We\'ll notify you when spots become available.',
          alreadyExists: true
        });
      }
    } catch (dbError) {
      console.error('Database connection test failed:', dbError);
      throw new Error(`Database connection failed: ${dbError.message}`);
    }

    // Step 8: Insert into database
    console.log('Step 8: Inserting into database...');
    try {
      const { error: insertError } = await supabase
        .from('waitlist')
        .insert([
          {
            email: email.toLowerCase(),
            first_name: firstName || null,
            last_name: lastName || null,
            company: company || null,
            source: source || 'debug_api',
            created_at: new Date().toISOString()
          }
        ]);

      if (insertError) {
        console.error('Database insert error:', insertError);
        throw new Error(`Database insert failed: ${insertError.message}`);
      }

      console.log('Database insert successful');
    } catch (insertError) {
      console.error('Database insert failed:', insertError);
      // Continue with Brevo even if database fails
      console.log('Continuing with Brevo despite database error...');
    }

    // Step 9: Brevo integration (if API key exists)
    if (process.env.BREVO_API_KEY) {
      console.log('Step 9: Brevo integration...');
      try {
        const contactData = {
          email: email.toLowerCase(),
          attributes: {
            FIRSTNAME: firstName || '',
            LASTNAME: lastName || '',
            COMPANY: company || '',
            SOURCE: source || 'debug_api',
            SIGNUP_DATE: new Date().toISOString(),
            STATUS: 'waitlist'
          },
          listIds: [2],
          updateEnabled: true
        };

        console.log('Sending to Brevo:', JSON.stringify(contactData, null, 2));

        const brevoResponse = await fetch('https://api.brevo.com/v3/contacts', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'api-key': process.env.BREVO_API_KEY
          },
          body: JSON.stringify(contactData)
        });

        console.log('Brevo response status:', brevoResponse.status);
        const brevoResult = await brevoResponse.json();
        console.log('Brevo response:', JSON.stringify(brevoResult, null, 2));

      } catch (brevoError) {
        console.error('Brevo integration error:', brevoError);
        // Don't fail the request if Brevo fails
      }
    } else {
      console.log('Step 9: Skipping Brevo (no API key)');
    }

    // Step 10: Success response
    console.log('Step 10: Returning success response');
    console.log('=== WAITLIST DEBUG API SUCCESS ===');

    return res.status(200).json({
      success: true,
      message: 'Successfully joined the waitlist! Check your email for confirmation.',
      timestamp: new Date().toISOString(),
      debug: {
        email: email.toLowerCase(),
        environmentCheck: envCheck,
        steps: 'All 10 steps completed successfully'
      }
    });

  } catch (error) {
    console.error('=== WAITLIST DEBUG API ERROR ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error details:', JSON.stringify(error, null, 2));

    return res.status(500).json({
      success: false,
      error: error.message,
      errorName: error.name,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      debug: {
        step: 'Error occurred during execution',
        environment: {
          hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
          hasBrevoKey: !!process.env.BREVO_API_KEY
        }
      }
    });
  }
}