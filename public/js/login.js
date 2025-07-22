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
            // Use the global Supabase client
            if (!window.supabaseClient) {
                throw new Error('Supabase client not available');
            }

            console.log('LOGIN.JS: Starting login for:', email);
            const data = await window.supabaseClient.signIn(email, password);
            
            if (data && window.supabaseClient.isLoggedIn()) {
                console.log('LOGIN.JS: User authenticated successfully:', email);
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
  
  // Reset UI state
  const submitButton = document.getElementById('submit-button');
  if (submitButton) {
    submitButton.disabled = false;
    submitButton.textContent = 'Sign In';
  }
  
  // Show success message
  const showSuccess = (message) => {
    const successMessage = document.getElementById('success-message');
    if (successMessage) {
      successMessage.textContent = message;
      successMessage.style.display = 'block';
    }
  };
  showSuccess('Login successful! Redirecting...');
  
  // Remove redirect URL and navigate
  localStorage.removeItem('redirectAfterLogin');
  console.log('LOGIN: Navigating to:', redirectUrl);
  window.location.replace(redirectUrl);
}