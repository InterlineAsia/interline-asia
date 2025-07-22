console.log('LOGIN: module loading …');

async function handleLoginSuccess() {
  const redirect = localStorage.getItem('redirectAfterLogin') || '/dashboard-choice.html';
  console.log('LOGIN: redirecting to', redirect);
  
  /* optional UI reset */
  const btn = document.getElementById('login-button');
  if (btn) { btn.disabled = false; btn.textContent = 'Sign In'; }
  
  localStorage.removeItem('redirectAfterLogin');
  window.location.replace(redirect);
}

async function handleLogin(email, password) {
  console.log('LOGIN: starting login for', email);
  
  if (!window.supabaseClient) throw new Error('Supabase client not available');
  
  await window.supabaseClient.readyPromise;                 // wait for singleton
  
  // ✅ correct Supabase v2 call
  const { data, error } = await window.supabaseClient.supabase.auth.signInWithPassword({ email, password });
  
  if (error) throw error;
  if (!data.session) throw new Error('No session returned');
  
  await handleLoginSuccess();                               // redirect
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('LOGIN: DOM loaded, initializing...');
    
    const loginButton = document.getElementById('login-button');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const errorMessage = document.getElementById('error-message');
    const successMessage = document.getElementById('success-message');

    if (!loginButton) {
        console.error('LOGIN: Login button not found');
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

    const hideMessages = () => {
        if (errorMessage) errorMessage.style.display = 'none';
        if (successMessage) successMessage.style.display = 'none';
    };

    const setLoadingState = (isLoading) => {
        loginButton.disabled = isLoading;
        loginButton.textContent = isLoading ? 'Signing In...' : 'Sign In';
    };

    // Handle login button click
    loginButton.addEventListener('click', async (e) => {
        e.preventDefault();
        console.log('LOGIN: Button clicked');
        
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        if (!email || !password) {
            showError('Please enter both email and password.');
            return;
        }

        hideMessages();
        setLoadingState(true);

        try {
            await handleLogin(email, password);
        } catch (error) {
            console.error('LOGIN: Error:', error);
            
            let message = 'Login failed. Please try again.';
            
            if (error.message) {
                if (error.message.includes('Invalid login credentials')) {
                    message = 'Invalid email or password.';
                } else if (error.message.includes('Email not confirmed')) {
                    message = 'Please check your email and confirm your account first.';
                } else if (error.message.includes('Too many requests')) {
                    message = 'Too many login attempts. Please wait and try again.';
                } else {
                    message = error.message;
                }
            }
            
            showError(message);
        } finally {
            setLoadingState(false);
        }
    });

    // Handle Enter key in form fields
    const handleEnterKey = (e) => {
        if (e.key === 'Enter') {
            loginButton.click();
        }
    };

    if (emailInput) {
        emailInput.addEventListener('keypress', handleEnterKey);
    }
    
    if (passwordInput) {
        passwordInput.addEventListener('keypress', handleEnterKey);
    }

    // Show success message if coming from registration
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('registered') === 'true') {
        showSuccess('Account created successfully! Please check your email to verify your account, then sign in.');
    }

    console.log('LOGIN: Module initialized successfully');
});