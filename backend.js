// Interline Asia - Backend Utilities and Helpers
// This file contains shared backend utilities for the CSV processing system

/**
 * Validates CSV file structure and content
 * @param {string} csvContent - Raw CSV content
 * @returns {Object} Validation result with isValid flag and errors
 */
function validateCSVStructure(csvContent) {
  const errors = [];
  const warnings = [];
  
  if (!csvContent || csvContent.trim().length === 0) {
    errors.push('CSV file is empty');
    return { isValid: false, errors, warnings };
  }
  
  const lines = csvContent.split('\n').filter(line => line.trim());
  
  if (lines.length < 2) {
    errors.push('CSV must have at least a header row and one data row');
    return { isValid: false, errors, warnings };
  }
  
  // Check for common CSV issues
  const headerLine = lines[0];
  const headers = headerLine.split(',').map(h => h.trim().replace(/"/g, ''));
  
  if (headers.length < 3) {
    errors.push('CSV must have at least 3 columns');
  }
  
  // Check for cruise-related columns
  const cruiseColumns = ['cruise', 'ship', 'line', 'departure', 'date', 'price', 'nights', 'region'];
  const hasRelevantColumns = headers.some(header => 
    cruiseColumns.some(col => header.toLowerCase().includes(col))
  );
  
  if (!hasRelevantColumns) {
    warnings.push('No obvious cruise-related columns detected. Gemini will attempt to process anyway.');
  }
  
  // Check data rows
  let validRows = 0;
  for (let i = 1; i < Math.min(lines.length, 6); i++) { // Check first 5 data rows
    const values = lines[i].split(',');
    if (values.length === headers.length) {
      validRows++;
    }
  }
  
  if (validRows === 0) {
    errors.push('No valid data rows found (column count mismatch)');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    totalRows: lines.length - 1,
    headers: headers
  };
}

/**
 * Estimates processing time based on file size and content
 * @param {number} rowCount - Number of rows to process
 * @returns {Object} Time estimates
 */
function estimateProcessingTime(rowCount) {
  const baseTimePerBatch = 3; // seconds
  const rowsPerBatch = 20;
  const batches = Math.ceil(rowCount / rowsPerBatch);
  
  const estimatedSeconds = batches * baseTimePerBatch;
  const estimatedMinutes = Math.ceil(estimatedSeconds / 60);
  
  return {
    batches,
    estimatedSeconds,
    estimatedMinutes,
    message: estimatedMinutes <= 1 ? 
      `~${estimatedSeconds} seconds` : 
      `~${estimatedMinutes} minute${estimatedMinutes > 1 ? 's' : ''}`
  };
}

/**
 * Generates a unique ID for processed deals
 * @param {Object} deal - Deal object
 * @returns {string} Unique identifier
 */
function generateDealId(deal) {
  const cruiseLine = (deal.cruiseLine || deal.cruise_line || '').replace(/\s+/g, '').toLowerCase();
  const shipName = (deal.shipName || deal.ship_name || '').replace(/\s+/g, '').toLowerCase();
  const departureDate = deal.departureDate || deal.departure_date || '';
  
  const timestamp = Date.now().toString(36);
  const hash = btoa(`${cruiseLine}-${shipName}-${departureDate}`).slice(0, 8);
  
  return `${cruiseLine.slice(0, 3)}${hash}${timestamp}`.toLowerCase();
}

/**
 * Sanitizes and validates processed deal data
 * @param {Array} deals - Array of processed deals
 * @returns {Object} Validation result with cleaned deals
 */
function validateProcessedDeals(deals) {
  const errors = [];
  const warnings = [];
  const cleanedDeals = [];
  
  if (!Array.isArray(deals)) {
    errors.push('Processed data is not an array');
    return { isValid: false, errors, warnings, cleanedDeals };
  }
  
  deals.forEach((deal, index) => {
    const dealErrors = [];
    const cleanedDeal = { ...deal };
    
    // Validate required fields
    if (!deal.cruiseLine) dealErrors.push(`Row ${index + 1}: Missing cruise line`);
    if (!deal.shipName) dealErrors.push(`Row ${index + 1}: Missing ship name`);
    if (!deal.departureDate) dealErrors.push(`Row ${index + 1}: Missing departure date`);
    
    // Validate date format
    if (deal.departureDate && !/^\d{4}-\d{2}-\d{2}$/.test(deal.departureDate)) {
      dealErrors.push(`Row ${index + 1}: Invalid date format (should be YYYY-MM-DD)`);
    }
    
    // Validate nights
    if (deal.nights && (isNaN(deal.nights) || deal.nights < 1 || deal.nights > 365)) {
      dealErrors.push(`Row ${index + 1}: Invalid nights value`);
      cleanedDeal.nights = null;
    }
    
    // Ensure ID exists
    if (!cleanedDeal.id) {
      cleanedDeal.id = generateDealId(deal);
    }
    
    // Add processing metadata
    cleanedDeal.processedAt = new Date().toISOString();
    cleanedDeal.dataQuality = dealErrors.length === 0 ? 'good' : 'warning';
    
    if (dealErrors.length === 0) {
      cleanedDeals.push(cleanedDeal);
    } else {
      errors.push(...dealErrors);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    cleanedDeals,
    originalCount: deals.length,
    validCount: cleanedDeals.length
  };
}

/**
 * Creates a backup of existing deals before updating
 * @param {string} backupDir - Directory to store backups
 * @returns {Promise<string>} Backup file path
 */
async function createDealsBackup(backupDir = 'public/data/backups') {
  try {
    const fs = require('fs').promises;
    const path = require('path');
    
    // Ensure backup directory exists
    await fs.mkdir(backupDir, { recursive: true });
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `deals-backup-${timestamp}.json`;
    const backupPath = path.join(backupDir, backupFileName);
    
    // Read current deals file
    const currentDealsPath = path.join(process.cwd(), 'public', 'deals.json');
    
    try {
      const currentDeals = await fs.readFile(currentDealsPath, 'utf8');
      await fs.writeFile(backupPath, currentDeals);
      return backupPath;
    } catch (error) {
      // If no current deals file exists, create empty backup
      await fs.writeFile(backupPath, '[]');
      return backupPath;
    }
    
  } catch (error) {
    console.error('Error creating backup:', error);
    throw new Error('Failed to create backup');
  }
}

/**
 * Logs processing activity for monitoring
 * @param {Object} activity - Activity details
 */
function logProcessingActivity(activity) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    ...activity
  };
  
  console.log('CSV Processing Activity:', JSON.stringify(logEntry, null, 2));
  
  // In production, you might want to send this to a monitoring service
  // or store in a database for analytics
}

module.exports = {
  validateCSVStructure,
  estimateProcessingTime,
  generateDealId,
  validateProcessedDeals,
  createDealsBackup,
  logProcessingActivity
};

// For Vercel serverless functions, also export as default
if (typeof module !== 'undefined' && module.exports) {
  module.exports.default = module.exports;
}