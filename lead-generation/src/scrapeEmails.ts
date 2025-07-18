// Email scraping from travel industry websites
import axios from 'axios';
import * as cheerio from 'cheerio';
import { config } from './config.js';
import type { EmailLead } from './types.js';

export class EmailScraper {
  private requestCount = 0;
  private lastRequestTime = 0;

  // Rate limiting for web scraping
  private async rateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    const minInterval = 60000 / config.rateLimiting.requestsPerMinute;

    if (timeSinceLastRequest < minInterval) {
      const waitTime = minInterval - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime = Date.now();
    this.requestCount++;
  }

  // Scrape emails from a list of domains
  async scrapeEmails(domains: string[]): Promise<EmailLead[]> {
    console.log(`📧 Starting email scraping for ${domains.length} domains...`);
    const allEmails: EmailLead[] = [];

    for (const domain of domains) {
      try {
        console.log(`   Scraping: ${domain}`);
        const emails = await this.scrapeDomain(domain);
        allEmails.push(...emails);
        
        if (emails.length > 0) {
          console.log(`   ✅ Found ${emails.length} emails on ${domain}`);
        }

        // Respect rate limiting
        await this.rateLimit();
      } catch (error) {
        console.warn(`   ⚠️ Failed to scrape ${domain}:`, error instanceof Error ? error.message : error);
      }
    }

    console.log(`✅ Total emails found: ${allEmails.length}`);
    return allEmails;
  }

  // Scrape emails from a single domain
  private async scrapeDomain(domain: string): Promise<EmailLead[]> {
    const emails: EmailLead[] = [];
    const urlsToTry = this.getUrlsToScrape(domain);

    for (const url of urlsToTry) {
      try {
        const pageEmails = await this.scrapePage(url, domain);
        emails.push(...pageEmails);

        // Stop if we've found enough emails for this domain
        if (emails.length >= config.search.maxEmailsPerDomain) {
          break;
        }
      } catch (error) {
        if (config.debug) {
          console.log(`     Failed to scrape ${url}: ${error instanceof Error ? error.message : error}`);
        }
      }
    }

    // Remove duplicates and return unique emails
    return this.deduplicateEmails(emails);
  }

  // Get list of URLs to scrape for a domain
  private getUrlsToScrape(domain: string): string[] {
    const protocol = 'https://';
    const baseUrl = `${protocol}${domain}`;

    return [
      `${baseUrl}/contact`,
      `${baseUrl}/contact-us`,
      `${baseUrl}/about`,
      `${baseUrl}/about-us`,
      `${baseUrl}/team`,
      `${baseUrl}/staff`,
      `${baseUrl}/`,
      `${baseUrl}/contact.html`,
      `${baseUrl}/contact.php`,
      `${baseUrl}/about.html`,
    ];
  }

