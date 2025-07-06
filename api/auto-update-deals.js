// Auto-update deals data after CSV processing
// File: /api/auto-update-deals.js

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
    const { processedData, updateType = 'append' } = req.body;

    if (!processedData || !Array.isArray(processedData)) {
      return res.status(400).json({ error: 'Valid processed data array is required' });
    }

    // This would integrate with your existing deals system
    // For now, we'll save to a new deals file and update the index

    const fs = require('fs').promises;
    const path = require('path');

    // Create timestamp for the new deals file
    const timestamp = new Date().toISOString().split('T')[0];
    const newFileName = `deals-${timestamp}.json`;
    const newFilePath = path.join(process.cwd(), 'public', 'data', newFileName);

    // Save the new deals data
    await fs.writeFile(newFilePath, JSON.stringify(processedData, null, 2));

    // Update the deals index
    const indexPath = path.join(process.cwd(), 'public', 'data', 'deals-index.json');
    let dealsIndex = [];
    
    try {
      const indexContent = await fs.readFile(indexPath, 'utf8');
      dealsIndex = JSON.parse(indexContent);
    } catch (error) {
      // Index doesn't exist, create new one
      dealsIndex = [];
    }

    // Add new entry to index
    const newEntry = {
      fileName: newFileName,
      uploadDate: new Date().toISOString(),
      totalDeals: processedData.length,
      regions: [...new Set(processedData.map(deal => deal.region))],
      cruiseLines: [...new Set(processedData.map(deal => deal.cruiseLine))],
      dateRange: {
        earliest: Math.min(...processedData.map(deal => new Date(deal.departureDate).getTime())),
        latest: Math.max(...processedData.map(deal => new Date(deal.departureDate).getTime()))
      }
    };

    if (updateType === 'replace') {
      // Replace all deals with new data
      dealsIndex = [newEntry];
    } else {
      // Append to existing deals
      dealsIndex.push(newEntry);
      
      // Keep only last 10 uploads to prevent bloat
      if (dealsIndex.length > 10) {
        const oldEntries = dealsIndex.slice(0, -10);
        // Delete old files
        for (const oldEntry of oldEntries) {
          try {
            await fs.unlink(path.join(process.cwd(), 'public', 'data', oldEntry.fileName));
          } catch (error) {
            console.warn(`Could not delete old file: ${oldEntry.fileName}`);
          }
        }
        dealsIndex = dealsIndex.slice(-10);
      }
    }

    // Save updated index
    await fs.writeFile(indexPath, JSON.stringify(dealsIndex, null, 2));

    // Update the main deals.json file with latest data
    const mainDealsPath = path.join(process.cwd(), 'public', 'deals.json');
    await fs.writeFile(mainDealsPath, JSON.stringify(processedData, null, 2));

    res.status(200).json({
      success: true,
      message: 'Deals updated successfully',
      fileName: newFileName,
      totalDeals: processedData.length,
      updateType: updateType,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error updating deals:', error);
    res.status(500).json({ 
      error: 'Failed to update deals', 
      details: error.message 
    });
  }
}