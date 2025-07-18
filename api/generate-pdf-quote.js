// PDF Quote Generator API - Phase 2
// Generates branded PDF quotes using Puppeteer

import puppeteer from 'puppeteer';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let browser;
  
  try {
    const { quoteId } = req.body;

    if (!quoteId) {
      return res.status(400).json({ error: 'Quote ID is required' });
    }

    // Get quote details
    const { data: quoteRequest, error: quoteError } = await supabase
      .from('quote_requests')
      .select(`
        *,
        users!inner(email, first_name, last_name),
        cruises!inner(*)
      `)
      .eq('id', quoteId)
      .eq('status', 'completed')
      .single();

    if (quoteError || !quoteRequest) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    const cruise = quoteRequest.cruises;
    const client = quoteRequest.users;

    // Generate PDF HTML template
    const pdfHtml = generatePDFTemplate(quoteRequest, cruise, client);

    // Launch Puppeteer
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    // Set content and generate PDF
    await page.setContent(pdfHtml, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      }
    });

    await browser.close();

    // Upload PDF to Supabase Storage
    const fileName = `quote_${quoteId}_${Date.now()}.pdf`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('quote-pdfs')
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: false
      });

    if (uploadError) {
      console.error('PDF upload error:', uploadError);
      return res.status(500).json({ error: 'Failed to save PDF' });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('quote-pdfs')
      .getPublicUrl(fileName);

    // Update quote request with PDF info
    await supabase
      .from('quote_requests')
      .update({
        pdf_generated: true,
        pdf_filename: fileName,
        pdf_url: urlData.publicUrl
      })
      .eq('id', quoteId);

    res.status(200).json({
      success: true,
      pdfUrl: urlData.publicUrl,
      filename: fileName
    });

  } catch (error) {
    console.error('PDF generation error:', error);
    
    if (browser) {
      await browser.close();
    }
    
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
}

