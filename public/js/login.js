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
            submitButton.textContent = isLoading ? 'Verifying...' : 'Login';
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
            // Ensure supabase is available
            if (!window.supabaseClient) {
                throw new Error("Supabase client is not available. Check your HTML includes the correct Supabase initialization script *before* this login.js.");
            }

            // Wait for Supabase client to be ready
            await window.supabaseClient.readyPromise;

            // Sign in using the global Supabase client
            const data = await window.supabaseClient.signIn(email, password);

            if (data && window.supabaseClient.isLoggedIn()) {
                console.log('LOGIN.JS: User authenticated successfully');
                await handleLoginSuccess();
            } else {
                throw new Error('Login failed - authentication not established');
            }
        } catch (error) {
            console.error('Login failed:', error.message);
            showError(`Login failed: ${error.message.replace('Error: ', '')}`);
            setLoadingState(false);
        }
    });
});

// Handle successful login redirect
async function handleLoginSuccess() {
  const redirectUrl = localStorage.getItem('redirectAfterLogin') || '/dashboard-choice.html';
  console.log('LOGIN: Login successful, handling redirect to:', redirectUrl);
  alert('Redirecting to: ' + redirectUrl); // <-- You can remove this line later if you wish
  localStorage.removeItem('redirectAfterLogin');
  window.location.replace(redirectUrl);
}
