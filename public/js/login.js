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
                // ** FIX: Check for and create user profile if it's missing **
                let { error: profileError } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('id', data.user.id)
                    .single();

                // If profile is missing (PGRST116: 0 rows returned), create it.
                if (profileError && profileError.code === 'PGRST116') {
                    console.warn(`User profile for ${data.user.email} not found. Creating a new one.`);
                    
                    const { error: createError } = await supabase
                        .from('profiles')
                        .insert({ 
                            id: data.user.id, 
                            email: data.user.email 
                        });

                    if (createError) {
                        // Log the error but still proceed as requested.
                        console.error('Failed to create user profile:', createError.message);
                    }
                } else if (profileError) {
                    // A different, more serious database error occurred. Halt execution.
                    throw new Error(`Error fetching user profile: ${profileError.message}`);
                }

                showSuccess('Login successful! Redirecting to your dashboard...');
                
                // Redirect to the dashboard choice page as per the latest project architecture.
                window.location.href = '/dashboard-choice.html';
            }
        } catch (error) {
            console.error('Login failed:', error.message);
            showError(`Login failed: ${error.message.replace('Error: ', '')}`);
            setLoadingState(false);
        }
    });
});