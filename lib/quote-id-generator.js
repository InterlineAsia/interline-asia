// Quote ID Generator - Clean Format
// Generates IDs like Q-2401-HAL-SEA instead of long UUIDs

/**
 * Generate a clean, readable quote ID
 * Format: Q-YYMM-XXX-YYY
 * Example: Q-2401-HAL-SEA
 */
function generateQuoteId() {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  
  // Generate 3-letter codes
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const code1 = Array.from({length: 3}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  const code2 = Array.from({length: 3}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  
  return `Q-${year}${month}-${code1}-${code2}`;
}

/**
 * Validate quote ID format
 */
function isValidQuoteId(id) {
  if (!id || typeof id !== 'string') return false;
  
  // Support both old and new formats during transition
  const newFormat = /^Q-\d{4}-[A-Z]{3}-[A-Z]{3}$/;
  const oldFormat = /^quote_\d+_[a-z0-9]+$/;
  
  return newFormat.test(id) || oldFormat.test(id);
}

/**
 * Extract readable parts from quote ID
 */
function parseQuoteId(id) {
  if (!id) return null;
  
  const newFormatMatch = id.match(/^Q-(\d{4})-([A-Z]{3})-([A-Z]{3})$/);
  if (newFormatMatch) {
    const [, yearMonth, code1, code2] = newFormatMatch;
    return {
      format: 'new',
      yearMonth,
      code1,
      code2,
      readable: id
    };
  }
  
  // Handle old format
  if (id.startsWith('quote_')) {
    return {
      format: 'old',
      readable: id.replace('quote_', 'Q-').substring(0, 15) + '...'
    };
  }
  
  return null;
}

module.exports = {
  generateQuoteId,
  isValidQuoteId,
  parseQuoteId
};