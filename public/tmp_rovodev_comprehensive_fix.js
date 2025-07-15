// Comprehensive Fix for Interline Asia Login, Dashboard, and Deals Issues
// This script addresses the authentication flow and deals loading problems

console.log('🔧 COMPREHENSIVE FIX: Starting system repair...');

// 1. Fix Authentication Flow Issues
function fixAuthenticationFlow() {
    console.log('🔐 Fixing authentication flow...');
    
    // Override the login redirect logic to ensure proper flow
    if (window.location.pathname === '/login.html' || window.location.pathname === '/public/login.html') {
        const originalLoginForm = document.getElementById('login-form');
        if (originalLoginForm) {
            originalLoginForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const email = document.getElementById('email').value.trim();
                const password = document.getElementById('password').value.trim();
                
                console.log('🔐 LOGIN: Processing login for:', email);
                
                try {
                    // Use the global supabase client
                    const { data, error } = await window.supabaseClient.supabase.auth.signInWithPassword({
                        email,
                        password,
                    });
                    
                    if (error) {
                        console.error('🔐 LOGIN ERROR:', error.message);
                        alert('Invalid email or password.');
                        return;
                    }
                    
                    console.log('🔐 LOGIN SUCCESS: User authenticated');
                    
                    // Check admin status
                    const adminEmails = ['rodney@telenational.com.au', 'admin@telenational.com.au'];
                    const isAdmin = adminEmails.includes(email.toLowerCase());
                    
                    if (isAdmin) {
                        console.log('🔐 ADMIN LOGIN: Redirecting to dashboard choice');
                        window.location.href = '/dashboard-choice.html';
                    } else {
                        console.log('🔐 MEMBER LOGIN: Redirecting to member dashboard');
                        window.location.href = '/dashboard.html';
                    }
                    
                } catch (err) {
                    console.error('🔐 LOGIN EXCEPTION:', err);
                    alert('Login failed. Please try again.');
                }
            });
        }
    }
}

// 2. Fix Dashboard Choice Authentication
function fixDashboardChoice() {
    console.log('🎯 Fixing dashboard choice authentication...');
    
    if (window.location.pathname === '/dashboard-choice.html' || window.location.pathname === '/public/dashboard-choice.html') {
        // Override the initialization function
        window.initializeDashboardChoice = async function() {
            try {
                console.log('🎯 DASHBOARD_CHOICE: Initializing...');
                
                // Wait for Supabase client
                if (window.supabaseClient) {
                    await window.supabaseClient.readyPromise;
                }
                
                // Check authentication
                const { data: { session } } = await window.supabaseClient.supabase.auth.getSession();
                if (!session) {
                    console.log('🎯 DASHBOARD_CHOICE: No session, redirecting to login');
                    window.location.href = '/login.html';
                    return;
                }
                
                const user = session.user;
                console.log('🎯 DASHBOARD_CHOICE: Current user:', user.email);
                
                // Determine access levels
                const adminEmails = ['rodney@telenational.com.au', 'admin@telenational.com.au'];
                const hasAdminAccess = adminEmails.includes(user.email?.toLowerCase());
                
                // Update UI
                const userInfo = document.getElementById('user-info');
                const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
                
                if (userInfo) {
                    userInfo.textContent = `Hello ${displayName}! Choose your dashboard:`;
                }
                
                // Create dashboard buttons
                const buttonsContainer = document.getElementById('dashboard-buttons');
                if (buttonsContainer) {
                    buttonsContainer.innerHTML = '';
                    
                    // Member Dashboard Button (always available)
                    const memberBtn = document.createElement('button');
                    memberBtn.innerHTML = `
                        <div style="display: flex; align-items: center; justify-content: center; gap: 1rem;">
                            <i class="ri-user-line" style="font-size: 1.5rem;"></i>
                            <div style="text-align: left;">
                                <div style="font-weight: 600; font-size: 1.1rem;">Member Dashboard</div>
                                <div style="font-size: 0.9rem; opacity: 0.8;">Access cruise deals and bookings</div>
                            </div>
                        </div>
                    `;
                    memberBtn.style.cssText = `
                        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
                        color: white; border: none; padding: 1.5rem; border-radius: 12px;
                        cursor: pointer; width: 100%; font-family: inherit; margin-bottom: 1rem;
                    `;
                    memberBtn.onclick = () => {
                        console.log('🎯 DASHBOARD_CHOICE: Navigating to member dashboard');
                        window.location.href = '/dashboard.html';
                    };
                    buttonsContainer.appendChild(memberBtn);
                    
                    // Admin Dashboard Button (only for admins)
                    if (hasAdminAccess) {
                        const adminBtn = document.createElement('button');
                        adminBtn.innerHTML = `
                            <div style="display: flex; align-items: center; justify-content: center; gap: 1rem;">
                                <i class="ri-admin-line" style="font-size: 1.5rem;"></i>
                                <div style="text-align: left;">
                                    <div style="font-weight: 600; font-size: 1.1rem;">Admin Dashboard</div>
                                    <div style="font-size: 0.9rem; opacity: 0.8;">Manage users and system settings</div>
                                </div>
                            </div>
                        `;
                        adminBtn.style.cssText = `
                            background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
                            color: white; border: none; padding: 1.5rem; border-radius: 12px;
                            cursor: pointer; width: 100%; font-family: inherit;
                        `;
                        adminBtn.onclick = () => {
                            console.log('🎯 DASHBOARD_CHOICE: Navigating to admin dashboard');
                            window.location.href = '/admin.html';
                        };
                        buttonsContainer.appendChild(adminBtn);
                    }
                }
                
                console.log('🎯 DASHBOARD_CHOICE: Initialization complete');
                
            } catch (error) {
                console.error('🎯 DASHBOARD_CHOICE ERROR:', error);
                window.location.href = '/login.html';
            }
        };
    }
}

