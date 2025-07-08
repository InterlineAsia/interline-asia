// Member Authentication Widget
// Provides sign-out functionality for all logged-in members

/**
 * Create a floating member auth widget for any page
 * Shows user info and sign-out button for logged-in members
 */
function createMemberAuthWidget() {
  // Check if widget already exists
  if (document.getElementById('member-auth-widget')) {
    return;
  }

  const widget = document.createElement('div');
  widget.id = 'member-auth-widget';
  widget.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(226, 232, 240, 0.5);
    border-radius: 12px;
    padding: 12px 16px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    z-index: 1000;
    display: none;
    align-items: center;
    gap: 12px;
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    transition: all 0.3s ease;
  `;

  widget.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px;">
      <i class="ri-user-line" style="color: #FF7F41;"></i>
      <span id="widget-user-name" style="color: #334155; font-weight: 500;"></span>
    </div>
    <button onclick="memberSignOut()" style="
      background: #dc3545;
      color: white;
      border: none;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 4px;
    " onmouseover="this.style.background='#c82333'; this.style.transform='scale(1.05)'" onmouseout="this.style.background='#dc3545'; this.style.transform='scale(1)'">
      <i class="ri-logout-box-line"></i>
      Sign Out
    </button>
  `;

  document.body.appendChild(widget);
}

/**
 * Update the member auth widget with current user info
 */
function updateMemberAuthWidget() {
  try {
    if (window.supabaseClient && window.supabaseClient.isLoggedIn()) {
      const user = window.supabaseClient.currentUser;
      const displayName = user?.full_name || user?.email?.split('@')[0] || 'User';
      const isAdmin = user?.is_admin || user?.is_super_admin || user?.role === 'admin';
      
      const widget = document.getElementById('member-auth-widget');
      const nameElement = document.getElementById('widget-user-name');
      
      if (widget && nameElement) {
        nameElement.textContent = `${displayName}${isAdmin ? ' (Admin)' : ' (Member)'}`;
        widget.style.display = 'flex';
      }
    } else {
      const widget = document.getElementById('member-auth-widget');
      if (widget) {
        widget.style.display = 'none';
      }
    }
  } catch (error) {
    console.log('Member auth widget update skipped:', error.message);
  }
}

/**
 * Handle member sign out
 */
function memberSignOut() {
  if (confirm('Are you sure you want to sign out?')) {
    if (window.supabaseClient) {
      window.supabaseClient.signOut();
    } else {
      // Fallback
      window.location.href = '/login';
    }
  }
}

/**
 * Initialize member auth widget on page load
 */
function initMemberAuth() {
  // Create the widget
  createMemberAuthWidget();
  
  // Update widget after a delay to ensure supabase client is ready
  setTimeout(async () => {
    try {
      if (window.supabaseClient) {
        await window.supabaseClient.readyPromise;
        updateMemberAuthWidget();
        
        // Listen for auth state changes
        if (window.supabaseClient.supabase) {
          window.supabaseClient.supabase.auth.onAuthStateChange((event, session) => {
            setTimeout(updateMemberAuthWidget, 100);
          });
        }
      }
    } catch (error) {
      console.log('Member auth initialization skipped:', error.message);
    }
  }, 500);
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMemberAuth);
} else {
  initMemberAuth();
}