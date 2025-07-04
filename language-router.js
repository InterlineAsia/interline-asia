// Multi-Language Router for Interline Asia
// Handles English/Thai language switching and routing

class LanguageRouter {
  constructor() {
    this.currentLanguage = 'en'; // Default to English
    this.supportedLanguages = {
      en: { name: 'English', flag: '🇺🇸', dir: 'ltr' },
      th: { name: 'ไทย', flag: '🇹🇭', dir: 'ltr' }
    };
    
    // Basic translations (expandable)
    this.translations = {
      en: {
        'site.title': 'Interline Asia',
        'nav.deals': 'Cruise Deals',
        'nav.login': 'Login',
        'nav.signup': 'Sign Up',
        'nav.dashboard': 'Dashboard',
        'deals.title': 'Exclusive Cruise Deals',
        'deals.subtitle': 'Discover luxury cruise experiences with insider rates and VIP access',
        'deals.filter.cruiseline': 'Filter by Cruise Line',
        'deals.filter.destination': 'Filter by Destination',
        'deals.filter.duration': 'Filter by Duration',
        'deals.filter.search': 'Search Ships/Itineraries',
        'deals.filter.sort': 'Sort by Price',
        'deals.filter.clear': 'Clear Filters',
        'deals.book': 'Book This Cruise',
        'deals.login_to_view': 'Login to view',
        'member.login_required': 'Member Access Required',
        'member.login_subtitle': 'Login to view exclusive pricing and book cruise deals',
        'member.verification_pending': 'Document Verification Pending',
        'member.verification_subtitle': 'Upload your industry credentials to unlock full booking access'
      },
      th: {
        'site.title': 'อินเตอร์ไลน์ เอเชีย',
        'nav.deals': 'ดีลล่องเรือ',
        'nav.login': 'เข้าสู่ระบบ',
        'nav.signup': 'สมัครสมาชิก',
        'nav.dashboard': 'แดชบอร์ด',
        'deals.title': 'ดีลล่องเรือสุดพิเศษ',
        'deals.subtitle': 'ค้นพบประสบการณ์ล่องเรือหรูหราด้วยราคาพิเศษและการเข้าถึง VIP',
        'deals.filter.cruiseline': 'กรองตามสายเรือ',
        'deals.filter.destination': 'กรองตามจุดหมาย',
        'deals.filter.duration': 'กรองตามระยะเวลา',
        'deals.filter.search': 'ค้นหาเรือ/เส้นทาง',
        'deals.filter.sort': 'เรียงตามราคา',
        'deals.filter.clear': 'ล้างตัวกรอง',
        'deals.book': 'จองล่องเรือนี้',
        'deals.login_to_view': 'เข้าสู่ระบบเพื่อดูราคา',
        'member.login_required': 'ต้องเป็นสมาชิก',
        'member.login_subtitle': 'เข้าสู่ระบบเพื่อดูราคาพิเศษและจองดีลล่องเรือ',
        'member.verification_pending': 'รอการตรวจสอบเอกสาร',
        'member.verification_subtitle': 'อัปโหลดข้อมูลประจำตัวของคุณเพื่อปลดล็อกการเข้าถึงการจองเต็มรูปแบบ'
      }
    };
    
    this.init();
  }

  init() {
    // Detect language from URL or localStorage
    this.detectLanguage();
    
    // Add language switcher
    this.addLanguageSwitcher();
    
    // Apply translations to current page
    this.applyTranslations();
    
    // Set document language and direction
    this.setDocumentLanguage();
  }

  detectLanguage() {
    // Check URL path for language prefix
    const path = window.location.pathname;
    const langMatch = path.match(/^\/(en|th)\//);
    
    if (langMatch) {
      this.currentLanguage = langMatch[1];
    } else {
      // Check localStorage
      const saved = localStorage.getItem('preferredLanguage');
      if (saved && this.supportedLanguages[saved]) {
        this.currentLanguage = saved;
      }
    }
  }

  addLanguageSwitcher() {
    // Remove existing switcher
    const existing = document.getElementById('language-switcher');
    if (existing) existing.remove();

    const switcher = document.createElement('div');
    switcher.id = 'language-switcher';
    switcher.className = 'language-switcher';
    switcher.innerHTML = `
      <div class="language-dropdown">
        <button class="language-btn" id="language-btn">
          <span class="language-flag">${this.supportedLanguages[this.currentLanguage].flag}</span>
          <span class="language-name">${this.supportedLanguages[this.currentLanguage].name}</span>
          <span class="dropdown-arrow">▼</span>
        </button>
        <div class="language-options" id="language-options">
          ${Object.keys(this.supportedLanguages).map(code => `
            <div class="language-option ${code === this.currentLanguage ? 'selected' : ''}" 
                 data-language="${code}">
              <span class="language-flag">${this.supportedLanguages[code].flag}</span>
              <span class="language-name">${this.supportedLanguages[code].name}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    // Insert switcher next to currency switcher or in header
    const currencySwitcher = document.getElementById('currency-switcher');
    const header = document.querySelector('.header') || document.querySelector('.auth-header');
    
    if (currencySwitcher) {
      currencySwitcher.parentNode.insertBefore(switcher, currencySwitcher);
    } else if (header) {
      header.appendChild(switcher);
    } else {
      document.body.insertBefore(switcher, document.body.firstChild);
    }

    // Add event listeners
    this.setupSwitcherEvents();
  }

  setupSwitcherEvents() {
    const btn = document.getElementById('language-btn');
    const options = document.getElementById('language-options');
    const optionElements = document.querySelectorAll('.language-option');

    // Toggle dropdown
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      options.classList.toggle('show');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
      options.classList.remove('show');
    });

