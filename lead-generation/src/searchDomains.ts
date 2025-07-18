// Domain search using SerpAPI to find travel industry websites
import axios from 'axios';
import { config } from './config.js';
import type { SearchResult } from './types.js';

export class DomainSearcher {
  private readonly baseUrl = config.serpApi.baseUrl;
  private readonly apiKey = config.serpApi.key;
  private requestCount = 0;
  private lastRequestTime = 0;

  // Rate limiting to respect API limits
  private async rateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    const minInterval = 60000 / config.rateLimiting.requestsPerMinute; // ms between requests

    if (timeSinceLastRequest < minInterval) {
      const waitTime = minInterval - timeSinceLastRequest;
      console.log(`⏳ Rate limiting: waiting ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime = Date.now();
    this.requestCount++;
  }

  // Search for travel industry domains using various strategies
  async searchDomains(): Promise<string[]> {
    console.log('🔍 Starting domain search...');
    const allDomains = new Set<string>();

    try {
      // Strategy 1: Search for travel agencies with contact pages
      const contactSearches = await this.searchForContactPages();
      contactSearches.forEach(domain => allDomains.add(domain));

      // Strategy 2: Search for specific travel industry terms
      const industrySearches = await this.searchIndustryTerms();
      industrySearches.forEach(domain => allDomains.add(domain));

      // Strategy 3: Search within specific travel domains
      const domainSearches = await this.searchWithinDomains();
      domainSearches.forEach(domain => allDomains.add(domain));

      const uniqueDomains = Array.from(allDomains);
      console.log(`✅ Found ${uniqueDomains.length} unique domains`);
      
      return uniqueDomains.slice(0, config.search.maxDomainsPerSearch);
    } catch (error) {
      console.error('❌ Error in domain search:', error);
      return [];
    }
  }

  // Search for travel websites with contact pages
  private async searchForContactPages(): Promise<string[]> {
    console.log('🔍 Searching for travel websites with contact pages...');
    const domains = new Set<string>();

    const contactQueries = [
      'site:*.com.au "travel agency" "contact us"',
      'site:*.com.au "cruise specialist" "contact"',
      'site:*.com.au "holiday packages" "email"',
      'site:*.com.au "travel consultant" "get in touch"',
      'site:*.com.au "travel services" "contact information"'
    ];

    for (const query of contactQueries) {
      try {
        await this.rateLimit();
        const results = await this.performSearch(query);
        
        results.forEach(result => {
          const domain = this.extractDomain(result.link);
          if (domain && this.isValidTravelDomain(domain)) {
            domains.add(domain);
          }
        });

        console.log(`   Found ${results.length} results for: ${query}`);
      } catch (error) {
        console.warn(`⚠️ Search failed for query: ${query}`, error);
      }
    }

    return Array.from(domains);
  }

  // Search for industry-specific terms
  private async searchIndustryTerms(): Promise<string[]> {
    console.log('🔍 Searching for industry-specific terms...');
    const domains = new Set<string>();

    for (const keyword of config.search.keywords) {
      try {
        await this.rateLimit();
        const query = `"${keyword}" Australia contact email -site:facebook.com -site:linkedin.com -site:instagram.com`;
        const results = await this.performSearch(query);
        
        results.forEach(result => {
          const domain = this.extractDomain(result.link);
          if (domain && this.isValidTravelDomain(domain)) {
            domains.add(domain);
          }
        });

        console.log(`   Found ${results.length} results for keyword: ${keyword}`);
      } catch (error) {
        console.warn(`⚠️ Search failed for keyword: ${keyword}`, error);
      }
    }

    return Array.from(domains);
  }

  // Search within specific travel domains
  private async searchWithinDomains(): Promise<string[]> {
    console.log('🔍 Searching within specific travel domains...');
    const domains = new Set<string>();

    for (const domain of config.search.domains) {
      try {
        await this.rateLimit();
        const query = `site:${domain} "contact" OR "email" OR "about"`;
        const results = await this.performSearch(query);
        
        results.forEach(result => {
          const resultDomain = this.extractDomain(result.link);
          if (resultDomain && this.isValidTravelDomain(resultDomain)) {
            domains.add(resultDomain);
          }
        });

        console.log(`   Found ${results.length} results for domain: ${domain}`);
      } catch (error) {
        console.warn(`⚠️ Search failed for domain: ${domain}`, error);
      }
    }

    return Array.from(domains);
  }

  // Perform actual search using SerpAPI
  private async performSearch(query: string): Promise<SearchResult[]> {
    try {
      const params = {
        engine: 'google',
        q: query,
        location: config.search.location,
        hl: config.search.language,
        gl: 'au', // Australia
        num: config.search.resultsPerPage,
        api_key: this.apiKey,
      };

      if (config.debug) {
        console.log(`🔍 Searching: ${query}`);
      }

      const response = await axios.get(this.baseUrl, {
        params,
        timeout: 30000, // 30 second timeout
      });

      if (response.data.error) {
        throw new Error(`SerpAPI error: ${response.data.error}`);
      }

      const organicResults = response.data.organic_results || [];
      
      return organicResults.map((result: any) => ({
        title: result.title || '',
        link: result.link || '',
        domain: this.extractDomain(result.link || ''),
        snippet: result.snippet || '',
      })).filter((result: SearchResult) => result.domain);

    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 429) {
          console.warn('⚠️ Rate limit hit, waiting longer...');
          await new Promise(resolve => setTimeout(resolve, 5000));
          throw new Error('Rate limit exceeded');
        }
        throw new Error(`Search API error: ${error.response?.status} ${error.response?.statusText}`);
      }
      throw error;
    }
  }

  // Extract domain from URL
  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace(/^www\./, '').toLowerCase();
    } catch {
      return '';
    }
  }

  // Validate if domain is likely a travel business
  private isValidTravelDomain(domain: string): boolean {
    // Skip common non-business domains
    const skipDomains = [
      'google.com', 'facebook.com', 'linkedin.com', 'instagram.com', 
      'twitter.com', 'youtube.com', 'tripadvisor.com', 'booking.com',
      'expedia.com', 'agoda.com', 'hotels.com', 'airbnb.com',
      'wikipedia.org', 'gov.au', 'edu.au'
    ];

    if (skipDomains.some(skip => domain.includes(skip))) {
      return false;
    }

    // Prefer Australian domains for local partnerships
    const preferredTlds = ['.com.au', '.net.au', '.org.au', '.asn.au'];
    const hasPreferredTld = preferredTlds.some(tld => domain.endsWith(tld));

    // Also accept .com domains if they contain travel-related keywords
    const travelKeywords = [
      'travel', 'cruise', 'holiday', 'vacation', 'tour', 'trip',
      'journey', 'adventure', 'escape', 'getaway', 'explore'
    ];
    const hasTravelKeyword = travelKeywords.some(keyword => domain.includes(keyword));

    return hasPreferredTld || (domain.endsWith('.com') && hasTravelKeyword);
  }

  // Get search statistics
  getSearchStats(): { requestCount: number; domainsFound: number } {
    return {
      requestCount: this.requestCount,
      domainsFound: 0, // Will be updated by caller
    };
  }
}