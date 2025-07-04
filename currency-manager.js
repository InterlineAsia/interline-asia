// Multi-Currency Manager for Interline Asia
// Handles currency switching and price display in AUD, USD, and THB

class CurrencyManager {
  constructor() {
    this.currentCurrency = 'USD'; // Default currency
    this.currencies = {
      USD: { symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
      AUD: { symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺' },
      THB: { symbol: '฿', name: 'Thai Baht', flag: '🇹🇭' }
    };
    
    // Static conversion rates (manually maintained for now)
    this.exchangeRates = {
      USD: { USD: 1, AUD: 1.52, THB: 34.50 },
      AUD: { USD: 0.66, AUD: 1, THB: 22.70 },
      THB: { USD: 0.029, AUD: 0.044, THB: 1 }
    };
    
    this.init();
  }

  init() {
    // Load saved currency preference
    this.loadCurrencyPreference();
    
    // Add currency switcher to page
    this.addCurrencySwitcher();
    
    // Convert existing prices
    this.convertAllPrices();
  }

  loadCurrencyPreference() {
    const saved = localStorage.getItem('preferredCurrency');
    if (saved && this.currencies[saved]) {
      this.currentCurrency = saved;
    }
  }

  saveCurrencyPreference() {
    localStorage.setItem('preferredCurrency', this.currentCurrency);
  }

  addCurrencySwitcher() {
    // Remove existing switcher
    const existing = document.getElementById('currency-switcher');
    if (existing) existing.remove();

    const switcher = document.createElement('div');
    switcher.id = 'currency-switcher';
    switcher.className = 'currency-switcher';
    switcher.innerHTML = `
      <div class="currency-dropdown">
        <button class="currency-btn" id="currency-btn">
          <span class="currency-flag">${this.currencies[this.currentCurrency].flag}</span>
          <span class="currency-code">${this.currentCurrency}</span>
          <span class="dropdown-arrow">▼</span>
        </button>
        <div class="currency-options" id="currency-options">
          ${Object.keys(this.currencies).map(code => `
            <div class="currency-option ${code === this.currentCurrency ? 'selected' : ''}" 
                 data-currency="${code}">
              <span class="currency-flag">${this.currencies[code].flag}</span>
              <span class="currency-info">
                <span class="currency-code">${code}</span>
                <span class="currency-name">${this.currencies[code].name}</span>
              </span>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    // Insert switcher in header or top of page
    const header = document.querySelector('.header') || document.querySelector('.auth-header');
    if (header) {
      header.appendChild(switcher);
    } else {
      // Fallback: add to top of body
      document.body.insertBefore(switcher, document.body.firstChild);
    }

    // Add event listeners
    this.setupSwitcherEvents();
  }

  setupSwitcherEvents() {
    const btn = document.getElementById('currency-btn');
    const options = document.getElementById('currency-options');
    const optionElements = document.querySelectorAll('.currency-option');

    // Toggle dropdown
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      options.classList.toggle('show');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
      options.classList.remove('show');
    });

    // Handle currency selection
    optionElements.forEach(option => {
      option.addEventListener('click', (e) => {
        e.stopPropagation();
        const newCurrency = option.dataset.currency;
        this.switchCurrency(newCurrency);
        options.classList.remove('show');
      });
    });
  }

  switchCurrency(newCurrency) {
    if (!this.currencies[newCurrency]) return;

    const oldCurrency = this.currentCurrency;
    this.currentCurrency = newCurrency;
    
    // Save preference
    this.saveCurrencyPreference();
    
    // Update switcher display
    this.updateSwitcherDisplay();
    
    // Convert all prices on page
    this.convertAllPrices();
    
    // Track currency change
    if (typeof gtag !== 'undefined') {
      gtag('event', 'currency_change', {
        from_currency: oldCurrency,
        to_currency: newCurrency
      });
    }
  }

  updateSwitcherDisplay() {
    const btn = document.getElementById('currency-btn');
    const options = document.querySelectorAll('.currency-option');
    
    if (btn) {
      btn.querySelector('.currency-flag').textContent = this.currencies[this.currentCurrency].flag;
      btn.querySelector('.currency-code').textContent = this.currentCurrency;
    }
    
    options.forEach(option => {
      option.classList.toggle('selected', option.dataset.currency === this.currentCurrency);
    });
  }

  convertAllPrices() {
    // Convert price values
    const priceElements = document.querySelectorAll('.price-value');
    priceElements.forEach(element => {
      this.convertPriceElement(element);
    });

    // Convert quote available elements (if they have data-original-price)
    const quoteElements = document.querySelectorAll('.quote-available');
    quoteElements.forEach(element => {
      if (element.dataset.originalPrice) {
        this.convertPriceElement(element);
      }
    });

    // Convert any other price displays
    const totalElements = document.querySelectorAll('#total-amount, #selected-cabin-price');
    totalElements.forEach(element => {
      this.convertPriceElement(element);
    });
  }

