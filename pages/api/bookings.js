// Consolidated Booking API - Handles all booking types
// Combines: booking.js + direct-booking.js
// Routes: /api/bookings?type=standard | /api/bookings?type=direct

const { createClient } = require('@supabase/supabase-js');
const formidable = require('formidable');
const fs = require('fs');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const config = {
  api: {
    bodyParser: false,
  },
};

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const bookingType = req.query.type || 'standard';

  try {
    if (bookingType === 'direct') {
      return await handleDirectBooking(req, res);
    } else {
      return await handleStandardBooking(req, res);
    }
  } catch (error) {
    console.error('Booking processing error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to process booking'
    });
  }
}

// Handle direct deal bookings (from direct-booking.js)
async function handleDirectBooking(req, res) {
  try {
    // Parse form data with file uploads
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB limit
      allowEmptyFiles: false,
      multiples: true
    });

    const [fields, files] = await form.parse(req);
    
    // Extract form data (handle both array and single values)
    const getValue = (field) => Array.isArray(field) ? field[0] : field;
    
    const bookingData = {
      dealId: getValue(fields.dealId) || getValue(fields.quoteId) || 'direct-booking',
      firstName1: getValue(fields.firstName1),
      middleName1: getValue(fields.middleName1),
      lastName1: getValue(fields.lastName1),
      dateOfBirth1: getValue(fields.dateOfBirth1),
      firstName2: getValue(fields.firstName2),
      middleName2: getValue(fields.middleName2),
      lastName2: getValue(fields.lastName2),
      dateOfBirth2: getValue(fields.dateOfBirth2),
      email1: getValue(fields.email1),
      phone1: getValue(fields.phone1),
      cabinType: getValue(fields.cabinType),
      specialRequests: getValue(fields.specialRequests) || ''
    };

    // Validate required fields
    const requiredFields = ['firstName1', 'lastName1', 'dateOfBirth1', 'firstName2', 'lastName2', 'dateOfBirth2', 'email1', 'phone1', 'cabinType'];
    for (const field of requiredFields) {
      if (!bookingData[field]) {
        return res.status(400).json({ error: `Missing required field: ${field}` });
      }
    }

    const { generateQuoteId } = require('../lib/quote-id-generator');
    const bookingId = generateQuoteId().replace('Q-', 'BK-'); // BK for Direct Booking

    // Process file uploads to Supabase Storage
    const uploadedFiles = [];
    for (const [fieldName, fileArray] of Object.entries(files)) {
      const fileList = Array.isArray(fileArray) ? fileArray : [fileArray];
      
      for (const file of fileList) {
        if (!file || file.size === 0) continue;
        
        try {
          const fileBuffer = fs.readFileSync(file.filepath);
          const fileName = `${bookingId}/${fieldName}_${Date.now()}_${file.originalFilename}`;
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('booking-documents')
            .upload(fileName, fileBuffer, {
              contentType: file.mimetype,
              upsert: false
            });

          if (uploadError) {
            console.error(`Upload error for ${fieldName}:`, uploadError);
            return res.status(500).json({ error: `Failed to upload ${fieldName}` });
          }

          uploadedFiles.push({
            fieldName,
            fileName: uploadData.path,
            originalName: file.originalFilename,
            size: file.size,
            type: file.mimetype
          });

        } catch (uploadError) {
          console.error(`File processing error for ${fieldName}:`, uploadError);
          return res.status(500).json({ error: `Failed to process ${fieldName}` });
        }
      }
    }

    // Insert booking into database
    const { data: insertData, error: insertError } = await supabase
      .from('direct_bookings')
      .insert({
        id: bookingId,
        deal_id: bookingData.dealId,
        guest_1_first_name: bookingData.firstName1,
        guest_1_middle_name: bookingData.middleName1,
        guest_1_last_name: bookingData.lastName1,
        guest_1_date_of_birth: bookingData.dateOfBirth1,
        guest_2_first_name: bookingData.firstName2,
        guest_2_middle_name: bookingData.middleName2,
        guest_2_last_name: bookingData.lastName2,
        guest_2_date_of_birth: bookingData.dateOfBirth2,
        primary_email: bookingData.email1,
        primary_phone: bookingData.phone1,
        cabin_type: bookingData.cabinType,
        special_requests: bookingData.specialRequests,
        uploaded_documents: uploadedFiles,
        booking_status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      return res.status(500).json({ error: 'Failed to create booking' });
    }

    // Send booking notification email
    const emailResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY
      },
      body: JSON.stringify({
        sender: {
          name: 'Interline Asia',
          email: 'noreply@interlineasia.com'
        },
        to: [
          { email: 'reservations@interlinetravel.com.au' }
        ],
        cc: [
          { email: 'admin@interlineasia.com' }
        ],
        subject: `New Direct Booking - ${bookingId}`,
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #0f172a;">New Direct Booking - ${bookingId}</h2>
            
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #1e293b; margin-top: 0;">Booking Details</h3>
              <p><strong>Booking ID:</strong> ${bookingId}</p>
              <p><strong>Deal ID:</strong> ${bookingData.dealId}</p>
              <p><strong>Cabin Type:</strong> ${bookingData.cabinType}</p>
              <p><strong>Booking Time:</strong> ${new Date().toLocaleString()}</p>
            </div>

            <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #1e293b; margin-top: 0;">Guest Information</h3>
              <p><strong>Guest 1:</strong> ${bookingData.firstName1} ${bookingData.lastName1}</p>
              <p><strong>Date of Birth:</strong> ${bookingData.dateOfBirth1}</p>
              <p><strong>Guest 2:</strong> ${bookingData.firstName2} ${bookingData.lastName2}</p>
              <p><strong>Date of Birth:</strong> ${bookingData.dateOfBirth2}</p>
              <p><strong>Email:</strong> ${bookingData.email1}</p>
              <p><strong>Phone:</strong> ${bookingData.phone1}</p>
            </div>

            ${uploadedFiles.length > 0 ? `
            <div style="background: #dcfce7; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #166534; margin-top: 0;">Uploaded Documents</h3>
              <ul>
                ${uploadedFiles.map(file => `<li>${file.originalName} (${file.fieldName})</li>`).join('')}
              </ul>
            </div>
            ` : ''}

            ${bookingData.specialRequests ? `
            <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #92400e; margin-top: 0;">Special Requests</h3>
              <p>${bookingData.specialRequests}</p>
            </div>
            ` : ''}
          </div>
        `
      })
    });

    if (!emailResponse.ok) {
      console.error('Email send failed:', await emailResponse.text());
      return res.status(500).json({ error: 'Failed to send booking email' });
    }

    res.status(200).json({
      success: true,
      message: 'Direct booking submitted successfully',
      bookingId: bookingId,
      uploadedFiles: uploadedFiles
    });

  } catch (error) {
    console.error('Direct booking processing error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to process direct booking'
    });
  }
}

// Handle standard bookings (from booking.js)
async function handleStandardBooking(req, res) {
  // Parse form data with file uploads
  const parseWithTimeout = (form, req, timeout = 25000) => {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('Form parsing timeout'));
      }, timeout);

      form.parse(req, (err, fields, files) => {
        clearTimeout(timer);
        if (err) reject(err);
        else resolve([fields, files]);
      });
    });
  };

  try {
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB limit
      allowEmptyFiles: false,
      multiples: true
    });

    const [fields, files] = await parseWithTimeout(form, req);
    
    // Extract booking data
    const bookingData = {
      quoteId: Array.isArray(fields.quoteId) ? fields.quoteId[0] : fields.quoteId,
      firstName: Array.isArray(fields.firstName) ? fields.firstName[0] : fields.firstName,
      middleName: Array.isArray(fields.middleName) ? fields.middleName[0] : fields.middleName,
      lastName: Array.isArray(fields.lastName) ? fields.lastName[0] : fields.lastName,
      dateOfBirth: Array.isArray(fields.dateOfBirth) ? fields.dateOfBirth[0] : fields.dateOfBirth,
      email: Array.isArray(fields.email) ? fields.email[0] : fields.email,
      phone: Array.isArray(fields.phone) ? fields.phone[0] : fields.phone,
      cabinType: Array.isArray(fields.cabinType) ? fields.cabinType[0] : fields.cabinType,
      specialRequests: Array.isArray(fields.specialRequests) ? fields.specialRequests[0] : fields.specialRequests
    };

    // Validate required fields
    const requiredFields = ['quoteId', 'firstName', 'lastName', 'dateOfBirth', 'email', 'phone', 'cabinType'];
    for (const field of requiredFields) {
      if (!bookingData[field]) {
        return res.status(400).json({ error: `Missing required field: ${field}` });
      }
    }

    // Check if quote exists
    const { data: quote, error: quoteError } = await supabase
      .from('quote_requests')
      .select(`
        *,
        cruises!inner(*)
      `)
      .eq('id', bookingData.quoteId)
      .single();

    if (quoteError || !quote) {
      console.warn('Quote not found, proceeding with booking anyway');
    }

    // Generate booking ID
    const { generateQuoteId } = require('../lib/quote-id-generator');
    const bookingId = generateQuoteId().replace('Q-', 'B-'); // B for Booking

    // Process file uploads
    const uploadedFiles = [];
    for (const [fieldName, fileArray] of Object.entries(files)) {
      const fileList = Array.isArray(fileArray) ? fileArray : [fileArray];
      
      for (const file of fileList) {
        if (!file || file.size === 0) continue;
        
        try {
          const fileBuffer = fs.readFileSync(file.filepath);
          const fileName = `${bookingId}/${fieldName}_${Date.now()}_${file.originalFilename}`;
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('booking-documents')
            .upload(fileName, fileBuffer, {
              contentType: file.mimetype,
              upsert: false
            });

          if (uploadError) {
            console.error(`Upload error for ${fieldName}:`, uploadError);
            return res.status(500).json({ error: `Failed to upload ${fieldName}` });
          }

          uploadedFiles.push({
            fieldName,
            fileName: uploadData.path,
            originalName: file.originalFilename,
            size: file.size,
            type: file.mimetype
          });

        } catch (uploadError) {
          console.error(`File processing error for ${fieldName}:`, uploadError);
          return res.status(500).json({ error: `Failed to process ${fieldName}` });
        }
      }
    }

    // Insert booking into database
    const { data: insertData, error: insertError } = await supabase
      .from('bookings')
      .insert({
        id: bookingId,
        quote_request_id: bookingData.quoteId,
        guest_first_name: bookingData.firstName,
        guest_middle_name: bookingData.middleName,
        guest_last_name: bookingData.lastName,
        guest_date_of_birth: bookingData.dateOfBirth,
        guest_email: bookingData.email,
        guest_phone: bookingData.phone,
        cabin_type: bookingData.cabinType,
        special_requests: bookingData.specialRequests,
        uploaded_documents: uploadedFiles,
        booking_status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      return res.status(500).json({ error: 'Failed to create booking' });
    }

    // Send booking notification email
    const cruise = quote?.cruises || {};
    const emailResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY
      },
      body: JSON.stringify({
        sender: {
          name: 'Interline Asia',
          email: 'noreply@interlineasia.com'
        },
        to: [
          { email: 'reservations@interlinetravel.com.au' }
        ],
        cc: [
          { email: 'admin@interlineasia.com' }
        ],
        subject: `New Booking - ${bookingId}`,
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #0f172a;">New Booking - ${bookingId}</h2>
            
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #1e293b; margin-top: 0;">Booking Details</h3>
              <p><strong>Booking ID:</strong> ${bookingId}</p>
              <p><strong>Quote ID:</strong> ${bookingData.quoteId}</p>
              <p><strong>Cabin Type:</strong> ${bookingData.cabinType}</p>
              <p><strong>Booking Time:</strong> ${new Date().toLocaleString()}</p>
            </div>

            <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #1e293b; margin-top: 0;">Guest Information</h3>
              <p><strong>Name:</strong> ${bookingData.firstName} ${bookingData.lastName}</p>
              <p><strong>Date of Birth:</strong> ${require('../lib/date-formatter').formatEmailDate(bookingData.dateOfBirth)}</p>
              <p><strong>Email:</strong> ${bookingData.email}</p>
              <p><strong>Phone:</strong> ${bookingData.phone}</p>
            </div>

            ${cruise.cruise_line ? `
            <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #1e293b; margin-top: 0;">Cruise Information</h3>
              <p><strong>Cruise Line:</strong> ${cruise.cruise_line}</p>
              <p><strong>Ship:</strong> ${cruise.ship_name}</p>
              <p><strong>Departure Date:</strong> ${require('../lib/date-formatter').formatEmailDate(cruise.departure_date)}</p>
              <p><strong>Duration:</strong> ${cruise.nights} nights</p>
            </div>
            ` : ''}

            ${uploadedFiles.length > 0 ? `
            <div style="background: #dcfce7; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #166534; margin-top: 0;">Uploaded Documents</h3>
              <ul>
                ${uploadedFiles.map(file => `<li>${file.originalName} (${file.fieldName})</li>`).join('')}
              </ul>
            </div>
            ` : ''}

            ${bookingData.specialRequests ? `
            <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #92400e; margin-top: 0;">Special Requests</h3>
              <p>${bookingData.specialRequests}</p>
            </div>
            ` : ''}
          </div>
        `
      })
    });

    if (!emailResponse.ok) {
      console.error('Email send failed:', await emailResponse.text());
      return res.status(500).json({ error: 'Failed to send booking email' });
    }

    res.status(200).json({
      success: true,
      message: 'Booking submitted successfully',
      bookingId: bookingId,
      uploadedFiles: uploadedFiles
    });

  } catch (error) {
    console.error('Standard booking processing error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to process standard booking'
    });
  }
}
export default handler;
export { config };