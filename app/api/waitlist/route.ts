// App Router API - Waitlist endpoint
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, firstName, lastName, company, source } = body;

    // Validate required fields
    if (!email) {
      return NextResponse.json({
        success: false,
        message: 'Email address is required'
      }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({
        success: false,
        message: 'Please enter a valid email address'
      }, { status: 400 });
    }

    // Check if email already exists in waitlist
    const { data: existingContact } = await supabase
      .from('waitlist')
      .select('email')
      .eq('email', email.toLowerCase())
      .single();

    if (existingContact) {
      return NextResponse.json({
        success: true,
        message: 'You are already on our waitlist! We\'ll notify you when spots become available.',
        alreadyExists: true
      });
    }

    // Store in Supabase waitlist table
    const { error: supabaseError } = await supabase
      .from('waitlist')
      .insert([
        {
          email: email.toLowerCase(),
          first_name: firstName || null,
          last_name: lastName || null,
          company: company || null,
          source: source || 'homepage_waitlist',
          created_at: new Date().toISOString()
        }
      ]);

    if (supabaseError) {
      console.error('Supabase error:', supabaseError);
      // Continue with Brevo even if Supabase fails
    }

    // Add contact to Brevo
    if (process.env.BREVO_API_KEY) {
      try {
        const contactData = {
          email: email.toLowerCase(),
          attributes: {
            FIRSTNAME: firstName || '',
            LASTNAME: lastName || '',
            COMPANY: company || '',
            SOURCE: source || 'homepage_waitlist',
            SIGNUP_DATE: new Date().toISOString(),
            STATUS: 'waitlist'
          },
          listIds: [14], // Interline Asia Waitlist - List ID in Brevo
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

        if (!brevoResponse.ok && brevoResponse.status !== 400) {
          console.error('Brevo API error:', await brevoResponse.text());
        }

        // Send welcome email
        await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'api-key': process.env.BREVO_API_KEY
          },
          body: JSON.stringify({
            to: [{ email: email.toLowerCase(), name: `${firstName} ${lastName}`.trim() || email }],
            templateId: 1, // Waitlist welcome template ID
            params: {
              FIRSTNAME: firstName || 'Travel Professional',
              COMPANY: company || ''
            },
            tags: ['waitlist', 'welcome']
          })
        });
      } catch (brevoError) {
        console.error('Brevo integration error:', brevoError);
        // Don't fail the request if Brevo fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully joined the waitlist! Check your email for confirmation.'
    });

  } catch (error) {
    console.error('Waitlist API error:', error);
    return NextResponse.json({
      success: false,
      message: 'An error occurred while joining the waitlist. Please try again.'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    success: false,
    message: 'Method not allowed'
  }, { status: 405 });
}