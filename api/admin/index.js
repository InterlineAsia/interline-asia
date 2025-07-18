// Admin API Router
// Redirects admin requests to the consolidated admin-tools.js endpoint

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Forward the request to admin-tools.js with appropriate parameters
  const { query, body, method } = req;
  
  try {
    // Import the admin-tools handler
    const adminToolsHandler = require('../admin-tools').default;
    
    // Call the handler with the request and response
    return await adminToolsHandler(req, res);
  } catch (error) {
    console.error('Admin router error:', error);
    return res.status(500).json({ 
      error: 'Admin router error', 
      details: error.message 
    });
  }
}