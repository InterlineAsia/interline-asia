#!/usr/bin/env node
// Safe cleanup script - removes console.logs without affecting functionality
// This script is conservative and only removes obvious debug statements

import fs from 'fs';
import path from 'path';

const SAFE_CONSOLE_PATTERNS = [
  /console\.log\(['"`]✅[^'"`]*['"`]\);?\s*$/gm,
  /console\.log\(['"`]🔧[^'"`]*['"`]\);?\s*$/gm,
  /console\.log\(['"`]📊[^'"`]*['"`]\);?\s*$/gm,
  /console\.log\(['"`]DEALS:[^'"`]*['"`][^)]*\);?\s*$/gm,
  /console\.log\(['"`]Loading[^'"`]*['"`]\);?\s*$/gm,
  /console\.log\(['"`]Initialized[^'"`]*['"`]\);?\s*$/gm,
];

const EXCLUDE_FILES = [
  'error-handler-unified.js', // Keep error logging
  'loading-states.js', // Keep loading logs
  'site-enhancements.js', // Keep enhancement logs
  'deals-loader-unified.js' // Keep deals loading logs
];

function shouldCleanFile(filePath) {
  const fileName = path.basename(filePath);
  return !EXCLUDE_FILES.some(excluded => fileName.includes(excluded));
}

function cleanConsoleLogsFromFile(filePath) {
  if (!shouldCleanFile(filePath)) {
    console.log(`⏭️  Skipping ${filePath} (protected file)`);
    return { cleaned: 0, file: filePath };
  }

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let cleanedContent = content;
    let totalCleaned = 0;

    // Only remove safe, obvious debug console.logs
    SAFE_CONSOLE_PATTERNS.forEach(pattern => {
      const matches = cleanedContent.match(pattern);
      if (matches) {
        cleanedContent = cleanedContent.replace(pattern, '');
        totalCleaned += matches.length;
      }
    });

    if (totalCleaned > 0) {
      // Create backup before modifying
      fs.writeFileSync(filePath + '.backup', content);
      fs.writeFileSync(filePath, cleanedContent);
      console.log(`✅ Cleaned ${totalCleaned} console.logs from ${filePath}`);
    }

    return { cleaned: totalCleaned, file: filePath };
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return { cleaned: 0, file: filePath, error: error.message };
  }
}

function findJavaScriptFiles(dir) {
  const files = [];
  
  function scanDirectory(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        scanDirectory(fullPath);
      } else if (stat.isFile() && item.endsWith('.js')) {
        files.push(fullPath);
      }
    }
  }
  
  scanDirectory(dir);
  return files;
}

// Main execution
console.log('🧹 Starting safe console.log cleanup...');
console.log('⚠️  Only removing obvious debug statements, keeping functional logs');

const jsFiles = findJavaScriptFiles('public');
console.log(`📁 Found ${jsFiles.length} JavaScript files`);

let totalCleaned = 0;
const results = [];

for (const file of jsFiles) {
  const result = cleanConsoleLogsFromFile(file);
  results.push(result);
  totalCleaned += result.cleaned;
}

console.log('\n📊 Cleanup Summary:');
console.log(`✅ Total console.logs removed: ${totalCleaned}`);
console.log(`📁 Files processed: ${results.length}`);
console.log(`🔧 Files modified: ${results.filter(r => r.cleaned > 0).length}`);

if (totalCleaned > 0) {
  console.log('\n💾 Backup files created with .backup extension');
  console.log('🔄 You can restore any file with: mv file.js.backup file.js');
}

console.log('\n✅ Safe cleanup complete!');