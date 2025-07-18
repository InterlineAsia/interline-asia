#!/usr/bin/env node
// Upload CSV via the working API endpoint in smaller chunks
// This bypasses the 413 error by splitting large files

import fs from 'fs';
import fetch from 'node-fetch';

async function uploadCSVInChunks(filename) {
  try {
    const filePath = `public/${filename}`;
    
    if (!fs.existsSync(filePath)) {
      console.error(`❌ File not found: ${filePath}`);
      return;
    }
    
    console.log(`📁 Processing: ${filename}`);
    const fileSize = fs.statSync(filePath).size;
    console.log(`📏 File size: ${(fileSize / 1024 / 1024).toFixed(2)}MB`);
    
    const csvContent = fs.readFileSync(filePath, 'utf8');
    const lines = csvContent.split('\n');
    const headers = lines[0];
    
    console.log(`📊 Total lines: ${lines.length}`);
    console.log(`📋 Headers: ${headers.substring(0, 100)}...`);
    
    // Split into chunks of 1000 lines each (about 1MB)
    const chunkSize = 1000;
    const chunks = [];
    
    for (let i = 1; i < lines.length; i += chunkSize) {
      const chunkLines = [headers, ...lines.slice(i, i + chunkSize)];
      const chunkContent = chunkLines.join('\n');
      chunks.push({
        content: chunkContent,
        startLine: i,
        endLine: Math.min(i + chunkSize - 1, lines.length - 1),
        size: chunkContent.length
      });
    }
    
    console.log(`📦 Split into ${chunks.length} chunks`);
    
    // Process each chunk
    let successCount = 0;
    let totalProcessed = 0;
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`\n📤 Processing chunk ${i + 1}/${chunks.length}`);
      console.log(`   Lines ${chunk.startLine}-${chunk.endLine} (${(chunk.size / 1024).toFixed(1)}KB)`);
      
      try {
        const response = await fetch('https://www.interlineasia.com/api/process-csv-text', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            csvContent: chunk.content,
            filename: `${filename}_chunk_${i + 1}`
          })
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            console.log(`   ✅ Chunk ${i + 1} uploaded successfully`);
            console.log(`   📊 Processed: ${result.details?.insertedCount || 'unknown'} deals`);
            successCount++;
            totalProcessed += result.details?.insertedCount || 0;
          } else {
            console.log(`   ❌ Chunk ${i + 1} failed: ${result.error}`);
          }
        } else {
          console.log(`   ❌ Chunk ${i + 1} HTTP error: ${response.status}`);
        }
        
        // Wait between chunks to avoid overwhelming the server
        if (i < chunks.length - 1) {
          console.log(`   ⏳ Waiting 2 seconds...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
      } catch (error) {
        console.log(`   ❌ Chunk ${i + 1} error: ${error.message}`);
      }
    }
    
    console.log(`\n🎉 Upload complete!`);
    console.log(`📊 Successful chunks: ${successCount}/${chunks.length}`);
    console.log(`📈 Total deals processed: ${totalProcessed}`);
    
  } catch (error) {
    console.error('❌ Upload error:', error.message);
  }
}

// Main execution
const filename = process.argv[2];

if (!filename) {
  console.log('📁 Available CSV files in public/:');
  const files = fs.readdirSync('public').filter(f => f.endsWith('.csv') || f.endsWith('.CSV'));
  files.forEach(file => {
    const size = (fs.statSync(`public/${file}`).size / 1024 / 1024).toFixed(2);
    console.log(`  • ${file} (${size}MB)`);
  });
  console.log('\n💡 Usage: node scripts/upload-via-api.js <filename>');
  console.log('💡 Example: node scripts/upload-via-api.js "1807 Master Upload Twins.csv"');
} else {
  uploadCSVInChunks(filename);
}