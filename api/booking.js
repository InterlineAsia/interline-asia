// Interline Asia - Booking API Endpoints
// Handles cruise booking submissions and responses with resilient email delivery

const { sendEmailWithRetry } = require('../lib/email.js');

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
      
      // Generate booking reference
      const bookingReference = `IA${Date.now()}`;
      
      // Send email to reservations team (not to customer) with retry logic
      try {
        const emailData = {
          toEmail: 'reservations@interlinetravel.com.au',
          toName: 'Reservations Team',
          subject: `New Cruise Booking Request - ${bookingReference}`,
          htmlContent: `
            <h2>New Cruise Booking Request</h2>
            <p><strong>Booking Reference:</strong> ${bookingReference}</p>
            <p><strong>Customer Email:</strong> ${bookingData.email}</p>
            <p><strong>Cruise ID:</strong> ${bookingData.cruiseId}</p>
            <p><strong>Passenger Details:</strong></p>
            <ul>
              <li>Name: ${bookingData.firstName} ${bookingData.lastName}</li>
              <li>Phone: ${bookingData.phone}</li>
              <li>Date of Birth: ${bookingData.dateOfBirth}</li>
            </ul>
            <p><strong>Documents:</strong> ${bookingData.uploadedFiles ? 'Uploaded to Supabase' : 'None'}</p>
            <p><strong>Special Requests:</strong> ${bookingData.specialRequests || 'None'}</p>
            <p><strong>Submitted:</strong> ${new Date().toISOString()}</p>
            <hr>
            <p><em>Please respond using the secure web form, not by email.</em></p>
          `
        };
        
        // Send email with retry logic and failover
        await sendEmailWithRetry(emailData);
        console.log('Booking notification email sent successfully with retry system');
        
      } catch (emailError) {
        console.error('Email sending failed after all retry attempts:', emailError);
        // Continue with booking even if email fails completely
      }
      
      // Return success response
      res.status(200).json({
        success: true,
        bookingReference,
        message: 'Booking request received and is being processed. Our team will contact you within 24 hours.',
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