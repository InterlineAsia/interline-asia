// Debug Environment Variables - Check what's available in Vercel runtime
export default async function handler(req, res) {
  try {
    // Test basic functionality first
    const basicInfo = {
      success: true,
      message: "Debug API executing successfully",
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
      platform: process.platform
    };

    // Check environment variables
    const envCheck = {
      NEXT_PUBLIC_SUPABASE_URL: {
        exists: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        value: process.env.NEXT_PUBLIC_SUPABASE_URL ? 
          `${process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 20)}...` : 'NOT_SET'
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
      },
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      VERCEL_REGION: process.env.VERCEL_REGION
    };

    // Test import capabilities
    let importTest = {};
    try {
      // Test if we can import Supabase
      const { createClient } = require('@supabase/supabase-js');
      importTest.supabase = 'Import successful';
      
      // Test if we can create client (only if env vars exist)
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        );
        importTest.supabaseClient = 'Client creation successful';
      } else {
        importTest.supabaseClient = 'Missing environment variables';
      }
    } catch (error) {
      importTest.supabase = `Import failed: ${error.message}`;
    }

    return res.status(200).json({
      ...basicInfo,
      environment: envCheck,
      imports: importTest,
      runtime: {
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime()
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }
}