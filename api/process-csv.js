// Vercel Serverless Function for CSV Processing with Google Gemini + Supabase
// File: /api/process-csv.js

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { csvContent, fileName } = req.body;

    if (!csvContent) {
      return res.status(400).json({ error: 'CSV content is required' });
    }

    // Get Google API key from environment variables
    const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
    if (!GOOGLE_API_KEY) {
      console.error('GOOGLE_API_KEY not found in environment variables');
      return res.status(500).json({ error: 'Google API key not configured' });
    }

    // Parse CSV content into rows
    const rows = parseCSV(csvContent);
    if (rows.length === 0) {
      return res.status(400).json({ error: 'No data found in CSV file' });
    }

    console.log(`Processing ${rows.length} rows from ${fileName}`);

    // Process with Gemini in batches to avoid token limits
    // Larger batch size for better efficiency with large files
    const batchSize = Math.min(20, Math.ceil(rows.length / 10)); // Dynamic batch sizing
    const processedDeals = [];

    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const batchResult = await processWithGemini(batch, GOOGLE_API_KEY);
      processedDeals.push(...batchResult);
      
      // Add small delay between batches to respect rate limits
      if (i + batchSize < rows.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Return processed data
    res.status(200).json({
      success: true,
      originalFileName: fileName,
      totalRows: rows.length,
      processedRows: processedDeals.length,
      processedData: processedDeals,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error processing CSV:', error);
    res.status(500).json({ 
      error: 'Failed to process CSV', 
      details: error.message 
    });
  }
}

function parseCSV(csvContent) {
  const lines = csvContent.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === headers.length) {
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index];
      });
      rows.push(row);
    }
  }

  return rows;
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result.map(val => val.replace(/"/g, ''));
}

async function processWithGemini(batch, apiKey) {
  const prompt = createGeminiPrompt(batch);
  
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.1,
          topK: 1,
          topP: 1,
          maxOutputTokens: 4096,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('Invalid response from Gemini API');
    }

    const generatedText = data.candidates[0].content.parts[0].text;
    
    // Parse the JSON response from Gemini
    try {
      const jsonMatch = generatedText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No valid JSON found in Gemini response');
      }
    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError);
      console.error('Gemini response:', generatedText);
      throw new Error('Failed to parse Gemini response as JSON');
    }

  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw error;
  }
}

function createGeminiPrompt(batch) {
  return `You are an expert cruise deal data processor for Interline Asia. Your task is to clean, standardize, and categorize cruise deal data for travel industry professionals.

CONTEXT: This data will be used on a website selling exclusive cruise deals to airline, tourism, and travel industry employees. The data must be accurate, well-formatted, and consistent.

CRUISE LINE STANDARDIZATION:
- Use official cruise line names: "Royal Caribbean", "Norwegian Cruise Line", "Princess Cruises", "Celebrity Cruises", "Holland America Line", "MSC Cruises", "Carnival Cruise Line", "Costa Cruises", "P&O Cruises", "Cunard Line", "Regent Seven Seas", "Oceania Cruises", "Azamara", "Virgin Voyages", "Disney Cruise Line", "Silversea Cruises", "Seabourn", "Crystal Cruises"

REGION STANDARDIZATION:
- Caribbean (Eastern Caribbean, Western Caribbean, Southern Caribbean)
- Mediterranean (Western Mediterranean, Eastern Mediterranean)
- Northern Europe (Baltic, Norwegian Fjords, British Isles)
- Alaska (Inside Passage, Gulf of Alaska)
- Asia (Southeast Asia, Far East, Japan)
- Transatlantic
- Transpacific
- Australia & New Zealand
- South America
- Antarctica
- Arctic
- Hawaii
- Bermuda
- Canada & New England
- Panama Canal
- World Cruise

PRICING RULES:
- Convert all prices to USD numbers (remove currency symbols, commas)
- If price says "Quote Available" or similar, set to null
- Standard cabin types: inside, oceanview, balcony, suite
- Ensure pricing is realistic (inside < oceanview < balcony < suite)

DATE FORMATTING:
- Always use YYYY-MM-DD format
- Handle various input formats (DD-MMM-YY, MM/DD/YYYY, etc.)
- If year is 2-digit, assume 20XX

INPUT DATA:
${JSON.stringify(batch, null, 2)}

OUTPUT REQUIREMENTS:
Return ONLY a valid JSON array. Each cruise deal object must have:
{
  "id": "unique_identifier_string",
  "cruiseLine": "standardized_cruise_line_name",
  "shipName": "ship_name",
  "departureDate": "YYYY-MM-DD",
  "region": "standardized_region_name",
  "nights": integer_number_of_nights,
  "departurePort": "departure_port_name",
  "arrivalPort": "arrival_port_name_or_same_if_roundtrip",
  "itinerary": "cleaned_itinerary_description",
  "cabinTypes": {
    "inside": number_or_null,
    "oceanview": number_or_null,
    "balcony": number_or_null,
    "suite": number_or_null
  },
  "maxPax": 4,
  "year": "2025",
  "originalData": original_input_object,
  "processedAt": "${new Date().toISOString()}"
}

CRITICAL: Return ONLY the JSON array, no explanations, no markdown formatting, no additional text.`;
}