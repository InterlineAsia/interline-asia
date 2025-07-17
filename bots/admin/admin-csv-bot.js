// Admin CSV Bot - Enhanced with Auto-Detection and Learning
// Monitors, ingests, and learns from new cruise CSV uploads

import BaseBot from '../core/base-bot.js';

class AdminCSVBot extends BaseBot {
  constructor() {
    super('AdminCSVBot', 'admin');
    this.capabilities = [
      'csv_auto_detection',
      'csv_ingestion', 
      'learning_updates',
      'intelligence_refresh'
    ];
  }

  async processRequest(requestData, context = {}) {
    try {
      const message = requestData.message?.toLowerCase() || '';
      
      // CSV-related queries
      if (this.isCSVQuery(message)) {
        return await this.handleCSVQuery(message, requestData, context);
      }
      
      // Learning status queries
      if (this.isLearningQuery(message)) {
        return await this.handleLearningQuery(message, requestData, context);
      }
      
      // Auto-detection queries
      if (this.isAutoDetectionQuery(message)) {
        return await this.handleAutoDetectionQuery(message, requestData, context);
      }
      
      // Default to parent class
      return await super.processRequest(requestData, context);
      
    } catch (error) {
      console.error('AdminCSVBot error:', error);
      return {
        response: 'I encountered an issue with CSV processing. Please try again or check the system logs.',
        responseType: 'error'
      };
    }
  }

  // Check if query is CSV-related
  isCSVQuery(message) {
    const csvKeywords = [
      'csv', 'upload', 'file', 'deals', 'cruise data',
      'import', 'ingest', 'process', 'parse'
    ];
    return csvKeywords.some(keyword => message.includes(keyword));
  }

  // Check if query is learning-related
  isLearningQuery(message) {
    const learningKeywords = [
      'learn', 'learning', 'knowledge', 'update', 'refresh',
      'intelligence', 'bot', 'smart', 'train'
    ];
    return learningKeywords.some(keyword => message.includes(keyword));
  }

  // Check if query is auto-detection related
  isAutoDetectionQuery(message) {
    const detectionKeywords = [
      'detect', 'scan', 'monitor', 'watch', 'auto',
      'automatic', 'new files', 'check'
    ];
    return detectionKeywords.some(keyword => message.includes(keyword));
  }

  // Handle CSV-related queries
  async handleCSVQuery(message, requestData, context) {
    if (message.includes('scan') || message.includes('detect') || message.includes('new')) {
      return await this.scanForNewCSVs();
    }
    
    if (message.includes('status') || message.includes('learning')) {
      return await this.getLearningStatus();
    }
    
    if (message.includes('force') || message.includes('relearn') || message.includes('refresh')) {
      return await this.forceRelearn();
    }
    
    return {
      response: `🤖 **Admin CSV Intelligence**

I can help you with:
• **Scan for new CSVs**: "scan for new csv files"
• **Check learning status**: "what's the learning status?"
• **Force relearn**: "force relearn all csv files"
• **Process specific file**: "process river.csv"

What would you like me to do?`,
      responseType: 'csv_help'
    };
  }

  // Handle learning queries
  async handleLearningQuery(message, requestData, context) {
    if (message.includes('status')) {
      return await this.getLearningStatus();
    }
    
    if (message.includes('update') || message.includes('refresh')) {
      return await this.scanForNewCSVs();
    }
    
    return {
      response: `🧠 **Learning System Status**

The cruise bot intelligence system continuously learns from:
• New CSV uploads (auto-detected)
• Updated cruise deals and pricing
• New cruise lines and destinations
• Enhanced filtering capabilities

Use "scan for new csvs" to trigger immediate learning.`,
      responseType: 'learning_info'
    };
  }

  // Handle auto-detection queries
  async handleAutoDetectionQuery(message, requestData, context) {
    return await this.scanForNewCSVs();
  }

  // Scan for new CSV files
  async scanForNewCSVs() {
    try {
      const response = await fetch('/api/admin-csv-intelligence', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'scan-for-new-csvs'
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        return {
          response: this.formatScanResults(result),
          responseType: 'csv_scan_success',
          data: result
        };
      } else {
        return {
          response: `❌ **CSV Scan Failed**

${result.message || 'Unknown error occurred'}

Please check the system logs for more details.`,
          responseType: 'csv_scan_error'
        };
      }

    } catch (error) {
      console.error('CSV scan error:', error);
      return {
        response: `❌ **CSV Scan Error**

Failed to scan for new CSV files: ${error.message}

Please check:
• File permissions
• Directory access
• API connectivity`,
        responseType: 'csv_scan_error'
      };
    }
  }

