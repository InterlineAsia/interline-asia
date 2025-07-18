// Admin CSV API Router
// Redirects admin/csv requests to the consolidated admin-tools.js endpoint

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Modify the request to include CSV-specific action
  if (!req.query) req.query = {};
  req.query.action = 'scan-for-new-csvs'; // Default action for CSV endpoint
  
  try {
    // Import the admin-tools handler
    const adminToolsHandler = require('../admin-tools').default;
    
    // Call the handler with the modified request and response
    return await adminToolsHandler(req, res);
  } catch (error) {
    console.error('Admin CSV router error:', error);
    return res.status(500).json({ 
      error: 'Admin CSV router error', 
      details: error.message 
    });
  }
}