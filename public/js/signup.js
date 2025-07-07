// Interline Asia - Signup Form Logic (Cloudflare Turnstile)

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded. Initializing signup form logic...');

    const signupForm = document.getElementById('signup-form');
    const documentUploadInput = document.getElementById('documentUpload');
    const submitButton = document.getElementById('create-account-btn');
    const uploadErrorEl = document.getElementById('upload-error');

    if (!signupForm || !documentUploadInput || !submitButton || !uploadErrorEl) {
        console.error('A required form element is missing from signup.html. Script will not run.');
        return;
    }

    // --- File Validation Logic ---
    function validateFile() {
        const file = documentUploadInput.files[0];
        let isValid = false;
        let errorMessage = '';

        if (file) {
            const maxSize = 5 * 1024 * 1024; // 5MB
            const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];

            if (file.size > maxSize) {
                errorMessage = 'File size must be less than 5MB.';
            } else if (!allowedTypes.includes(file.type)) {
                errorMessage = 'File must be a PDF, PNG, or JPG.';
            } else {
                isValid = true;
                showFileValidation(true, `Valid: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
            }
        } else {
            errorMessage = 'Please upload a verification document to continue.';
        }

        if (!isValid) {
            showFileValidation(false, errorMessage);
        }

        // The submit button is enabled by the Turnstile callback, but we can disable it here if the file is invalid.
        if (!isValid) {
            submitButton.disabled = true;
        }
        
        uploadErrorEl.textContent = errorMessage;
        uploadErrorEl.style.display = isValid ? 'none' : 'block';
        return isValid;
    }

    function showFileValidation(isValid, message) {
        const indicator = document.getElementById('document-indicator');
        if (!indicator) return;

        indicator.className = 'file-validation-indicator ' + (isValid ? 'valid' : 'invalid');
        indicator.innerHTML = `<i class="ri-${isValid ? 'check' : 'error-warning'}-line"></i> ${message}`;
        indicator.style.display = 'flex';
    }

    documentUploadInput.addEventListener('change', validateFile);

    // --- Form Submission Logic ---
    signupForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        hideError();
        hideSuccess();

        const originalText = submitButton.textContent;
        submitButton.textContent = 'Creating Account...';
        submitButton.disabled = true;

        try {
            const formData = new FormData(this);
            const userData = {
                fullName: formData.get('fullName').trim(),
                email: formData.get('email').trim().toLowerCase(),
                password: formData.get('password'),
                confirmPassword: formData.get('confirmPassword')
            };
            const documentFile = documentUploadInput.files[0];

            // --- Client-side validation ---
            if (!userData.fullName || !userData.email || !userData.password) {
                throw new Error('Please fill in all required fields.');
            }
            if (userData.password.length < 8) {
                throw new Error('Password must be at least 8 characters long.');
            }
            if (userData.password !== userData.confirmPassword) {
                throw new Error('Passwords do not match.');
            }
            if (!documentFile) {
                throw new Error('Please upload a verification document.');
            }

            // --- Turnstile Token Check ---
            const turnstileToken = document.getElementById('cf-turnstile-response').value;
            if (!turnstileToken) {
                // Ask Turnstile to run explicitly if the token is missing.
                if (window.turnstile) {
                    window.turnstile.execute();
                }
                throw new Error('Security verification failed. Please try submitting again.');
            }
            // Supabase expects the captcha token under the key 'recaptchaToken'
            userData.recaptchaToken = turnstileToken;

            // Ensure the Supabase client is fully initialized before making an auth call
            console.log('Waiting for Supabase client to be ready...');
            await window.supabaseClient.readyPromise;

            // --- Supabase Signup ---
            console.log('Creating account with Supabase...');
            const result = await window.supabaseClient.signUp(userData);

            if (result.user) {
                // --- File Upload ---
                console.log('Uploading verification document...');
                try {
                    await window.supabaseClient.uploadFile(documentFile, result.user.id);
                    console.log('File uploaded successfully.');
                } catch (uploadError) {
                    console.error('File upload failed after signup:', uploadError);
                    showError('Account created, but file upload failed. Please upload from your dashboard.');
                }

                // --- Success Feedback ---
                showSuccess('Account created successfully! Please check your email to verify your account, then log in.');
                this.reset();
                submitButton.disabled = true; // Keep disabled after success

                setTimeout(() => {
                    window.location.href = 'login.html?registered=true';
                }, 4000);
            }

        } catch (error) {
            console.error('Signup error:', error);
            showError(error.message || 'An unknown error occurred during signup.');
            // Re-enable the button on error
            validateFile();
        } finally {
            // Only reset button text if it hasn't been changed by a success message
            if (document.getElementById('success-message').style.display !== 'block') {
                submitButton.textContent = originalText;
            }
        }
    });

    // --- Initialization ---
    async function initializePage() {
        try {
            // Wait for the Supabase client to be fully initialized and ready.
            await window.supabaseClient.readyPromise;
            // If the user is already logged in, redirect them to the dashboard.
            if (window.supabaseClient.isLoggedIn()) {
                window.location.href = 'dashboard.html';
            }
        } catch (error) {
            console.error('Page initialization failed:', error);
            showError('Error initializing the page. Please refresh and try again.');
        }
    }

    initializePage();
});