  // Scrape emails from a single page
  private async scrapePage(url: string, domain: string): Promise<EmailLead[]> {
    try {
      const response = await axios.get(url, {
        timeout: config.scraping.timeout,
        headers: {
          'User-Agent': config.scraping.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
        },
        maxRedirects: 3,
      });

      if (response.status !== 200) {
        throw new Error(`HTTP ${response.status}`);
      }

      const html = response.data;
      const $ = cheerio.load(html);

      // Extract emails using multiple methods
      const emails = new Set<string>();
      
      // Method 1: Find emails in text content
      const textEmails = this.extractEmailsFromText($.text());
      textEmails.forEach(email => emails.add(email));

      // Method 2: Find emails in href attributes
      $('a[href^="mailto:"]').each((_, element) => {
        const href = $(element).attr('href');
        if (href) {
          const email = href.replace('mailto:', '').split('?')[0];
          if (this.isValidEmail(email)) {
            emails.add(email.toLowerCase());
          }
        }
      });

      // Method 3: Find emails in data attributes
      $('[data-email]').each((_, element) => {
        const email = $(element).attr('data-email');
        if (email && this.isValidEmail(email)) {
          emails.add(email.toLowerCase());
        }
      });

      // Convert to EmailLead objects with additional context
      const emailLeads: EmailLead[] = [];
      
      for (const email of emails) {
        if (this.isBusinessEmail(email, domain)) {
          const lead: EmailLead = {
            email: email.toLowerCase(),
            domain,
            sourceUrl: url,
            ...this.extractContactInfo($, email),
          };
          emailLeads.push(lead);
        }
      }

      return emailLeads;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
          throw new Error(`Domain not accessible: ${error.code}`);
        }
        if (error.response?.status === 403) {
          throw new Error('Access forbidden (403)');
        }
        if (error.response?.status === 404) {
          throw new Error('Page not found (404)');
        }
      }
      throw error;
    }
  }

  // Extract emails from text using regex
  private extractEmailsFromText(text: string): string[] {
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const matches = text.match(emailRegex) || [];
    
    return matches
      .map(email => email.toLowerCase())
      .filter(email => this.isValidEmail(email));
  }

  // Validate email format
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  }

  // Check if email is likely a business email (not generic)
  private isBusinessEmail(email: string, domain: string): boolean {
    const genericEmails = [
      'noreply', 'no-reply', 'donotreply', 'admin', 'webmaster', 
      'postmaster', 'root', 'support', 'help', 'newsletter',
      'marketing', 'sales', 'info@', 'contact@'
    ];

    const emailLower = email.toLowerCase();
    
    // Skip obviously generic emails
    if (genericEmails.some(generic => emailLower.includes(generic))) {
      return false;
    }

    // Skip emails that don't match the domain (external emails)
    if (!emailLower.includes(domain.split('.')[0])) {
      return false;
    }

    // Prefer business-looking emails
    const businessIndicators = [
      'contact', 'info', 'enquiry', 'inquiry', 'booking', 'reservations',
      'travel', 'cruise', 'holiday', 'tour', 'manager', 'director'
    ];

    const hasBusinessIndicator = businessIndicators.some(indicator => 
      emailLower.includes(indicator)
    );

    return hasBusinessIndicator || emailLower.includes('@' + domain);
  }

  // Extract additional contact information from the page
  private extractContactInfo($: cheerio.CheerioAPI, email: string): Partial<EmailLead> {
    const info: Partial<EmailLead> = {};

    // Try to find company name
    const titleText = $('title').text();
    const h1Text = $('h1').first().text();
    
    if (titleText) {
      info.companyName = this.cleanCompanyName(titleText);
    } else if (h1Text) {
      info.companyName = this.cleanCompanyName(h1Text);
    }

    // Try to find contact name near the email
    const emailContext = this.findEmailContext($, email);
    if (emailContext.name) {
      info.contactName = emailContext.name;
    }

    // Try to find phone number
    const phoneRegex = /(\+?61\s?)?(\(0\d\)\s?)?\d{4}\s?\d{4}|\+?61\s?\d{3}\s?\d{3}\s?\d{3}/g;
    const pageText = $.text();
    const phoneMatch = pageText.match(phoneRegex);
    if (phoneMatch && phoneMatch[0]) {
      info.phoneNumber = phoneMatch[0].trim();
    }

    return info;
  }

  // Find context around an email to extract contact name
  private findEmailContext($: cheerio.CheerioAPI, email: string): { name?: string } {
    let contactName: string | undefined;

    // Look for name patterns near email
    $('*').each((_, element) => {
      const text = $(element).text();
      if (text.includes(email)) {
        // Look for name patterns before or after email
        const nameRegex = /([A-Z][a-z]+\s+[A-Z][a-z]+)(?=\s*[:\-]?\s*[\w.]+@)|([A-Z][a-z]+\s+[A-Z][a-z]+)(?:\s*[\-\|]\s*)/g;
        const nameMatch = text.match(nameRegex);
        if (nameMatch && nameMatch[0]) {
          contactName = nameMatch[0].trim();
          return false; // Break the loop
        }
      }
    });

    return { name: contactName };
  }

  // Clean and extract company name
  private cleanCompanyName(text: string): string {
    return text
      .replace(/\s*\|\s*.*$/, '') // Remove everything after |
      .replace(/\s*-\s*.*$/, '') // Remove everything after -
      .replace(/\s*(Home|Contact|About).*$/i, '') // Remove navigation words
      .trim()
      .substring(0, 100); // Limit length
  }

  // Remove duplicate emails
  private deduplicateEmails(emails: EmailLead[]): EmailLead[] {
    const seen = new Set<string>();
    return emails.filter(lead => {
      if (seen.has(lead.email)) {
        return false;
      }
      seen.add(lead.email);
      return true;
    });
  }

  // Get scraping statistics
  getScrapingStats(): { requestCount: number; emailsFound: number } {
    return {
      requestCount: this.requestCount,
      emailsFound: 0, // Will be updated by caller
    };
  }
}