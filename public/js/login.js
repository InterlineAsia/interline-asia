// LOGIN SYSTEM COORDINATOR
// This file ensures only one login system is active and coordinates between different implementations

console.log('LOGIN_COORDINATOR: Initializing login system coordinator...');

// Define a global flag to track if a login system is already active
window.loginSystemActive = false;

document.addEventListener('DOMContentLoaded', () => {
    // Check if another login system is already active
    if (window.loginSystemActive) {
        console.log('LOGIN_COORDINATOR: Another login system is already active, skipping initialization');
        return;
    }

    // Mark this login system as active
    window.loginSystemActive = true;
    console.log('LOGIN_COORDINATOR: This login system is now active');

    // Clear any stale auth state that might cause conflicts
    clearStaleAuthState();
});

// Function to clear any stale auth state
function clearStaleAuthState() {
    console.log('LOGIN_COORDINATOR: Clearing stale auth state...');

    // Clear any auth-related cookies
    document.cookie.split(";").forEach(function (c) {
        if (c.trim().startsWith('sb-')) {
            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        }
    });

    // Clear any auth-related localStorage items
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('sb-')) {
            console.log('LOGIN_COORDINATOR: Clearing stale localStorage item:', key);
            localStorage.removeItem(key);
        }
    }

    console.log('LOGIN_COORDINATOR: Stale auth state cleared');
}