    // Handle language selection
    optionElements.forEach(option => {
      option.addEventListener('click', (e) => {
        e.stopPropagation();
        const newLanguage = option.dataset.language;
        this.switchLanguage(newLanguage);
        options.classList.remove('show');
      });
    });
  }

  switchLanguage(newLanguage) {
    if (!this.supportedLanguages[newLanguage]) return;

    const oldLanguage = this.currentLanguage;
    this.currentLanguage = newLanguage;
    
    // Save preference
    localStorage.setItem('preferredLanguage', newLanguage);
    
    // Update switcher display
    this.updateSwitcherDisplay();
    
    // Apply translations
    this.applyTranslations();
    
    // Set document language
    this.setDocumentLanguage();
    
    // Track language change
    if (typeof gtag !== 'undefined') {
      gtag('event', 'language_change', {
        from_language: oldLanguage,
        to_language: newLanguage
      });
    }

    // For full implementation, you might want to reload the page with new URL
    // this.redirectToLanguageVersion(newLanguage);
  }

  updateSwitcherDisplay() {
    const btn = document.getElementById('language-btn');
    const options = document.querySelectorAll('.language-option');
    
    if (btn) {
      btn.querySelector('.language-flag').textContent = this.supportedLanguages[this.currentLanguage].flag;
      btn.querySelector('.language-name').textContent = this.supportedLanguages[this.currentLanguage].name;
    }
    
    options.forEach(option => {
      option.classList.toggle('selected', option.dataset.language === this.currentLanguage);
    });
  }

  applyTranslations() {
    // Find all elements with data-translate attribute
    const translatableElements = document.querySelectorAll('[data-translate]');
    
    translatableElements.forEach(element => {
      const key = element.dataset.translate;
      const translation = this.getTranslation(key);
      
      if (translation) {
        if (element.tagName === 'INPUT' && element.type === 'text') {
          element.placeholder = translation;
        } else {
          element.textContent = translation;
        }
      }
    });

    // Apply translations to common elements by ID/class
    this.translateCommonElements();
  }

  translateCommonElements() {
    const commonTranslations = {
      'h1': 'deals.title',
      '.header p': 'deals.subtitle',
      '.main-stat': 'deals.title',
      '.sub-stat': 'deals.subtitle'
    };

    Object.keys(commonTranslations).forEach(selector => {
      const elements = document.querySelectorAll(selector);
      const translation = this.getTranslation(commonTranslations[selector]);
      
      if (translation) {
        elements.forEach(element => {
          // Only translate if not already translated
          if (!element.dataset.translated) {
            element.textContent = translation;
            element.dataset.translated = 'true';
          }
        });
      }
    });
  }

  getTranslation(key) {
    return this.translations[this.currentLanguage]?.[key] || this.translations.en[key] || key;
  }

  setDocumentLanguage() {
    document.documentElement.lang = this.currentLanguage;
    document.documentElement.dir = this.supportedLanguages[this.currentLanguage].dir;
  }

  redirectToLanguageVersion(language) {
    const currentPath = window.location.pathname;
    const currentSearch = window.location.search;
    
    // Remove existing language prefix
    const cleanPath = currentPath.replace(/^\/(en|th)/, '');
    
    // Add new language prefix
    const newPath = `/${language}${cleanPath}`;
    
    // Redirect to new URL
    window.location.href = newPath + currentSearch;
  }

  // Public method to get current language info
  getCurrentLanguage() {
    return {
      code: this.currentLanguage,
      name: this.supportedLanguages[this.currentLanguage].name,
      flag: this.supportedLanguages[this.currentLanguage].flag,
      dir: this.supportedLanguages[this.currentLanguage].dir
    };
  }

  // Public method to add translation
  addTranslation(key, translations) {
    Object.keys(translations).forEach(lang => {
      if (this.translations[lang]) {
        this.translations[lang][key] = translations[lang];
      }
    });
  }
}

// CSS Styles for language switcher
const languageStyles = `
  .language-switcher {
    position: relative;
    display: inline-block;
    margin-right: 1rem;
  }

  .language-dropdown {
    position: relative;
  }

  .language-btn {
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

  .language-btn:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  .language-flag {
    font-size: 1.2rem;
  }

  .language-name {
    font-weight: 600;
  }

  .language-options {
    position: absolute;
    top: 100%;
    right: 0;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    min-width: 150px;
    z-index: 1000;
    opacity: 0;
    visibility: hidden;
    transform: translateY(-10px);
    transition: all 0.2s ease;
  }

  .language-options.show {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
  }

  .language-option {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    cursor: pointer;
    transition: background 0.2s ease;
    border-bottom: 1px solid #f1f5f9;
  }

  .language-option:last-child {
    border-bottom: none;
  }

  .language-option:hover {
    background: #f8f9fa;
  }

  .language-option.selected {
    background: #dbeafe;
    color: #1e40af;
  }

  .language-option .language-name {
    font-weight: 600;
    color: #1e40af;
  }

  @media (max-width: 768px) {
    .language-switcher {
      margin-right: 0.5rem;
    }

    .language-btn {
      padding: 0.4rem 0.8rem;
      font-size: 0.8rem;
    }

    .language-options {
      right: 0;
      left: auto;
      min-width: 120px;
    }
  }
`;

// Inject styles
const languageStyleSheet = document.createElement('style');
languageStyleSheet.textContent = languageStyles;
document.head.appendChild(languageStyleSheet);

// Initialize language router
let languageRouter;
document.addEventListener('DOMContentLoaded', () => {
  languageRouter = new LanguageRouter();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LanguageRouter;
}