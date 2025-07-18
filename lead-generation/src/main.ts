// Main orchestration script for lead generation and outreach
import { config, validateConfig } from './config.js';
import { setupDatabase, testConnection } from './supabaseClient.js';
import { DomainSearcher } from './searchDomains.js';
import { EmailScraper } from './scrapeEmails.js';
import { LeadStorage } from './storeLeads.js';
import { BrevoEmailSender } from './sendViaBrevo.js';

class LeadGenerationOrchestrator {
  private domainSearcher: DomainSearcher;
  private emailScraper: EmailScraper;
  private leadStorage: LeadStorage;
  private emailSender: BrevoEmailSender;

  constructor() {
    this.domainSearcher = new DomainSearcher();
    this.emailScraper = new EmailScraper();
    this.leadStorage = new LeadStorage();
    this.emailSender = new BrevoEmailSender();
  }

  // Main execution flow
  async run(): Promise<void> {
    console.log('🚀 Starting Interline Asia Lead Generation System');
    console.log('=' .repeat(60));

    try {
      // Step 1: Validate configuration
      await this.validateSetup();

      // Step 2: Search for domains
      const domains = await this.searchForDomains();
      if (domains.length === 0) {
        console.log('❌ No domains found. Exiting.');
        return;
      }

      // Step 3: Scrape emails from domains
      const emailLeads = await this.scrapeEmailsFromDomains(domains);
      if (emailLeads.length === 0) {
        console.log('❌ No emails found. Exiting.');
        return;
      }

      // Step 4: Store leads in database
      const storedLeads = await this.storeLeadsInDatabase(emailLeads);
      if (storedLeads.length === 0) {
        console.log('❌ No new leads to process. Exiting.');
        return;
      }

      // Step 5: Send emails via Brevo
      await this.sendEmailsToLeads(storedLeads);

      // Step 6: Show final statistics
      await this.showFinalStatistics();

    } catch (error) {
      console.error('❌ Fatal error in lead generation:', error);
      process.exit(1);
    }
  }

  // Validate configuration and setup
  private async validateSetup(): Promise<void> {
    console.log('🔧 Validating configuration...');

    // Check environment variables
    const configErrors = validateConfig();
    if (configErrors.length > 0) {
      console.error('❌ Configuration errors:');
      configErrors.forEach(error => console.error(`   - ${error}`));
      throw new Error('Invalid configuration');
    }

    // Test database connection
    console.log('🔗 Testing database connection...');
    const dbConnected = await testConnection();
    if (!dbConnected) {
      throw new Error('Database connection failed');
    }

    // Setup database schema
    await setupDatabase();

    // Test email configuration
    console.log('📧 Testing email configuration...');
    const emailConfigValid = await this.emailSender.testEmailConfig();
    if (!emailConfigValid) {
      console.warn('⚠️ Email configuration test failed. Emails may not send properly.');
    }

    console.log('✅ Setup validation complete');
    console.log('');
  }

  // Search for travel industry domains
  private async searchForDomains(): Promise<string[]> {
    console.log('🔍 Step 1: Searching for travel industry domains...');
    console.log('-'.repeat(50));

    const domains = await this.domainSearcher.searchDomains();
    const searchStats = this.domainSearcher.getSearchStats();

    console.log(`📊 Search Results:`);
    console.log(`   - API requests made: ${searchStats.requestCount}`);
    console.log(`   - Unique domains found: ${domains.length}`);
    console.log(`   - Max domains to process: ${config.search.maxDomainsPerSearch}`);

    if (config.debug && domains.length > 0) {
      console.log('   - Sample domains:');
      domains.slice(0, 5).forEach(domain => console.log(`     • ${domain}`));
      if (domains.length > 5) {
        console.log(`     ... and ${domains.length - 5} more`);
      }
    }

    console.log('');
    return domains;
  }

