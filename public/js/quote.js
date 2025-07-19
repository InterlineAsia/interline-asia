/**
 * Quote System JavaScript
 * Handles form submission, auto-save, session timer, and validation
 */

let currentDeal = null;
let allDeals = [];
let autoSaveInterval;
let sessionTimer;
let sessionTimeLeft = 15 * 60; // 15 minutes in seconds

// Auto-save configuration
const AUTOSAVE_KEY = 'quote_draft_';

// Security validation
function validateAccess() {
    const urlParams = new URLSearchParams(window.location.search);
    const dealId = urlParams.get('id');
    const token = urlParams.get('token');
    
    if (!dealId || !token) {
        return false;
    }
    
    const validTokenPattern = /^[a-zA-Z0-9]{6,}$/;
    return validTokenPattern.test(token);
}

// Load CSV data with Enhanced CSV Loader
async function loadCSVDeals() {
    try {
        console.log('QUOTE: Loading CSV data with enhanced loader...');
        
        // Use enhanced CSV loader if available
        if (window.csvLoader) {
            allDeals = await window.csvLoader.loadAllDeals();
            console.log('QUOTE: Enhanced loader provided', allDeals.length, 'deals');
            return;
        }
        
        // Fallback to legacy loading
        console.log('QUOTE: Enhanced loader not available, using fallback...');
        
        const riverResponse = await fetch('/public/river.csv');
        if (riverResponse.ok) {
            const riverCSV = await riverResponse.text();
            const riverDeals = parseCSV(riverCSV, 'River Cruise');
            allDeals = allDeals.concat(riverDeals);
        }

        const oceanResponse = await fetch('/public/twins.csv');
        if (oceanResponse.ok) {
            const oceanCSV = await oceanResponse.text();
            const oceanDeals = parseCSV(oceanCSV, 'Ocean Cruise');
            allDeals = allDeals.concat(oceanDeals);
        }

        console.log('QUOTE: Loaded', allDeals.length, 'total deals');
    } catch (error) {
        console.error('QUOTE: Error loading CSV data:', error);
    }
}

// Parse CSV data
function parseCSV(csvText, cruiseType) {
    const lines = csvText.trim().split('\n');
    const headers = parseCSVLine(lines[0]);
    const deals = [];

    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length >= 10) {
            const deal = createDeal(headers, values, cruiseType);
            if (deal.cruiseLine && deal.shipName) {
                deals.push(deal);
            }
        }
    }
    return deals;
}

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());
    return result;
}

function createDeal(headers, values, cruiseType) {
    const deal = {};
    headers.forEach((header, index) => {
        deal[header] = values[index] || '';
    });

    let actualCruiseType = cruiseType;
    const region = (deal.Region || '').toLowerCase();
    const itinerary = (deal.Itinerary || '').toLowerCase();
    
    if (region.includes('arctic') || region.includes('antarctic') || 
        itinerary.includes('expedition') || itinerary.includes('arctic') || 
        itinerary.includes('antarctic') || itinerary.includes('polar')) {
        actualCruiseType = 'Expedition Cruise';
    }

    return {
        id: `${actualCruiseType.toLowerCase().replace(/\s+/g, '_')}_${deal.SEQ || Math.random().toString(36).substr(2, 9)}`,
        cruiseType: actualCruiseType,
        cruiseLine: deal['Cruise Line'] || '',
        shipName: deal.Ship || '',
        region: deal.Region || '',
        nights: parseInt(deal.Nights || 0),
        departureDate: parseDate(deal.Date),
        departurePort: deal.From || '',
        arrivalPort: deal.To || '',
        itinerary: deal.Itinerary || ''
    };
}

function parseDate(dateStr) {
    if (!dateStr) return null;
    
    if (dateStr.includes('-') && dateStr.length <= 9) {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            const day = parseInt(parts[0]);
            const monthMap = {
                'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
                'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
            };
            const month = monthMap[parts[1].toLowerCase()];
            let year = parseInt(parts[2]);
            if (year < 100) year += 2000;
            
            if (!isNaN(day) && month !== undefined && !isNaN(year)) {
                return new Date(year, month, day);
            }
        }
    }
    
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
}

