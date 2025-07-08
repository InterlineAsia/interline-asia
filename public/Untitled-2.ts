// supabase/functions/db-webhook-handler/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { sendAdminNewUserAlert, sendAdminDocumentAlert } from '../_shared/email.ts'

const WEBHOOK_SECRET = Deno.env.get('DB_WEBHOOK_SECRET')

serve(async (req) => {
  // 1. Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // 2. Verify the webhook secret
  const signature = req.headers.get('x-webhook-secret')
  if (!signature || signature !== WEBHOOK_SECRET) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 401,
    })
  }

  // 3. Process the webhook payload
  try {
    const payload = await req.json()
    console.log('Webhook received for table:', payload.table);

    // Create a Supabase admin client to fetch related data if needed
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    switch (payload.table) {
      case 'profiles':
        if (payload.type === 'INSERT') {
          console.log(`New user signed up: ${payload.record.full_name}`);
          await sendAdminNewUserAlert(payload.record);
        }
        break;

      case 'uploads':
        if (payload.type === 'INSERT') {
          console.log(`New document uploaded by user ID: ${payload.record.user_id}`);
          
          // Fetch the user's profile to get their name and email
          const { data: profile, error } = await supabaseAdmin
            .from('profiles')
            .select('full_name, email')
            .eq('id', payload.record.user_id)
            .single();

          if (error) throw new Error(`Failed to fetch profile for user ${payload.record.user_id}: ${error.message}`);

          // Enhance the payload with user details before sending the email
          const enhancedPayload = { ...payload.record, user_full_name: profile.full_name, user_email: profile.email };
          await sendAdminDocumentAlert(enhancedPayload);
        }
        break;
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Error processing webhook:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})