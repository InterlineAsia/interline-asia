#!/usr/bin/env node

// 🤖 Lead Generation Bot #1 - Singapore Travel Industry
// Finds travel-related leads in Singapore using SerpAPI and stores in Supabase

require('dotenv').config({ path: '../.env.local' });

// Also try loading from current directory as fallback
if (!process.env.SERPAPI_API_KEY) {
  require('dotenv').config();
}
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

// Configuration
const config = {
  serpApi: {
    key: process.env.SERPAPI_API_KEY,
    baseUrl: 'https://serpapi.com/search'
  },
  supabase: {
    url: process.env.SUPABASE_URL,
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY
  },
  targetCountry: process.env.TARGET_COUNTRY || 'Singapore',
  maxResultsPerSearch: 20,
  requestDelay: 2000, // 2 seconds between requests
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
};

// Initialize Supabase client
const supabase = createClient(config.supabase.url, config.supabase.serviceKey);

// Search categories and keywords for Singapore travel industry
const searchCategories = [
  {
    category: 'Travel Agencies',
    keywords: [
      'travel agency Singapore site:.sg',
      'travel agent Singapore site:.sg',
      'holiday packages Singapore site:.sg',
      'vacation packages Singapore site:.sg'
    ]
  },
  {
    category: 'Cruise Specialists',
    keywords: [
      'cruise specialist Singapore site:.sg',
      'cruise packages Singapore site:.sg',
      'cruise booking Singapore site:.sg'
    ]
  },
  {
    category: 'Group Tour Providers',
    keywords: [
      'group tours Singapore site:.sg',
      'tour operator Singapore site:.sg',
      'guided tours Singapore site:.sg'
    ]
  },
  {
    category: 'Airlines',
    keywords: [
      'airlines Singapore site:.sg',
      'charter flights Singapore site:.sg',
      'regional airline Singapore site:.sg'
    ]
  },
  {
    category: 'Tourism Boards',
    keywords: [
      'tourism board Singapore site:.sg',
      'DMC Singapore site:.sg',
      'destination management Singapore site:.sg'
    ]
  },
  {
    category: 'Car Rental',
    keywords: [
      'car rental Singapore site:.sg',
      'vehicle rental Singapore site:.sg',
      'car hire Singapore site:.sg'
    ]
  },
  {
    category: 'Hotels & Resorts',
    keywords: [
      'hotel chain Singapore site:.sg',
      'resort Singapore site:.sg',
      'accommodation Singapore site:.sg'
    ]
  },
  {
    category: 'Travel Wholesalers',
    keywords: [
      'travel wholesaler Singapore site:.sg',
      'travel consolidator Singapore site:.sg',
      'B2B travel Singapore site:.sg'
    ]
  },
  {
    category: 'Corporate Travel',
    keywords: [
      'corporate travel Singapore site:.sg',
      'business travel Singapore site:.sg',
      'MICE Singapore site:.sg'
    ]
  },
  {
    category: 'Luxury Travel',
    keywords: [
      'luxury travel Singapore site:.sg',
      'premium travel Singapore site:.sg',
      'high-end travel Singapore site:.sg'
    ]
  },
  {
    category: 'Adventure Tours',
    keywords: [
      'adventure tours Singapore site:.sg',
      'outdoor activities Singapore site:.sg',
      'eco tours Singapore site:.sg'
    ]
  }
];

// Statistics tracking
const stats = {
  searchesPerformed: 0,
  websitesScanned: 0,
  emailsFound: 0,
  leadsInserted: 0,
  duplicatesSkipped: 0,
  errors: 0
};

// Email regex pattern
const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;

// Delay function for rate limiting
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Extract domain from URL
function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return '';
  }
}

// Validate email format
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

// Filter business emails (exclude generic ones)
function isBusinessEmail(email, domain) {
  const emailLower = email.toLowerCase();
  
  // Skip generic emails
  const genericEmails = [
    'noreply', 'no-reply', 'donotreply', 'admin', 'webmaster', 
    'postmaster', 'root', 'newsletter', 'marketing@', 'sales@'
  ];
  
  if (genericEmails.some(generic => emailLower.includes(generic))) {
    return false;
  }
  
  // Prefer emails from the same domain
  if (domain && emailLower.includes(domain.split('.')[0])) {
    return true;
  }
  
  // Accept business-looking emails
  const businessIndicators = [
    'contact', 'info', 'enquiry', 'inquiry', 'booking', 'reservations',
    'travel', 'cruise', 'holiday', 'tour', 'manager', 'director'
  ];
  
  return businessIndicators.some(indicator => emailLower.includes(indicator));
}

// Search Google via SerpAPI
async function searchGoogle(query) {
  try {
    console.log(`🔍 Searching: ${query}`);
    
    const params = {
      engine: 'google',
      q: query,
      location: 'Singapore',
      hl: 'en',
      gl: 'sg',
      num: config.maxResultsPerSearch,
      api_key: config.serpApi.key
    };
    
    const response = await axios.get(config.serpApi.baseUrl, { params, timeout: 30000 });
    
    if (response.data.error) {
      throw new Error(`SerpAPI error: ${response.data.error}`);
    }
    
    stats.searchesPerformed++;
    
    const organicResults = response.data.organic_results || [];
    const websites = organicResults
      .map(result => ({
        url: result.link,
        title: result.title,
        domain: extractDomain(result.link)
      }))
      .filter(site => site.domain && site.domain.endsWith('.sg'));
    
    console.log(`   Found ${websites.length} Singapore websites`);
    return websites;
    
  } catch (error) {
    console.error(`❌ Search failed for "${query}":`, error.message);
    stats.errors++;
    return [];
  }
}

