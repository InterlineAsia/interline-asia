// Debug Environment Variables
export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const envVars = {
      GEMINI_API_KEY: process.env.GEMINI_API_KEY ? 'SET' : 'MISSING',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING',
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING',
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV
    };

    return res.status(200).json({
      status: 'debug',
      environment: envVars,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}