  // Scrape emails from discovered domains
  private async scrapeEmailsFromDomains(domains: string[]): Promise<any[]> {
    console.log('📧 Step 2: Scraping emails from domains...');
    console.log('-'.repeat(50));

    const emailLeads = await this.emailScraper.scrapeEmails(domains);
    const scrapingStats = this.emailScraper.getScrapingStats();

    console.log(`📊 Scraping Results:`);
    console.log(`   - Domains processed: ${domains.length}`);
    console.log(`   - HTTP requests made: ${scrapingStats.requestCount}`);
    console.log(`   - Email leads found: ${emailLeads.length}`);
    console.log(`   - Average emails per domain: ${(emailLeads.length / domains.length).toFixed(1)}`);

    if (config.debug && emailLeads.length > 0) {
      console.log('   - Sample emails:');
      emailLeads.slice(0, 3).forEach(lead => {
        console.log(`     • ${lead.email} (${lead.domain})`);
        if (lead.companyName) console.log(`       Company: ${lead.companyName}`);
        if (lead.contactName) console.log(`       Contact: ${lead.contactName}`);
      });
      if (emailLeads.length > 3) {
        console.log(`     ... and ${emailLeads.length - 3} more`);
      }
    }

    console.log('');
    return emailLeads;
  }

  // Store leads in Supabase database
  private async storeLeadsInDatabase(emailLeads: any[]): Promise<any[]> {
    console.log('💾 Step 3: Storing leads in database...');
    console.log('-'.repeat(50));

    const storedLeads = await this.leadStorage.storeLeads(emailLeads);
    const storageStats = this.leadStorage.getStorageStats();

    console.log(`📊 Storage Results:`);
    console.log(`   - Leads processed: ${emailLeads.length}`);
    console.log(`   - New leads inserted: ${storageStats.inserted}`);
    console.log(`   - Duplicates skipped: ${storageStats.skipped}`);
    console.log(`   - Errors encountered: ${storageStats.errors}`);

    // Show database statistics
    const dbStats = await this.leadStorage.getDatabaseStats();
    console.log(`📈 Database Statistics:`);
    console.log(`   - Total leads in database: ${dbStats.totalLeads}`);
    console.log(`   - Pending leads: ${dbStats.pendingLeads}`);
    console.log(`   - Previously sent: ${dbStats.sentLeads}`);

    console.log('');
    return storedLeads;
  }

  // Send emails to leads via Brevo
  private async sendEmailsToLeads(storedLeads: any[]): Promise<void> {
    console.log('📤 Step 4: Sending emails via Brevo...');
    console.log('-'.repeat(50));

    if (storedLeads.length === 0) {
      console.log('   No new leads to email');
      return;
    }

    // Limit the number of emails to send in one run
    const maxEmailsToSend = Math.min(storedLeads.length, config.rateLimiting.emailsPerHour);
    const leadsToEmail = storedLeads.slice(0, maxEmailsToSend);

    console.log(`   Sending emails to ${leadsToEmail.length} leads...`);

    const emailResults = await this.emailSender.sendEmails(leadsToEmail);
    const sendingStats = this.emailSender.getSendingStats();

    // Update lead statuses based on email results
    for (let i = 0; i < leadsToEmail.length; i++) {
      const lead = leadsToEmail[i];
      const result = emailResults[i];

      if (result && result.success) {
        await this.leadStorage.updateLeadStatus(lead.id, 'sent', {
          sent_at: new Date().toISOString(),
          last_contacted: new Date().toISOString(),
        });
      } else {
        // Mark as error for retry later
        await this.leadStorage.updateLeadStatus(lead.id, 'pending');
      }
    }

    console.log(`📊 Email Results:`);
    console.log(`   - Emails attempted: ${leadsToEmail.length}`);
    console.log(`   - Successfully sent: ${sendingStats.sent}`);
    console.log(`   - Failed to send: ${sendingStats.errors}`);
    console.log(`   - Success rate: ${((sendingStats.sent / leadsToEmail.length) * 100).toFixed(1)}%`);

    console.log('');
  }

