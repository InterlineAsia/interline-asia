// Storage Cleanup Utilities - Interline Asia Backend
// Identifies and manages orphaned files in Supabase storage

const { createClient } = require('@supabase/supabase-js');

/**
 * Initialize Supabase client for storage operations
 */
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nxreyyxbuwxjfmtvdkji.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for storage operations');
  }
  
  return createClient(supabaseUrl, supabaseKey);
}

/**
 * Find orphaned files in storage buckets
 * Files are considered orphaned if they exist in storage but have no database record after 24 hours
 * @param {string} bucketName - Storage bucket to check ('uploads' or 'verification-uploads')
 * @returns {Promise<Array>} Array of orphaned file objects
 */
async function findOrphanedFiles(bucketName = 'verification-uploads') {
  const supabase = getSupabaseClient();
  const orphanedFiles = [];
  const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
  
  try {
    console.log(`Scanning bucket '${bucketName}' for orphaned files...`);
    
    // Get all files from storage bucket
    const { data: storageFiles, error: storageError } = await supabase.storage
      .from(bucketName)
      .list('', {
        limit: 1000,
        sortBy: { column: 'created_at', order: 'desc' }
      });
    
    if (storageError) {
      throw new Error(`Failed to list storage files: ${storageError.message}`);
    }
    
    console.log(`Found ${storageFiles.length} files in storage bucket '${bucketName}'`);
    
    // Get all upload records from database
    const { data: dbRecords, error: dbError } = await supabase
      .from('uploads')
      .select('file_path, file_name, created_at, uploaded_at');
    
    if (dbError) {
      throw new Error(`Failed to fetch database records: ${dbError.message}`);
    }
    
    console.log(`Found ${dbRecords.length} upload records in database`);
    
    // Check each storage file against database records
    for (const storageFile of storageFiles) {
      // Skip directories
      if (!storageFile.name || storageFile.name.endsWith('/')) {
        continue;
      }
      
      // Check if file is older than 24 hours
      const fileCreatedAt = new Date(storageFile.created_at);
      if (fileCreatedAt > cutoffTime) {
        continue; // Skip recent files
      }
      
      // Look for matching database record
      const hasDbRecord = dbRecords.some(record => 
        record.file_path === storageFile.name || 
        record.file_name === storageFile.name ||
        record.file_path?.endsWith(storageFile.name)
      );
      
      if (!hasDbRecord) {
        orphanedFiles.push({
          bucket: bucketName,
          fileName: storageFile.name,
          filePath: storageFile.name,
          size: storageFile.metadata?.size || 0,
          createdAt: storageFile.created_at,
          lastModified: storageFile.updated_at,
          ageHours: Math.round((Date.now() - fileCreatedAt.getTime()) / (1000 * 60 * 60))
        });
      }
    }
    
    console.log(`Found ${orphanedFiles.length} orphaned files in bucket '${bucketName}'`);
    return orphanedFiles;
    
  } catch (error) {
    console.error(`Error finding orphaned files in bucket '${bucketName}':`, error.message);
    throw error;
  }
}

/**
 * Generate orphan cleanup report
 * @param {Array} orphanedFiles - Array of orphaned file objects
 * @returns {string} Markdown report content
 */
