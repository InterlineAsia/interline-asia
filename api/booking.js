// Interline Asia - Booking API Endpoints
// Handles cruise booking submissions and responses

// POST /submit-booking - Handle booking form submissions
export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const bookingData = req.body;
      
      // Basic validation
      if (!bookingData.email || !bookingData.cruiseId) {
        return res.status(400).json({ 
          error: 'Missing required fields: email and cruiseId' 
        });
      }
      
      // Log booking attempt
      console.log('Booking submission received:', {
        email: bookingData.email,
        cruiseId: bookingData.cruiseId,
        timestamp: new Date().toISOString()
      });
      
      // Simulate processing (replace with actual booking logic)
      const bookingReference = `IA${Date.now()}`;
      
      // Return success response
      res.status(200).json({
        success: true,
        bookingReference,
        message: 'Booking request received and is being processed',
        status: 'pending'
      });
      
    } catch (error) {
      console.error('Booking submission error:', error);
      res.status(500).json({ 
        error: 'Internal server error during booking submission' 
      });
    }
  } 
  // GET /booking-response - Handle booking status queries
  else if (req.method === 'GET') {
    try {
      const { reference } = req.query;
      
      if (!reference) {
        return res.status(400).json({ 
          error: 'Missing booking reference' 
        });
      }
      
      // Simulate booking status lookup (replace with actual logic)
      const mockResponse = {
        reference,
        status: 'confirmed',
        cruiseLine: 'Sample Cruise Line',
        ship: 'Sample Ship',
        departureDate: '2024-06-15',
        message: 'Your booking has been confirmed'
      };
      
      res.status(200).json(mockResponse);
      
    } catch (error) {
      console.error('Booking response error:', error);
      res.status(500).json({ 
        error: 'Internal server error during booking lookup' 
      });
    }
  } else {
    res.setHeader('Allow', ['POST', 'GET']);
    res.status(405).json({ error: 'Method not allowed' });
  }
}