function formatDate(date) {
    if (!date) return 'TBA';
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

function getCruiseLineLogo(cruiseLine) {
    const logoMap = {
        'royal caribbean': 'royal-caribbean.png',
        'celebrity cruises': 'celebrity.png',
        'norwegian cruise line': 'norwegian.png',
        'carnival cruise line': 'carnival.png',
        'princess cruises': 'princess.png',
        'holland america line': 'holland-america.png',
        'msc cruises': 'msc.png',
        'costa cruises': 'costa.png',
        'cunard': 'cunard.png',
        'seabourn': 'seabourn.png',
        'silversea': 'silversea.png',
        'regent seven seas': 'regent.png',
        'oceania cruises': 'oceania.png',
        'azamara': 'azamara.png',
        'viking ocean cruises': 'viking.png',
        'amawaterways': 'amawaterways.png',
        'avalon waterways': 'avalon.png',
        'scenic': 'scenic.png',
        'emerald cruises': 'emerald-cruises.png',
        'crystal': 'crystal.png',
        'atlas': 'atlas.png',
        'hx hurtigruten expeditions': 'hx.png',
        'hurtigruten expeditions': 'hx.png',
        'ponant': 'ponant.png',
        'lindblad expeditions': 'lindblad.png',
        'quark expeditions': 'QUARK EXPEDITIONS.png',
        'coral expeditions': 'coral-expeditions.png',
        'heritage expeditions': 'heritage-expeditions.png'
    };
    
    return logoMap[cruiseLine.toLowerCase()] || 'placeholder.png';
}

// Display cruise information
function displayCruise(deal) {
    currentDeal = deal;
    
    document.getElementById('cruise-logo').src = `/logos/cruiselines/${getCruiseLineLogo(deal.cruiseLine)}`;
    document.getElementById('cruise-logo').alt = deal.cruiseLine;
    document.getElementById('ship-name').textContent = deal.shipName;
    document.getElementById('cruise-line').textContent = deal.cruiseLine;
    
    const badge = document.getElementById('cruise-type-badge');
    badge.textContent = deal.cruiseType;
    badge.className = `cruise-type-badge ${deal.cruiseType.toLowerCase().replace(/\s+/g, '-')}`;

    document.getElementById('departure-port').textContent = deal.departurePort || 'TBA';
    document.getElementById('departure-date').textContent = formatDate(deal.departureDate);
    document.getElementById('duration').textContent = `${deal.nights} nights`;
    document.getElementById('region').textContent = deal.region || 'TBA';

    document.title = `Quote Request - ${deal.shipName} | Interline Asia`;
}

// Auto-save functionality
function startAutoSave() {
    autoSaveInterval = setInterval(() => {
        saveDraft();
    }, 3000);
}

function saveDraft() {
    if (!currentDeal) return;

    const draftData = {
        dealId: currentDeal.id,
        interiorPrice: document.getElementById('interior-price').value,
        oceanviewPrice: document.getElementById('oceanview-price').value,
        balconyPrice: document.getElementById('balcony-price').value,
        suitePrice: document.getElementById('suite-price').value,
        notes: document.getElementById('notes').value,
        timestamp: Date.now()
    };

    const hasContent = draftData.interiorPrice || draftData.oceanviewPrice || 
                      draftData.balconyPrice || draftData.suitePrice || draftData.notes;

    if (hasContent) {
        localStorage.setItem(AUTOSAVE_KEY + currentDeal.id, JSON.stringify(draftData));
        showAutoSaveIndicator();
    }
}

function loadDraft() {
    if (!currentDeal) return;

    const savedDraft = localStorage.getItem(AUTOSAVE_KEY + currentDeal.id);
    if (savedDraft) {
        try {
            const draftData = JSON.parse(savedDraft);
            
            document.getElementById('interior-price').value = draftData.interiorPrice || '';
            document.getElementById('oceanview-price').value = draftData.oceanviewPrice || '';
            document.getElementById('balcony-price').value = draftData.balconyPrice || '';
            document.getElementById('suite-price').value = draftData.suitePrice || '';
            document.getElementById('notes').value = draftData.notes || '';

            console.log('QUOTE: Draft restored from localStorage');
        } catch (error) {
            console.error('QUOTE: Error loading draft:', error);
        }
    }
}

function clearDraft() {
    if (!currentDeal) return;
    localStorage.removeItem(AUTOSAVE_KEY + currentDeal.id);
}

function showAutoSaveIndicator() {
    const indicator = document.getElementById('auto-save-indicator');
    indicator.style.display = 'flex';
    setTimeout(() => {
        indicator.style.display = 'none';
    }, 2000);
}

// Session timer functionality
function startSessionTimer() {
    sessionTimer = setInterval(() => {
        sessionTimeLeft--;
        updateTimerDisplay();

        if (sessionTimeLeft <= 0) {
            expireSession();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const minutes = Math.floor(sessionTimeLeft / 60);
    const seconds = sessionTimeLeft % 60;
    const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    const timerElement = document.getElementById('timer-text');
    const sessionTimerElement = document.getElementById('session-timer');
    
    timerElement.textContent = `This session will expire in ${timeString}`;

    if (sessionTimeLeft <= 120) {
        sessionTimerElement.classList.add('warning');
    }
}

function expireSession() {
    clearInterval(sessionTimer);
    clearInterval(autoSaveInterval);
    document.getElementById('session-expired-overlay').style.display = 'flex';
}

// Form validation
function validateForm() {
    const interiorPrice = document.getElementById('interior-price').value;
    const oceanviewPrice = document.getElementById('oceanview-price').value;
    const balconyPrice = document.getElementById('balcony-price').value;
    const suitePrice = document.getElementById('suite-price').value;

    const hasPrice = interiorPrice || oceanviewPrice || balconyPrice || suitePrice;
    
    if (!hasPrice) {
        // Add visual feedback
        const priceInputs = document.querySelectorAll('.price-input');
        priceInputs.forEach(input => {
            input.classList.add('error');
            setTimeout(() => input.classList.remove('error'), 3000);
        });
        
        alert('Please enter at least one cabin price.');
        return false;
    }

    return true;
}

// Handle form submission
async function handleQuoteSubmission(event) {
    event.preventDefault();
    
    if (!validateForm()) {
        return;
    }

    const formData = {
        cruiseId: currentDeal.id,
        interior: document.getElementById('interior-price').value || null,
        oceanview: document.getElementById('oceanview-price').value || null,
        balcony: document.getElementById('balcony-price').value || null,
        suite: document.getElementById('suite-price').value || null,
        notes: document.getElementById('notes').value || '',
        cruiseDetails: {
            shipName: currentDeal.shipName,
            cruiseLine: currentDeal.cruiseLine,
            departureDate: formatDate(currentDeal.departureDate)
        },
        cc: 'admin@interlineasia.com'
    };

    console.log('QUOTE: Submitting quote data:', formData);
    
    const submitBtn = document.getElementById('send-quote-btn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="ri-loader-4-line"></i> Sending Quote...';

    try {
        const response = await fetch('/api/send-quote', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (result.success) {
            document.getElementById('quote-form').style.display = 'none';
            document.getElementById('success-panel').style.display = 'block';
            
            clearDraft();
            clearInterval(sessionTimer);
            clearInterval(autoSaveInterval);
            
            console.log('QUOTE: Quote sent successfully:', result);
        } else {
            throw new Error(result.error || 'Failed to send quote');
        }

    } catch (error) {
        console.error('QUOTE: Error sending quote:', error);
        
        alert(`Failed to send quote: ${error.message}\n\nPlease try again or contact support if the problem persists.`);
        
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="ri-mail-send-line"></i> Send Quote';
    }
}

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    if (!validateAccess()) {
        document.getElementById('loading-state').style.display = 'none';
        document.getElementById('access-denied').style.display = 'block';
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const dealId = urlParams.get('id');

    console.log('QUOTE: Looking for deal ID:', dealId);

    await loadCSVDeals();

    const deal = allDeals.find(d => d.id === dealId);

    if (deal) {
        displayCruise(deal);
        loadDraft();
        startAutoSave();
        startSessionTimer();
        
        document.getElementById('loading-state').style.display = 'none';
        document.getElementById('quote-content').style.display = 'block';
        console.log('QUOTE: Found and displayed deal:', deal);
    } else {
        console.log('QUOTE: Deal not found');
        document.getElementById('loading-state').style.display = 'none';
        document.getElementById('access-denied').style.display = 'block';
    }

    document.getElementById('quote-form').addEventListener('submit', handleQuoteSubmission);
});

// Add smooth transitions and interactions
document.addEventListener('DOMContentLoaded', () => {
    // Add focus/blur animations to form inputs
    const inputs = document.querySelectorAll('.price-input, .notes-textarea');
    inputs.forEach(input => {
        input.addEventListener('focus', () => {
            input.parentElement.style.transform = 'translateY(-1px)';
        });
        
        input.addEventListener('blur', () => {
            input.parentElement.style.transform = 'translateY(0)';
        });
    });

    // Add loading animation to page elements
    setTimeout(() => {
        const container = document.querySelector('.quote-container');
        if (container) {
            container.style.opacity = '1';
            container.style.transform = 'translateY(0)';
        }
    }, 100);
});