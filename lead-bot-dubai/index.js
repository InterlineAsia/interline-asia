#!/usr/bin/env node

/**
 * Dubai Lead Generation Bot - Enhanced Version
 * Fixed for real-world email extraction with deep crawling and bot detection avoidance
 */

require('dotenv').config({ path: '.env.local' });
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const cheerio = require('cheerio');
const { createClient } = require('@supabase/supabase-js');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const fs = require('fs');
const path = require('path');

// Add stealth plugin to avoid bot detection
puppeteer.use(StealthPlugin());

class DubaiLeadBot {
  constructor() {
    this.supabase = null;
    this.browser = null;
    this.page = null;
    this.leads = [];
    this.processedEmails = new Set();
    this.processedDomains = new Set();
    this.stats = {
      totalSearches: 0,
      totalSitesVisited: 0,
      totalEmailsFound: 0,
      supabaseSaved: 0,
      csvSaved: false
    };
    
    this.config = {
      country: process.env.TARGET_COUNTRY || 'Dubai',
      maxResultsPerQuery: parseInt(process.env.MAX_RESULTS_PER_QUERY) || 8,
      delayBetweenRequests: parseInt(process.env.DELAY_BETWEEN_REQUESTS) || 3000,
      maxRetries: 3,
      timeout: 45000,
      debugMode: process.env.DEBUG_MODE === 'true' || false,
      deepCrawl: true
    };

    // Search categories with Dubai-focused queries
    this.searchCategories = {
      'Airlines': [
        'airlines Dubai contact email address',
        'Dubai aviation companies email contact',
        'airline offices Dubai email information',
        'Dubai airport airlines business contact'
      ],
      'Travel Associations': [
        'travel associations Dubai email contact',
        'Dubai tourism trade associations',
        'travel industry organizations Dubai contact',
        'Dubai travel professional associations email'
      ],
      'Tourism Boards': [
        'Dubai tourism board contact email',
        'tourism development Dubai email contact',
        'Dubai destination marketing organizations',
        'tourism promotion Dubai business email'
      ],
      'Car Rental Companies': [
        'car rental companies Dubai email contact',
        'Dubai vehicle rental agencies email',
        'car hire Dubai business contact',
        'Dubai auto rental companies email address'
      ],
      'Hotels': [
        'hotel chains Dubai contact email',
        'Dubai hotels management email contact',
        'hospitality companies Dubai email address',
        'Dubai resort hotels business contact'
      ],
      'Travel Wholesalers': [
        'travel wholesalers Dubai email contact',
        'Dubai tour operators business email',
        'travel suppliers Dubai contact information',
        'Dubai travel distribution companies email'
      ]
    };

    this.skipDomains = [
      'facebook.com', 'linkedin.com', 'instagram.com', 'youtube.com',
      'twitter.com', 'tiktok.com', 'pinterest.com', 'snapchat.com',
      'tripadvisor.com', 'booking.com', 'expedia.com', 'agoda.com',
      'hotels.com', 'kayak.com', 'priceline.com', 'orbitz.com',
      'wikipedia.org', 'google.com', 'bing.com', 'yahoo.com'
    ];

    // Reduced generic email filtering - allow more business emails
    this.genericEmails = [
      'noreply@', 'no-reply@', 'webmaster@', 'admin@'
    ];

    // Common contact page patterns
    this.contactPagePatterns = [
      '/contact', '/contact-us', '/contactus', '/about', '/about-us', 
      '/team', '/support', '/help', '/reach-us', '/get-in-touch',
      '/company', '/corporate', '/office', '/location'
    ];
  }

