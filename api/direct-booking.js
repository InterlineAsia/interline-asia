// Direct Deal Booking API - Simplified for deal-based bookings
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
      cabinPrice: getValue(fields.cabinPrice),
      cruiseLine: getValue(fields.cruiseLine),
      shipName: getValue(fields.shipName),
      totalAmount: getValue(fields.totalAmount),
      specialRequests: getValue(fields.specialRequests)
    };

    // Validate required fields
    const requiredFields = ['firstName1', 'lastName1', 'dateOfBirth1', 'firstName2', 'lastName2', 'dateOfBirth2', 'email1', 'phone1', 'cabinType'];
    for (const field of requiredFields) {
      if (!bookingData[field]) {
        return res.status(400).json({ error: `Missing required field: ${field}` });
      }
    }

    const bookingId = `BK-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // Process file uploads to Supabase Storage
    const uploadedFiles = [];
    const fileMapping = {
      'passport1': 'passport_guest1',
      'passport2': 'passport_guest2', 
      'employment_proof': 'employment_proof'
    };
    
    for (const [fileKey, fileType] of Object.entries(fileMapping)) {
      if (files[fileKey]) {
        const file = Array.isArray(files[fileKey]) ? files[fileKey][0] : files[fileKey];
        
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
    const hasPassports = uploadedFiles.some(f => f.type === 'passport_guest1') && 
                        uploadedFiles.some(f => f.type === 'passport_guest2');
    const hasEmploymentProof = uploadedFiles.some(f => f.type === 'employment_proof');
    
    if (!hasPassports || !hasEmploymentProof) {
      return res.status(400).json({ 
        error: 'Passport copies for both guests and employment proof are required' 
      });
    }

    // Store booking in database (create table if needed)
    const { error: insertError } = await supabase
      .from('direct_bookings')
      .insert({
        id: bookingId,
        deal_id: bookingData.dealId,
        guest1_first_name: bookingData.firstName1,
        guest1_middle_name: bookingData.middleName1 || null,
        guest1_last_name: bookingData.lastName1,
        guest1_date_of_birth: bookingData.dateOfBirth1,
        guest2_first_name: bookingData.firstName2,
        guest2_middle_name: bookingData.middleName2 || null,
        guest2_last_name: bookingData.lastName2,
        guest2_date_of_birth: bookingData.dateOfBirth2,
        email: bookingData.email1,
        phone: bookingData.phone1,
        cabin_type: bookingData.cabinType,
        cabin_price: bookingData.cabinPrice,
        total_amount: bookingData.totalAmount,
        cruise_line: bookingData.cruiseLine,
        ship_name: bookingData.shipName,
        special_requests: bookingData.specialRequests || null,
        uploaded_documents: uploadedFiles,
        status: 'pending',
        created_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('Database insert error:', insertError);
      // If table doesn't exist, we'll still continue and send email
      console.log('Continuing without database storage...');
    }

    // Prepare booking email
    const guest1Name = `${bookingData.firstName1} ${bookingData.middleName1 ? bookingData.middleName1 + ' ' : ''}${bookingData.lastName1}`;
    const guest2Name = `${bookingData.firstName2} ${bookingData.middleName2 ? bookingData.middleName2 + ' ' : ''}${bookingData.lastName2}`;
    
    const bookingEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">New Direct Booking Received</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Booking ID: ${bookingId}</p>
        </div>

        <div style="background: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          
          <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1e293b; margin-top: 0;">Guest 1 Information</h3>
            <p><strong>Full Name:</strong> ${guest1Name}</p>
            <p><strong>Date of Birth:</strong> ${new Date(bookingData.dateOfBirth1).toLocaleDateString()}</p>
            <p><strong>Email:</strong> ${bookingData.email1}</p>
            <p><strong>Phone:</strong> ${bookingData.phone1}</p>
          </div>

          <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1e293b; margin-top: 0;">Guest 2 Information</h3>
            <p><strong>Full Name:</strong> ${guest2Name}</p>
            <p><strong>Date of Birth:</strong> ${new Date(bookingData.dateOfBirth2).toLocaleDateString()}</p>
          </div>

          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1e293b; margin-top: 0;">Booking Details</h3>
            <p><strong>Deal ID:</strong> ${bookingData.dealId}</p>
            <p><strong>Cruise Line:</strong> ${bookingData.cruiseLine || 'TBA'}</p>
            <p><strong>Ship:</strong> ${bookingData.shipName || 'TBA'}</p>
            <p><strong>Cabin Type:</strong> ${bookingData.cabinType}</p>
            <p><strong>Cabin Price:</strong> ${bookingData.cabinPrice}</p>
            <p><strong>Total Amount:</strong> ${bookingData.totalAmount}</p>
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
                <li>${file.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${file.originalName} (${Math.round(file.size / 1024)}KB)</li>
              `).join('')}
            </ul>
          </div>

          <div style="background: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #dc2626; margin-top: 0;">Next Steps</h3>
            <ol style="color: #991b1b; line-height: 1.6; margin: 0; padding-left: 20px;">
              <li>Review passenger information and documents</li>
              <li>Verify employment/retirement status</li>
              <li>Process booking with cruise line</li>
              <li>Send confirmation to passengers</li>
            </ol>
          </div>
        </div>
      </div>
    `;

    // Send booking email
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
        subject: `New Direct Booking - ${guest1Name} & ${guest2Name} - ${bookingData.shipName || 'Cruise'}`,
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
          <p style="color: #1e293b; font-size: 16px;">Dear ${bookingData.firstName1},</p>
          
          <p style="color: #475569; line-height: 1.6;">
            Your booking for ${guest1Name} and ${guest2Name} has been successfully submitted and is now being processed by our reservations team.
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
        to: [{ email: bookingData.email1, name: guest1Name }],
        subject: `Booking Confirmation - ${bookingData.shipName || 'Your Cruise'}`,
        htmlContent: clientConfirmationHtml
      })
    });

    res.status(200).json({
      success: true,
      message: 'Booking submitted successfully',
      bookingId: bookingId
    });

  } catch (error) {
    console.error('Direct booking processing error:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}