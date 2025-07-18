// Supabase client initialization for lead generation
import { createClient } from '@supabase/supabase-js';
import { config } from './config.js';
import type { StoredLead } from './types.js';

// Initialize Supabase client with service role key for admin operations
export const supabase = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Database schema setup
export async function setupDatabase(): Promise<void> {
  console.log('🔧 Setting up database schema...');

  // Create leads table if it doesn't exist
  const { error: tableError } = await supabase.rpc('create_leads_table_if_not_exists');
  
  if (tableError) {
    console.warn('⚠️ Could not create table via RPC, checking if table exists...');
    
    // Check if table exists by trying to select from it
    const { error: selectError } = await supabase
      .from('leads')
      .select('id')
      .limit(1);
    
    if (selectError) {
      console.error('❌ Leads table does not exist. Please create it manually:');
      console.log(`
CREATE TABLE IF NOT EXISTS leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  domain TEXT NOT NULL,
  source_url TEXT NOT NULL,
  contact_name TEXT,
  phone_number TEXT,
  company_name TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'bounced', 'replied', 'unsubscribed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE,
  last_contacted TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_domain ON leads(domain);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);

-- Create RLS policies
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Allow service role to do everything
CREATE POLICY "Service role can manage leads" ON leads
  FOR ALL USING (auth.role() = 'service_role');
      `);
      throw new Error('Database setup failed. Please run the SQL above manually.');
    }
  }

  console.log('✅ Database schema ready');
}

// Test database connection
export async function testConnection(): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ Database connection failed:', error.message);
      return false;
    }

    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection error:', error);
    return false;
  }
}

// Get existing leads to avoid duplicates
export async function getExistingEmails(): Promise<Set<string>> {
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('email');

    if (error) {
      console.error('❌ Error fetching existing emails:', error.message);
      return new Set();
    }

    return new Set(data?.map(lead => lead.email.toLowerCase()) || []);
  } catch (error) {
    console.error('❌ Error fetching existing emails:', error);
    return new Set();
  }
}

// Get leads by status
export async function getLeadsByStatus(status: string): Promise<StoredLead[]> {
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(`❌ Error fetching leads with status ${status}:`, error.message);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error(`❌ Error fetching leads with status ${status}:`, error);
    return [];
  }
}

// Update lead status
export async function updateLeadStatus(
  email: string, 
  status: string, 
  additionalData: Partial<StoredLead> = {}
): Promise<boolean> {
  try {
    const updateData = {
      status,
      updated_at: new Date().toISOString(),
      ...additionalData,
    };

    const { error } = await supabase
      .from('leads')
      .update(updateData)
      .eq('email', email);

    if (error) {
      console.error(`❌ Error updating lead status for ${email}:`, error.message);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`❌ Error updating lead status for ${email}:`, error);
    return false;
  }
}