// Dashboard Authentication Check
// This script directly checks if the user is authenticated using Supabase

document.addEventListener('DOMContentLoaded', async function() {
  console.log('DASHBOARD_AUTH: Initializing authentication check...');
  
  // Initialize Supabase client directly
  const supabase = window.supabase.createClient(
    window.SUPABASE_URL || 'https://nxreyyxbuwxjfmtvdkji.supabase.co',
    window.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54cmV5eXhidXd4amZtdHZka2ppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NTg4NDQsImV4cCI6MjA2NzAzNDg0NH0.SuaK9TqBLbysPCe0zyrMA8owMK4R-q7iNZbtLQzEKcE',
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        storage: window.localStorage
      }
    }
  );
  
  console.log('DASHBOARD_AUTH: Checking authentication status...');
  
  try {
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.log('DASHBOARD_AUTH: No session found, redirecting to login');
      window.location.href = '/login.html?redirect=' + encodeURIComponent(window.location.pathname);
      return;
    }
    
    console.log('DASHBOARD_AUTH: User authenticated:', session.user.email);
    
    // Get user data
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle();
    
    if (userError) {
      console.warn('DASHBOARD_AUTH: Error fetching user profile:', userError.message);
    }
    
    // Determine if user is admin
    const adminEmails = ['rodney@telenational.com.au', 'admin@telenational.com.au'];
    const isAdmin = adminEmails.includes(session.user.email.toLowerCase()) || 
                   userData?.role === 'admin' || 
                   userData?.role === 'super_admin' ||
                   userData?.is_admin === true;
    
    // Update UI based on user data
    updateDashboardUI(session.user, userData, isAdmin);
    
  } catch (error) {
    console.error('DASHBOARD_AUTH: Authentication error:', error);
    window.location.href = '/login.html?error=auth';
  }
});

function updateDashboardUI(user, profile, isAdmin) {
  // Update user info display
  const userInfo = document.getElementById('user-info');
  const displayName = profile?.full_name || user.email?.split('@')[0] || 'User';
  const roleText = isAdmin ? ' (Admin)' : ' (Member)';
  
  if (userInfo) {
    userInfo.textContent = `Hello ${displayName}${roleText}! You have access to both dashboards. Choose one to continue:`;
  }

  // Create dashboard buttons
  const buttonsContainer = document.getElementById('dashboard-buttons');
  if (!buttonsContainer) {
    console.error('DASHBOARD_AUTH: Buttons container not found');
    return;
  }

  buttonsContainer.innerHTML = ''; // Clear existing buttons

  // Create Member Dashboard Button (always available)
  const memberBtn = createDashboardButton({
    icon: 'ri-user-line',
    title: 'Member Dashboard',
    description: 'Access cruise deals, bookings, and your account',
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    onClick: () => {
      console.log('DASHBOARD_AUTH: Navigating to member dashboard');
      window.location.href = '/dashboard.html';
    }
  });
  buttonsContainer.appendChild(memberBtn);

  // Create Admin Dashboard Button (only for admins)
  if (isAdmin) {
    console.log('DASHBOARD_AUTH: Adding admin button');
    const adminBtn = createDashboardButton({
      icon: 'ri-admin-line',
      title: 'Admin Dashboard',
      description: 'Manage users, bookings, and system settings',
      gradient: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
      onClick: () => {
        console.log('DASHBOARD_AUTH: Navigating to admin dashboard');
        window.location.href = '/admin.html';
      }
    });
    buttonsContainer.appendChild(adminBtn);
  }

  console.log('DASHBOARD_AUTH: Dashboard UI updated successfully');
}

function createDashboardButton({ icon, title, description, gradient, onClick }) {
  const button = document.createElement('button');
  
  button.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; gap: 1rem;">
      <i class="${icon}" style="font-size: 1.5rem;"></i>
      <div style="text-align: left;">
        <div style="font-weight: 600; font-size: 1.1rem;">${title}</div>
        <div style="font-size: 0.9rem; opacity: 0.8;">${description}</div>
      </div>
    </div>
  `;
  
  button.style.cssText = `
    background: ${gradient};
    color: white;
    border: none;
    padding: 1.5rem;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    width: 100%;
    font-family: inherit;
    margin-bottom: 0.5rem;
  `;
  
  button.onmouseover = () => {
    button.style.transform = 'translateY(-2px)';
    button.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
  };
  
  button.onmouseout = () => {
    button.style.transform = 'translateY(0)';
    button.style.boxShadow = 'none';
  };
  
  button.onclick = onClick;
  return button;
}