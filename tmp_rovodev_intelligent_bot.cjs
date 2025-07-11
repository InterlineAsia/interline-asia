const fs = require('fs');

let content = fs.readFileSync('api/unified-api.js', 'utf8');

// Replace the simple bot response with intelligent one
const oldCode = `    // Intelligent admin bot with database access
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

const newCode = `    // Intelligent admin bot with database access
    if (botType === 'admin') {
      try {
        const intelligentResponse = await getIntelligentResponse(message);
        return res.status(200).json({
          success: true,
          response: intelligentResponse
        });
      } catch (error) {
        console.error('Intelligent bot error:', error);
        return res.status(200).json({
          success: true,
          response: \`**Admin Helper Bot** - Ready to assist!

I can help you with real-time data about:
• Member statistics and analytics
• Today's signups and activity
• Member demographics and locations  
• Available cruise deals
• Document and verification status
• System health and functions

Ask me anything specific about your system!\`
        });
      }
    }`;

content = content.replace(oldCode, newCode);
fs.writeFileSync('api/unified-api.js', content);
console.log('Intelligent bot integration complete!');