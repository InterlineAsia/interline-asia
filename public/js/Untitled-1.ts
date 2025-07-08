import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY')

async function sendEmail(to, subject, htmlContent) {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api-key': BREVO_API_KEY },
    body: JSON.stringify({
      sender: { name: 'Interline Asia Support', email: 'noreply@interlineasia.com' },
      to: [{ email: to }],
      subject,
      htmlContent,
    }),
  })
  return res.ok
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userEmail, userName, status, notes } = await req.json()
    let subject = ''
    let content = ''

    if (status === 'verified') {
      subject = '✅ Your Interline Asia Account is Verified!'
      content = `<h2>Congratulations, ${userName}!</h2><p>Your verification documents have been reviewed and your account has been <strong>approved</strong>.</p><p>You now have full access to exclusive interline rates and VIP cruise deals. Welcome aboard!</p>`
    } else if (status === 'rejected') {
      subject = '⚠️ Action Required for Your Interline Asia Account'
      content = `<h2>Update on Your Interline Asia Verification</h2><p>Hi ${userName},</p><p>Our team has reviewed your verification documents, but unfortunately, we were unable to approve your account at this time.</p>${notes ? `<p><strong>Admin Notes:</strong> <em>${notes}</em></p>` : ''}<p>Please log in to your dashboard to upload new documents or contact our support team for assistance.</p>`
    } else {
      throw new Error('Invalid status for email notification.')
    }

    await sendEmail(userEmail, subject, content)

    return new Response(JSON.stringify({ message: 'Email sent successfully.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})