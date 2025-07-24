// Enhanced Waitlist API - Environment Variable Diagnostics
import { NextApiRequest, NextApiResponse } from 'next';

interface EnvironmentStatus {
  NEXT_PUBLIC_SUPABASE_URL: 'PRESENT' | 'MISSING';
  SUPABASE_SERVICE_ROLE_KEY: 'PRESENT' | 'MISSING';
  BREVO_API_KEY: 'PRESENT' | 'MISSING';
}

interface ErrorResponse {
  success: false;
  error: string;
  details: string[];
  environmentStatus: EnvironmentStatus;
  timestamp: string;
}

interface SuccessResponse {
  success: true;
  message: string;
  environmentStatus: EnvironmentStatus;
  timestamp: string;
}

type ApiResponse = ErrorResponse | SuccessResponse;

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  console.log('=== ENHANCED WAITLIST API - ENVIRONMENT DIAGNOSTICS ===');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Method:', req.method);
  console.log('User-Agent:', req.headers['user-agent']);

  try {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle OPTIONS request
    if (req.method === 'OPTIONS') {
      console.log('OPTIONS request handled');
      return res.status(200).end();
    }

    // Check environment variables
    console.log('Checking environment variables...');
    
    const envStatus: EnvironmentStatus = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'PRESENT' : 'MISSING',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'PRESENT' : 'MISSING',
      BREVO_API_KEY: process.env.BREVO_API_KEY ? 'PRESENT' : 'MISSING'
    };

    // Log environment status (with partial values for security)
    console.log('Environment Status:', {
      NEXT_PUBLIC_SUPABASE_URL: {
        status: envStatus.NEXT_PUBLIC_SUPABASE_URL,
        preview: process.env.NEXT_PUBLIC_SUPABASE_URL ? 
          `${process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 30)}...` : 'NOT_SET'
      },
      SUPABASE_SERVICE_ROLE_KEY: {
        status: envStatus.SUPABASE_SERVICE_ROLE_KEY,
        preview: process.env.SUPABASE_SERVICE_ROLE_KEY ? 
          `${process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 20)}...` : 'NOT_SET'
      },
      BREVO_API_KEY: {
        status: envStatus.BREVO_API_KEY,
        preview: process.env.BREVO_API_KEY ? 
          `${process.env.BREVO_API_KEY.substring(0, 20)}...` : 'NOT_SET'
      }
    });

    // Check for missing variables
    const missingVars: string[] = [];
    
    if (envStatus.NEXT_PUBLIC_SUPABASE_URL === 'MISSING') {
      missingVars.push('NEXT_PUBLIC_SUPABASE_URL is missing');
    }
    
    if (envStatus.SUPABASE_SERVICE_ROLE_KEY === 'MISSING') {
      missingVars.push('SUPABASE_SERVICE_ROLE_KEY is missing');
    }
    
    if (envStatus.BREVO_API_KEY === 'MISSING') {
      missingVars.push('BREVO_API_KEY is missing');
    }

    const timestamp = new Date().toISOString();

    // Return error if any variables are missing
    if (missingVars.length > 0) {
      console.error('Missing environment variables:', missingVars);
      
      const errorResponse: ErrorResponse = {
        success: false,
        error: 'Environment configuration error',
        details: missingVars,
        environmentStatus: envStatus,
        timestamp
      };

      return res.status(500).json(errorResponse);
    }

    // All variables are present
    console.log('All required environment variables are present');
    
    const successResponse: SuccessResponse = {
      success: true,
      message: 'All required environment variables are present.',
      environmentStatus: envStatus,
      timestamp
    };

    return res.status(200).json(successResponse);

  } catch (error) {
    console.error('=== ENHANCED WAITLIST API ERROR ===');
    console.error('Error:', error);

    const errorResponse: ErrorResponse = {
      success: false,
      error: 'Unexpected error occurred',
      details: [error instanceof Error ? error.message : 'Unknown error'],
      environmentStatus: {
        NEXT_PUBLIC_SUPABASE_URL: 'MISSING',
        SUPABASE_SERVICE_ROLE_KEY: 'MISSING',
        BREVO_API_KEY: 'MISSING'
      },
      timestamp: new Date().toISOString()
    };

    return res.status(500).json(errorResponse);
  }
}