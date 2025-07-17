// Secure Quote Delivery API - Phase 1
// Sends completed quote to client (email from token) with CC to admin

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
    const { 
      quoteId, 
      token, 
      interiorPrice, 
      oceanviewPrice, 
      balconyPrice, 
      suitePrice, 
      notes,
      validUntil 
    } = req.body;

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
      return res.status(404).json({ error: 'Invalid or expired quote request' });
    }

    // Check if quote has expired
    if (new Date() > new Date(quoteRequest.expires_at)) {
      return res.status(400).json({ error: 'Quote request has expired' });
    }

    // Validate at least one price is provided
    const prices = { interiorPrice, oceanviewPrice, balconyPrice, suitePrice };
    const hasValidPrice = Object.values(prices).some(price => price && parseFloat(price) > 0);
    
    if (!hasValidPrice) {
      return res.status(400).json({ error: 'At least one cabin price must be provided' });
    }

    // Get client email from user record (SECURE - never exposed to Stephen's team)
    const clientEmail = quoteRequest.users.email;
    const clientName = `${quoteRequest.users.first_name} ${quoteRequest.users.last_name}`;
    const cruise = quoteRequest.cruises;

    // Format pricing display
    const formatPrice = (price) => price && parseFloat(price) > 0 ? `$${parseFloat(price).toLocaleString()}` : 'Not Available';
    
    const pricingHtml = `
      <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #1e293b; margin-top: 0;">Cabin Pricing</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
          <div>
            <p><strong>Interior Cabin:</strong> ${formatPrice(interiorPrice)}</p>
            <p><strong>Oceanview Cabin:</strong> ${formatPrice(oceanviewPrice)}</p>
          </div>
          <div>
            <p><strong>Balcony Cabin:</strong> ${formatPrice(balconyPrice)}</p>
            <p><strong>Suite:</strong> ${formatPrice(suitePrice)}</p>
          </div>
        </div>
        ${validUntil ? `<p style="color: #dc2626; font-weight: bold;">Valid Until: ${new Date(validUntil).toLocaleDateString()}</p>` : ''}
      </div>
    `;

    // Prepare quote email to client
    const bookingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/booking?id=${quoteId}`;
    
    const clientEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Your Cruise Quote</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Exclusive rates for travel professionals</p>
        </div>

        <div style="background: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <p style="color: #1e293b; font-size: 16px;">Dear ${clientName},</p>
          
          <p style="color: #475569; line-height: 1.6;">
            Thank you for your interest in this exclusive cruise experience. 
            We're pleased to provide you with the following pricing for your consideration.
          </p>

          <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1e293b; margin-top: 0;">Cruise Details</h3>
            <p><strong>Cruise Line:</strong> ${cruise.cruise_line}</p>
            <p><strong>Ship:</strong> ${cruise.ship_name}</p>
            <p><strong>Departure Date:</strong> ${new Date(cruise.departure_date).toLocaleDateString()}</p>
            <p><strong>Duration:</strong> ${cruise.nights} nights</p>
            <p><strong>Region:</strong> ${cruise.region}</p>
            <p><strong>Route:</strong> ${cruise.departure_port} → ${cruise.arrival_port}</p>
          </div>

          ${pricingHtml}

          ${notes ? `
            <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #92400e; margin-top: 0;">Additional Notes</h3>
              <p style="color: #78350f; line-height: 1.6;">${notes}</p>
            </div>
          ` : ''}

          <div style="text-align: center; margin: 30px 0;">
            <a href="${bookingUrl}" 
               style="background: linear-gradient(135deg, #059669, #047857); color: white; 
                      padding: 15px 30px; text-decoration: none; border-radius: 8px; 
                      font-weight: bold; font-size: 16px; display: inline-block;">
              Book This Cruise Now
            </a>
          </div>

          <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h4 style="color: #1e293b; margin-top: 0;">Important Information</h4>
            <ul style="color: #475569; line-height: 1.6; margin: 0; padding-left: 20px;">
              <li>Prices are per person and subject to availability</li>
              <li>Additional taxes and fees may apply</li>
              <li>Travel insurance is recommended</li>
              <li>Industry verification required for booking</li>
            </ul>
          </div>

          <p style="color: #64748b; font-size: 14px; line-height: 1.6;">
            If you have any questions about this quote or need assistance with your booking, 
            please don't hesitate to contact us at admin@interlineasia.com.
          </p>

          <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px; text-align: center;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
              Interline Asia - Exclusive Cruise Experiences for Travel Professionals<br>
              This quote was generated securely and is valid for the specified period.
            </p>
          </div>
        </div>
      </div>
    `;

    // Send email to client with CC to admin
    const emailResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY
      },
      body: JSON.stringify({
        sender: {
          name: 'Interline Asia',
          email: 'quotes@interlineasia.com'
        },
        to: [{ email: clientEmail, name: clientName }],
        cc: [{ email: 'admin@interlineasia.com' }],
        subject: `Your Cruise Quote - ${cruise.ship_name} (${cruise.cruise_line})`,
        htmlContent: clientEmailHtml
      })
    });

    if (!emailResponse.ok) {
      console.error('Email send failed:', await emailResponse.text());
      return res.status(500).json({ error: 'Failed to send quote email' });
    }

    // Update quote request status
    const { error: updateError } = await supabase
      .from('quote_requests')
      .update({
        status: 'completed',
        interior_price: interiorPrice || null,
        oceanview_price: oceanviewPrice || null,
        balcony_price: balconyPrice || null,
        suite_price: suitePrice || null,
        notes: notes || null,
        valid_until: validUntil || null,
        completed_at: new Date().toISOString()
      })
      .eq('id', quoteId);

    if (updateError) {
      console.error('Database update error:', updateError);
    }

    res.status(200).json({
      success: true,
      message: 'Quote sent successfully to client'
    });

  } catch (error) {
    console.error('Send quote error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}