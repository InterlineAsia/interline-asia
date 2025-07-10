// Bot Manager for Interline Asia - Handles Gemini API integration

import { GeminiClient } from './core/gemini-client.js';

export class BotManager {
  constructor() {
    this.geminiClient = new GeminiClient();
  }

  async processRequest(botType, requestData) {
    try {
      const message = requestData.message;
      
      // Prepare Gemini API request
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`;
      
      const requestBody = {
        contents: [
          {
            role: "user",
            parts: [{ text: message }]
          }
        ]
      };

      // Call Gemini API
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status} - ${response.statusText}`);
      }

      const result = await response.json();
      
      // Extract reply text from response
      const botReply = result.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, no response.";
      
      return {
        response: botReply
      };
      
    } catch (error) {
      console.error("Bot Error:", error);
      return {
        response: "I'm experiencing technical difficulties. Please try again later."
      };
    }
  }

  healthCheck() {
    return {
      status: 'ok',
      bots: ['admin', 'booking', 'lead', 'followup'],
      gemini_status: 'connected',
      timestamp: new Date().toISOString()
    };
  }
}

// Singleton instance
let botManagerInstance = null;

export function getBotManager() {
  if (!botManagerInstance) {
    botManagerInstance = new BotManager();
  }
  return botManagerInstance;
}