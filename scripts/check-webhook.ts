#!/usr/bin/env tsx
/**
 * Interline Asia - GitHub-Vercel Webhook Monitor
 * Checks if GitHub webhook to Vercel is properly configured
 */

import { readFileSync } from 'fs';
import { join } from 'path';

interface GitHubWebhook {
  id: number;
  name: string;
  active: boolean;
  events: string[];
  config: {
    url: string;
    content_type: string;
    insecure_ssl: string;
  };
  updated_at: string;
  created_at: string;
}

interface WebhookCheckResult {
  isConnected: boolean;
  webhookCount: number;
  vercelWebhooks: GitHubWebhook[];
  issues: string[];
}

class WebhookChecker {
  private githubToken: string;
  private repoOwner = 'InterlineAsia';
  private repoName = 'interline-asia';

  constructor() {
    this.githubToken = this.loadGitHubToken();
  }

  private loadGitHubToken(): string {
    // Try to load from environment variables first
    if (process.env.GITHUB_TOKEN) {
      return process.env.GITHUB_TOKEN;
    }

    // Try to load from .env.local
    try {
      const envPath = join(process.cwd(), '.env.local');
      const envContent = readFileSync(envPath, 'utf-8');
      const tokenMatch = envContent.match(/GITHUB_TOKEN=(.+)/);
      if (tokenMatch) {
        return tokenMatch[1].trim();
      }
    } catch (error) {
      // .env.local doesn't exist or can't be read
    }

    throw new Error('GitHub token not found. Please set GITHUB_TOKEN in environment or .env.local');
  }

  private async fetchGitHubAPI(endpoint: string): Promise<any> {
    const url = `https://api.github.com${endpoint}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Interline-Asia-Webhook-Checker/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to fetch from GitHub API: ${error.message}`);
    }
  }

  private isVercelWebhook(webhook: GitHubWebhook): boolean {
    const url = webhook.config.url.toLowerCase();
    return (
      url.includes('vercel.com') || 
      url.includes('zeit.co') || 
      url.includes('now.sh')
    );
  }

  private validateWebhook(webhook: GitHubWebhook): string[] {
    const issues: string[] = [];

    if (!webhook.active) {
      issues.push('Webhook is inactive');
    }

    if (!webhook.events.includes('push')) {
      issues.push('Webhook does not listen to push events');
    }

    if (webhook.config.content_type !== 'application/json') {
      issues.push('Webhook content type should be application/json');
    }

    return issues;
  }

  async checkWebhooks(): Promise<WebhookCheckResult> {
    console.log('🔍 Checking GitHub webhooks for Interline Asia...');
    
    try {
      const webhooks: GitHubWebhook[] = await this.fetchGitHubAPI(
        `/repos/${this.repoOwner}/${this.repoName}/hooks`
      );

      const vercelWebhooks = webhooks.filter(webhook => this.isVercelWebhook(webhook));
      
      const result: WebhookCheckResult = {
        isConnected: vercelWebhooks.length > 0,
        webhookCount: webhooks.length,
        vercelWebhooks,
        issues: []
      };

      // Validate each Vercel webhook
      vercelWebhooks.forEach((webhook, index) => {
        const webhookIssues = this.validateWebhook(webhook);
        if (webhookIssues.length > 0) {
          result.issues.push(`Webhook ${index + 1}: ${webhookIssues.join(', ')}`);
        }
      });

      return result;
    } catch (error) {
      throw new Error(`Failed to check webhooks: ${error.message}`);
    }
  }

  async createVercelWebhook(): Promise<GitHubWebhook> {
    console.log('🔧 Creating new Vercel webhook...');
    
    const webhookConfig = {
      name: 'web',
      active: true,
      events: ['push', 'pull_request'],
      config: {
        url: 'https://api.vercel.com/v1/integrations/deploy/prj_YOUR_PROJECT_ID/YOUR_HOOK_ID',
        content_type: 'application/json',
        insecure_ssl: '0'
      }
    };

    try {
      const response = await fetch(
        `https://api.github.com/repos/${this.repoOwner}/${this.repoName}/hooks`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.githubToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
            'User-Agent': 'Interline-Asia-Webhook-Checker/1.0'
          },
          body: JSON.stringify(webhookConfig)
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to create webhook: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to create Vercel webhook: ${error.message}`);
    }
  }

  printReport(result: WebhookCheckResult): void {
    console.log('\n📊 Webhook Status Report');
    console.log('========================');
    console.log(`Repository: ${this.repoOwner}/${this.repoName}`);
    console.log(`Total webhooks: ${result.webhookCount}`);
    console.log(`Vercel webhooks: ${result.vercelWebhooks.length}`);
    
    if (result.isConnected) {
      console.log('✅ GitHub-Vercel webhook is connected');
      
      result.vercelWebhooks.forEach((webhook, index) => {
        console.log(`\n🔗 Vercel Webhook ${index + 1}:`);
        console.log(`   URL: ${webhook.config.url}`);
        console.log(`   Active: ${webhook.active ? '✅' : '❌'}`);
        console.log(`   Events: ${webhook.events.join(', ')}`);
        console.log(`   Created: ${new Date(webhook.created_at).toLocaleString()}`);
        console.log(`   Updated: ${new Date(webhook.updated_at).toLocaleString()}`);
      });

      if (result.issues.length > 0) {
        console.log('\n⚠️  Issues found:');
        result.issues.forEach(issue => console.log(`   - ${issue}`));
      }
    } else {
      console.log('🚨 GitHub-Vercel webhook missing or broken!');
      console.log('\n💡 To fix this:');
      console.log('   1. Go to Vercel Dashboard → Settings → Git');
      console.log('   2. Disconnect and reconnect your GitHub repository');
      console.log('   3. Or run: npm run create-webhook');
    }
  }
}

// Main execution
async function main() {
  try {
    const checker = new WebhookChecker();
    const result = await checker.checkWebhooks();
    
    checker.printReport(result);
    
    // Exit with error code if webhook is missing
    if (!result.isConnected) {
      process.exit(1);
    }
    
    console.log('\n✅ Webhook check completed successfully');
  } catch (error) {
    console.error('❌ Webhook check failed:', error.message);
    
    if (error.message.includes('GitHub token')) {
      console.log('\n💡 To fix this:');
      console.log('   1. Generate a GitHub Personal Access Token');
      console.log('   2. Add GITHUB_TOKEN=your_token to .env.local');
      console.log('   3. Token needs "repo" and "admin:repo_hook" scopes');
    }
    
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { WebhookChecker, WebhookCheckResult };