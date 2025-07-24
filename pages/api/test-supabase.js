// Test Supabase Connection - Isolated testing
export default async function handler(req, res) {
  try {
    console.log('Starting Supabase connection test...');
    
    // Check environment variables first
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL environment variable not set');
    }
    
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable not set');
    }

    console.log('Environment variables found, attempting import...');
    
    // Import Supabase
    const { createClient } = require('@supabase/supabase-js');
    console.log('Supabase import successful');

    // Create client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    console.log('Supabase client created');

    // Test simple query
    console.log('Testing database connection...');
    const { data, error } = await supabase
      .from('waitlist')
      .select('count(*)')
      .limit(1);

    if (error) {
      console.error('Supabase query error:', error);
      throw new Error(`Supabase query failed: ${error.message}`);
    }

    console.log('Database connection successful');

    return res.status(200).json({
      success: true,
      message: 'Supabase connection test successful',
      timestamp: new Date().toISOString(),
      connection: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 30) + '...',
        keyExists: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        queryResult: data
      }
    });

  } catch (error) {
    console.error('Supabase test error:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      environment: {
        hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
      }
    });
  }
}