// Scrape emails from website
async function scrapeWebsite(website, category) {
  try {
    console.log(`   📧 Scraping: ${website.domain}`);
    stats.websitesScanned++;
    
    const response = await axios.get(website.url, {
      timeout: 15000,
      headers: {
        'User-Agent': config.userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      },
      maxRedirects: 3
    });
    
    if (response.status !== 200) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    // Extract emails from page content
    const pageText = response.data;
    const emailMatches = pageText.match(emailRegex) || [];
    
    const validEmails = emailMatches
      .map(email => email.toLowerCase())
      .filter(email => isValidEmail(email))
      .filter(email => isBusinessEmail(email, website.domain))
      .filter((email, index, arr) => arr.indexOf(email) === index); // Remove duplicates
    
    if (validEmails.length > 0) {
      console.log(`      ✅ Found ${validEmails.length} business emails`);
      stats.emailsFound += validEmails.length;
      
      // Store leads in database
      for (const email of validEmails) {
        await storeLead({
          name: null, // Will be extracted later if needed
          email: email,
          company: website.title || website.domain,
          website: website.url,
          category: category,
          country: config.targetCountry
        });
      }
    }
    
    return validEmails;
    
  } catch (error) {
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      console.log(`      ⚠️ Website not accessible: ${website.domain}`);
    } else if (error.response?.status === 403) {
      console.log(`      ⚠️ Access forbidden: ${website.domain}`);
    } else if (error.response?.status === 404) {
      console.log(`      ⚠️ Page not found: ${website.domain}`);
    } else {
      console.log(`      ⚠️ Scraping failed for ${website.domain}: ${error.message}`);
    }
    stats.errors++;
    return [];
  }
}

// Store lead in Supabase
async function storeLead(leadData) {
  try {
    // Check if email already exists
    const { data: existing } = await supabase
      .from('leads')
      .select('email')
      .eq('email', leadData.email)
      .single();
    
    if (existing) {
      stats.duplicatesSkipped++;
      return false;
    }
    
    // Insert new lead
    const { data, error } = await supabase
      .from('leads')
      .insert({
        ...leadData,
        timestamp: new Date().toISOString()
      });
    
    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        stats.duplicatesSkipped++;
        return false;
      }
      throw error;
    }
    
    stats.leadsInserted++;
    return true;
    
  } catch (error) {
    console.error(`❌ Error storing lead ${leadData.email}:`, error.message);
    stats.errors++;
    return false;
  }
}

// Main execution function
async function runLeadGeneration() {
  console.log('🤖 Starting Lead Generation Bot #1 - Singapore Travel Industry');
  console.log('=' .repeat(70));
  console.log(`Target Country: ${config.targetCountry}`);
  console.log(`Categories: ${searchCategories.length}`);
  console.log(`Max results per search: ${config.maxResultsPerSearch}`);
  console.log('');
  
  // Validate configuration
  if (!config.serpApi.key) {
    console.error('❌ SERPAPI_API_KEY not found in environment variables');
    process.exit(1);
  }
  
  if (!config.supabase.url || !config.supabase.serviceKey) {
    console.error('❌ Supabase configuration not found in environment variables');
    process.exit(1);
  }
  
  // Test database connection
  try {
    const { data, error } = await supabase.from('leads').select('count').limit(1);
    if (error) throw error;
    console.log('✅ Database connection successful\n');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
  
  const startTime = Date.now();
  
  // Process each category
  for (const categoryData of searchCategories) {
    console.log(`📂 Processing Category: ${categoryData.category}`);
    console.log('-' .repeat(50));
    
    // Process each keyword in the category
    for (const keyword of categoryData.keywords) {
      try {
        // Search for websites
        const websites = await searchGoogle(keyword);
        
        if (websites.length === 0) {
          console.log('   No websites found for this search\n');
          continue;
        }
        
        // Scrape emails from each website
        for (const website of websites) {
          await scrapeWebsite(website, categoryData.category);
          await delay(1000); // 1 second delay between website scrapes
        }
        
        // Delay between searches to respect rate limits
        await delay(config.requestDelay);
        
      } catch (error) {
        console.error(`❌ Error processing keyword "${keyword}":`, error.message);
        stats.errors++;
      }
    }
    
    console.log(''); // Empty line between categories
  }
  
  // Final statistics
  const endTime = Date.now();
  const duration = Math.round((endTime - startTime) / 1000);
  
  console.log('🎯 Lead Generation Complete!');
  console.log('=' .repeat(70));
  console.log(`📊 Final Statistics:`);
  console.log(`   ⏱️  Total time: ${duration} seconds`);
  console.log(`   🔍 Searches performed: ${stats.searchesPerformed}`);
  console.log(`   🌐 Websites scanned: ${stats.websitesScanned}`);
  console.log(`   📧 Emails found: ${stats.emailsFound}`);
  console.log(`   💾 Leads inserted: ${stats.leadsInserted}`);
  console.log(`   🔄 Duplicates skipped: ${stats.duplicatesSkipped}`);
  console.log(`   ❌ Errors encountered: ${stats.errors}`);
  console.log('');
  
  if (stats.leadsInserted > 0) {
    console.log(`✅ Success! ${stats.leadsInserted} new leads added to database.`);
  } else {
    console.log(`⚠️  No new leads found. Try different keywords or check for duplicates.`);
  }
  
  console.log('\n🎉 Bot execution completed successfully!');
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n⚠️ Received interrupt signal. Shutting down gracefully...');
  console.log(`📊 Current stats: ${stats.leadsInserted} leads inserted, ${stats.websitesScanned} sites scanned`);
  process.exit(0);
});

// Run the bot
if (require.main === module) {
  runLeadGeneration().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}