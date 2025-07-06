// Vercel Serverless Function for Newsletter Signup with Brevo
// File: /api/newsletter-signup.js

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Get Brevo API key from environment variables
    const BREVO_API_KEY = process.env.BREVO_API_KEY;
    if (!BREVO_API_KEY) {
      console.error('BREVO_API_KEY not found in environment variables');
      return res.status(500).json({ error: 'Email service not configured' });
    }

    // Add contact to Brevo
    const brevoResponse = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY
      },
      body: JSON.stringify({
        email: email.toLowerCase().trim(),
        attributes: {
          FIRSTNAME: '', // Will be empty for newsletter signups
          LASTNAME: '',
          SOURCE: 'Homepage Newsletter'
        },
        listIds: [1], // Default list ID - update this with your actual list ID
        updateEnabled: true // Update if contact already exists
      })
    });

    const brevoData = await brevoResponse.json();

    if (!brevoResponse.ok) {
      // Handle specific Brevo errors
      if (brevoResponse.status === 400 && brevoData.code === 'duplicate_parameter') {
        // Contact already exists - this is fine
        console.log('Contact already exists in Brevo:', email);
      } else {
        console.error('Brevo API error:', brevoData);
        return res.status(500).json({ 
          error: 'Failed to subscribe to newsletter',
          details: brevoData.message || 'Unknown error'
        });
      }
    }

    console.log('Newsletter signup successful:', email);

    return res.status(200).json({
      success: true,
      message: 'Successfully subscribed to newsletter',
      email: email
    });

  } catch (error) {
    console.error('Newsletter signup error:', error);
    return res.status(500).json({ 
      error: 'Failed to process newsletter signup',
      details: error.message 
    });
  }
}