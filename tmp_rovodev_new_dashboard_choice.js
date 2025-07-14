// ✅ INTERLINE ASIA - REBUILT DASHBOARD CHOICE SYSTEM
// Clean dashboard choice logic with proper role detection

class InterlineDashboardChoice {
    constructor() {
        this.supabaseClient = window.supabaseClient;
        this.loginSystem = window.interlineLoginSystem;
    }

    async initialize() {
        console.log('🎯 DASHBOARD_CHOICE: Initializing...');
        
        try {
            // Wait for dependencies
            await this.supabaseClient.readyPromise;
            await this.loginSystem.initialize();

            // Check if user is logged in
            if (!this.supabaseClient.isLoggedIn()) {
                console.log('❌ DASHBOARD_CHOICE: User not logged in, redirecting...');
                window.location.href = '/login.html';
                return;
            }

            const user = this.supabaseClient.getCurrentUser();
            if (!user) {
                console.log('❌ DASHBOARD_CHOICE: No user found, redirecting...');
                window.location.href = '/login.html';
                return;
            }

            console.log('✅ DASHBOARD_CHOICE: User found:', user.email);

            // Determine access levels
            const hasAdminAccess = this.loginSystem.hasAdminAccess(user);
            const hasMemberAccess = this.loginSystem.hasMemberAccess(user);

            console.log('📋 DASHBOARD_CHOICE: Access levels:', {
                hasAdminAccess,
                hasMemberAccess,
                userEmail: user.email
            });

            // If user doesn't have both roles, redirect them directly
            if (!hasAdminAccess || !hasMemberAccess) {
                console.log('🔄 DASHBOARD_CHOICE: User doesn\'t need choice screen, redirecting...');
                if (hasAdminAccess) {
                    window.location.href = '/admin.html';
                } else {
                    window.location.href = '/dashboard.html';
                }
                return;
            }

            // User has both roles, show choice screen
            this.renderChoiceScreen(user, hasAdminAccess, hasMemberAccess);

        } catch (error) {
            console.error('❌ DASHBOARD_CHOICE: Initialization failed:', error);
            window.location.href = '/login.html';
        }
    }

    renderChoiceScreen(user, hasAdminAccess, hasMemberAccess) {
        console.log('🎨 DASHBOARD_CHOICE: Rendering choice screen...');

        // Update user info
        const userInfo = document.getElementById('user-info');
        const displayName = user.full_name || user.email?.split('@')[0] || 'User';
        
        if (userInfo) {
            userInfo.textContent = `Hello ${displayName}! You have access to both dashboards. Choose one to continue:`;
        }

        // Get buttons container
        const buttonsContainer = document.getElementById('dashboard-buttons');
        if (!buttonsContainer) {
            console.error('❌ DASHBOARD_CHOICE: Buttons container not found');
            return;
        }

        // Clear existing buttons
        buttonsContainer.innerHTML = '';

        // Create Member Dashboard Button
        if (hasMemberAccess) {
            const memberBtn = this.createDashboardButton({
                icon: 'ri-user-line',
                title: 'Member Dashboard',
                description: 'Access cruise deals, bookings, and your account',
                gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                onClick: () => {
                    console.log('🎯 DASHBOARD_CHOICE: Navigating to member dashboard');
                    window.location.href = '/dashboard.html';
                }
            });
            buttonsContainer.appendChild(memberBtn);
        }

        // Create Admin Dashboard Button
        if (hasAdminAccess) {
            const adminBtn = this.createDashboardButton({
                icon: 'ri-admin-line',
                title: 'Admin Dashboard',
                description: 'Manage users, bookings, and system settings',
                gradient: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                onClick: () => {
                    console.log('🎯 DASHBOARD_CHOICE: Navigating to admin dashboard');
                    window.location.href = '/admin.html';
                }
            });
            buttonsContainer.appendChild(adminBtn);
        }

        console.log('✅ DASHBOARD_CHOICE: Choice screen rendered successfully');
    }

    createDashboardButton({ icon, title, description, gradient, onClick }) {
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
        
        // Add hover effects
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

    signOut() {
        if (confirm('Are you sure you want to sign out?')) {
            console.log('🚪 DASHBOARD_CHOICE: Signing out...');
            if (this.supabaseClient) {
                this.supabaseClient.signOut();
            } else {
                window.location.href = '/login.html';
            }
        }
    }
}

// Global instance and initialization
window.interlineDashboardChoice = new InterlineDashboardChoice();

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.interlineDashboardChoice.initialize();
});

// Global signOut function for the button
function signOut() {
    window.interlineDashboardChoice.signOut();
}