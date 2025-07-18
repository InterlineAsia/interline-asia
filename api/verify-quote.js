// Verify Quote Request API - Phase 1
// Verifies quote token and returns quote details for the quote form

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { quoteId, token } = req.body;

    // Validate required fields
    if (!quoteId || !token) {
      return res.status(400).json({ error: 'Missing quote ID or token' });
    }

    // Verify quote request exists and token is valid
    const { data: quoteRequest, error: quoteError } = await supabase
      .from('quote_requests')
      .select(`
        *,
        users!inner(email, first_name, last_name),
        cruises!inner(*)
      `)
      .eq('id', quoteId)
      .eq('token', token)
      .eq('status', 'pending')
      .single();

    if (quoteError || !quoteRequest) {
      console.error('Quote verification error:', quoteError);
      return res.status(404).json({ error: 'Invalid or expired quote request' });
    }

    // Check if quote has expired
    if (new Date() > new Date(quoteRequest.expires_at)) {
      return res.status(400).json({ error: 'Quote request has expired' });
    }

    // Return quote details (without sensitive user info)
    res.status(200).json({
      success: true,
      quote: {
        id: quoteRequest.id,
        client_name: quoteRequest.client_name,
        created_at: quoteRequest.created_at,
        expires_at: quoteRequest.expires_at
      },
      cruise: quoteRequest.cruises
    });

  } catch (error) {
    console.error('Quote verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}