  convertPriceElement(element) {
    // Skip if element contains "Login to view" or similar
    if (element.textContent.includes('Login') || element.textContent.includes('🔒')) {
      return;
    }

    // Get original price or current price
    let originalPrice = element.dataset.originalPrice;
    
    if (!originalPrice) {
      // Extract price from current text and store as original
      const priceMatch = element.textContent.match(/[\d,]+\.?\d*/);
      if (priceMatch) {
        originalPrice = priceMatch[0].replace(/,/g, '');
        element.dataset.originalPrice = originalPrice;
        element.dataset.originalCurrency = 'USD'; // Assume USD as base
      } else {
        return; // No price found
      }
    }

    const originalCurrency = element.dataset.originalCurrency || 'USD';
    const numPrice = parseFloat(originalPrice);
    
    if (isNaN(numPrice)) return;

    // Convert price
    const convertedPrice = this.convertPrice(numPrice, originalCurrency, this.currentCurrency);
    const formattedPrice = this.formatPrice(convertedPrice, this.currentCurrency);
    
    // Update element text
    if (element.classList.contains('quote-available')) {
      element.innerHTML = `📝 Quote Available (${formattedPrice})`;
    } else {
      element.textContent = formattedPrice;
    }
  }

  convertPrice(amount, fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) return amount;
    
    // Convert via USD if needed
    let usdAmount = amount;
    if (fromCurrency !== 'USD') {
      usdAmount = amount / this.exchangeRates[fromCurrency].USD;
    }
    
    // Convert from USD to target currency
    if (toCurrency !== 'USD') {
      return usdAmount * this.exchangeRates.USD[toCurrency];
    }
    
    return usdAmount;
  }

  formatPrice(amount, currency) {
    const symbol = this.currencies[currency].symbol;
    
    // Format based on currency
    switch (currency) {
      case 'THB':
        // Thai Baht - no decimals, comma separators
        return `${symbol}${Math.round(amount).toLocaleString()}`;
      case 'AUD':
      case 'USD':
      default:
        // USD/AUD - 2 decimals, comma separators
        return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    }
  }

  // Public method to get current currency info
  getCurrentCurrency() {
    return {
      code: this.currentCurrency,
      symbol: this.currencies[this.currentCurrency].symbol,
      name: this.currencies[this.currentCurrency].name,
      flag: this.currencies[this.currentCurrency].flag
    };
  }

  // Public method to convert a specific price
  getConvertedPrice(amount, fromCurrency = 'USD') {
    const converted = this.convertPrice(amount, fromCurrency, this.currentCurrency);
    return this.formatPrice(converted, this.currentCurrency);
  }
}

// CSS Styles for currency switcher
const currencyStyles = `
  .currency-switcher {
    position: relative;
    display: inline-block;
    margin-left: auto;
  }

  .currency-dropdown {
    position: relative;
  }

  .currency-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    color: white;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.9rem;
    font-weight: 600;
  }

  .currency-btn:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  .currency-flag {
    font-size: 1.2rem;
  }

  .currency-code {
    font-weight: 600;
  }

  .dropdown-arrow {
    font-size: 0.8rem;
    transition: transform 0.2s ease;
  }

  .currency-options.show .dropdown-arrow {
    transform: rotate(180deg);
  }

  .currency-options {
    position: absolute;
    top: 100%;
    right: 0;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    min-width: 200px;
    z-index: 1000;
    opacity: 0;
    visibility: hidden;
    transform: translateY(-10px);
    transition: all 0.2s ease;
  }

  .currency-options.show {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
  }

  .currency-option {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    cursor: pointer;
    transition: background 0.2s ease;
    border-bottom: 1px solid #f1f5f9;
  }

  .currency-option:last-child {
    border-bottom: none;
  }

  .currency-option:hover {
    background: #f8f9fa;
  }

  .currency-option.selected {
    background: #dbeafe;
    color: #1e40af;
  }

  .currency-info {
    display: flex;
    flex-direction: column;
  }

  .currency-option .currency-code {
    font-weight: 600;
    color: #1e40af;
  }

  .currency-name {
    font-size: 0.8rem;
    color: #64748b;
  }

  .currency-option.selected .currency-name {
    color: #1d4ed8;
  }

  @media (max-width: 768px) {
    .currency-switcher {
      margin: 0;
    }

    .currency-btn {
      padding: 0.4rem 0.8rem;
      font-size: 0.8rem;
    }

    .currency-options {
      right: 0;
      left: auto;
      min-width: 180px;
    }
  }
`;

// Inject styles
const currencyStyleSheet = document.createElement('style');
currencyStyleSheet.textContent = currencyStyles;
document.head.appendChild(currencyStyleSheet);

// Initialize currency manager
let currencyManager;
document.addEventListener('DOMContentLoaded', () => {
  currencyManager = new CurrencyManager();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CurrencyManager;
}