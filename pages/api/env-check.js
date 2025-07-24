// Simple Environment Variable Check - No external dependencies
export default function handler(req, res) {
  try {
    console.log('=== ENV CHECK API START ===');
    
    const envStatus = {
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
      platform: process.platform,
      environment: process.env.NODE_ENV,
      vercel: !!process.env.VERCEL,
      variables: {
        NEXT_PUBLIC_SUPABASE_URL: {
          exists: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          length: process.env.NEXT_PUBLIC_SUPABASE_URL?.length || 0,
          preview: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) || 'NOT_SET'
        },
        SUPABASE_SERVICE_ROLE_KEY: {
          exists: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
          length: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
          preview: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20) || 'NOT_SET'
        },
        BREVO_API_KEY: {
          exists: !!process.env.BREVO_API_KEY,
          length: process.env.BREVO_API_KEY?.length || 0,
          preview: process.env.BREVO_API_KEY?.substring(0, 20) || 'NOT_SET'
        }
      }
    };

    console.log('Environment check result:', JSON.stringify(envStatus, null, 2));

    return res.status(200).json({
      success: true,
      message: 'Environment check completed',
      ...envStatus
    });

  } catch (error) {
    console.error('Environment check error:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }
}