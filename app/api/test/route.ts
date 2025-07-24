// Test API route for diagnosing Vercel deployment
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      status: "ok",
      message: "App Router API route working on Vercel",
      timestamp: new Date().toISOString(),
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        vercelRegion: process.env.VERCEL_REGION || 'unknown',
        hasEnvVars: {
          supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          supabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
          brevoKey: !!process.env.BREVO_API_KEY
        }
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    return NextResponse.json({
      success: true,
      status: "ok",
      message: "POST request received successfully",
      receivedData: body,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}