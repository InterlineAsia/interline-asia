// Type definitions for the lead generation system

export interface SearchResult {
  title: string;
  link: string;
  domain: string;
  snippet?: string;
}

export interface EmailLead {
  email: string;
  domain: string;
  sourceUrl: string;
  contactName?: string;
  phoneNumber?: string;
  companyName?: string;
}

export interface StoredLead {
  id: string;
  email: string;
  domain: string;
  source_url: string;
  contact_name?: string;
  phone_number?: string;
  company_name?: string;
  status: 'pending' | 'sent' | 'bounced' | 'replied' | 'unsubscribed';
  created_at: string;
  updated_at: string;
  sent_at?: string;
  last_contacted?: string;
}

export interface EmailTemplate {
  subject: string;
  textContent: string;
  htmlContent?: string;
}

export interface BrevoResponse {
  messageId: string;
  success: boolean;
  error?: string;
}

export interface ScrapingConfig {
  maxDomainsPerSearch: number;
  maxEmailsPerDomain: number;
  requestsPerMinute: number;
  emailsPerHour: number;
  userAgent: string;
  timeout: number;
}

export interface SearchConfig {
  keywords: string[];
  domains: string[];
  location: string;
  language: string;
  resultsPerPage: number;
}