  // Get learning status
  async getLearningStatus() {
    try {
      const response = await fetch('/api/admin-csv-intelligence', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'get-learning-status'
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        return {
          response: this.formatLearningStatus(result.status),
          responseType: 'learning_status',
          data: result.status
        };
      } else {
        return {
          response: `❌ **Learning Status Error**

${result.error || 'Could not retrieve learning status'}`,
          responseType: 'learning_status_error'
        };
      }

    } catch (error) {
      console.error('Learning status error:', error);
      return {
        response: `❌ **Learning Status Error**

Failed to get learning status: ${error.message}`,
        responseType: 'learning_status_error'
      };
    }
  }

  // Force relearn all CSV files
  async forceRelearn() {
    try {
      const response = await fetch('/api/admin-csv-intelligence', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'force-relearn'
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        return {
          response: `🔄 **Force Relearn Complete**

${this.formatScanResults(result)}

All CSV files have been reprocessed and the intelligence system has been updated.`,
          responseType: 'force_relearn_success',
          data: result
        };
      } else {
        return {
          response: `❌ **Force Relearn Failed**

${result.message || 'Unknown error occurred'}`,
          responseType: 'force_relearn_error'
        };
      }

    } catch (error) {
      console.error('Force relearn error:', error);
      return {
        response: `❌ **Force Relearn Error**

Failed to force relearn: ${error.message}`,
        responseType: 'force_relearn_error'
      };
    }
  }

  // Format scan results for display
  formatScanResults(result) {
    if (result.processedFiles === 0) {
      return `✅ **CSV Scan Complete**

📊 **Results:**
• Found ${result.foundFiles} CSV files
• No new files to process
• System is up to date

All cruise data is current and the intelligence system is ready.`;
    }

    const summary = result.summary;
    let response = `✅ **CSV Auto-Detection & Learning Complete**

📥 **Files Processed:**
• Found: ${result.foundFiles} CSV files
• Processed: ${result.processedFiles} new/updated files
• Errors: ${result.errors}

🧠 **Learning Summary:**
• Total Deals: ${summary.totalDeals}
• New Deals: ${summary.dealsInserted}
• Updated Deals: ${summary.dealsUpdated}

📊 **Intelligence Updates:**`;

    if (summary.newCruiseLines && summary.newCruiseLines.length > 0) {
      response += `\n• Cruise Lines: ${summary.newCruiseLines.slice(0, 5).join(', ')}`;
      if (summary.newCruiseLines.length > 5) {
        response += ` (+${summary.newCruiseLines.length - 5} more)`;
      }
    }

    if (summary.newRegions && summary.newRegions.length > 0) {
      response += `\n• Regions: ${summary.newRegions.slice(0, 5).join(', ')}`;
      if (summary.newRegions.length > 5) {
        response += ` (+${summary.newRegions.length - 5} more)`;
      }
    }

    response += `\n\n🤖 **Bot Intelligence Updated:**
• Price filters refreshed
• Destination data updated  
• Cruise line recognition enhanced
• Duration ranges recalculated

The cruise bot can now answer questions about all newly added deals!`;

    return response;
  }

  // Format learning status for display
  formatLearningStatus(status) {
    return `🧠 **Learning System Status**

📊 **Current Knowledge:**
• Total Deals: ${status.totalDeals.toLocaleString()}
• Processing: ${status.isProcessing ? 'Active' : 'Idle'}
• Last Update: ${new Date().toLocaleString()}

📁 **Monitored Directories:**
${status.watchDirectories.map(dir => `• ${dir}`).join('\n')}

📋 **Supported Formats:**
${status.supportedFormats.map(format => `• ${format}`).join('\n')}

🔍 **Intelligence Indexes:**
${status.intelligenceIndexes.length > 0 ? 
  status.intelligenceIndexes.map(idx => `• ${idx.index_name}: Updated ${new Date(idx.last_updated).toLocaleDateString()}`).join('\n') :
  '• No indexes found'
}

✅ **System Status:** ${status.isProcessing ? 'Processing files...' : 'Ready for new uploads'}`;
  }
}

export default AdminCSVBot;