  async initializeSupabase() {
    try {
      if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
        this.supabase = createClient(
          process.env.SUPABASE_URL,
          process.env.SUPABASE_ANON_KEY
        );
        await this.setupSupabaseTable();
      }
    } catch (error) {
      // Silent fallback to CSV only
    }
  }

  async setupSupabaseTable() {
    if (!this.supabase) return;
    
    try {
      const { error } = await this.supabase.rpc('exec', {
        sql: `
          CREATE TABLE IF NOT EXISTS leads_dubai (
            id BIGSERIAL PRIMARY KEY,
            company_name TEXT NOT NULL,
            email TEXT NOT NULL,
            source_url TEXT NOT NULL,
            category TEXT NOT NULL,
            search_query TEXT NOT NULL,
            timestamp TIMESTAMPTZ DEFAULT NOW(),
            created_at TIMESTAMPTZ DEFAULT NOW(),
            CONSTRAINT unique_email UNIQUE(email)
          );
          
          CREATE INDEX IF NOT EXISTS idx_leads_dubai_email ON leads_dubai(email);
          CREATE INDEX IF NOT EXISTS idx_leads_dubai_category ON leads_dubai(category);
        `
      });
    } catch (error) {
      // Continue without Supabase
    }
  }

  async setupBrowser() {
    this.browser = await puppeteer.launch({
      headless: false, // Use visible browser to avoid detection
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled',
        '--disable-features=VizDisplayCompositor',
        '--window-size=1366,768'
      ]
    });

    this.page = await this.browser.newPage();
    
    // Set realistic user agent
    await this.page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );
    await this.page.setViewport({ width: 1366, height: 768 });
    
    // Set extra headers to appear more human
    await this.page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
    });
    
    // Block only heavy resources but allow CSS for better parsing
    await this.page.setRequestInterception(true);
    this.page.on('request', (req) => {
      if (['image', 'font', 'media'].includes(req.resourceType())) {
        req.abort();
      } else {
        req.continue();
      }
    });
  }

  async searchGoogle(query) {
    try {
      this.stats.totalSearches++;
      
      await this.page.goto('https://www.google.com', { 
        waitUntil: 'networkidle2',
        timeout: this.config.timeout 
      });

      // Handle cookie consent
      try {
        await this.page.waitForSelector('button[id*="accept"], button[id*="agree"]', { timeout: 3000 });
        await this.page.click('button[id*="accept"], button[id*="agree"]');
        await this.delay(1000);
      } catch (e) {
        // Continue
      }

      // Search
      await this.page.waitForSelector('input[name="q"], textarea[name="q"]');
      await this.page.click('input[name="q"], textarea[name="q"]');
      await this.page.keyboard.type(query);
      await this.page.keyboard.press('Enter');
      
      await this.page.waitForSelector('#search', { timeout: this.config.timeout });
      await this.delay(3000);

      // Extract results
      const searchResults = await this.page.evaluate((maxResults) => {
        const results = [];
        const resultElements = document.querySelectorAll('#search .g, #search .tF2Cxc');
        
        for (let i = 0; i < Math.min(resultElements.length, maxResults); i++) {
          const element = resultElements[i];
          const linkElement = element.querySelector('a[href]');
          const titleElement = element.querySelector('h3');
          
          if (linkElement && titleElement) {
            const url = linkElement.href;
            const title = titleElement.textContent;
            
            if (url && title && url.startsWith('http') && !url.includes('google.com')) {
              results.push({ url, title });
            }
          }
        }
        
        return results;
      }, this.config.maxResultsPerQuery);

      return searchResults;
      
    } catch (error) {
      return [];
    }
  }

  async extractEmailsFromPage(url, retryCount = 0, isSubpage = false) {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname.toLowerCase().replace('www.', '');
      
      if (this.skipDomains.some(skipDomain => domain.includes(skipDomain))) {
        if (this.config.debugMode) console.log(`   ⏭️  Skipping ${domain} (blacklisted)`);
        return [];
      }

      if (!isSubpage && this.processedDomains.has(domain)) {
        return [];
      }
      
      if (!isSubpage) {
        this.processedDomains.add(domain);
        this.stats.totalSitesVisited++;
      }

      if (this.config.debugMode) {
        console.log(`   📄 Visiting: ${domain}${isSubpage ? ' (subpage)' : ''}`);
      }
      
      // Navigate with better error handling
      const response = await this.page.goto(url, { 
        waitUntil: 'networkidle2',
        timeout: this.config.timeout 
      });

      const statusCode = response ? response.status() : 0;
      if (this.config.debugMode) {
        console.log(`      Status: ${statusCode}`);
      }

      if (statusCode >= 400) {
        if (this.config.debugMode) console.log(`      ❌ Bad status code: ${statusCode}`);
        return [];
      }

      // Wait for page to fully load and scroll to trigger lazy content
      await this.delay(2000);
      await this.page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      await this.delay(1000);
      await this.page.evaluate(() => {
        window.scrollTo(0, 0);
      });
      await this.delay(1000);

      const content = await this.page.content();
      const $ = cheerio.load(content);

      // Extract company name
      let companyName = this.extractCompanyName($, domain);

      // Enhanced email extraction with obfuscation support
      let allEmails = this.extractAllEmails(content, $);
      
      if (this.config.debugMode) {
        console.log(`      Raw emails found: ${allEmails.length}`);
      }

      const validEmails = [];
      for (const email of allEmails) {
        const cleanEmail = email.toLowerCase().trim();
        
        // Skip generic emails (but allow more business emails)
        if (this.genericEmails.some(generic => cleanEmail.startsWith(generic))) {
          if (this.config.debugMode) console.log(`      ⏭️  Skipping generic: ${cleanEmail}`);
          continue;
        }

        if (this.processedEmails.has(cleanEmail)) {
          continue;
        }

        if (this.isValidEmail(cleanEmail)) {
          this.processedEmails.add(cleanEmail);
          validEmails.push({
            company_name: companyName,
            email: cleanEmail,
            source_url: url,
            timestamp: new Date().toISOString()
          });
          this.stats.totalEmailsFound++;
          
          if (this.config.debugMode) {
            console.log(`      ✅ Valid email: ${cleanEmail}`);
          }
        } else {
          if (this.config.debugMode) console.log(`      ❌ Invalid email: ${cleanEmail}`);
        }
      }

      // If no emails found on main page and deep crawl enabled, try contact pages
      if (validEmails.length === 0 && !isSubpage && this.config.deepCrawl) {
        if (this.config.debugMode) console.log(`      🔍 No emails on main page, checking contact pages...`);
        
        const contactEmails = await this.crawlContactPages(url, domain, companyName);
        validEmails.push(...contactEmails);
      }

      if (this.config.debugMode && validEmails.length > 0) {
        console.log(`      📧 Found ${validEmails.length} valid emails from ${domain}`);
      }

      return validEmails;

    } catch (error) {
      if (this.config.debugMode) {
        console.log(`      ❌ Error: ${error.message}`);
      }
      
      if (retryCount < this.config.maxRetries) {
        if (this.config.debugMode) console.log(`      🔄 Retry ${retryCount + 1}/${this.config.maxRetries}`);
        await this.delay(3000);
        return this.extractEmailsFromPage(url, retryCount + 1, isSubpage);
      } else {
        return [];
      }
    }
  }

  extractAllEmails(content, $) {
    const emails = new Set();
    
    // Enhanced email regex for .ae domains and international formats
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,6}\b/g;
    const pageText = $.text();
    const htmlContent = content;
    
    // Extract from text content
    const textEmails = pageText.match(emailRegex) || [];
    textEmails.forEach(email => emails.add(email));
    
    // Extract from HTML (including hidden in attributes)
    const htmlEmails = htmlContent.match(emailRegex) || [];
    htmlEmails.forEach(email => emails.add(email));
    
    // Handle obfuscated emails
    const obfuscatedPatterns = [
      /([a-zA-Z0-9._%+-]+)\s*\[at\]\s*([a-zA-Z0-9.-]+\.[a-zA-Z]{2,6})/gi,
      /([a-zA-Z0-9._%+-]+)\s*\(at\)\s*([a-zA-Z0-9.-]+\.[a-zA-Z]{2,6})/gi,
      /([a-zA-Z0-9._%+-]+)\s*@\s*([a-zA-Z0-9.-]+)\s*\.\s*([a-zA-Z]{2,6})/gi,
      /([a-zA-Z0-9._%+-]+)\s*AT\s*([a-zA-Z0-9.-]+\.[a-zA-Z]{2,6})/gi
    ];
    
    obfuscatedPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(pageText)) !== null) {
        const email = `${match[1]}@${match[2]}${match[3] ? '.' + match[3] : ''}`;
        emails.add(email);
      }
    });
    
    // Extract from mailto links
    $('a[href^="mailto:"]').each((i, el) => {
      const href = $(el).attr('href');
      const email = href.replace('mailto:', '').split('?')[0];
      if (email) emails.add(email);
    });
    
    return Array.from(emails);
  }

  async crawlContactPages(baseUrl, domain, companyName) {
    const contactEmails = [];
    const baseUrlObj = new URL(baseUrl);
    
    for (const pattern of this.contactPagePatterns) {
      try {
        const contactUrl = `${baseUrlObj.protocol}//${baseUrlObj.hostname}${pattern}`;
        
        if (this.config.debugMode) {
          console.log(`        🔗 Trying: ${pattern}`);
        }
        
        const response = await this.page.goto(contactUrl, { 
          waitUntil: 'networkidle2',
          timeout: 15000 
        });
        
        if (response && response.status() === 200) {
          await this.delay(1500);
          
          const content = await this.page.content();
          const $ = cheerio.load(content);
          
          const emails = this.extractAllEmails(content, $);
          
          for (const email of emails) {
            const cleanEmail = email.toLowerCase().trim();
            
            if (!this.genericEmails.some(generic => cleanEmail.startsWith(generic)) &&
                !this.processedEmails.has(cleanEmail) &&
                this.isValidEmail(cleanEmail)) {
              
              this.processedEmails.add(cleanEmail);
              contactEmails.push({
                company_name: companyName,
                email: cleanEmail,
                source_url: contactUrl,
                timestamp: new Date().toISOString()
              });
              this.stats.totalEmailsFound++;
              
              if (this.config.debugMode) {
                console.log(`        ✅ Contact email: ${cleanEmail}`);
              }
            }
          }
        }
        
        await this.delay(1000);
        
      } catch (error) {
        // Continue to next contact page
      }
    }
    
    return contactEmails;
  }

  extractCompanyName($, domain) {
    let companyName = '';
    
    const title = $('title').text().trim();
    if (title && title.length < 100) {
      companyName = title.split('|')[0].split('-')[0].trim();
    }
    
    if (!companyName || companyName.length < 3) {
      const h1 = $('h1').first().text().trim();
      if (h1 && h1.length < 100) {
        companyName = h1;
      }
    }
    
    if (!companyName || companyName.length < 3) {
      companyName = domain.split('.')[0].replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    
    companyName = companyName.replace(/[^\w\s&.-]/g, '').trim();
    if (companyName.length > 100) {
      companyName = companyName.substring(0, 100).trim();
    }
    
    return companyName || domain;
  }

  isValidEmail(email) {
    // More permissive email validation for real-world emails
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    return emailRegex.test(email) && 
           email.length > 5 && 
           email.length < 100 &&
           !email.includes('..') &&
           !email.startsWith('.') &&
           !email.endsWith('.') &&
           !email.includes(' ') &&
           // Allow common business domains including .ae
           /\.(com|org|net|edu|gov|ae|co\.ae|biz|info|me|io)$/i.test(email);
  }

  async processCategory(category, queries) {
    console.log(`📂 Processing: ${category}...`);
    const categoryStartCount = this.leads.length;
    
    for (let i = 0; i < queries.length; i++) {
      const query = queries[i];
      
      if (this.config.debugMode) {
        console.log(`  🔍 Query ${i + 1}/${queries.length}: "${query}"`);
      }
      
      try {
        const searchResults = await this.searchGoogle(query);
        
        if (this.config.debugMode) {
          console.log(`    📊 Found ${searchResults.length} search results`);
        }
        
        for (let j = 0; j < searchResults.length; j++) {
          const result = searchResults[j];
          
          if (this.config.debugMode) {
            console.log(`    🌐 Site ${j + 1}/${searchResults.length}: ${result.title}`);
          }
          
          const emails = await this.extractEmailsFromPage(result.url);
          
          for (const emailData of emails) {
            this.leads.push({
              ...emailData,
              category,
              search_query: query
            });
          }
          
          await this.delay(this.config.delayBetweenRequests);
        }
        
        await this.delay(1000);
        
      } catch (error) {
        if (this.config.debugMode) {
          console.log(`  ❌ Query failed: ${error.message}`);
        }
      }
    }
    
    const categoryLeads = this.leads.length - categoryStartCount;
    console.log(`✅ ${category} complete - Found ${categoryLeads} leads`);
    
    if (this.config.debugMode && categoryLeads > 0) {
      const categoryEmails = this.leads.slice(categoryStartCount).map(l => l.email);
      console.log(`   📧 Emails: ${categoryEmails.join(', ')}`);
    }
  }

  async saveToSupabase() {
    if (!this.supabase || this.leads.length === 0) {
      return 0;
    }

    try {
      const batchSize = 50;
      let totalSaved = 0;
      
      for (let i = 0; i < this.leads.length; i += batchSize) {
        const batch = this.leads.slice(i, i + batchSize);
        
        const { data, error } = await this.supabase
          .from('leads_dubai')
          .insert(batch)
          .select();

        if (!error) {
          totalSaved += batch.length;
        }
      }

      this.stats.supabaseSaved = totalSaved;
      return totalSaved;
      
    } catch (error) {
      return 0;
    }
  }

  async saveToCSV() {
    try {
      const outputDir = path.join(__dirname, 'output');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const csvPath = path.join(outputDir, 'leads_dubai.csv');
      
      const csvWriter = createCsvWriter({
        path: csvPath,
        header: [
          { id: 'company_name', title: 'Company Name' },
          { id: 'email', title: 'Email' },
          { id: 'source_url', title: 'Source URL' },
          { id: 'category', title: 'Category' },
          { id: 'search_query', title: 'Search Query' },
          { id: 'timestamp', title: 'Timestamp' }
        ]
      });

      await csvWriter.writeRecords(this.leads);
      this.stats.csvSaved = true;
      
      return csvPath;
      
    } catch (error) {
      this.stats.csvSaved = false;
      return null;
    }
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  printFinalSummary() {
    console.log('\n' + '='.repeat(50));
    console.log('🎉 DUBAI LEAD GENERATION COMPLETE');
    console.log('='.repeat(50));
    console.log(`📊 Search Statistics:`);
    console.log(`   • Total searches performed: ${this.stats.totalSearches}`);
    console.log(`   • Websites visited: ${this.stats.totalSitesVisited}`);
    console.log(`   • Unique emails found: ${this.stats.totalEmailsFound}`);
    console.log(`   • Final lead count: ${this.leads.length}`);
    console.log('\n💾 Storage Results:');
    
    if (this.stats.supabaseSaved > 0) {
      console.log(`✅ Saved ${this.stats.supabaseSaved} leads to Supabase`);
    } else {
      console.log(`⚠️  Supabase save failed - check credentials`);
    }
    
    if (this.stats.csvSaved) {
      console.log(`✅ Backup CSV created at output/leads_dubai.csv`);
    } else {
      console.log(`❌ CSV backup failed`);
    }
    
    console.log('='.repeat(50));
  }

  async run() {
    console.log('🤖 Dubai Lead Generation Bot Starting...');
    console.log(`🎯 Target: ${this.config.country} | Categories: ${Object.keys(this.searchCategories).length}`);
    console.log(`🔧 Debug Mode: ${this.config.debugMode ? 'ON' : 'OFF'}\n`);
    
    try {
      await this.initializeSupabase();
      await this.setupBrowser();
      
      // Process all categories
      for (const [category, queries] of Object.entries(this.searchCategories)) {
        await this.processCategory(category, queries);
      }
      
      if (this.leads.length > 0) {
        console.log('\n💾 Saving results...');
        
        await this.saveToSupabase();
        await this.saveToCSV();
      }
      
      this.printFinalSummary();
      
    } catch (error) {
      console.error('💥 Bot error:', error.message);
      
      if (this.leads.length > 0) {
        await this.saveToCSV();
        console.log('✅ Emergency CSV backup saved');
      }
    } finally {
      await this.cleanup();
    }
  }
}

// Run the bot
if (require.main === module) {
  const bot = new DubaiLeadBot();
  bot.run().catch(console.error);
}

module.exports = DubaiLeadBot;