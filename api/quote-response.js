// Quote Response Handler - Secure quote response form backend
// Handles Stephen's quote responses via secure links

const { isValidQuoteId } = require('../lib/quote-id-generator');
const { formatEmailDate } = require('../lib/date-formatter');

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // Serve quote response form
    const { id } = req.query;
    
    if (!id || !isValidQuoteId(id)) {
      return res.status(400).json({ error: 'Invalid quote ID' });
    }
    
    // Return basic quote info for form (implement later when UI is ready)
    return res.status(200).json({ 
      quoteId: id,
      status: 'pending',
      message: 'Quote response form ready'
    });
  }
  
  if (req.method === 'POST') {
    // Handle quote response submission
    try {
      const { quoteId, pricing, notes, validUntil } = req.body;
      
      if (!quoteId || !isValidQuoteId(quoteId)) {
        return res.status(400).json({ error: 'Invalid quote ID' });
      }
      
      // Log the response (database integration can be added later)
      console.log('QUOTE RESPONSE:', {
        quoteId,
        pricing,
        notes,
        validUntil,
        timestamp: new Date().toISOString()
      });
      
      // TODO: Store in database and send client email
      // For now, just acknowledge receipt
      
      return res.status(200).json({
        success: true,
        message: 'Quote response received',
        quoteId
      });
      
    } catch (error) {
      console.error('Quote response error:', error);
      return res.status(500).json({ error: 'Failed to process quote response' });
    }
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}