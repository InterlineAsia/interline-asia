// Configuration management for lead generation system
import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Supabase
  supabase: {
    url: process.env.SUPABASE_URL || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },

  // SerpAPI
  serpApi: {
    key: process.env.SERPAPI_KEY || '',
    baseUrl: 'https://serpapi.com/search',
  },

  // Brevo
  brevo: {
    apiKey: process.env.BREVO_API_KEY || '',
    baseUrl: 'https://api.brevo.com/v3',
    sender: {
      email: process.env.BREVO_SENDER_EMAIL || 'partnerships@interlineasia.com',
      name: process.env.BREVO_SENDER_NAME || 'Interline Asia Partnerships',
    },
  },

  // Search settings
  search: {
    keywords: (process.env.SEARCH_KEYWORDS || 'travel agency,cruise specialist').split(','),
    domains: (process.env.SEARCH_DOMAINS || 'travel.com.au,cruises.com.au').split(','),
    maxDomainsPerSearch: parseInt(process.env.MAX_DOMAINS_PER_SEARCH || '50'),
    maxEmailsPerDomain: parseInt(process.env.MAX_EMAILS_PER_DOMAIN || '5'),
    location: 'Australia',
    language: 'en',
    resultsPerPage: 100,
  },

  // Rate limiting
  rateLimiting: {
    requestsPerMinute: parseInt(process.env.REQUESTS_PER_MINUTE || '30'),
    emailsPerHour: parseInt(process.env.EMAILS_PER_HOUR || '100'),
  },

  // Scraping settings
  scraping: {
    userAgent: 'Mozilla/5.0 (compatible; InterlineAsia-Bot/1.0; +https://interlineasia.com/bot)',
    timeout: 10000, // 10 seconds
    maxRetries: 3,
    retryDelay: 2000, // 2 seconds
  },

  // Debug
  debug: process.env.DEBUG === 'true',
};

// Validation
export function validateConfig(): string[] {
  const errors: string[] = [];

  if (!config.supabase.url) errors.push('SUPABASE_URL is required');
  if (!config.supabase.serviceRoleKey) errors.push('SUPABASE_SERVICE_ROLE_KEY is required');
  if (!config.serpApi.key) errors.push('SERPAPI_KEY is required');
  if (!config.brevo.apiKey) errors.push('BREVO_API_KEY is required');

  return errors;
}