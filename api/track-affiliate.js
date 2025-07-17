// API endpoint for affiliate click tracking
// Vercel Serverless Function

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, value, url, timestamp, page } = req.body;

    // Basic validation
    if (!name || !value || !url) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Log the affiliate click (you can extend this to save to database)
    console.log('📊 Affiliate Click Tracked:', {
      event: name,
      affiliate: value,
      url: url,
      page: page,
      timestamp: timestamp,
      userAgent: req.headers['user-agent'],
      ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      referer: req.headers.referer
    });

    // Optional: Save to database or external analytics service
    // await saveToDatabase(clickData);

    // Return success
    res.status(200).json({ 
      success: true, 
      message: 'Affiliate click tracked',
      event: name,
      affiliate: value
    });

  } catch (error) {
    console.error('Affiliate tracking error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}