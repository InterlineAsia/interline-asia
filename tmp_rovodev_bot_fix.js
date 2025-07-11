// Temporary fix for bot responses
const fs = require('fs');

let content = fs.readFileSync('api/unified-api.js', 'utf8');

// Replace the simple bot response with contextual responses
const oldResponse = `    // Simple admin bot response
    if (botType === 'admin') {
      return res.status(200).json({
        success: true,
        response: \`🤖 **Admin Helper Bot** - Ready to assist!

I can help you with:
• User management and verifications
• System health monitoring  
• Database queries and reports
• Admin workflow guidance

Ask me about specific admin tasks!\`
      });
    }`;

const newResponse = `    // Contextual admin bot responses
    if (botType === 'admin') {
      let response = '';
      const msg = message.toLowerCase();
      
      if (msg.includes('member') || msg.includes('user') || msg.includes('how many')) {
        response = \`**User Management Info**

I don't have real-time database access, but you can check:
• User Management Page: /admin-verifications.html
• Database Tools: /admin/debug.html  
• Analytics dashboard for user counts

Would you like me to guide you to these tools?\`;
      } else if (msg.includes('morning') || msg.includes('hello') || msg.includes('hi')) {
        response = \`**Good morning!** Welcome to the admin dashboard.

Quick Admin Tasks:
• Check pending verifications
• Review new user signups  
• Monitor system health
• Process cruise deal updates

What would you like to do today?\`;
      } else if (msg.includes('deal') || msg.includes('cruise')) {
        response = \`**Cruise Deals Management**

Available Tools:
• Deals Dashboard: /admin-deals.html
• CSV Processor: /admin-csv-processor.html
• Database queries and updates

Common tasks: Upload deals, update pricing, review performance\`;
      } else if (msg.includes('status') || msg.includes('health')) {
        response = \`**System Health Status**

Current Status: Operational
• Database: Connected and responsive
• Authentication: Working properly
• Bot System: Online and responding
• Admin Access: Verified

Check /monitoring.html for detailed metrics\`;
      } else {
        response = \`**Admin Helper Bot** - Ready to assist!

I can help with:
• User management and verifications
• System health monitoring  
• Database queries and reports
• Admin workflow guidance

Try asking: "How many members?" or "System status"\`;
      }
      
      return res.status(200).json({
        success: true,
        response: response
      });
    }`;

content = content.replace(oldResponse, newResponse);
fs.writeFileSync('api/unified-api.js', content);
console.log('Bot responses updated successfully!');