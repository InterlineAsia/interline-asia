// Backup and Restore Deals API
// File: /api/backup-deals.js

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

  const fs = require('fs').promises;
  const path = require('path');

  try {
    if (req.method === 'POST') {
      // Create backup
      const { createDealsBackup } = require('../backend.js');
      const backupPath = await createDealsBackup();
      
      res.status(200).json({
        success: true,
        message: 'Backup created successfully',
        backupPath,
        timestamp: new Date().toISOString()
      });

    } else if (req.method === 'GET') {
      // List available backups
      const backupDir = path.join(process.cwd(), 'public', 'data', 'backups');
      
      try {
        const files = await fs.readdir(backupDir);
        const backups = [];
        
        for (const file of files) {
          if (file.endsWith('.json')) {
            const filePath = path.join(backupDir, file);
            const stats = await fs.stat(filePath);
            const content = await fs.readFile(filePath, 'utf8');
            const deals = JSON.parse(content);
            
            backups.push({
              fileName: file,
              created: stats.birthtime,
              size: stats.size,
              dealCount: deals.length,
              filePath: `/data/backups/${file}`
            });
          }
        }
        
        // Sort by creation date (newest first)
        backups.sort((a, b) => new Date(b.created) - new Date(a.created));
        
        res.status(200).json({
          success: true,
          backups
        });
        
      } catch (error) {
        res.status(200).json({
          success: true,
          backups: [],
          message: 'No backups found'
        });
      }

    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Error handling backup request:', error);
    res.status(500).json({ 
      error: 'Failed to handle backup request', 
      details: error.message 
    });
  }
}