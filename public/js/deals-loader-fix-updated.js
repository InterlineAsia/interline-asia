// CRITICAL FIX: Add Supabase direct query to deals-loader-fix.js
// This will replace the loadUnifiedDeals function

async function loadUnifiedDeals() {
  console.log('🌊 Loading unified cruise deals...');
  
  try {
    // Check if we have Supabase client
    if (!window.supabaseClient) {
      throw new Error('Supabase client not available');
    }
    
    // Wait for client to be ready
    await window.supabaseClient.readyPromise;
    
    // Method 1: Try Supabase direct query FIRST (PRIMARY METHOD)
    console.log('📊 Attempting Supabase direct query...');
    try {
      const { data: supabaseDeals, error } = await window.supabaseClient.supabase
        .from('cruise_deals')
        .select('*')
        .range(0, 9999);
      
      if (error) {
        console.error('🚨 Supabase query error:', error);
      } else if (supabaseDeals && supabaseDeals.length > 0) {
        console.log(`✅ PRIMARY: Loaded ${supabaseDeals.length} deals from Supabase direct query`);
        
        // Store deals globally for filtering
        window.allCruiseDeals = supabaseDeals;
        
        displayUnifiedDeals(supabaseDeals);
        return;
      } else {
        console.log('⚠️ Supabase returned no deals');
      }
    } catch (supabaseError) {
      console.error('🚨 Supabase direct query failed:', supabaseError);
    }
    
    // Method 2: Try unified API as fallback
    console.log('📡 Fetching from unified API...');
    const response = await fetch('/api/unified-api?endpoint=cruise-data');
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success || !result.deals || result.deals.length === 0) {
      console.log('⚠️ Unified API returned no deals, falling back...');
      throw new Error('No deals available from unified API');
    }
    
    console.log(`✅ SECONDARY: Loaded ${result.deals.length} deals from unified API`);
    
    // Store deals globally for filtering
    window.allCruiseDeals = result.deals;
    
    // Display the deals
    displayUnifiedDeals(result.deals);
    
  } catch (error) {
    console.error('❌ Error loading from primary sources:', error);
    console.log('🔄 FALLBACK: Loading legacy deals...');
    await loadLegacyDeals();
  }
}