function generatePDFTemplate(quoteRequest, cruise, client) {
  const formatPrice = (price) => price && parseFloat(price) > 0 ? `$${parseFloat(price).toLocaleString()}` : 'Not Available';
  const clientName = `${client.first_name} ${client.last_name}`;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Cruise Quote - ${cruise.ship_name}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Arial', sans-serif;
          line-height: 1.6;
          color: #333;
          background: white;
        }
        
        .header {
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          color: white;
          padding: 40px 30px;
          text-align: center;
          margin-bottom: 30px;
        }
        
        .logo {
          font-size: 32px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        
        .tagline {
          font-size: 16px;
          opacity: 0.9;
        }
        
        .container {
          max-width: 800px;
          margin: 0 auto;
          padding: 0 30px;
        }
        
        .quote-title {
          font-size: 28px;
          color: #0f172a;
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 3px solid #3b82f6;
          padding-bottom: 15px;
        }
        
        .section {
          margin-bottom: 30px;
          background: #f8fafc;
          padding: 25px;
          border-radius: 8px;
          border-left: 4px solid #3b82f6;
        }
        
        .section h3 {
          color: #1e293b;
          font-size: 20px;
          margin-bottom: 15px;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 8px;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-bottom: 15px;
        }
        
        .info-item {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px dotted #cbd5e1;
        }
        
        .info-label {
          font-weight: bold;
          color: #475569;
        }
        
        .info-value {
          color: #1e293b;
        }
        
        .pricing-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-top: 20px;
        }
        
        .price-card {
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
        }
        
        .price-card.featured {
          border-color: #3b82f6;
          background: #f0f9ff;
        }
        
        .cabin-type {
          font-weight: bold;
          color: #1e293b;
          font-size: 16px;
          margin-bottom: 10px;
        }
        
        .price {
          font-size: 24px;
          font-weight: bold;
          color: #059669;
          margin-bottom: 5px;
        }
        
        .price-note {
          font-size: 12px;
          color: #64748b;
        }
        
        .notes-section {
          background: #fef3c7;
          border-left-color: #f59e0b;
        }
        
        .footer {
          margin-top: 40px;
          padding: 30px;
          background: #f1f5f9;
          border-radius: 8px;
          text-align: center;
        }
        
        .contact-info {
          margin-bottom: 20px;
        }
        
        .contact-info h4 {
          color: #1e293b;
          margin-bottom: 10px;
        }
        
        .disclaimer {
          font-size: 12px;
          color: #64748b;
          line-height: 1.4;
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #cbd5e1;
        }
        
        .valid-until {
          background: #fee2e2;
          color: #dc2626;
          padding: 15px;
          border-radius: 8px;
          text-align: center;
          font-weight: bold;
          margin: 20px 0;
        }
        
        @media print {
          .header {
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">INTERLINE ASIA</div>
        <div class="tagline">Exclusive Cruise Experiences for Travel Professionals</div>
      </div>
      
      <div class="container">
        <h1 class="quote-title">Cruise Quote</h1>
        
        <div class="section">
          <h3>Client Information</h3>
          <div class="info-item">
            <span class="info-label">Client Name:</span>
            <span class="info-value">${clientName}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Quote Date:</span>
            <span class="info-value">${new Date().toLocaleDateString()}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Quote Reference:</span>
            <span class="info-value">${quoteRequest.id}</span>
          </div>
        </div>
        
        <div class="section">
          <h3>Cruise Details</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Cruise Line:</span>
              <span class="info-value">${cruise.cruise_line}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Ship:</span>
              <span class="info-value">${cruise.ship_name}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Departure Date:</span>
              <span class="info-value">${new Date(cruise.departure_date).toLocaleDateString()}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Duration:</span>
              <span class="info-value">${cruise.nights} nights</span>
            </div>
            <div class="info-item">
              <span class="info-label">Region:</span>
              <span class="info-value">${cruise.region}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Route:</span>
              <span class="info-value">${cruise.departure_port} → ${cruise.arrival_port}</span>
            </div>
          </div>
          ${cruise.itinerary ? `
            <div class="info-item">
              <span class="info-label">Itinerary:</span>
              <span class="info-value">${cruise.itinerary}</span>
            </div>
          ` : ''}
        </div>
        
        <div class="section">
          <h3>Cabin Pricing</h3>
          <div class="pricing-grid">
            <div class="price-card ${quoteRequest.interior_price ? 'featured' : ''}">
              <div class="cabin-type">Interior Cabin</div>
              <div class="price">${formatPrice(quoteRequest.interior_price)}</div>
              <div class="price-note">Per person, double occupancy</div>
            </div>
            <div class="price-card ${quoteRequest.oceanview_price ? 'featured' : ''}">
              <div class="cabin-type">Oceanview Cabin</div>
              <div class="price">${formatPrice(quoteRequest.oceanview_price)}</div>
              <div class="price-note">Per person, double occupancy</div>
            </div>
            <div class="price-card ${quoteRequest.balcony_price ? 'featured' : ''}">
              <div class="cabin-type">Balcony Cabin</div>
              <div class="price">${formatPrice(quoteRequest.balcony_price)}</div>
              <div class="price-note">Per person, double occupancy</div>
            </div>
            <div class="price-card ${quoteRequest.suite_price ? 'featured' : ''}">
              <div class="cabin-type">Suite</div>
              <div class="price">${formatPrice(quoteRequest.suite_price)}</div>
              <div class="price-note">Per person, double occupancy</div>
            </div>
          </div>
        </div>
        
        ${quoteRequest.valid_until ? `
          <div class="valid-until">
            This quote is valid until: ${new Date(quoteRequest.valid_until).toLocaleDateString()}
          </div>
        ` : ''}
        
        ${quoteRequest.notes ? `
          <div class="section notes-section">
            <h3>Additional Notes</h3>
            <p>${quoteRequest.notes}</p>
          </div>
        ` : ''}
        
        <div class="footer">
          <div class="contact-info">
            <h4>Ready to Book?</h4>
            <p>Contact us at <strong>admin@interlineasia.com</strong></p>
            <p>Visit: <strong>www.interlineasia.com</strong></p>
          </div>
          
          <div class="disclaimer">
            <strong>Important Information:</strong><br>
            • Prices are per person based on double occupancy and subject to availability<br>
            • Additional taxes, fees, and gratuities may apply<br>
            • Travel insurance is strongly recommended<br>
            • Industry verification required for booking<br>
            • All bookings subject to cruise line terms and conditions<br><br>
            
            This quote was generated by Interline Asia's secure booking system on ${new Date().toLocaleDateString()}.
            Quote reference: ${quoteRequest.id}
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}