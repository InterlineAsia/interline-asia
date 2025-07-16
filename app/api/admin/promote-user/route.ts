import { NextRequest, NextResponse } from 'next/server';
import { promoteUserToVerified, isAdmin } from '../../../../utils/admin-utils';
import { createClient } from '@supabase/supabase-js';
import Sentry from '../../../../sentry.server';

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key'
);

export async function POST(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    // Extract the token and get the user
    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    // Check if the current user is an admin
    const userIsAdmin = await isAdmin(user.id);
    if (!userIsAdmin) {
      return NextResponse.json(
        { error: 'Access denied. Admin privileges required.' },
        { status: 403 }
      );
    }

    // Parse the request body
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required in request body' },
        { status: 400 }
      );
    }

    // Promote the user to verified status
    await promoteUserToVerified(userId);

    return NextResponse.json(
      { 
        success: true, 
        message: 'User successfully promoted to verified status',
        userId 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error promoting user:', error);
    Sentry.captureException(error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'Failed to promote user to verified status'
      },
      { status: 500 }
    );
  }
}