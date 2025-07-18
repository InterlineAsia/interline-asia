#!/usr/bin/env node

/**
 * Singapore Travel Industry Lead Generation Bot
 * Searches for travel-related companies in Singapore and extracts contact information
 */

require('dotenv').config({ path: '../.env.local' });
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const { Parser } = require('json2csv');

// Environment validation
if (!process.env.SERPAPI_API_KEY) {
  console.error('❌ SERPAPI_API_KEY not found in environment variables');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nxreyyxbuwxjfmtvdkji.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// SerpAPI configuration
const SERPAPI_CONFIG = {
  baseURL: 'https://serpapi.com/search',
  key: process.env.SERPAPI_API_KEY,
  engine: 'google',
  location: 'Singapore',
  gl: 'sg',
  hl: 'en'
};

// Search categories for Singapore travel industry
const SEARCH_CATEGORIES = [
  {
    name: 'Airlines',
    queries: [
      'airlines Singapore contact',
      'Singapore airlines companies',
      'aviation companies Singapore',
      'airline offices Singapore'
    ]
  },
  {
    name: 'Travel Associations',
    queries: [
      'travel associations Singapore',
      'tourism associations Singapore',
      'travel industry organizations Singapore',
      'Singapore travel trade associations'
    ]
  },
  {
    name: 'Tourism Boards',
    queries: [
      'tourism boards Singapore',
      'Singapore tourism promotion board',
      'destination marketing organizations Singapore',
      'tourism development Singapore'
    ]
  },
  {
    name: 'Car Rental Companies',
    queries: [
      'car rental companies Singapore',
      'vehicle rental Singapore',
      'car hire Singapore companies',
      'Singapore car rental services'
    ]
  },
  {
    name: 'Hotels',
    queries: [
      'hotels Singapore contact',
      'hotel chains Singapore',
      'hospitality companies Singapore',
      'Singapore hotel management'
    ]
  },
  {
    name: 'Travel Wholesalers',
    queries: [
      'travel wholesalers Singapore',
      'tour operators Singapore',
      'travel agents Singapore',
      'Singapore travel companies'
    ]
  }
];

// Email regex pattern
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;

// Rate limiting
const RATE_LIMIT_DELAY = 2000; // 2 seconds between requests
const MAX_RETRIES = 3;

/**
 * Sleep function for rate limiting
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Extract emails from text content
 */
function extractEmails(text) {
  if (!text) return [];
  const emails = text.match(EMAIL_REGEX) || [];
  return [...new Set(emails)]; // Remove duplicates
}

/**
 * Fetch and parse webpage content for emails
 */
async function scrapeWebsiteForEmails(url, retries = 0) {
  try {
    // console.log(`🔍 Scraping website: ${url}`);
    
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    
    // Remove script and style elements
    $('script, style').remove();
    
    // Get text content
    const textContent = $('body').text();
    
    // Extract emails
    const emails = extractEmails(textContent);
    
    // console.log(`📧 Found ${emails.length} emails on ${url}`);
    return emails;
    
  } catch (error) {
    if (retries < MAX_RETRIES) {
      // console.log(`⚠️ Retrying ${url} (attempt ${retries + 1}/${MAX_RETRIES})`);
      await sleep(RATE_LIMIT_DELAY);
      return scrapeWebsiteForEmails(url, retries + 1);
    }
    
    // console.log(`❌ Failed to scrape ${url}: ${error.message}`);
    return [];
  }
}

/**
 * Search Google via SerpAPI
 */
async function searchGoogle(query, category) {
  try {
    // console.log(`🔎 Searching: "${query}" (${category})`);
    
    const params = {
      ...SERPAPI_CONFIG,
      q: query,
      num: 20 // Get more results
    };
    
    const response = await axios.get(SERPAPI_CONFIG.baseURL, { params });
    
    if (response.data.error) {
      throw new Error(response.data.error);
    }
    
    return response.data.organic_results || [];
    
  } catch (error) {
    // console.error(`❌ Search error for "${query}":`, error.message);
    return [];
  }
}

/**
 * Process search results and extract leads
 */
async function processSearchResults(results, query, category) {
  const leads = [];
  
  for (const result of results) {
    try {
      const { title, link, snippet } = result;
      
      if (!title || !link) continue;
      
      // Skip non-relevant domains
      if (link.includes('facebook.com') || 
          link.includes('linkedin.com') || 
          link.includes('twitter.com') ||
          link.includes('instagram.com') ||
          link.includes('youtube.com') ||
          link.includes('wikipedia.org')) {
        continue;
      }
      
      // console.log(`📄 Processing: ${title}`);
      
      // Extract emails from snippet first
      let emails = extractEmails(snippet);
      
      // If no emails in snippet, try scraping the website
      if (emails.length === 0) {
        emails = await scrapeWebsiteForEmails(link);
        await sleep(RATE_LIMIT_DELAY); // Rate limiting
      }
      
      // Create lead entry for each email found
      for (const email of emails) {
        const lead = {
          company_name: title.replace(/[^\w\s-]/g, '').trim(),
          website: link,
          email: email.toLowerCase(),
          source_url: link,
          category: category,
          search_query: query,
          timestamp: new Date().toISOString()
        };
        
        leads.push(lead);
        // console.log(`✅ Lead found: ${lead.company_name} - ${lead.email}`);
      }
      
      // Even if no emails found, save the company info
      if (emails.length === 0) {
        const lead = {
          company_name: title.replace(/[^\w\s-]/g, '').trim(),
          website: link,
          email: null,
          source_url: link,
          category: category,
          search_query: query,
          timestamp: new Date().toISOString()
        };
        
        leads.push(lead);
        // console.log(`📝 Company saved (no email): ${lead.company_name}`);
      }
      
    } catch (error) {
      // console.error(`❌ Error processing result:`, error.message);
    }
  }
  
  return leads;
}

/**
 * Convert leads to CSV format using json2csv
 */
function convertLeadsToCSV(leads) {
  if (leads.length === 0) return '';
  
  // Define CSV fields
  const fields = [
    { label: 'company_name', value: 'company_name' },
    { label: 'email', value: 'email' },
    { label: 'source_url', value: 'source_url' },
    { label: 'category', value: 'category' },
    { label: 'search_query', value: 'search_query' },
    { label: 'timestamp', value: 'timestamp' }
  ];
  
  // Create parser
  const parser = new Parser({ fields });
  
  // Convert to CSV
  return parser.parse(leads);
}

/**
 * Save leads to CSV file
 */
async function saveLeadsToCSV(leads, filePath = 'output/leads_singapore.csv') {
  try {
    console.log(`🔄 Preparing to save ${leads.length} leads to CSV...`);
    
    // Ensure output directory exists
    const outputDir = path.dirname(filePath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      console.log(`📁 Created directory: ${outputDir}`);
    }
    
    // Remove existing file if it exists
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🗑️  Removed existing file: ${filePath}`);
    }
    
    // Convert leads to CSV using json2csv
    let csvContent;
    if (leads.length === 0) {
      // Create empty CSV with headers only
      csvContent = 'company_name,email,source_url,category,search_query,timestamp\n';
    } else {
      csvContent = convertLeadsToCSV(leads);
    }
    
    // Write to file
    fs.writeFileSync(filePath, csvContent, 'utf8');
    
    // Verify file was created
    if (fs.existsSync(filePath)) {
      console.log(`✅ Saved ${leads.length} leads to ${filePath}`);
    } else {
      console.error(`❌ Failed to create file: ${filePath}`);
    }
    
  } catch (error) {
    console.error(`❌ Error saving CSV file: ${error.message}`);
    console.error(`❌ Stack trace:`, error.stack);
  }
}

/**
 * Save leads to Supabase
 */
async function saveLeadsToSupabase(leads) {
  if (leads.length === 0) {
    return;
  }
  
  try {
    // Create table if it doesn't exist
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS leads_singapore (
        id SERIAL PRIMARY KEY,
        company_name TEXT,
        website TEXT,
        email TEXT,
        source_url TEXT,
        category TEXT,
        search_query TEXT,
        timestamp TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_leads_singapore_email ON leads_singapore(email);
      CREATE INDEX IF NOT EXISTS idx_leads_singapore_category ON leads_singapore(category);
      CREATE INDEX IF NOT EXISTS idx_leads_singapore_timestamp ON leads_singapore(timestamp);
    `;
    
    await supabase.rpc('exec_sql', { sql: createTableQuery });
    
    // Insert leads in batches
    const batchSize = 50;
    let successCount = 0;
    
    for (let i = 0; i < leads.length; i += batchSize) {
      const batch = leads.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from('leads_singapore')
        .upsert(batch, { 
          onConflict: 'email,website',
          ignoreDuplicates: true 
        });
      
      if (error) {
        // console.error(`❌ Batch insert error:`, error);
      } else {
        successCount += batch.length;
        // console.log(`✅ Saved batch ${Math.floor(i/batchSize) + 1}: ${batch.length} leads`);
      }
    }
    
    console.log(`💾 Saved ${successCount} leads to Supabase`);
    
  } catch (error) {
    console.error('❌ Error saving to Supabase:', error);
  }
}

/**
 * Main execution function
 */
async function main() {
  console.log('🚀 Starting Singapore Travel Industry Lead Generation Bot');
  console.log('=' .repeat(60));
  
  const startTime = Date.now();
  let totalLeads = [];
  
  try {
    // Process each category
    for (const category of SEARCH_CATEGORIES) {
      console.log(`\n📂 Processing category: ${category.name}`);
      console.log('-'.repeat(40));
      
      let categoryLeads = [];
      
      // Process each query in the category
      for (const query of category.queries) {
        await sleep(RATE_LIMIT_DELAY); // Rate limiting
        
        const results = await searchGoogle(query, category.name);
        const leads = await processSearchResults(results, query, category.name);
        
        categoryLeads = categoryLeads.concat(leads);
        
        // console.log(`📊 Query "${query}" found ${leads.length} leads`);
      }
      
      // Remove duplicates within category
      const uniqueLeads = categoryLeads.filter((lead, index, self) => 
        index === self.findIndex(l => l.email === lead.email && l.website === lead.website)
      );
      
      console.log(`📈 ${category.name}: ${uniqueLeads.length} leads`);
      totalLeads = totalLeads.concat(uniqueLeads);
    }
    
    // Remove global duplicates
    const finalLeads = totalLeads.filter((lead, index, self) => 
      index === self.findIndex(l => l.email === lead.email && l.website === lead.website)
    );
    
    console.log(`\n🎯 Total unique leads found: ${finalLeads.length}`);
    
    // Save to Supabase
    await saveLeadsToSupabase(finalLeads);
    
    // Save to CSV file
    await saveLeadsToCSV(finalLeads, 'output/leads_singapore.csv');
    
    // Summary
    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 FINAL SUMMARY');
    console.log('='.repeat(60));
    console.log(`⏱️  Total execution time: ${duration} seconds`);
    console.log(`🎯 Total leads found: ${finalLeads.length}`);
    console.log(`📧 Leads with emails: ${finalLeads.filter(l => l.email).length}`);
    console.log(`🏢 Companies without emails: ${finalLeads.filter(l => !l.email).length}`);
    
    // Category breakdown
    console.log('\n📈 Category Breakdown:');
    SEARCH_CATEGORIES.forEach(cat => {
      const count = finalLeads.filter(l => l.category === cat.name).length;
      console.log(`   ${cat.name}: ${count} leads`);
    });
    
    console.log('\n✅ Lead generation completed successfully!');
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n⚠️  Process interrupted. Cleaning up...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n⚠️  Process terminated. Cleaning up...');
  process.exit(0);
});

// Run the bot
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = { main, searchGoogle, processSearchResults, saveLeadsToSupabase, saveLeadsToCSV, convertLeadsToCSV };