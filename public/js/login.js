// login.js

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const submitButton = document.getElementById('submit-button');
    const errorMessage = document.getElementById('error-message');
    const successMessage = document.getElementById('success-message');

    if (!loginForm) {
        console.error('Login form not found. Make sure your form has id="login-form".');
        return;
    }

    const showSuccess = (message) => {
        if (successMessage) {
            successMessage.textContent = message;
            successMessage.style.display = 'block';
        }
        if (errorMessage) errorMessage.style.display = 'none';
    };

    const showError = (message) => {
        if (errorMessage) {
            errorMessage.textContent = message;
            errorMessage.style.display = 'block';
        }
        if (successMessage) successMessage.style.display = 'none';
    };

    const setLoadingState = (isLoading) => {
        if (submitButton) {
            submitButton.disabled = isLoading;
            submitButton.textContent = isLoading ? 'Verifying...' : 'Sign In';
        }
    };

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        setLoadingState(true);
        showError('');
        showSuccess('');

        const email = loginForm.email.value;
        const password = loginForm.password.value;

        if (!email || !password) {
            showError('Please enter both email and password.');
            setLoadingState(false);
            return;
        }

        try {
            // Use the global Supabase singleton
            await window.supabaseClient.readyPromise;

            // Use the singleton's signIn method (which wraps Supabase v2)
            const data = await window.supabaseClient.signIn(email, password);

            if (data && window.supabaseClient.isLoggedIn()) {
                console.log('LOGIN.JS: User authenticated successfully');
                showSuccess('Login successful! Redirecting...');
                // Handle redirect immediately
                const redirectUrl = localStorage.getItem('redirectAfterLogin') || '/dashboard-choice.html';
                console.log('LOGIN: Login successful, handling redirect to:', redirectUrl);
                localStorage.removeItem('redirectAfterLogin');
                console.log('LOGIN: Executing redirect now...');
                window.location.replace(redirectUrl);
            } else {
                showError('Login failed - authentication not established');
                throw new Error('Login failed - authentication not established');
            }
        } catch (error) {
            console.error('Login failed:', error.message);
            showError(`Login failed: ${error.message.replace('Error: ', '')}`);
        } finally {
            setLoadingState(false);
        }
    });
});

// Removed handleLoginSuccess - redirect logic moved inline for immediate execution
