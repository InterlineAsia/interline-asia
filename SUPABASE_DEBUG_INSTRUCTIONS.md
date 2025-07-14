# 🔍 SUPABASE DEBUGGING INSTRUCTIONS

## IMMEDIATE TESTING STEPS

### 1. Open Browser Console
Go to https://www.interlineasia.com/deals and open browser console (F12)

### 2. Run Manual Supabase Test
Copy and paste this code into the console:

```javascript
// Manual Supabase debugging
async function testSupabaseDeals() {
  console.log('🔍 MANUAL DEBUG: Testing Supabase connection...');
  
  if (!window.supabaseClient?.supabase) {
    console.error('❌ Supabase client not available');
    return;
  }
  
  try {
    // Test 1: Check table exists and count rows
    console.log('Test 1: Checking table row count...');
    const { count, error: countError } = await window.supabaseClient.supabase
      .from('cruise_deals')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ Count query failed:', countError);
      return;
    }
    
    console.log('✅ Total rows in cruise_deals:', count);
    
    // Test 2: Get sample data
    console.log('Test 2: Getting sample data...');
    const { data, error } = await window.supabaseClient.supabase
      .from('cruise_deals')
      .select('*')
      .limit(3);
    
    if (error) {
      console.error('❌ Sample query failed:', error);
      return;
    }
    
    console.log('✅ Sample data:', data);
    console.log('✅ Column names:', data[0] ? Object.keys(data[0]) : 'No data');
    
    // Test 3: Try range query
    console.log('Test 3: Testing range query...');
    const { data: rangeData, error: rangeError } = await window.supabaseClient.supabase
      .from('cruise_deals')
      .select('*')
      .range(0, 100);
    
    if (rangeError) {
      console.error('❌ Range query failed:', rangeError);
      return;
    }
    
    console.log('✅ Range query successful, got', rangeData.length, 'deals');
    
    return { count, sampleData: data, rangeData };
    
  } catch (error) {
    console.error('❌ Exception:', error);
  }
}

// Run the test
testSupabaseDeals();
```

### 3. Expected Results

**If Supabase is working correctly:**
- ✅ "Total rows in cruise_deals: [number > 0]"
- ✅ "Sample data: [array of objects]"
- ✅ "Column names: [array of column names]"
- ✅ "Range query successful, got [number] deals"

**If there are issues:**
- ❌ "Count query failed" - Table doesn't exist or permissions issue
- ❌ "Sample query failed" - Data access issue
- ❌ "Total rows: 0" - Table is empty
- ❌ "No data" - Table exists but no records

### 4. Common Issues & Solutions

**Issue: Table doesn't exist**
- Check if table name is correct (cruise_deals vs cruisedeals vs cruise-deals)
- Verify table was created in correct schema

**Issue: Permission denied**
- Check RLS (Row Level Security) policies
- Verify API key has read permissions

**Issue: Table is empty**
- Check if CSV import completed successfully
- Verify data was inserted into correct table

**Issue: Column name mismatch**
- Check if CSV headers were normalized properly
- Look for spaces, special characters in column names

### 5. Next Steps Based on Results

**If test shows data exists:**
- The issue is in the deals loader logic
- Need to fix the data mapping/display

**If test shows no data:**
- Need to check CSV import process
- Verify table structure and data insertion

**If test shows permission errors:**
- Need to fix Supabase RLS policies
- Check API key permissions

## MANUAL FIX COMMANDS

If you need to test specific queries, use these in console:

```javascript
// Check all tables
window.supabaseClient.supabase.from('cruise_deals').select('count', { count: 'exact', head: true })

// Get first 5 rows
window.supabaseClient.supabase.from('cruise_deals').select('*').limit(5)

// Check specific columns
window.supabaseClient.supabase.from('cruise_deals').select('ship_name, cruise_line, destination').limit(5)
```