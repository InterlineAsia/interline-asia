// Interline Asia - Gemini AI Client
// Google Gemini integration for intelligent bot responses

export class GeminiClient {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    this.endpoint = process.env.GEMINI_ENDPOINT || 'https://generativelanguage.googleapis.com';
    
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY not found in environment variables');
    }
  }

  async generateContent(prompt, context = {}) {
    try {
      const url = `${this.endpoint}/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
      
      const requestBody = {
        contents: [{
          parts: [{
            text: this.buildPrompt(prompt, context)
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH", 
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Gemini API error: ${response.status} - ${errorData}`);
      }

      const data = await response.json();
      
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error('Invalid response from Gemini API');
      }

      return data.candidates[0].content.parts[0].text;
      
    } catch (error) {
      console.error('Gemini API call failed:', error);
      throw error;
    }
  }

  buildPrompt(prompt, context) {
    const systemContext = `You are an AI assistant for Interline Asia, a luxury cruise booking platform for verified travel industry professionals. 

Key Context:
- Company: Interline Asia specializes in exclusive cruise rates for travel agents, tour operators, and industry professionals
- Industry: Travel/Tourism - cruise bookings with industry rates
- Tone: Professional, helpful, knowledgeable about cruises and travel industry
- Focus: Providing excellent customer service while maintaining industry standards

Current Context: ${JSON.stringify(context, null, 2)}

User Request: ${prompt}

Please provide a helpful, professional response that aligns with Interline Asia's brand and the travel industry context.`;

    return systemContext;
  }

  // Specialized methods for different bot types
  async analyzeBookingRequest(bookingData) {
    const prompt = `Analyze this cruise booking request and provide insights:
    
Booking Details:
- Cruise: ${bookingData.cruise_line} - ${bookingData.ship_name}
- Departure: ${bookingData.departure_date}
- Duration: ${bookingData.nights} nights
- Region: ${bookingData.region}
- Cabin: ${bookingData.cabin_type}
- Passengers: ${bookingData.passengers?.length || 0}

Please analyze:
1. Is this a reasonable booking request?
2. Any potential issues or concerns?
3. Recommended next steps
4. Risk assessment (low/medium/high)

Provide a concise analysis in JSON format.`;

    const response = await this.generateContent(prompt, { type: 'booking_analysis' });
    
    try {
      return JSON.parse(response);
    } catch (error) {
      // If JSON parsing fails, return structured response
      return {
        analysis: response,
        risk_level: 'medium',
        recommendations: ['Manual review recommended']
      };
    }
  }

  async qualifyLead(leadData) {
    const prompt = `Analyze this potential travel industry lead and provide qualification insights:

Lead Information:
- Email: ${leadData.email}
- Name: ${leadData.fullName || 'Not provided'}
- Company: ${leadData.company || 'Not provided'}
- Source: ${leadData.source || 'Unknown'}

Please analyze:
1. Likelihood this is a legitimate travel industry professional (0-100%)
2. Key indicators supporting or contradicting industry status
3. Recommended verification approach
4. Risk factors to consider
5. Suggested email sequence tier (high/medium/low priority)

Provide analysis in JSON format with clear reasoning.`;

    const response = await this.generateContent(prompt, { type: 'lead_qualification' });
    
    try {
      return JSON.parse(response);
    } catch (error) {
      return {
        qualification_score: 50,
        analysis: response,
        tier: 'medium',
        verification_approach: 'standard'
      };
    }
  }

  async generatePersonalizedEmail(emailType, recipientData, bookingData = null) {
    let prompt = '';
    
    switch (emailType) {
      case 'welcome_high_quality':
        prompt = `Generate a personalized welcome email for a high-quality travel industry lead:
        
Recipient: ${recipientData.fullName}
Email: ${recipientData.email}
Company: ${recipientData.company || 'Not specified'}

Create a warm, professional welcome email that:
1. Acknowledges their travel industry expertise
2. Highlights exclusive benefits of Interline Asia
3. Encourages quick verification to access deals
4. Maintains professional tone while being welcoming

Return only the email body content (no subject line).`;
        break;
        
      case 'booking_confirmation':
        prompt = `Generate a personalized booking confirmation email:
        
Recipient: ${recipientData.fullName}
Booking: ${bookingData?.cruise_line} - ${bookingData?.ship_name}
Departure: ${bookingData?.departure_date}
Reference: ${bookingData?.reference_number}

Create a professional confirmation email that:
1. Confirms the booking details
2. Explains next steps in the process
3. Sets appropriate expectations about industry rates
4. Maintains excitement about the cruise

Return only the email body content.`;
        break;
        
      case 'bon_voyage':
        prompt = `Generate a personalized Bon Voyage email:
        
Recipient: ${recipientData.fullName}
Cruise: ${bookingData?.cruise_line} - ${bookingData?.ship_name}
Departure: ${bookingData?.departure_date} (in 3 days)
Region: ${bookingData?.region}

Create an exciting, helpful Bon Voyage email that:
1. Builds excitement for the upcoming cruise
2. Provides useful last-minute tips
3. Reinforces Interline Asia's value
4. Wishes them well on their journey

Return only the email body content.`;
        break;
    }

    return await this.generateContent(prompt, { 
      type: 'email_generation',
      emailType,
      recipient: recipientData.email 
    });
  }

  async analyzeSupplierResponse(responseData) {
    const prompt = `Analyze this supplier response to a cruise booking request:

Response Type: ${responseData.action}
${responseData.action === 'confirm' ? `
Confirmation Details:
- Cabin Number: ${responseData.cabinNumber}
- Booking Number: ${responseData.bookingNumber}
- Payment Amount: ${responseData.paymentAmount}
- Instructions: ${responseData.paymentInstructions}
` : `
Decline Reason: ${responseData.reason || 'No reason provided'}
`}

Please analyze:
1. Does this response seem legitimate and complete?
2. Any red flags or concerns?
3. Recommended follow-up actions
4. Customer communication suggestions

Provide analysis in JSON format.`;

    const response = await this.generateContent(prompt, { type: 'supplier_analysis' });
    
    try {
      return JSON.parse(response);
    } catch (error) {
      return {
        analysis: response,
        legitimacy_score: 80,
        recommendations: ['Standard processing']
      };
    }
  }

  // Health check for Gemini connection
  async healthCheck() {
    try {
      const testResponse = await this.generateContent('Test connection. Respond with "OK" if working.');
      return {
        connected: true,
        model: this.model,
        testResponse: testResponse.substring(0, 100),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        connected: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

export default GeminiClient;