function generateOrphanReport(orphanedFiles) {
  const reportDate = new Date().toISOString();
  const totalSize = orphanedFiles.reduce((sum, file) => sum + (file.size || 0), 0);
  const totalSizeMB = Math.round(totalSize / 1024 / 1024 * 100) / 100;
  
  let report = `# 🧹 ORPHANED FILES CLEANUP REPORT

**Generated**: ${reportDate}  
**Total Orphaned Files**: ${orphanedFiles.length}  
**Total Size**: ${totalSizeMB} MB  
**Scan Criteria**: Files older than 24 hours without database records

---

## 📊 SUMMARY BY BUCKET

`;

  // Group by bucket
  const bucketGroups = orphanedFiles.reduce((groups, file) => {
    const bucket = file.bucket || 'unknown';
    if (!groups[bucket]) groups[bucket] = [];
    groups[bucket].push(file);
    return groups;
  }, {});

  Object.entries(bucketGroups).forEach(([bucket, files]) => {
    const bucketSize = files.reduce((sum, file) => sum + (file.size || 0), 0);
    const bucketSizeMB = Math.round(bucketSize / 1024 / 1024 * 100) / 100;
    
    report += `### ${bucket}
- **Files**: ${files.length}
- **Size**: ${bucketSizeMB} MB

`;
  });

  report += `## 📋 DETAILED FILE LIST

| Bucket | File Name | Size (KB) | Age (Hours) | Created At |
|--------|-----------|-----------|-------------|------------|
`;

  orphanedFiles.forEach(file => {
    const sizeKB = Math.round((file.size || 0) / 1024);
    report += `| ${file.bucket} | \`${file.fileName}\` | ${sizeKB} | ${file.ageHours} | ${file.createdAt} |\n`;
  });

  report += `
---

## ⚠️ RECOMMENDED ACTIONS

### Immediate Review Required:
- **Files older than 7 days**: Consider for deletion
- **Large files (>1MB)**: Priority for cleanup
- **Recent files (<48 hours)**: May be legitimate uploads in progress

### Cleanup Commands (DO NOT RUN YET):
\`\`\`bash
# Review each file before deletion
# supabase storage rm --bucket verification-uploads file-name.pdf
\`\`\`

---

**⚠️ IMPORTANT**: This report is for review only. Do not delete files without manual verification.  
**Next Steps**: Review each file and confirm it's safe to delete before running cleanup commands.
`;

  return report;
}

/**
 * Main cleanup function - scans for orphans and generates report
 * @param {Array} buckets - Array of bucket names to scan (default: ['verification-uploads', 'uploads'])
 * @returns {Promise<Object>} Cleanup results
 */
async function cleanOrphans(buckets = ['verification-uploads', 'uploads']) {
  const startTime = Date.now();
  let allOrphanedFiles = [];
  
  try {
    console.log('Starting orphaned file cleanup scan...');
    
    // Scan each bucket
    for (const bucket of buckets) {
      try {
        const orphans = await findOrphanedFiles(bucket);
        allOrphanedFiles = allOrphanedFiles.concat(orphans);
      } catch (error) {
        console.error(`Failed to scan bucket '${bucket}':`, error.message);
      }
    }
    
    // Generate report
    const reportContent = generateOrphanReport(allOrphanedFiles);
    
    // Log summary
    const duration = Date.now() - startTime;
    console.log(`Cleanup scan completed in ${duration}ms`);
    console.log(`Found ${allOrphanedFiles.length} orphaned files across ${buckets.length} buckets`);
    
    return {
      success: true,
      orphanedFiles: allOrphanedFiles,
      reportContent: reportContent,
      summary: {
        totalFiles: allOrphanedFiles.length,
        bucketsScanned: buckets.length,
        duration: duration
      }
    };
    
  } catch (error) {
    console.error('Orphan cleanup scan failed:', error.message);
    throw error;
  }
}

/**
 * Safe file deletion (with confirmation)
 * @param {string} bucket - Bucket name
 * @param {string} filePath - File path to delete
 * @param {boolean} confirmed - Confirmation flag
 * @returns {Promise<Object>} Deletion result
 */
async function safeDeleteFile(bucket, filePath, confirmed = false) {
  if (!confirmed) {
    throw new Error('File deletion requires explicit confirmation. Set confirmed=true');
  }
  
  const supabase = getSupabaseClient();
  
  try {
    console.log(`Deleting file: ${bucket}/${filePath}`);
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);
    
    if (error) {
      throw new Error(`Failed to delete file: ${error.message}`);
    }
    
    console.log(`Successfully deleted: ${bucket}/${filePath}`);
    return { success: true, deletedFile: filePath, bucket: bucket };
    
  } catch (error) {
    console.error(`Failed to delete ${bucket}/${filePath}:`, error.message);
    throw error;
  }
}

module.exports = {
  findOrphanedFiles,
  cleanOrphans,
  generateOrphanReport,
  safeDeleteFile,
  getSupabaseClient
};