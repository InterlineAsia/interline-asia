// Supabase Edge Function: send-verified-alert
// Sends email notification when a user is verified

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY')

interface WebhookPayload {
  type: 'UPDATE'
  table: string
  record: {
    id: string
    full_name: string
    email: string
    verified: boolean
  }
  old_record: {
    verified: boolean
  }
}

interface BrevoEmailPayload {
  sender: {
    name: string
    email: string
  }
  to: Array<{
    email: string
    name: string
  }>
  subject: string
  htmlContent: string
}

async function sendBrevoEmail(payload: BrevoEmailPayload): Promise<boolean> {
  if (!BREVO_API_KEY) {
    console.error('BREVO_API_KEY not found in environment variables')
    return false
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Brevo API error:', response.status, errorText)
      return false
    }

    const result = await response.json()
    console.log('Email sent successfully:', result)
    return true
  } catch (error) {
    console.error('Failed to send email via Brevo:', error)
    return false
  }
}

serve(async (req) => {
  try {
    // Parse the webhook payload
    const payload: WebhookPayload = await req.json()
    
    console.log('Received webhook payload:', JSON.stringify(payload, null, 2))

    // Check if this is a verification status update to true
    if (
      payload.type === 'UPDATE' &&
      payload.table === 'profiles' &&
      payload.record.verified === true &&
      payload.old_record.verified !== true
    ) {
      console.log(`User verified: ${payload.record.full_name} (${payload.record.email})`)

      // Prepare email content
      const emailPayload: BrevoEmailPayload = {
        sender: {
          name: 'Interline Asia System',
          email: 'noreply@interlineasia.com'
        },
        to: [
          {
            email: 'admin@interlineasia.com',
            name: 'Admin'
          }
        ],
        subject: '✅ New User Verified - Interline Asia',
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #0070f3;">🎉 New User Verified</h2>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #333;">User Details:</h3>
              <p><strong>Full Name:</strong> ${payload.record.full_name}</p>
              <p><strong>Email:</strong> ${payload.record.email}</p>
              <p><strong>User ID:</strong> ${payload.record.id}</p>
              <p><strong>Status:</strong> <span style="color: #28a745; font-weight: bold;">VERIFIED</span></p>
            </div>
            
            <div style="background-color: #e3f2fd; padding: 15px; border-radius: 8px; border-left: 4px solid #0070f3;">
              <p style="margin: 0;"><strong>Action Required:</strong> The user now has access to verified member features and can proceed with bookings.</p>
            </div>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            
            <p style="color: #666; font-size: 14px;">
              This is an automated notification from the Interline Asia verification system.
              <br>
              Time: ${new Date().toISOString()}
            </p>
          </div>
        `
      }

      // Send the email
      const emailSent = await sendBrevoEmail(emailPayload)
      
      if (emailSent) {
        console.log('Admin notification email sent successfully')
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Admin notification sent',
            user: {
              name: payload.record.full_name,
              email: payload.record.email
            }
          }),
          { 
            headers: { 'Content-Type': 'application/json' },
            status: 200 
          }
        )
      } else {
        console.error('Failed to send admin notification email')
        // Don't return error - just log the failure
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: 'Email sending failed but webhook processed',
            user: {
              name: payload.record.full_name,
              email: payload.record.email
            }
          }),
          { 
            headers: { 'Content-Type': 'application/json' },
            status: 200 
          }
        )
      }
    } else {
      // Not a verification event we care about
      console.log('Webhook received but not a verification event, ignoring')
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Webhook received but not a verification event' 
        }),
        { 
          headers: { 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

  } catch (error) {
    console.error('Error processing webhook:', error)
    
    // Return success to avoid webhook retries, but log the error
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'Error processing webhook',
        error: error.message 
      }),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  }
})