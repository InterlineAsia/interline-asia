// Script to convert large CSV file into smaller JSON chunks
const fs = require('fs');

// Parse CSV line handling quotes and commas
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
  return result;
}

// Convert CSV to JSON in chunks
function convertCSVToJSONChunks() {
  try {
    console.log('Reading CSV file...');
    const csvData = fs.readFileSync('2906 Master Upload Twins.csv', 'utf8');
    const lines = csvData.trim().split('\n');
    
    // Get headers from first line
    const headers = parseCSVLine(lines[0]);
    console.log(`Found ${lines.length - 1} data rows with ${headers.length} columns`);
    
    // Create index file
    const indexData = {
      totalDeals: lines.length - 1,
      chunkSize: 500,
      totalChunks: Math.ceil((lines.length - 1) / 500),
      chunks: []
    };
    
    // Process data in chunks of 500 rows
    const chunkSize = 500;
    let currentChunk = 1;
    
    for (let startRow = 1; startRow < lines.length; startRow += chunkSize) {
      const endRow = Math.min(startRow + chunkSize, lines.length);
      console.log(`Processing chunk ${currentChunk}: rows ${startRow} to ${endRow - 1}`);
      
      const deals = [];
      
      // Process rows for this chunk
      for (let i = startRow; i < endRow; i++) {
        const values = parseCSVLine(lines[i]);
        
        if (values.length >= headers.length) {
          const deal = {};
          
          // Map CSV columns to deal object
          headers.forEach((header, index) => {
            deal[header] = values[index] || '';
          });
          
          // Only include deals with basic required data
          if (deal['Cruise Line'] && deal['Ship'] && deal['Date']) {
            deals.push({
              cruiseLine: deal['Cruise Line'],
              shipName: deal['Ship'],
              departureDate: deal['Date'],
              region: deal['Region'] || '',
              nights: deal['Nights'] || '',
              from: deal['From'] || '',
              to: deal['To'] || '',
              itinerary: deal['Itinerary'] || '',
              insidePrice: deal['Inside'] || 'Quote Available',
              oceanviewPrice: deal['Oceanview'] || 'Quote Available',
              balconyPrice: deal['Balcony'] || 'Quote Available',
              suitePrice: deal['Suite'] || 'Quote Available',
              seq: deal['SEQ'] || ''
            });
          }
        }
      }
      
      // Save this chunk
      const chunkFilename = `public/data/cruise-deals-${currentChunk}.json`;
      fs.writeFileSync(chunkFilename, JSON.stringify(deals, null, 2));
      console.log(`Saved ${deals.length} deals to ${chunkFilename}`);
      
      // Add to index
      indexData.chunks.push({
        chunkNumber: currentChunk,
        filename: `data/cruise-deals-${currentChunk}.json`,
        dealCount: deals.length,
        startRow,
        endRow: endRow - 1
      });
      
      currentChunk++;
    }
    
    // Save index file
    fs.writeFileSync('public/data/index.json', JSON.stringify(indexData, null, 2));
    console.log(`Saved index file with ${indexData.totalChunks} chunks`);
    
    // Create a sample file with first 100 deals for initial loading
    const sampleDeals = JSON.parse(fs.readFileSync('public/data/cruise-deals-1.json', 'utf8')).slice(0, 100);
    fs.writeFileSync('public/deals.json', JSON.stringify(sampleDeals, null, 2));
    console.log('Updated sample deals.json with first 100 deals');
    
  } catch (error) {
    console.error('❌ Error converting CSV:', error.message);
  }
}

convertCSVToJSONChunks();