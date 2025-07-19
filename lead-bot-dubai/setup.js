#!/usr/bin/env node

/**
 * Auto-setup script for Dubai Lead Bot
 * Creates Supabase table if credentials are provided
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function setupSupabaseTable() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    return false;
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    // Create table with proper schema
    const { error } = await supabase.rpc('exec', {
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
        CREATE INDEX IF NOT EXISTS idx_leads_dubai_timestamp ON leads_dubai(timestamp);
      `
    });

    return !error;
  } catch (error) {
    return false;
  }
}

module.exports = { setupSupabaseTable };