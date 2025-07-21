// Consolidated Admin API - Handles all admin operations
// Combines: admin-tools.js + admin-verifications.js + process-csv-text.js
// Routes: /api/admin?action=tools | /api/admin?action=verifications | /api/admin?action=csv

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function handler(req, res) {
  const action = req.query.action || 'tools';

  try {
    switch (action) {
      case 'tools':
        return await handleAdminTools(req, res);
      case 'verifications':
        return await handleVerifications(req, res);
      case 'csv':
        return await handleCSVProcessing(req, res);
      default:
        return res.status(400).json({ error: 'Invalid action. Use: tools, verifications, or csv' });
    }
  } catch (error) {
    console.error('Admin processing error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to process admin request'
    });
  }
}

// Handle admin tools (from admin-tools.js)
async function handleAdminTools(req, res) {
  const tool = req.query.tool;

  if (req.method === 'GET') {
    switch (tool) {
      case 'get-uploads':
        return await getUploads(req, res);
      case 'health-check':
        return await healthCheck(req, res);
      case 'system-stats':
        return await getSystemStats(req, res);
      default:
        return res.status(400).json({ error: 'Invalid tool parameter' });
    }
  } else if (req.method === 'POST') {
    switch (tool) {
      case 'update-upload':
        return await updateUpload(req, res);
      case 'delete-upload':
        return await deleteUpload(req, res);
      case 'backup-deals':
        return await backupDeals(req, res);
      default:
        return res.status(400).json({ error: 'Invalid tool parameter' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

// Handle user verifications (from admin-verifications.js)
async function handleVerifications(req, res) {
  if (req.method === 'GET') {
    return await getVerifications(req, res);
  } else if (req.method === 'POST') {
    return await updateVerification(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

// Handle CSV processing (from process-csv-text.js)
async function handleCSVProcessing(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { csvText, tableName = 'cruise_deals', mode = 'append' } = req.body;

    if (!csvText) {
      return res.status(400).json({ error: 'CSV text is required' });
    }

    // Parse CSV text
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) {
      return res.status(400).json({ error: 'CSV must have at least a header and one data row' });
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const dataRows = lines.slice(1);

    console.log(`Processing ${dataRows.length} rows for table: ${tableName}`);

    const processedData = [];
    let errorCount = 0;

    for (let i = 0; i < dataRows.length; i++) {
      try {
        const values = dataRows[i].split(',').map(v => v.trim().replace(/"/g, ''));
        
        if (values.length !== headers.length) {
          console.warn(`Row ${i + 2}: Column count mismatch. Expected ${headers.length}, got ${values.length}`);
          errorCount++;
          continue;
        }

        const rowData = {};
        headers.forEach((header, index) => {
          let value = values[index];
          
          // Handle empty values
          if (value === '' || value === 'NULL' || value === 'null') {
            value = null;
          }
          
          // Convert numeric strings to numbers for specific fields
          if (['price', 'nights', 'pax'].includes(header.toLowerCase()) && value !== null) {
            const numValue = parseFloat(value);
            if (!isNaN(numValue)) {
              value = numValue;
            }
          }
          
          // Handle date fields
          if (header.toLowerCase().includes('date') && value !== null) {
            try {
              const date = new Date(value);
              if (!isNaN(date.getTime())) {
                value = date.toISOString().split('T')[0]; // YYYY-MM-DD format
              }
            } catch (dateError) {
              console.warn(`Row ${i + 2}: Invalid date format for ${header}: ${value}`);
            }
          }
          
          rowData[header] = value;
        });

        // Add metadata
        rowData.created_at = new Date().toISOString();
        rowData.updated_at = new Date().toISOString();
        
        processedData.push(rowData);

      } catch (rowError) {
        console.error(`Error processing row ${i + 2}:`, rowError);
        errorCount++;
      }
    }

    if (processedData.length === 0) {
      return res.status(400).json({ 
        error: 'No valid data rows to process',
        errorCount 
      });
    }

    // Insert data into Supabase
    let result;
    if (mode === 'replace') {
      // Delete existing data first
      const { error: deleteError } = await supabase
        .from(tableName)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows

      if (deleteError) {
        console.error('Error clearing table:', deleteError);
        return res.status(500).json({ error: 'Failed to clear existing data' });
      }
    }

    // Insert new data in batches
    const batchSize = 100;
    let insertedCount = 0;
    let insertErrors = 0;

    for (let i = 0; i < processedData.length; i += batchSize) {
      const batch = processedData.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from(tableName)
        .insert(batch)
        .select('id');

      if (error) {
        console.error(`Batch insert error (rows ${i + 1}-${Math.min(i + batchSize, processedData.length)}):`, error);
        insertErrors += batch.length;
      } else {
        insertedCount += data.length;
      }
    }

    res.status(200).json({
      success: true,
      message: 'CSV processing completed',
      stats: {
        totalRows: dataRows.length,
        processedRows: processedData.length,
        insertedRows: insertedCount,
        parseErrors: errorCount,
        insertErrors: insertErrors,
        tableName: tableName,
        mode: mode
      }
    });

  } catch (error) {
    console.error('CSV processing error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to process CSV data'
    });
  }
}

// Helper functions for admin tools
async function getUploads(req, res) {
  try {
    const { data, error } = await supabase
      .from('user_uploads')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch uploads' });
    }

    res.status(200).json({ uploads: data });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function healthCheck(req, res) {
  try {
    const startTime = Date.now();
    
    // Test database connection
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    const responseTime = Date.now() - startTime;

    if (error) {
      return res.status(500).json({ 
        status: 'unhealthy',
        error: error.message,
        responseTime
      });
    }

    res.status(200).json({
      status: 'healthy',
      responseTime,
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'unhealthy',
      error: error.message 
    });
  }
}

async function getSystemStats(req, res) {
  try {
    const [usersResult, bookingsResult, quotesResult] = await Promise.all([
      supabase.from('users').select('count'),
      supabase.from('bookings').select('count'),
      supabase.from('quote_requests').select('count')
    ]);

    res.status(200).json({
      users: usersResult.data?.[0]?.count || 0,
      bookings: bookingsResult.data?.[0]?.count || 0,
      quotes: quotesResult.data?.[0]?.count || 0,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get system stats' });
  }
}

async function updateUpload(req, res) {
  try {
    const { id, status, notes } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Upload ID is required' });
    }

    const { data, error } = await supabase
      .from('user_uploads')
      .update({ 
        status,
        notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to update upload' });
    }

    res.status(200).json({ success: true, upload: data });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function deleteUpload(req, res) {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Upload ID is required' });
    }

    const { error } = await supabase
      .from('user_uploads')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(500).json({ error: 'Failed to delete upload' });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function backupDeals(req, res) {
  try {
    const { data, error } = await supabase
      .from('cruise_deals')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: 'Failed to backup deals' });
    }

    res.status(200).json({ 
      success: true, 
      backup: data,
      count: data.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function getVerifications(req, res) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, verification_status, verification_documents, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch verifications' });
    }

    res.status(200).json({ verifications: data });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function updateVerification(req, res) {
  try {
    const { userId, status, notes } = req.body;

    if (!userId || !status) {
      return res.status(400).json({ error: 'User ID and status are required' });
    }

    const { data, error } = await supabase
      .from('users')
      .update({ 
        verification_status: status,
        verification_notes: notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to update verification' });
    }

    res.status(200).json({ success: true, user: data });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}
module.exports = handler;