// 3. Fix Dashboard Authentication
function fixDashboardAuth() {
    console.log('📊 Fixing dashboard authentication...');
    
    if (window.location.pathname === '/dashboard.html' || window.location.pathname === '/public/dashboard.html') {
        // Override the auth check function
        window.checkAuthAndInitialize = async function() {
            try {
                console.log('📊 DASHBOARD: Checking authentication...');
                
                // Wait for Supabase client
                if (window.supabaseClient) {
                    await window.supabaseClient.readyPromise;
                }
                
                // Check session
                const { data: { session } } = await window.supabaseClient.supabase.auth.getSession();
                if (!session) {
                    console.log('📊 DASHBOARD: No session, redirecting to login');
                    window.location.href = '/login.html';
                    return;
                }
                
                console.log('📊 DASHBOARD: User authenticated, initializing...');
                await initializeDashboard();
                
            } catch (error) {
                console.error('📊 DASHBOARD ERROR:', error);
                window.location.href = '/login.html';
            }
        };
    }
}

// 4. Fix Deals Page Authentication and Loading
function fixDealsPage() {
    console.log('🚢 Fixing deals page...');
    
    if (window.location.pathname === '/deals.html' || window.location.pathname === '/public/deals.html') {
        // Override the authentication check
        window.checkAuthentication = async function() {
            console.log('🚢 DEALS: Checking authentication...');
            
            try {
                // Wait for Supabase client
                if (window.supabaseClient) {
                    await window.supabaseClient.readyPromise;
                }
                
                // Check session
                const { data: { session } } = await window.supabaseClient.supabase.auth.getSession();
                if (!session) {
                    console.log('🚢 DEALS: No session, redirecting to login');
                    window.location.href = '/login.html';
                    return false;
                }
                
                console.log('🚢 DEALS: User authenticated:', session.user.email);
                return true;
                
            } catch (error) {
                console.error('🚢 DEALS AUTH ERROR:', error);
                window.location.href = '/login.html';
                return false;
            }
        };
        
        // Enhanced deals loading function
        window.loadDealsWithAuth = async function() {
            console.log('🚢 DEALS: Loading deals with authentication...');
            
            // Check auth first
            const isAuthenticated = await window.checkAuthentication();
            if (!isAuthenticated) {
                return;
            }
            
            // Show loading state
            const loadingState = document.getElementById('loading-state');
            const errorState = document.getElementById('error-state');
            const dealsContainer = document.getElementById('deals-container');
            
            if (loadingState) loadingState.style.display = 'block';
            if (errorState) errorState.style.display = 'none';
            if (dealsContainer) dealsContainer.style.display = 'none';
            
            try {
                // Try multiple data sources
                let deals = [];
                
                // 1. Try Supabase cruise_deals table
                try {
                    const { data: supabaseDeals, error } = await window.supabaseClient.supabase
                        .from('cruise_deals')
                        .select('*')
                        .eq('is_active', true)
                        .order('departure_date', { ascending: true })
                        .limit(1000);
                    
                    if (!error && supabaseDeals && supabaseDeals.length > 0) {
                        deals = supabaseDeals;
                        console.log(`🚢 DEALS: Loaded ${deals.length} deals from Supabase`);
                    }
                } catch (supabaseError) {
                    console.warn('🚢 DEALS: Supabase failed:', supabaseError);
                }
                
                // 2. Fallback to unified API
                if (deals.length === 0) {
                    try {
                        const response = await fetch('/api/unified-api?endpoint=cruise-data');
                        if (response.ok) {
                            const result = await response.json();
                            if (result.success && result.deals) {
                                deals = result.deals;
                                console.log(`🚢 DEALS: Loaded ${deals.length} deals from API`);
                            }
                        }
                    } catch (apiError) {
                        console.warn('🚢 DEALS: API failed:', apiError);
                    }
                }
                
                // 3. Fallback to static JSON
                if (deals.length === 0) {
                    try {
                        const response = await fetch('/deals.json');
                        if (response.ok) {
                            deals = await response.json();
                            console.log(`🚢 DEALS: Loaded ${deals.length} deals from JSON`);
                        }
                    } catch (jsonError) {
                        console.warn('🚢 DEALS: JSON failed:', jsonError);
                    }
                }
                
                if (deals.length > 0) {
                    // Store deals globally for filtering
                    window.allCruiseDeals = deals;
                    
                    // Populate filter options
                    populateFilterOptions(deals);
                    
                    // Display deals
                    displayDeals(deals);
                    
                    // Setup search and filter functionality
                    setupSearchAndFilters();
                    
                    // Hide loading, show deals
                    if (loadingState) loadingState.style.display = 'none';
                    if (dealsContainer) dealsContainer.style.display = 'block';
                    
                    console.log('🚢 DEALS: Successfully loaded and displayed deals');
                } else {
                    throw new Error('No deals found from any source');
                }
                
            } catch (error) {
                console.error('🚢 DEALS LOADING ERROR:', error);
                if (loadingState) loadingState.style.display = 'none';
                if (errorState) {
                    errorState.style.display = 'block';
                    errorState.innerHTML = `
                        <div style="text-align: center; padding: 2rem;">
                            <h3 style="color: #dc2626;">Unable to Load Deals</h3>
                            <p>We're having trouble loading cruise deals. Please try refreshing the page.</p>
                            <button onclick="window.loadDealsWithAuth()" style="background: #3b82f6; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 6px; cursor: pointer;">
                                Try Again
                            </button>
                        </div>
                    `;
                }
            }
        };
        
        // Setup search and filter functionality
        window.setupSearchAndFilters = function() {
            console.log('🔍 DEALS: Setting up search and filters...');
            
            const searchInput = document.getElementById('search-input');
            const cruiseLineFilter = document.getElementById('cruise-line-filter');
            const destinationFilter = document.getElementById('destination-filter');
            const clearFiltersBtn = document.getElementById('clear-filters');
            
            // Search functionality
            if (searchInput) {
                searchInput.addEventListener('input', debounce(() => {
                    applyFilters();
                }, 300));
            }
            
            // Filter functionality
            if (cruiseLineFilter) {
                cruiseLineFilter.addEventListener('change', applyFilters);
            }
            if (destinationFilter) {
                destinationFilter.addEventListener('change', applyFilters);
            }
            
            // Clear filters
            if (clearFiltersBtn) {
                clearFiltersBtn.addEventListener('click', clearAllFilters);
            }
            
            console.log('🔍 DEALS: Search and filters setup complete');
        };
        
        // Apply filters function
        window.applyFilters = function() {
            if (!window.allCruiseDeals) return;
            
            const searchTerm = document.getElementById('search-input')?.value?.toLowerCase() || '';
            const cruiseLine = document.getElementById('cruise-line-filter')?.value || '';
            const destination = document.getElementById('destination-filter')?.value || '';
            
            let filteredDeals = [...window.allCruiseDeals];
            
            // Apply search filter
            if (searchTerm) {
                filteredDeals = filteredDeals.filter(deal => {
                    const searchText = [
                        deal.ship_name || deal.shipName,
                        deal.cruise_line || deal.cruiseLine,
                        deal.itinerary,
                        deal.destination || deal.region
                    ].join(' ').toLowerCase();
                    return searchText.includes(searchTerm);
                });
            }
            
            // Apply cruise line filter
            if (cruiseLine) {
                filteredDeals = filteredDeals.filter(deal => 
                    (deal.cruise_line || deal.cruiseLine || '').toLowerCase().includes(cruiseLine.toLowerCase())
                );
            }
            
            // Apply destination filter
            if (destination) {
                filteredDeals = filteredDeals.filter(deal => 
                    (deal.destination || deal.region || '').toLowerCase().includes(destination.toLowerCase())
                );
            }
            
            console.log(`🔍 DEALS: Filtered to ${filteredDeals.length} deals`);
            displayDeals(filteredDeals);
            updateResultsCount(filteredDeals.length, window.allCruiseDeals.length);
        };
        
        // Clear all filters
        window.clearAllFilters = function() {
            const searchInput = document.getElementById('search-input');
            const cruiseLineFilter = document.getElementById('cruise-line-filter');
            const destinationFilter = document.getElementById('destination-filter');
            
            if (searchInput) searchInput.value = '';
            if (cruiseLineFilter) cruiseLineFilter.value = '';
            if (destinationFilter) destinationFilter.value = '';
            
            applyFilters();
        };
        
        // Populate filter options
        window.populateFilterOptions = function(deals) {
            const cruiseLines = new Set();
            const destinations = new Set();
            
            deals.forEach(deal => {
                const cruiseLine = deal.cruise_line || deal.cruiseLine;
                const destination = deal.destination || deal.region;
                
                if (cruiseLine) cruiseLines.add(cruiseLine);
                if (destination) destinations.add(destination);
            });
            
            // Populate cruise line filter
            const cruiseLineFilter = document.getElementById('cruise-line-filter');
            if (cruiseLineFilter) {
                cruiseLineFilter.innerHTML = '<option value="">All Cruise Lines</option>';
                Array.from(cruiseLines).sort().forEach(line => {
                    const option = document.createElement('option');
                    option.value = line;
                    option.textContent = line;
                    cruiseLineFilter.appendChild(option);
                });
            }
            
            // Populate destination filter
            const destinationFilter = document.getElementById('destination-filter');
            if (destinationFilter) {
                destinationFilter.innerHTML = '<option value="">All Destinations</option>';
                Array.from(destinations).sort().forEach(dest => {
                    const option = document.createElement('option');
                    option.value = dest;
                    option.textContent = dest;
                    destinationFilter.appendChild(option);
                });
            }
        };
        
        // Display deals function
        window.displayDeals = function(deals) {
            const dealsContainer = document.getElementById('deals-container');
            if (!dealsContainer) return;
            
            if (!deals || deals.length === 0) {
                dealsContainer.innerHTML = '<div style="text-align: center; padding: 2rem;"><p>No deals found matching your criteria.</p></div>';
                return;
            }
            
            const dealsHTML = deals.map((deal, index) => {
                const shipName = deal.ship_name || deal.shipName || 'Cruise Ship';
                const cruiseLine = deal.cruise_line || deal.cruiseLine || 'Cruise Line';
                const destination = deal.destination || deal.region || 'Destination';
                const duration = deal.duration || deal.nights || '7';
                const price = deal.price || deal.starting_price || deal.inside_price || 'TBA';
                
                return `
                    <div style="background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); padding: 1.5rem; margin-bottom: 1rem;">
                        <h3 style="color: #1e293b; margin-bottom: 0.5rem;">${shipName}</h3>
                        <p style="color: #6b7280; margin-bottom: 1rem;">${cruiseLine}</p>
                        <p style="color: #374151; margin-bottom: 0.5rem;"><strong>Destination:</strong> ${destination}</p>
                        <p style="color: #374151; margin-bottom: 1rem;"><strong>Duration:</strong> ${duration} nights</p>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="color: #059669; font-weight: 600;">From $${typeof price === 'number' ? price.toLocaleString() : price}</span>
                            <button onclick="viewDealDetails(${index})" style="background: #3b82f6; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer;">
                                View Details
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
            
            dealsContainer.innerHTML = `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 1.5rem;">${dealsHTML}</div>`;
        };
        
        // Update results count
        window.updateResultsCount = function(filtered, total) {
            const resultsCount = document.getElementById('results-count');
            if (resultsCount) {
                resultsCount.textContent = `Showing ${filtered} of ${total} deals`;
            }
        };
        
        // View deal details
        window.viewDealDetails = function(index) {
            if (window.allCruiseDeals && window.allCruiseDeals[index]) {
                const deal = window.allCruiseDeals[index];
                alert(`Deal Details:\n\nShip: ${deal.ship_name || deal.shipName}\nCruise Line: ${deal.cruise_line || deal.cruiseLine}\nDestination: ${deal.destination || deal.region}\nDuration: ${deal.duration || deal.nights} nights`);
            }
        };
        
        // Debounce function
        function debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        }
    }
}

// 5. Initialize all fixes when DOM is ready
function initializeAllFixes() {
    console.log('🔧 COMPREHENSIVE FIX: Initializing all fixes...');
    
    // Apply fixes based on current page
    fixAuthenticationFlow();
    fixDashboardChoice();
    fixDashboardAuth();
    fixDealsPage();
    
    // Override page-specific initialization
    if (window.location.pathname.includes('deals.html')) {
        // For deals page, start the enhanced loading process
        setTimeout(() => {
            if (window.loadDealsWithAuth) {
                window.loadDealsWithAuth();
            }
        }, 500);
    }
    
    console.log('🔧 COMPREHENSIVE FIX: All fixes applied successfully');
}

// Apply fixes when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAllFixes);
} else {
    initializeAllFixes();
}

console.log('🔧 COMPREHENSIVE FIX: Script loaded and ready');