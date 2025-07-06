// CSV Validation API Endpoint
// File: /api/validate-csv.js

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

    // Import validation functions
    const { validateCSVStructure, estimateProcessingTime } = require('../backend.js');

    // Validate CSV structure
    const validation = validateCSVStructure(csvContent);
    
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        errors: validation.errors,
        warnings: validation.warnings
      });
    }

    // Estimate processing time
    const timeEstimate = estimateProcessingTime(validation.totalRows);

    // Analyze CSV content for preview
    const lines = csvContent.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const sampleRows = lines.slice(1, 4).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      return row;
    });

    res.status(200).json({
      success: true,
      validation: {
        isValid: validation.isValid,
        errors: validation.errors,
        warnings: validation.warnings,
        totalRows: validation.totalRows,
        headers: validation.headers
      },
      preview: {
        headers,
        sampleRows,
        totalRows: validation.totalRows
      },
      processing: {
        estimatedTime: timeEstimate.message,
        batches: timeEstimate.batches,
        estimatedMinutes: timeEstimate.estimatedMinutes
      },
      fileName
    });

  } catch (error) {
    console.error('Error validating CSV:', error);
    res.status(500).json({ 
      error: 'Failed to validate CSV', 
      details: error.message 
    });
  }
}