// Credit Card Validation System
// Implements Luhn algorithm and BINList API integration for card verification

class CardValidator {
  constructor() {
    this.cardTypes = {
      visa: { name: 'Visa', icon: '💳', pattern: /^4/ },
      mastercard: { name: 'Mastercard', icon: '💳', pattern: /^5[1-5]|^2[2-7]/ },
      amex: { name: 'American Express', icon: '💳', pattern: /^3[47]/ },
      discover: { name: 'Discover', icon: '💳', pattern: /^6(?:011|5)/ },
      diners: { name: 'Diners Club', icon: '💳', pattern: /^3[0689]/ },
      jcb: { name: 'JCB', icon: '💳', pattern: /^35/ }
    };
    
    this.cardInfo = null;
    this.isValid = false;
    this.init();
  }

  init() {
    this.setupCardNumberInput();
    this.setupExpiryInput();
    this.setupCVVInput();
  }

  setupCardNumberInput() {
    const cardNumberInput = document.getElementById('cardNumber');
    if (!cardNumberInput) return;

    cardNumberInput.addEventListener('input', (e) => {
      this.formatCardNumber(e.target);
      this.validateCard(e.target.value);
    });

    cardNumberInput.addEventListener('blur', (e) => {
      this.fetchCardInfo(e.target.value);
    });
  }

  setupExpiryInput() {
    const expiryInput = document.getElementById('cardExpiry');
    if (!expiryInput) return;

    expiryInput.addEventListener('input', (e) => {
      this.formatExpiry(e.target);
      this.validateExpiry(e.target.value);
    });
  }

  setupCVVInput() {
    const cvvInput = document.getElementById('cardCVV');
    if (!cvvInput) return;

    cvvInput.addEventListener('input', (e) => {
      this.formatCVV(e.target);
      this.validateCVV(e.target.value);
    });
  }

  formatCardNumber(input) {
    let value = input.value.replace(/\D/g, '');
    value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
    input.value = value;
  }