  // Show final statistics and summary
  private async showFinalStatistics(): Promise<void> {
    console.log('📊 Final Statistics & Summary');
    console.log('='.repeat(60));

    // Get updated database statistics
    const dbStats = await this.leadStorage.getDatabaseStats();
    const searchStats = this.domainSearcher.getSearchStats();
    const scrapingStats = this.emailScraper.getScrapingStats();
    const storageStats = this.leadStorage.getStorageStats();
    const sendingStats = this.emailSender.getSendingStats();

    console.log(`🔍 Domain Search:`);
    console.log(`   - API requests: ${searchStats.requestCount}`);
    console.log(`   - Domains found: ${searchStats.domainsFound}`);

    console.log(`📧 Email Scraping:`);
    console.log(`   - HTTP requests: ${scrapingStats.requestCount}`);
    console.log(`   - Emails discovered: ${scrapingStats.emailsFound}`);

    console.log(`💾 Database Storage:`);
    console.log(`   - New leads added: ${storageStats.inserted}`);
    console.log(`   - Duplicates skipped: ${storageStats.skipped}`);
    console.log(`   - Storage errors: ${storageStats.errors}`);

    console.log(`📤 Email Sending:`);
    console.log(`   - Emails sent: ${sendingStats.sent}`);
    console.log(`   - Send errors: ${sendingStats.errors}`);

    console.log(`📈 Database Totals:`);
    console.log(`   - Total leads: ${dbStats.totalLeads}`);
    console.log(`   - Pending: ${dbStats.pendingLeads}`);
    console.log(`   - Sent: ${dbStats.sentLeads}`);
    console.log(`   - Bounced: ${dbStats.bouncedLeads}`);
    console.log(`   - Replied: ${dbStats.repliedLeads}`);

    console.log('');
    console.log('✅ Lead generation run completed successfully!');
    console.log('');
    console.log('💡 Next Steps:');
    console.log('   1. Monitor email responses and update lead statuses');
    console.log('   2. Follow up with interested prospects');
    console.log('   3. Run this script again to find new leads');
    console.log('   4. Analyze conversion rates and optimize messaging');
  }

  // Run only email sending for existing pending leads
  async runEmailOnly(): Promise<void> {
    console.log('📤 Running email-only mode for pending leads...');
    
    await this.validateSetup();
    
    const pendingLeads = await this.leadStorage.getLeadsForProcessing('pending', 50);
    if (pendingLeads.length === 0) {
      console.log('   No pending leads found');
      return;
    }

    await this.sendEmailsToLeads(pendingLeads);
    await this.showFinalStatistics();
  }

  // Run only lead discovery (no email sending)
  async runDiscoveryOnly(): Promise<void> {
    console.log('🔍 Running discovery-only mode (no emails will be sent)...');
    
    await this.validateSetup();
    
    const domains = await this.searchForDomains();
    if (domains.length === 0) return;

    const emailLeads = await this.scrapeEmailsFromDomains(domains);
    if (emailLeads.length === 0) return;

    await this.storeLeadsInDatabase(emailLeads);
    
    console.log('✅ Discovery completed. Use --email-only to send emails to discovered leads.');
  }
}

// Main execution
async function main(): Promise<void> {
  const orchestrator = new LeadGenerationOrchestrator();
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  const mode = args[0];

  try {
    switch (mode) {
      case '--email-only':
        await orchestrator.runEmailOnly();
        break;
      case '--discovery-only':
        await orchestrator.runDiscoveryOnly();
        break;
      case '--help':
        console.log(`
Interline Asia Lead Generation System

Usage:
  npm start                 Run full pipeline (discovery + email)
  npm start -- --email-only        Send emails to existing pending leads
  npm start -- --discovery-only    Discover leads only (no email sending)
  npm start -- --help             Show this help message

Environment variables required:
  SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
  SERPAPI_KEY
  BREVO_API_KEY
        `);
        break;
      default:
        await orchestrator.run();
        break;
    }
  } catch (error) {
    console.error('❌ Application error:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n⏹️ Gracefully shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n⏹️ Gracefully shutting down...');
  process.exit(0);
});

// Run the application
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}