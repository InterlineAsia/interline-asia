#!/usr/bin/env node

// Database setup script for Lead Generation Bot #1
require('dotenv').config({ path: '../.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupDatabase() {
  console.log('🔧 Setting up database for Lead Generation Bot...');
  
  try {
    // Create leads table if it doesn't exist
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS leads (
          id SERIAL PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          website TEXT,
          category TEXT,
          country TEXT DEFAULT 'Singapore',
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
        
        -- Create indexes for better performance
        CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
        CREATE INDEX IF NOT EXISTS idx_leads_category ON leads(category);
        CREATE INDEX IF NOT EXISTS idx_leads_country ON leads(country);
        
        -- Enable RLS (Row Level Security)
        ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
        
        -- Create policy for service role
        DROP POLICY IF EXISTS "Service role can manage leads" ON leads;
        CREATE POLICY "Service role can manage leads" ON leads
          FOR ALL USING (auth.role() = 'service_role');
      `
    });
    
    if (error) {
      console.log('⚠️ RPC method not available, trying direct table creation...');
      
      // Fallback: Try creating table directly
      const { error: createError } = await supabase
        .from('leads')
        .select('id')
        .limit(1);
      
      if (createError && createError.code === '42P01') {
        console.log('❌ Leads table does not exist. Please create it manually in Supabase:');
        console.log(`
CREATE TABLE leads (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  website TEXT,
  category TEXT,
  country TEXT DEFAULT 'Singapore',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_category ON leads(category);
CREATE INDEX idx_leads_country ON leads(country);
        `);
        return false;
      }
    }
    
    // Test the table
    const { data: testData, error: testError } = await supabase
      .from('leads')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Database test failed:', testError.message);
      return false;
    }
    
    console.log('✅ Database setup complete!');
    console.log('✅ Leads table is ready');
    return true;
    
  } catch (error) {
    console.error('❌ Database setup error:', error.message);
    return false;
  }
}

if (require.main === module) {
  setupDatabase().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { setupDatabase };