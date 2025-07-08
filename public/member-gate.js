// Member Access Gate - Authentication and Document Verification
// Controls access to pricing and booking based on login status and document uploads

class MemberGate {
  constructor() {
    this.currentUser = null;
    this.userProfile = null; // Will hold profile data like verification_status
    this.isLoggedIn = false;
    this.init();
  }

  async init() {
    // Check if user is logged in
    await this.checkAuthStatus();
    
    // Apply access gates to current page
    this.applyAccessGates();
  }

  async checkAuthStatus() {
    try {
      // Check Supabase auth status
      if (window.supabaseClient && window.supabaseClient.supabase) {
        const { data: { user } } = await window.supabaseClient.supabase.auth.getUser();
        
        if (user) {
          this.currentUser = user;
          this.isLoggedIn = true;

          // Fetch user profile to get verification status
          if (window.supabaseClient && window.supabaseClient.getProfile) {
            this.userProfile = await window.supabaseClient.getProfile();
          }
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      this.isLoggedIn = false;
    }
  }

  applyAccessGates() {
    // Hide prices for non-logged-in users
    this.gatePricing();
    
    // Hide booking buttons for non-verified users
    this.gateBooking();
    
    // Show appropriate messages
    this.showAccessMessages();
  }

  gatePricing() {
    const priceElements = document.querySelectorAll('.price-value, .quote-available');
    
    priceElements.forEach(element => {
      if (!this.isLoggedIn) {
        // Replace price with login prompt
        element.innerHTML = '<span class="login-to-view">🔒 Login to view</span>';
        element.style.cursor = 'pointer';
        element.onclick = () => this.redirectToLogin();
      }
    });
  }

  gateBooking() {
    const bookingButtons = document.querySelectorAll('.book-now-btn');
    
    bookingButtons.forEach(button => {
      if (!this.isLoggedIn) {
        button.textContent = '🔒 Login to Book';
        button.onclick = (e) => {
          e.preventDefault();
          this.redirectToLogin();
        };
      } else if (!this.isVerified()) {
        button.textContent = '⏳ Verification Pending';
        button.disabled = true; // Disable the button
        button.style.cursor = 'not-allowed';
        button.onclick = (e) => {
          e.preventDefault();
          alert('Your account is pending verification. You will be notified via email once you have full booking access.');
        };
      }
    });
  }

  isVerified() {
    // Check for admin-approved status instead of document presence
    return this.userProfile && this.userProfile.verification_status === 'verified';
  }

  addAccessBanner() {
    // Remove existing banner
    const existingBanner = document.getElementById('access-banner');
    if (existingBanner) existingBanner.remove();

    const banner = document.createElement('div');
    banner.id = 'access-banner';
    banner.className = 'access-banner';

    if (!this.isLoggedIn) {
      banner.innerHTML = `
        <div class="banner-content guest-banner">
          <div class="banner-icon">🔒</div>
          <div class="banner-text">
            <h3>Member Access Required</h3>
            <p>Login to view exclusive pricing and book cruise deals</p>
          </div>
          <button class="banner-btn" onclick="memberGate.redirectToLogin()">
            Login / Sign Up
          </button>
        </div>
      `;
    } else if (!this.isVerified()) {
      banner.innerHTML = `
        <div class="banner-content verification-banner">
          <div class="banner-icon">⏳</div>
          <div class="banner-text">
            <h3>Account Verification Pending</h3>
            <p>Our team is reviewing your credentials. You'll be notified once you have full booking access.</p>
          </div>
          <button class="banner-btn" onclick="memberGate.redirectToDashboard()">
            My Dashboard
          </button>
        </div>
      `;
    } else {
      banner.innerHTML = `
        <div class="banner-content verified-banner">
          <div class="banner-icon">✅</div>
          <div class="banner-text">
            <h3>Verified Member</h3>
            <p>Welcome back! You have full access to exclusive deals and booking</p>
          </div>
          <button class="banner-btn" onclick="memberGate.redirectToDashboard()">
            My Dashboard
          </button>
        </div>
      `;
    }

    // Insert banner at top of main content
    const container = document.querySelector('.container') || document.body;
    const firstChild = container.firstElementChild;
    container.insertBefore(banner, firstChild);
  }

  redirectToLogin() {
    // Store current page for redirect after login
    localStorage.setItem('redirectAfterLogin', window.location.href);
    window.location.href = 'login.html';
  }

  redirectToDashboard() {
    window.location.href = 'dashboard.html';
  }

  // Public method to refresh gate status
  async refresh() {
    await this.checkAuthStatus();
    this.applyAccessGates();
  }
}

// CSS Styles for member gate
const memberGateStyles = `
  .login-to-view {
    color: #dc2626;
    font-weight: 600;
    font-size: 0.9rem;
    background: rgba(220, 38, 38, 0.1);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    border: 1px solid rgba(220, 38, 38, 0.3);
  }

  .access-banner {
    margin-bottom: 2rem;
    border-radius: 12px;
    overflow: hidden;
    animation: slideDown 0.4s ease-out;
  }

  .banner-content {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.5rem;
    position: relative;
  }

  .guest-banner {
    background: linear-gradient(135deg, #fef2f2, #fee2e2);
    border: 1px solid #fca5a5;
  }

  .verification-banner {
    background: linear-gradient(135deg, #fff3cd, #fef3c7);
    border: 1px solid #fbbf24;
  }

  .verified-banner {
    background: linear-gradient(135deg, #dcfce7, #bbf7d0);
    border: 1px solid #22c55e;
  }

  .banner-icon {
    font-size: 2.5rem;
    flex-shrink: 0;
  }

  .banner-text {
    flex: 1;
  }

  .guest-banner .banner-text {
    color: #dc2626;
  }

  .verification-banner .banner-text {
    color: #92400e;
  }

  .verified-banner .banner-text {
    color: #166534;
  }

  .banner-text h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1.3rem;
  }

  .banner-text p {
    margin: 0;
    line-height: 1.5;
  }

  .banner-btn {
    background: #3b82f6;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .banner-btn:hover {
    background: #2563eb;
    transform: translateY(-1px);
  }

  .document-reminder {
    background: rgba(255, 255, 255, 0.95);
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 2rem;
  }

  .reminder-content h4 {
    color: #1e40af;
    margin: 0 0 1rem 0;
    font-size: 1.2rem;
  }

  .document-checklist {
    display: grid;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .checklist-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    border-radius: 6px;
  }

  .checklist-item.completed {
    background: rgba(34, 197, 94, 0.1);
    color: #166534;
  }

  .checklist-item.pending {
    background: rgba(251, 191, 36, 0.1);
    color: #92400e;
  }

  .check-icon {
    font-size: 1.2rem;
  }

  .reminder-btn {
    background: #1e40af;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .reminder-btn:hover {
    background: #1d4ed8;
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (max-width: 768px) {
    .banner-content {
      flex-direction: column;
      text-align: center;
      gap: 1rem;
    }

    .banner-icon {
      font-size: 2rem;
    }

    .banner-text h3 {
      font-size: 1.1rem;
    }

    .banner-text p {
      font-size: 0.9rem;
    }
  }
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = memberGateStyles;
document.head.appendChild(styleSheet);

// Initialize member gate
let memberGate;
document.addEventListener('DOMContentLoaded', () => {
  memberGate = new MemberGate();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MemberGate;
}