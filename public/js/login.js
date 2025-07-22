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
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                throw new Error(error.message);
            }

            if (data.user) {
                console.log('LOGIN.JS: User authenticated successfully:', data.user.email);
                await handleLoginSuccess();
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
  localStorage.removeItem('redirectAfterLogin');
  window.location.replace(redirectUrl);
}