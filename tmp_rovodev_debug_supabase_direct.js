// Direct Supabase Debug Script
// This will test the exact same queries used in deals.html

console.log('🔍 Starting Supabase Direct Debug...');

// Test 1: Check if Supabase client is available
if (!window.supabaseClient) {
    console.error('❌ window.supabaseClient not found!');
    console.log('Available window properties:', Object.keys(window).filter(k => k.includes('supabase')));
} else {
    console.log('✅ window.supabaseClient found');
}

// Test 2: Check authentication
async function testAuth() {
    try {
        await window.supabaseClient.readyPromise;
        const isLoggedIn = window.supabaseClient.isLoggedIn();
        const currentUser = window.supabaseClient.getCurrentUser();
        
        console.log('🔐 Auth Status:', {
            isLoggedIn,
            user: currentUser?.email || 'No user'
        });
        
        return isLoggedIn;
    } catch (error) {
        console.error('❌ Auth check failed:', error);
        return false;
    }
}

// Test 3: Direct Supabase queries (same as deals.html)
async function testSupabaseQueries() {
    console.log('🔍 Testing Supabase queries...');
    
    try {
        // Test 1: Count cruise_deals
        console.log('📊 Testing cruise_deals count...');
        const { data: countData, error: countError, count } = await window.supabaseClient.supabase
            .from('cruise_deals')
            .select('*', { count: 'exact', head: true });
            
        if (countError) {
            console.error('❌ cruise_deals count error:', countError);
        } else {
            console.log(`✅ cruise_deals total count: ${count}`);
        }
        
        // Test 2: Query active deals (same as deals.html)
        console.log('🔍 Testing active cruise_deals query...');
        const { data: activeData, error: activeError } = await window.supabaseClient.supabase
            .from('cruise_deals')
            .select('*')
            .eq('is_active', true)
            .order('departure_date', { ascending: true })
            .limit(10);
            
        if (activeError) {
            console.error('❌ Active cruise_deals error:', activeError);
            console.error('Error details:', {
                message: activeError.message,
                details: activeError.details,
                hint: activeError.hint,
                code: activeError.code
            });
        } else {
            console.log(`✅ Active cruise_deals query success: ${activeData?.length || 0} deals`);
            if (activeData && activeData.length > 0) {
                console.log('📋 Sample deal:', activeData[0]);
            }
        }
        
        // Test 3: Query deals_dashboard view
        console.log('🔍 Testing deals_dashboard view...');
        const { data: dashboardData, error: dashboardError } = await window.supabaseClient.supabase
            .from('deals_dashboard')
            .select('*')
            .limit(10);
            
        if (dashboardError) {
            console.error('❌ deals_dashboard error:', dashboardError);
            console.error('Error details:', {
                message: dashboardError.message,
                details: dashboardError.details,
                hint: dashboardError.hint,
                code: dashboardError.code
            });
        } else {
            console.log(`✅ deals_dashboard query success: ${dashboardData?.length || 0} deals`);
        }
        
        // Test 4: Check RLS policies by trying without filters
        console.log('🔍 Testing RLS policies...');
        const { data: allData, error: allError } = await window.supabaseClient.supabase
            .from('cruise_deals')
            .select('*')
            .limit(5);
            
        if (allError) {
            console.error('❌ RLS test error:', allError);
        } else {
            console.log(`✅ RLS test success: ${allData?.length || 0} deals (no filters)`);
        }
        
    } catch (error) {
        console.error('❌ Query test failed:', error);
    }
}

// Test 4: Test Unified API
async function testUnifiedAPI() {
    console.log('🌐 Testing Unified API...');
    
    try {
        const response = await fetch('/api/unified-api?endpoint=cruise-data');
        const result = await response.json();
        
        console.log('📡 Unified API Response:', {
            status: response.status,
            ok: response.ok,
            success: result.success,
            dealsCount: result.deals?.length || 0,
            error: result.error
        });
        
        if (result.deals && result.deals.length > 0) {
            console.log('📋 Sample unified API deal:', result.deals[0]);
        }
        
    } catch (error) {
        console.error('❌ Unified API test failed:', error);
    }
}

// Run all tests
async function runAllTests() {
    console.log('🚀 Running comprehensive Supabase debug tests...');
    
    const isAuthenticated = await testAuth();
    if (!isAuthenticated) {
        console.error('❌ Authentication failed - stopping tests');
        return;
    }
    
    await testSupabaseQueries();
    await testUnifiedAPI();
    
    console.log('✅ Debug tests completed');
}

// Auto-run if DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runAllTests);
} else {
    runAllTests();
}