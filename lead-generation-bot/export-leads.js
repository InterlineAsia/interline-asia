#!/usr/bin/env node

/**
 * Export leads from Supabase to CSV file
 */

require('dotenv').config({ path: '../.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { Parser } = require('json2csv');
const fs = require('fs');
const path = require('path');

// Initialize Supabase client
const supabase = createClient(
  'https://nxreyyxbuwxjfmtvdkji.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function exportLeadsToCSV() {
  try {
    console.log('🔍 Fetching leads from Supabase...');
    
    // Get all leads from Supabase
    const { data: leads, error } = await supabase
      .from('leads_singapore')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error fetching leads:', error.message);
      return;
    }
    
    console.log(`📊 Found ${leads.length} leads in database`);
    
    if (leads.length === 0) {
      console.log('📭 No leads found to export');
      return;
    }
    
    // Ensure output directory exists
    const outputDir = 'output';
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      console.log(`📁 Created directory: ${outputDir}`);
    }
    
    // Define CSV fields
    const fields = [
      { label: 'company_name', value: 'company_name' },
      { label: 'email', value: 'email' },
      { label: 'source_url', value: 'source_url' },
      { label: 'category', value: 'category' },
      { label: 'search_query', value: 'search_query' },
      { label: 'timestamp', value: 'timestamp' }
    ];
    
    // Create parser and convert to CSV
    const parser = new Parser({ fields });
    const csvContent = parser.parse(leads);
    
    // Write to file
    const filePath = 'output/leads_singapore.csv';
    fs.writeFileSync(filePath, csvContent, 'utf8');
    
    console.log(`✅ Saved ${leads.length} leads to ${filePath}`);
    
    // Show summary
    const emailCount = leads.filter(lead => lead.email).length;
    const noEmailCount = leads.length - emailCount;
    
    console.log(`📧 Leads with emails: ${emailCount}`);
    console.log(`🏢 Companies without emails: ${noEmailCount}`);
    
    // Category breakdown
    const categories = {};
    leads.forEach(lead => {
      categories[lead.category] = (categories[lead.category] || 0) + 1;
    });
    
    console.log('\n📈 Category Breakdown:');
    Object.entries(categories).forEach(([category, count]) => {
      console.log(`   ${category}: ${count} leads`);
    });
    
  } catch (error) {
    console.error('❌ Export error:', error.message);
  }
}

exportLeadsToCSV();