// PDF Quote Generator API - Phase 2
// Generates branded PDF quotes when Stephen's team submits pricing

import { createClient } from '@supabase/supabase-js';
import puppeteer from 'puppeteer';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      quoteId, 
      token, 
      generatePDF = false 
    } = req.body;

    // Validate required fields
    if (!quoteId || !token) {
      return res.status(400).json({ error: 'Missing quote ID or token' });
    }

    // Verify quote request exists and token is valid
    const { data: quoteRequest, error: quoteError } = await supabase
      .from('quote_requests')
      .select(`
        *,
        users!inner(email, first_name, last_name),
        cruises!inner(*)
      `)
      .eq('id', quoteId)
      .eq('token', token)
      .single();

    if (quoteError || !quoteRequest) {
      return res.status(404).json({ error: 'Invalid quote request' });
    }

    if (!generatePDF) {
      return res.status(200).json({ 
        success: true, 
        message: 'Quote data retrieved successfully',
        quote: quoteRequest 
      });
    }

    // Generate PDF quote
    const pdfBuffer = await generateQuotePDF(quoteRequest);
    
    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="quote-${quoteId}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    res.send(pdfBuffer);

  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ error: 'Failed to generate PDF quote' });
  }
}

async function generateQuotePDF(quoteRequest) {
  let browser;
  
  try {
    // Launch Puppeteer
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Generate HTML content for PDF
    const htmlContent = generateQuoteHTML(quoteRequest);
    
    // Set content and generate PDF
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
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
    
    return pdfBuffer;
    
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

function generateQuoteHTML(quoteRequest) {
  const cruise = quoteRequest.cruises;
  const client = quoteRequest.users;
  const clientName = `${client.first_name} ${client.last_name}`;
  
  // Format pricing display
  const formatPrice = (price) => {
    if (!price || parseFloat(price) <= 0) return 'Not Available';
    return `$${parseFloat(price).toLocaleString()}`;
  };
  
  const pricingRows = [
    { type: 'Interior Cabin', price: formatPrice(quoteRequest.interior_price) },
    { type: 'Oceanview Cabin', price: formatPrice(quoteRequest.oceanview_price) },
    { type: 'Balcony Cabin', price: formatPrice(quoteRequest.balcony_price) },
    { type: 'Suite', price: formatPrice(quoteRequest.suite_price) }
  ].filter(row => row.price !== 'Not Available');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
            
            .quote-container {
                max-width: 800px;
                margin: 0 auto;
                padding: 40px;
            }
            
            .header {
                text-align: center;
                margin-bottom: 40px;
                border-bottom: 3px solid #0f172a;
                padding-bottom: 30px;
            }
            
            .logo {
                font-size: 32px;
                font-weight: bold;
                color: #0f172a;
                margin-bottom: 10px;
                letter-spacing: 2px;
            }
            
            .tagline {
                color: #64748b;
                font-size: 14px;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            
            .quote-title {
                font-size: 28px;
                color: #0f172a;
                margin: 30px 0 20px 0;
                text-align: center;
            }
            
            .client-info {
                background: #f8fafc;
                padding: 20px;
                border-radius: 8px;
                margin-bottom: 30px;
                border-left: 4px solid #3b82f6;
            }
            
            .client-info h3 {
                color: #0f172a;
                margin-bottom: 10px;
            }
            
            .cruise-details {
                background: #f0f9ff;
                padding: 25px;
                border-radius: 8px;
                margin-bottom: 30px;
                border: 1px solid #3b82f6;
            }
            
            .cruise-details h3 {
                color: #1e40af;
                margin-bottom: 15px;
                font-size: 20px;
            }
            
            .detail-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 15px;
                margin-bottom: 15px;
            }
            
            .detail-item {
                display: flex;
                flex-direction: column;
            }
            
            .detail-label {
                font-weight: bold;
                color: #1e40af;
                font-size: 12px;
                text-transform: uppercase;
                margin-bottom: 5px;
            }
            
            .detail-value {
                color: #1d4ed8;
                font-weight: 500;
            }
            
            .pricing-section {
                background: #dcfce7;
                padding: 25px;
                border-radius: 8px;
                margin-bottom: 30px;
                border: 1px solid #22c55e;
            }
            
            .pricing-section h3 {
                color: #166534;
                margin-bottom: 20px;
                font-size: 20px;
            }
            
            .pricing-table {
                width: 100%;
                border-collapse: collapse;
            }
            
            .pricing-table th,
            .pricing-table td {
                padding: 12px;
                text-align: left;
                border-bottom: 1px solid #bbf7d0;
            }
            
            .pricing-table th {
                background: #166534;
                color: white;
                font-weight: bold;
            }
            
            .pricing-table td {
                color: #166534;
                font-weight: 500;
            }
            
            .pricing-table tr:last-child td {
                border-bottom: none;
            }
            
            .notes-section {
                background: #fef3c7;
                padding: 20px;
                border-radius: 8px;
                margin-bottom: 30px;
                border-left: 4px solid #f59e0b;
            }
            
            .notes-section h3 {
                color: #92400e;
                margin-bottom: 10px;
            }
            
            .notes-section p {
                color: #78350f;
                line-height: 1.6;
            }
            
            .important-info {
                background: #f1f5f9;
                padding: 20px;
                border-radius: 8px;
                margin-bottom: 30px;
            }
            
            .important-info h3 {
                color: #1e293b;
                margin-bottom: 15px;
            }
            
            .important-info ul {
                color: #475569;
                padding-left: 20px;
            }
            
            .important-info li {
                margin-bottom: 8px;
            }
            
            .footer {
                text-align: center;
                padding-top: 30px;
                border-top: 2px solid #e2e8f0;
                color: #64748b;
                font-size: 12px;
            }
            
            .contact-info {
                margin-top: 20px;
                color: #475569;
            }
            
            .valid-until {
                background: #fee2e2;
                color: #dc2626;
                padding: 15px;
                border-radius: 8px;
                text-align: center;
                font-weight: bold;
                margin-bottom: 20px;
            }
            
            @media print {
                body { -webkit-print-color-adjust: exact; }
            }
        </style>
    </head>
    <body>
        <div class="quote-container">
            <!-- Header -->
            <div class="header">
                <div class="logo">INTERLINE ASIA</div>
                <div class="tagline">Exclusive Cruise Experiences for Travel Professionals</div>
            </div>
            
            <!-- Quote Title -->
            <h1 class="quote-title">Cruise Quote</h1>
            
            <!-- Client Information -->
            <div class="client-info">
                <h3>Prepared For:</h3>
                <p><strong>${clientName}</strong></p>
                <p>Quote ID: ${quoteRequest.id}</p>
                <p>Generated: ${new Date().toLocaleDateString()}</p>
            </div>
            
            ${quoteRequest.valid_until ? `
                <div class="valid-until">
                    This quote is valid until: ${new Date(quoteRequest.valid_until).toLocaleDateString()}
                </div>
            ` : ''}
            
            <!-- Cruise Details -->
            <div class="cruise-details">
                <h3>Cruise Details</h3>
                <div class="detail-grid">
                    <div class="detail-item">
                        <div class="detail-label">Cruise Line</div>
                        <div class="detail-value">${cruise.cruise_line}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Ship</div>
                        <div class="detail-value">${cruise.ship_name}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Departure Date</div>
                        <div class="detail-value">${new Date(cruise.departure_date).toLocaleDateString()}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Duration</div>
                        <div class="detail-value">${cruise.nights} nights</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Region</div>
                        <div class="detail-value">${cruise.region}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Route</div>
                        <div class="detail-value">${cruise.departure_port} → ${cruise.arrival_port}</div>
                    </div>
                </div>
                ${cruise.itinerary ? `
                    <div class="detail-item">
                        <div class="detail-label">Itinerary</div>
                        <div class="detail-value">${cruise.itinerary}</div>
                    </div>
                ` : ''}
            </div>
            
            <!-- Pricing -->
            <div class="pricing-section">
                <h3>Cabin Pricing (Per Person)</h3>
                <table class="pricing-table">
                    <thead>
                        <tr>
                            <th>Cabin Type</th>
                            <th>Price</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${pricingRows.map(row => `
                            <tr>
                                <td>${row.type}</td>
                                <td>${row.price}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            
            ${quoteRequest.notes ? `
                <div class="notes-section">
                    <h3>Additional Notes</h3>
                    <p>${quoteRequest.notes}</p>
                </div>
            ` : ''}
            
            <!-- Important Information -->
            <div class="important-info">
                <h3>Important Information</h3>
                <ul>
                    <li>Prices are per person and subject to availability</li>
                    <li>Additional taxes and fees may apply</li>
                    <li>Travel insurance is recommended</li>
                    <li>Industry verification required for booking</li>
                    <li>Prices quoted in Australian Dollars (AUD)</li>
                    <li>Final confirmation subject to cruise line availability</li>
                </ul>
            </div>
            
            <!-- Footer -->
            <div class="footer">
                <p><strong>Interline Asia</strong> - Exclusive Cruise Experiences for Travel Professionals</p>
                <div class="contact-info">
                    <p>Email: admin@interlineasia.com | Website: www.interlineasia.com</p>
                    <p>This quote was generated securely and is valid for the specified period.</p>
                </div>
            </div>
        </div>
    </body>
    </html>
  `;
}