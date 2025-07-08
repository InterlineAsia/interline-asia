import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Check for the user's JWT in the "Authorization" header
    const authHeader = req.headers.get('Authorization')!
    const { data: { user } } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''))
    if (!user) throw new Error("User not found")

    // 2. Check if the user is an admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.is_admin) {
      return new Response(JSON.stringify({ error: 'Permission denied. User is not an admin.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      })
    }

    // 3. Perform the requested admin action
    const { action, payload } = await req.json()

    switch (action) {
      case 'GET_ALL_USERS': {
        const { data: users, error } = await supabaseAdmin.from('profiles').select(`
          id,
          full_name,
          email,
          created_at,
          verification_status,
          uploads ( id, file_name, uploaded_at, upload_status )
        `).order('created_at', { ascending: false });

        if (error) throw error
        return new Response(JSON.stringify(users), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
      }

      case 'UPDATE_USER_STATUS': {
        const { userId, status, notes } = payload
        const { data, error } = await supabaseAdmin
          .from('profiles')
          .update({ verification_status: status, admin_notes: notes })
          .eq('id', userId)
          .select('email, full_name')
          .single()

        if (error) throw error

        // Trigger the email notification to the user
        await supabaseAdmin.functions.invoke('send-verification-email', {
          body: {
            userEmail: data.email,
            userName: data.full_name,
            status: status,
            notes: notes
          }
        })

        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
      }

      default:
        throw new Error('Invalid admin action')
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})