  formatExpiry(input) {
    let value = input.value.replace(/\D/g, '');
    if (value.length >= 2) {
      value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    input.value = value;
  }

  formatCVV(input) {
    input.value = input.value.replace(/\D/g, '');
  }

  // Luhn Algorithm Implementation
  luhnCheck(cardNumber) {
    const digits = cardNumber.replace(/\D/g, '');
    let sum = 0;
    let isEven = false;

    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = parseInt(digits[i]);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }

  detectCardType(cardNumber) {
    const digits = cardNumber.replace(/\D/g, '');
    
    for (const [type, config] of Object.entries(this.cardTypes)) {
      if (config.pattern.test(digits)) {
        return { type, ...config };
      }
    }
    
    return null;
  }

  validateCard(cardNumber) {
    const digits = cardNumber.replace(/\D/g, '');
    const cardType = this.detectCardType(digits);
    const isLuhnValid = this.luhnCheck(digits);
    const isLengthValid = digits.length >= 13 && digits.length <= 19;

    // Update card type display
    this.updateCardTypeDisplay(cardType);

    // Update validation display
    this.updateValidationDisplay(isLuhnValid && isLengthValid, digits.length);

    this.isValid = isLuhnValid && isLengthValid;
    return this.isValid;
  }

  updateCardTypeDisplay(cardType) {
    const cardTypeElement = document.getElementById('cardType');
    if (!cardTypeElement) return;

    if (cardType) {
      cardTypeElement.innerHTML = `
        <span class="card-brand">
          ${cardType.icon} ${cardType.name}
        </span>
      `;
      cardTypeElement.className = 'card-type detected';
    } else {
      cardTypeElement.innerHTML = '';
      cardTypeElement.className = 'card-type';
    }
  }

  updateValidationDisplay(isValid, length) {
    const validationElement = document.getElementById('cardValidation');
    if (!validationElement) return;

    if (length === 0) {
      validationElement.innerHTML = '';
      validationElement.className = 'card-validation';
      return;
    }

    if (isValid) {
      validationElement.innerHTML = `
        <span class="validation-success">
          ✅ Valid card number
        </span>
      `;
      validationElement.className = 'card-validation success';
    } else {
      validationElement.innerHTML = `
        <span class="validation-error">
          ❌ Invalid card number
        </span>
      `;
      validationElement.className = 'card-validation error';
    }
  }

  validateExpiry(expiry) {
    const match = expiry.match(/^(\d{2})\/(\d{2})$/);
    if (!match) return false;

    const month = parseInt(match[1]);
    const year = parseInt('20' + match[2]);
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    if (month < 1 || month > 12) return false;
    if (year < currentYear || (year === currentYear && month < currentMonth)) return false;

    return true;
  }

  validateCVV(cvv) {
    return cvv.length >= 3 && cvv.length <= 4;
  }

  // Fetch card information from BINList API
  async fetchCardInfo(cardNumber) {
    const digits = cardNumber.replace(/\D/g, '');
    if (digits.length < 6) return;

    const bin = digits.substring(0, 6);
    
    try {
      const response = await fetch(`https://lookup.binlist.net/${bin}`, {
        headers: {
          'Accept-Version': '3'
        }
      });

      if (response.ok) {
        const data = await response.json();
        this.cardInfo = {
          scheme: data.scheme || 'Unknown',
          type: data.type || 'Unknown',
          brand: data.brand || 'Unknown',
          bank: data.bank?.name || 'Unknown Bank',
          country: data.country?.name || 'Unknown Country',
          countryCode: data.country?.alpha2 || 'XX'
        };

        this.displayCardInfo();
      }
    } catch (error) {
      console.warn('BINList API error:', error);
      // Fallback to basic card type detection
      this.cardInfo = {
        scheme: this.detectCardType(digits)?.name || 'Unknown',
        type: 'Unknown',
        brand: 'Unknown',
        bank: 'Unknown Bank',
        country: 'Unknown Country',
        countryCode: 'XX'
      };
    }
  }

  displayCardInfo() {
    const cardInfoElement = document.getElementById('cardInfo');
    if (!cardInfoElement || !this.cardInfo) return;

    cardInfoElement.innerHTML = `
      <div class="card-details">
        <div class="card-detail-item">
          <span class="detail-label">Card Type:</span>
          <span class="detail-value">${this.cardInfo.scheme} ${this.cardInfo.type}</span>
        </div>
        <div class="card-detail-item">
          <span class="detail-label">Issuing Bank:</span>
          <span class="detail-value">${this.cardInfo.bank}</span>
        </div>
        <div class="card-detail-item">
          <span class="detail-label">Country:</span>
          <span class="detail-value">${this.cardInfo.country}</span>
        </div>
      </div>
    `;
  }

  // Get card metadata for backend (no sensitive data)
  getCardMetadata() {
    if (!this.cardInfo) return null;

    return {
      scheme: this.cardInfo.scheme,
      type: this.cardInfo.type,
      brand: this.cardInfo.brand,
      bank: this.cardInfo.bank,
      country: this.cardInfo.country,
      countryCode: this.cardInfo.countryCode,
      isValid: this.isValid
    };
  }

  // Validate all card fields
  validateAllFields() {
    const cardNumber = document.getElementById('cardNumber')?.value || '';
    const cardExpiry = document.getElementById('cardExpiry')?.value || '';
    const cardCVV = document.getElementById('cardCVV')?.value || '';
    const cardName = document.getElementById('cardName')?.value || '';

    const isCardValid = this.validateCard(cardNumber);
    const isExpiryValid = this.validateExpiry(cardExpiry);
    const isCVVValid = this.validateCVV(cardCVV);
    const isNameValid = cardName.trim().length > 0;

    return {
      isValid: isCardValid && isExpiryValid && isCVVValid && isNameValid,
      cardNumber: isCardValid,
      expiry: isExpiryValid,
      cvv: isCVVValid,
      name: isNameValid,
      metadata: this.getCardMetadata()
    };
  }

  // Get masked card number for display (last 4 digits only)
  getMaskedCardNumber() {
    const cardNumber = document.getElementById('cardNumber')?.value || '';
    const digits = cardNumber.replace(/\D/g, '');
    if (digits.length < 4) return '****';
    return '**** **** **** ' + digits.slice(-4);
  }
}

// CSS Styles for card validation
const cardValidationStyles = `
  .security-note {
    background: #f0f9ff;
    border: 1px solid #0ea5e9;
    border-radius: 6px;
    padding: 1rem;
    margin-bottom: 1.5rem;
    color: #0c4a6e;
    font-size: 0.9rem;
  }

  .card-input-container {
    position: relative;
    display: flex;
    align-items: center;
  }

  .card-input-container input {
    flex: 1;
    padding-right: 120px;
  }

  .card-type {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 0.8rem;
    color: #64748b;
  }

  .card-type.detected {
    color: #059669;
    font-weight: 600;
  }

  .card-brand {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .card-validation {
    margin-top: 0.5rem;
    font-size: 0.85rem;
  }

  .validation-success {
    color: #059669;
    font-weight: 600;
  }

  .validation-error {
    color: #dc2626;
    font-weight: 600;
  }

  .card-details {
    background: #f8f9fa;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 1rem;
    margin-top: 1rem;
  }

  .card-detail-item {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.5rem;
  }

  .card-detail-item:last-child {
    margin-bottom: 0;
  }

  .detail-label {
    font-weight: 600;
    color: #374151;
  }

  .detail-value {
    color: #6b7280;
  }

  @media (max-width: 768px) {
    .card-input-container input {
      padding-right: 100px;
    }

    .card-type {
      right: 8px;
      font-size: 0.7rem;
    }

    .card-detail-item {
      flex-direction: column;
      gap: 0.25rem;
    }
  }
`;

// Inject styles
const cardStyleSheet = document.createElement('style');
cardStyleSheet.textContent = cardValidationStyles;
document.head.appendChild(cardStyleSheet);

// Initialize card validator
let cardValidator;
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('cardNumber')) {
    cardValidator = new CardValidator();
  }
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CardValidator;
}