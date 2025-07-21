// Date Formatter - Clean departure dates
// Removes time components and formats consistently

/**
 * Format departure date for display
 * Removes time component and formats as "01 Oct 2025"
 */
function formatDepartureDate(dateInput) {
  if (!dateInput) return 'Date TBD';
  
  try {
    // Handle various input formats
    let date;
    if (typeof dateInput === 'string') {
      // Remove time component if present
      const cleanDate = dateInput.replace(/T.*$/, '');
      date = new Date(cleanDate);
    } else {
      date = new Date(dateInput);
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short', 
      year: 'numeric'
    });
  } catch (error) {
    console.warn('Date formatting error:', error);
    return 'Date Error';
  }
}

/**
 * Clean ISO date string by removing time component
 */
function cleanISODate(isoString) {
  if (!isoString || typeof isoString !== 'string') return isoString;
  
  // Remove time component (everything after T)
  return isoString.replace(/T.*$/, '');
}

/**
 * Format date for email templates
 */
function formatEmailDate(dateInput) {
  const formatted = formatDepartureDate(dateInput);
  return formatted === 'Date TBD' ? 'To be confirmed' : formatted;
}

module.exports = {
  formatDepartureDate,
  cleanISODate,
  formatEmailDate
};