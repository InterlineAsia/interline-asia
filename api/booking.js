// Secure Booking Processing API - Phase 1
// Processes booking with file uploads to Supabase (NO files in email)

import { createClient } from '@supabase/supabase-js';
import formidable from 'formidable';
import fs from 'fs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse form data with file uploads
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB limit
      allowEmptyFiles: false,
      multiples: true
    });

    const [fields, files] = await form.parse(req);
    
    // Extract form data
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

    // Verify quote exists and is valid
    const { data: quoteRequest, error: quoteError } = await supabase
      .from('quote_requests')
      .select(`
        *,
        cruises!inner(*)
      `)
      .eq('id', bookingData.quoteId)
      .eq('status', 'completed')
      .single();

    if (quoteError || !quoteRequest) {
      return res.status(404).json({ error: 'Invalid quote request' });
    }

    const cruise = quoteRequest.cruises;
    const bookingId = `booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Process file uploads to Supabase Storage
    const uploadedFiles = [];
    const fileTypes = ['passport', 'employment_proof'];
    
    for (const fileType of fileTypes) {
      if (files[fileType]) {
        const file = Array.isArray(files[fileType]) ? files[fileType][0] : files[fileType];
        
        try {
          // Read file content
          const fileContent = fs.readFileSync(file.filepath);
          const fileName = `${bookingId}_${fileType}_${file.originalFilename}`;
          
          // Upload to Supabase Storage
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('booking-documents')
            .upload(fileName, fileContent, {
              contentType: file.mimetype,
              upsert: false
            });

          if (uploadError) {
            console.error(`Upload error for ${fileType}:`, uploadError);
            return res.status(500).json({ error: `Failed to upload ${fileType}` });
          }

          uploadedFiles.push({
            type: fileType,
            filename: fileName,
            originalName: file.originalFilename,
            size: file.size,
            mimetype: file.mimetype,
            path: uploadData.path
          });

          // Clean up temp file
          fs.unlinkSync(file.filepath);

        } catch (uploadError) {
          console.error(`File processing error for ${fileType}:`, uploadError);
          return res.status(500).json({ error: `Failed to process ${fileType}` });
        }
      }
    }

    // Validate required documents
    const hasPassport = uploadedFiles.some(f => f.type === 'passport');
    const hasEmploymentProof = uploadedFiles.some(f => f.type === 'employment_proof');
    
    if (!hasPassport || !hasEmploymentProof) {
      return res.status(400).json({ 
        error: 'Both passport and employment proof documents are required' 
      });
    }

    // Store booking in database
    const { error: insertError } = await supabase
      .from('bookings')
      .insert({
        id: bookingId,
        quote_request_id: bookingData.quoteId,
        first_name: bookingData.firstName,
        middle_name: bookingData.middleName || null,
        last_name: bookingData.lastName,
        date_of_birth: bookingData.dateOfBirth,
        email: bookingData.email,
        phone: bookingData.phone,
        cabin_type: bookingData.cabinType,
        special_requests: bookingData.specialRequests || null,
        uploaded_documents: uploadedFiles,
        status: 'pending',
        created_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('Database insert error:', insertError);
      return res.status(500).json({ error: 'Failed to create booking' });
    }

    // Prepare booking email (NO FILE ATTACHMENTS - files are in Supabase)
    const fullName = `${bookingData.firstName} ${bookingData.middleName ? bookingData.middleName + ' ' : ''}${bookingData.lastName}`;
    
    const bookingEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">New Booking Received</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Booking ID: ${bookingId}</p>
        </div>

        <div style="background: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          
          <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1e293b; margin-top: 0;">Passenger Information</h3>
            <p><strong>Full Name:</strong> ${fullName}</p>
            <p><strong>Date of Birth:</strong> ${new Date(bookingData.dateOfBirth).toLocaleDateString()}</p>
            <p><strong>Email:</strong> ${bookingData.email}</p>
            <p><strong>Phone:</strong> ${bookingData.phone}</p>
            <p><strong>Cabin Type:</strong> ${bookingData.cabinType}</p>
          </div>

          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1e293b; margin-top: 0;">Cruise Details</h3>
            <p><strong>Cruise Line:</strong> ${cruise.cruise_line}</p>
            <p><strong>Ship:</strong> ${cruise.ship_name}</p>
            <p><strong>Departure Date:</strong> ${new Date(cruise.departure_date).toLocaleDateString()}</p>
            <p><strong>Duration:</strong> ${cruise.nights} nights</p>
            <p><strong>Region:</strong> ${cruise.region}</p>
            <p><strong>Route:</strong> ${cruise.departure_port} → ${cruise.arrival_port}</p>
          </div>

          ${bookingData.specialRequests ? `
            <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #92400e; margin-top: 0;">Special Requests</h3>
              <p style="color: #78350f; line-height: 1.6;">${bookingData.specialRequests}</p>
            </div>
          ` : ''}

          <div style="background: #dcfce7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #166534; margin-top: 0;">Uploaded Documents</h3>
            <p style="color: #15803d; margin-bottom: 10px;">
              <strong>Documents have been securely uploaded to Supabase Storage:</strong>
            </p>
            <ul style="color: #15803d; margin: 0; padding-left: 20px;">
              ${uploadedFiles.map(file => `
                <li>${file.type === 'passport' ? 'Passport' : 'Employment Proof'}: ${file.originalName} (${Math.round(file.size / 1024)}KB)</li>
              `).join('')}
            </ul>
            <p style="color: #15803d; font-size: 14px; margin-top: 15px;">
              <strong>Access documents via:</strong> Supabase Admin Panel → Storage → booking-documents
            </p>
          </div>

          <div style="background: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #dc2626; margin-top: 0;">Next Steps</h3>
            <ol style="color: #991b1b; line-height: 1.6; margin: 0; padding-left: 20px;">
              <li>Review passenger information and documents</li>
              <li>Verify employment/retirement status</li>
              <li>Process booking with cruise line</li>
              <li>Send confirmation to passenger</li>
            </ol>
          </div>

          <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px;">
            <p style="color: #64748b; font-size: 12px; margin: 0;">
              This booking was submitted through Interline Asia's secure booking system.<br>
              All documents are stored securely in Supabase and are not attached to this email for security reasons.
            </p>
          </div>
        </div>
      </div>
    `;

    // Send booking email (NO FILE ATTACHMENTS)
    const emailResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY
      },
      body: JSON.stringify({
        sender: {
          name: 'Interline Asia Bookings',
          email: 'bookings@interlineasia.com'
        },
        to: [{ email: 'reservations@interlinetravel.com.au' }],
        cc: [{ email: 'admin@interlineasia.com' }],
        subject: `New Booking - ${fullName} - ${cruise.ship_name}`,
        htmlContent: bookingEmailHtml
      })
    });

    if (!emailResponse.ok) {
      console.error('Email send failed:', await emailResponse.text());
      return res.status(500).json({ error: 'Failed to send booking email' });
    }

    // Send confirmation email to client
    const clientConfirmationHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Booking Confirmed!</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Thank you for choosing Interline Asia</p>
        </div>

        <div style="background: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <p style="color: #1e293b; font-size: 16px;">Dear ${bookingData.firstName},</p>
          
          <p style="color: #475569; line-height: 1.6;">
            Your booking has been successfully submitted and is now being processed by our reservations team.
            You will receive a confirmation email within 24-48 hours with your booking details and next steps.
          </p>

          <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <h3 style="color: #1e293b; margin-top: 0;">Booking Reference</h3>
            <p style="font-size: 24px; font-weight: bold; color: #059669; margin: 10px 0;">${bookingId}</p>
            <p style="color: #64748b; font-size: 14px; margin: 0;">Please keep this reference for your records</p>
          </div>

          <div style="background: #dcfce7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #166534; margin-top: 0;">What Happens Next?</h3>
            <ol style="color: #15803d; line-height: 1.6; margin: 0; padding-left: 20px;">
              <li>Our team will review your booking and documents</li>
              <li>We'll process your reservation with the cruise line</li>
              <li>You'll receive detailed confirmation and payment instructions</li>
              <li>Final documents will be sent closer to departure</li>
            </ol>
          </div>

          <p style="color: #64748b; font-size: 14px; line-height: 1.6;">
            If you have any questions about your booking, please contact us at admin@interlineasia.com 
            and include your booking reference number.
          </p>
        </div>
      </div>
    `;

    await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY
      },
      body: JSON.stringify({
        sender: {
          name: 'Interline Asia',
          email: 'bookings@interlineasia.com'
        },
        to: [{ email: bookingData.email, name: fullName }],
        subject: `Booking Confirmation - ${cruise.ship_name}`,
        htmlContent: clientConfirmationHtml
      })
    });

    res.status(200).json({
      success: true,
      message: 'Booking submitted successfully',
      bookingId: bookingId
    });

  } catch (error) {
    console.error('Booking processing error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}