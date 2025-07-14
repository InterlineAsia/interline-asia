// Enhanced Supabase debugging function
async function debugSupabaseConnection() {
  console.log('🔍 SUPABASE DEBUG: Starting comprehensive debugging...');
  
  try {
    // Check Supabase client
    console.log('🔍 DEBUG: window.supabaseClient exists:', !!window.supabaseClient);
    console.log('🔍 DEBUG: supabase instance exists:', !!window.supabaseClient?.supabase);
    
    if (!window.supabaseClient?.supabase) {
      console.error('❌ DEBUG: Supabase client not properly initialized');
      return;
    }
    
    // Test basic connection
    console.log('🔍 DEBUG: Testing basic Supabase connection...');
    const { data: testData, error: testError } = await window.supabaseClient.supabase
      .from('cruise_deals')
      .select('count', { count: 'exact', head: true });
    
    if (testError) {
      console.error('❌ DEBUG: Basic connection test failed:', testError);
      return;
    }
    
    console.log('✅ DEBUG: Basic connection successful, total rows:', testData);
    
    // Test small query first
    console.log('🔍 DEBUG: Testing small query (limit 5)...');
    const { data: smallData, error: smallError } = await window.supabaseClient.supabase
      .from('cruise_deals')
      .select('*')
      .limit(5);
    
    if (smallError) {
      console.error('❌ DEBUG: Small query failed:', smallError);
      return;
    }
    
    console.log('✅ DEBUG: Small query successful:', {
      count: smallData?.length,
      sample: smallData?.[0],
      columns: smallData?.[0] ? Object.keys(smallData[0]) : 'No data'
    });
    
    // Test larger query
    console.log('🔍 DEBUG: Testing larger query (range 0-100)...');
    const { data: largeData, error: largeError } = await window.supabaseClient.supabase
      .from('cruise_deals')
      .select('*')
      .range(0, 100);
    
    if (largeError) {
      console.error('❌ DEBUG: Large query failed:', largeError);
      return;
    }
    
    console.log('✅ DEBUG: Large query successful:', {
      count: largeData?.length,
      dataType: typeof largeData,
      isArray: Array.isArray(largeData)
    });
    
    return largeData;
    
  } catch (error) {
    console.error('❌ DEBUG: Exception during debugging:', error);
  }
}

// Add this to window for manual testing
window.debugSupabaseConnection = debugSupabaseConnection;