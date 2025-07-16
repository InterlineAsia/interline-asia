// Deals Page Error Fix - Interline Asia Phase 2
// Fixes console errors and improves data loading reliability

(function() {
    'use strict';

    // Enhanced error handling for deals page
    class DealsErrorHandler {
        constructor() {
            this.retryCount = 0;
            this.maxRetries = 3;
            this.loadingTimeout = null;
            
            this.setupErrorHandling();
        }

        setupErrorHandling() {
            // Catch and handle parsing errors
            window.addEventListener('error', (event) => {
                if (event.filename && event.filename.includes('deals.html')) {
                    this.handleJSError(event);
                }
            });

            // Handle unhandled promise rejections
            window.addEventListener('unhandledrejection', (event) => {
                this.handlePromiseRejection(event);
            });
        }

        handleJSError(event) {
            console.error('Deals page JS error:', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            });

            // Track error in analytics
            if (window.analytics) {
                window.analytics.trackError(event.message, 'deals_page_js_error');
            }

            // Show user-friendly message
            this.showErrorMessage('There was an issue loading cruise data. Refreshing...');
            
            // Attempt recovery
            setTimeout(() => {
                this.attemptRecovery();
            }, 2000);
        }

        handlePromiseRejection(event) {
            console.error('Deals page promise rejection:', event.reason);
            
            // Track error in analytics
            if (window.analytics) {
                window.analytics.trackError(event.reason.toString(), 'deals_page_promise_error');
            }
        }

        attemptRecovery() {
            if (this.retryCount < this.maxRetries) {
                this.retryCount++;
                console.log(`Attempting recovery ${this.retryCount}/${this.maxRetries}...`);
                
                // Try to reload deals data
                if (typeof loadAllDealsData === 'function') {
                    loadAllDealsData().catch(error => {
                        console.error('Recovery attempt failed:', error);
                    });
                } else {
                    // Fallback: reload page
                    setTimeout(() => {
                        window.location.reload();
                    }, 3000);
                }
            } else {
                this.showErrorMessage('Unable to load cruise data. Please refresh the page manually.');
            }
        }

        showErrorMessage(message) {
            // Create or update error message
            let errorDiv = document.getElementById('deals-error-message');
            if (!errorDiv) {
                errorDiv = document.createElement('div');
                errorDiv.id = 'deals-error-message';
                errorDiv.style.cssText = `
                    position: fixed;
                    top: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: #fee2e2;
                    border: 1px solid #fecaca;
                    color: #dc2626;
                    padding: 1rem 2rem;
                    border-radius: 8px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    z-index: 10000;
                    max-width: 500px;
                    text-align: center;
                `;
                document.body.appendChild(errorDiv);
            }
            
            errorDiv.innerHTML = `
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <i class="ri-error-warning-line"></i>
                    <span>${message}</span>
                </div>
            `;

            // Auto-hide after 5 seconds
            setTimeout(() => {
                if (errorDiv.parentElement) {
                    errorDiv.remove();
                }
            }, 5000);
        }
    }

    // Enhanced CSV parsing with better error handling
    function safeParseCSVLine(line) {
        try {
            const result = [];
            let current = '';
            let inQuotes = false;
            let i = 0;

            while (i < line.length) {
                const char = line[i];
                
                if (char === '"') {
                    if (inQuotes && line[i + 1] === '"') {
                        // Escaped quote
                        current += '"';
                        i += 2;
                    } else {
                        // Toggle quote state
                        inQuotes = !inQuotes;
                        i++;
                    }
                } else if (char === ',' && !inQuotes) {
                    result.push(current.trim());
                    current = '';
                    i++;
                } else {
                    current += char;
                    i++;
                }
            }
            
            // Add the last field
            result.push(current.trim());
            
            return result;
        } catch (error) {
            console.warn('CSV parsing error for line:', line.substring(0, 100), error);
            return [];
        }
    }

    // Enhanced data loading with timeout and retry
    async function safeLoadCSVData(url, cruiseType) {
        const maxRetries = 3;
        const timeout = 10000; // 10 seconds
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`Loading ${cruiseType} data (attempt ${attempt}/${maxRetries})...`);
                
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), timeout);
                
                const response = await fetch(url + '?v=' + Date.now(), {
                    signal: controller.signal,
                    headers: {
                        'Cache-Control': 'no-cache'
                    }
                });
                
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const csvText = await response.text();
                
                if (!csvText || csvText.trim().length === 0) {
                    throw new Error('Empty CSV response');
                }
                
                console.log(`✅ ${cruiseType} data loaded successfully (${csvText.length} characters)`);
                return csvText;
                
            } catch (error) {
                console.warn(`❌ ${cruiseType} load attempt ${attempt} failed:`, error.message);
                
                if (attempt === maxRetries) {
                    throw new Error(`Failed to load ${cruiseType} data after ${maxRetries} attempts: ${error.message}`);
                }
                
                // Wait before retry (exponential backoff)
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
        }
    }

    // Enhanced deal creation with validation
    function safeCreateDeal(headers, values, cruiseType) {
        try {
            if (!headers || !values || headers.length === 0 || values.length === 0) {
                return null;
            }

            const deal = {};
            
            // Safely map headers to values
            headers.forEach((header, index) => {
                deal[header] = values[index] || '';
            });

            // Validate required fields
            const requiredFields = ['Cruise Line', 'Ship'];
            const missingFields = requiredFields.filter(field => !deal[field] || deal[field].trim() === '');
            
            if (missingFields.length > 0) {
                console.warn('Deal missing required fields:', missingFields, deal);
                return null;
            }

            // Determine cruise type with fallback
            let actualType = cruiseType || 'Ocean Cruise';
            const region = (deal.Region || '').toLowerCase();
            const itinerary = (deal.Itinerary || '').toLowerCase();

            if (region.includes('arctic') || region.includes('antarctic') ||
                itinerary.includes('expedition') || itinerary.includes('polar')) {
                actualType = 'Expedition Cruise';
            }

            // Parse price safely
            const price = safeParsePrice(deal.Inside) || 
                         safeParsePrice(deal.Oceanview) || 
                         safeParsePrice(deal.Balcony) || 0;

            // Parse date safely
            const departureDate = safeParseDate(deal.Date);

            return {
                id: `${actualType.toLowerCase().replace(/\s+/g, '_')}_${Math.random().toString(36).substr(2, 9)}`,
                cruiseType: actualType,
                cruiseLine: deal['Cruise Line'] || '',
                shipName: deal.Ship || '',
                region: deal.Region || '',
                nights: parseInt(deal.Nights || 0) || 0,
                departureDate: departureDate,
                departurePort: deal.From || '',
                arrivalPort: deal.To || '',
                itinerary: deal.Itinerary || '',
                price: price,
                insidePrice: deal.Inside || '',
                oceanviewPrice: deal.Oceanview || '',
                balconyPrice: deal.Balcony || '',
                suitePrice: deal.Suite || ''
            };
        } catch (error) {
            console.warn('Deal creation error:', error, { headers, values, cruiseType });
            return null;
        }
    }

    function safeParsePrice(priceStr) {
        try {
            if (!priceStr || typeof priceStr !== 'string') return 0;
            if (priceStr.toLowerCase().includes('quote')) return 0;
            
            const cleaned = priceStr.replace(/[$,\s]/g, '');
            const price = parseFloat(cleaned);
            
            return isNaN(price) ? 0 : Math.max(0, price);
        } catch (error) {
            return 0;
        }
    }

    function safeParseDate(dateStr) {
        try {
            if (!dateStr || typeof dateStr !== 'string') return null;

            // Handle DD-MMM-YY format
            if (dateStr.includes('-') && dateStr.length <= 9) {
                const parts = dateStr.split('-');
                if (parts.length === 3) {
                    const day = parseInt(parts[0]);
                    const month = parts[1];
                    const year = parts[2].length === 2 ? parseInt('20' + parts[2]) : parseInt(parts[2]);
                    
                    const monthMap = {
                        'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
                        'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
                    };
                    
                    const monthNum = monthMap[month];
                    if (!isNaN(day) && monthNum !== undefined && !isNaN(year)) {
                        const date = new Date(year, monthNum, day);
                        return isNaN(date.getTime()) ? null : date;
                    }
                }
            }

            // Fallback to standard date parsing
            const date = new Date(dateStr);
            return isNaN(date.getTime()) ? null : date;
        } catch (error) {
            return null;
        }
    }

    // Initialize error handler when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.dealsErrorHandler = new DealsErrorHandler();
        });
    } else {
        window.dealsErrorHandler = new DealsErrorHandler();
    }

    // Export safe functions for use in deals.html
    window.safeParseCSVLine = safeParseCSVLine;
    window.safeLoadCSVData = safeLoadCSVData;
    window.safeCreateDeal = safeCreateDeal;
    window.safeParsePrice = safeParsePrice;
    window.safeParseDate = safeParseDate;

    console.log('✅ Deals error handling system initialized');

})();