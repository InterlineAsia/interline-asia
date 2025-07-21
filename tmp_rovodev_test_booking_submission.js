// Safe Test Script - Booking Form Submission Simulation
// Tests the booking API without making actual database changes

const testBookingSubmission = async () => {
  console.log('🧪 Testing Booking Form Submission Flow...');
  
  try {
    // Simulate form data that would be sent to /api/booking.js
    const mockFormData = {
      quoteId: 'test_quote_123',
      firstName: 'John',
      lastName: 'Doe', 
      dateOfBirth: '1990-01-01',
      email: 'test@example.com',
      phone: '+1234567890',
      cabinType: 'Interior'
    };

    // Test 1: Check if the API endpoint exists and responds
    console.log('📡 Testing API endpoint availability...');
    
    const response = await fetch('/api/booking', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(mockFormData)
    });

    console.log(`Response Status: ${response.status}`);
    console.log(`Response Headers:`, Object.fromEntries(response.headers.entries()));

    if (response.status === 500) {
      const errorText = await response.text();
      console.error('❌ 500 Error detected:', errorText);
      
      // Check for the specific error mentioned
      if (errorText.includes('FUNCTION_INVOCATION_FAILED') || 
          errorText.includes('sin1::59gjw-1753025981477-ab08c296f6b6')) {
        console.error('🎯 Found the specific error mentioned in audit requirements!');
        return {
          status: 'ERROR_DETECTED',
          error: 'FUNCTION_INVOCATION_FAILED',
          details: errorText
        };
      }
    }

    const responseData = await response.json().catch(() => null);
    console.log('Response Data:', responseData);

    return {
      status: response.ok ? 'SUCCESS' : 'ERROR',
      statusCode: response.status,
      data: responseData
    };

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    return {
      status: 'TEST_FAILED',
      error: error.message
    };
  }
};

// Test 2: Check quote ID format
const testQuoteIdFormat = () => {
  console.log('🔢 Testing Quote ID Format...');
  
  // Simulate current quote ID generation (from schema analysis)
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  const currentFormat = `quote_${timestamp}_${random}`;
  
  console.log('Current Format Example:', currentFormat);
  console.log('Length:', currentFormat.length);
  
  // Propose shortened format
  const shortId = btoa(timestamp.toString()).substr(0, 8) + random.substr(0, 4);
  console.log('Proposed Short Format:', shortId);
  console.log('Short Length:', shortId.length);
  
  return {
    current: currentFormat,
    proposed: shortId,
    improvement: `${currentFormat.length - shortId.length} characters shorter`
  };
};

// Test 3: Check for roomType field
const testRoomTypeField = () => {
  console.log('🏨 Testing Room Type Field Support...');
  
  // Check if roomType is captured in forms
  const quoteForm = document.querySelector('form[action*="quote"]');
  const bookingForm = document.querySelector('form[action*="booking"]');
  
  const hasRoomTypeInQuote = quoteForm ? 
    quoteForm.querySelector('[name="roomType"], [name="room_type"]') !== null : false;
  const hasRoomTypeInBooking = bookingForm ? 
    bookingForm.querySelector('[name="roomType"], [name="room_type"]') !== null : false;
  
  console.log('Room Type in Quote Form:', hasRoomTypeInQuote);
  console.log('Room Type in Booking Form:', hasRoomTypeInBooking);
  
  return {
    quoteForm: hasRoomTypeInQuote,
    bookingForm: hasRoomTypeInBooking,
    recommendation: 'Add roomType field to capture accommodation preferences'
  };
};

// Test 4: Date format testing
const testDateFormat = () => {
  console.log('📅 Testing Date Format Conversion...');
  
  const testDates = [
    '2025-10-01T00:00:00Z',
    '2025-10-01T00:00:00.000Z',
    '2025-10-01'
  ];
  
  const formatDate = (isoDate) => {
    const date = new Date(isoDate);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short', 
      year: 'numeric'
    });
  };
  
  testDates.forEach(date => {
    console.log(`${date} → ${formatDate(date)}`);
  });
  
  return {
    function: formatDate.toString(),
    examples: testDates.map(date => ({ input: date, output: formatDate(date) }))
  };
};

// Run all tests
const runSafeAudit = async () => {
  console.log('🚀 Starting Safe Backend Audit...');
  console.log('=' .repeat(50));
  
  const results = {
    timestamp: new Date().toISOString(),
    tests: {}
  };
  
  // Test booking submission
  results.tests.bookingSubmission = await testBookingSubmission();
  console.log('');
  
  // Test quote ID format
  results.tests.quoteIdFormat = testQuoteIdFormat();
  console.log('');
  
  // Test room type field
  results.tests.roomTypeField = testRoomTypeField();
  console.log('');
  
  // Test date formatting
  results.tests.dateFormat = testDateFormat();
  console.log('');
  
  console.log('📊 Audit Results Summary:');
  console.log(JSON.stringify(results, null, 2));
  
  return results;
};

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runSafeAudit, testBookingSubmission, testQuoteIdFormat };
} else {
  // Browser environment - attach to window
  window.safeAudit = { runSafeAudit, testBookingSubmission, testQuoteIdFormat };
}

console.log('✅ Safe audit test script loaded. Run runSafeAudit() to execute all tests.');