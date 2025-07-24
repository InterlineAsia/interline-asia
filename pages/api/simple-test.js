// Ultra-simple test API - No dependencies
export default async function handler(req, res) {
  try {
    // Test basic functionality without any imports
    return res.status(200).json({
      success: true,
      message: "Simple API working",
      timestamp: new Date().toISOString(),
      method: req.method,
      hasEnvVars: {
        supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        supabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        brevoKey: !!process.env.BREVO_API_KEY
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
}