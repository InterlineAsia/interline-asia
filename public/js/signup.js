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
            const maxSize = window.FILE_CONFIG?.maxSize || 5 * 1024 * 1024; // 5MB fallback
            const allowedTypes = window.FILE_CONFIG?.allowedTypes || ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];

            if (file.size > maxSize) {
                errorMessage = `File size must be less than ${maxSize / 1024 / 1024}MB.`;
            } else if (!allowedTypes.includes(file.type.toLowerCase())) {
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
            // Supabase expects the captcha token under the key 'turnstileToken'
            userData.turnstileToken = turnstileToken;

            // Ensure the Supabase client is fully initialized before making an auth call
            console.log('Waiting for Supabase client to be ready...');
            await window.supabaseClient.readyPromise;

            // --- Supabase Signup ---
            console.log('Creating account with Supabase...');
            const result = await window.supabaseClient.signUp(userData);
            console.log('Supabase signup result:', result); // For debugging

            if (result && result.user) {
                // Wait for user to be properly authenticated before upload
                console.log('Waiting for authentication to complete...');
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // --- File Upload ---
                console.log('Uploading verification document...');
                let uploadSuccess = false;
                try {
                    // Ensure we have the user session before uploading
                    if (result.session) {
                        window.supabaseClient.currentSession = result.session;
                        await window.supabaseClient._setCurrentUserWithMetadata(result.user);
                    }
                    
                    // Wait a bit more for the session to be fully established
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                    console.log('Attempting file upload with user ID:', result.user.id);
                    const uploadResult = await window.supabaseClient.uploadFile(documentFile, result.user.id);
                    console.log('File uploaded successfully:', uploadResult);
                    uploadSuccess = true;
                    
                    // Show success message with upload confirmation
                    showSuccess('Account created successfully! Your verification document has been uploaded. Please check your email to verify your account, then log in.');
                    
                } catch (uploadError) {
                    console.error('File upload failed after signup:', uploadError);
                    console.error('Upload error details:', uploadError.message);
                    
                    // Provide specific error messages based on the error type
                    let errorMessage = 'Account created, but file upload failed. ';
                    
                    if (uploadError.message.includes('Storage bucket not available')) {
                        errorMessage += 'Storage system is not configured properly. Please contact support.';
                    } else if (uploadError.message.includes('User must be authenticated')) {
                        errorMessage += 'Authentication issue during upload. Please log in and upload from your dashboard.';
                    } else if (uploadError.message.includes('Database error')) {
                        errorMessage += 'File was uploaded but not recorded properly. Please contact support.';
                    } else {
                        errorMessage += `${uploadError.message}. Please upload from your dashboard after logging in.`;
                    }
                    
                    showError(errorMessage);
                }

                // --- Success Feedback ---
                if (!uploadSuccess) {
                    // Only show this if upload failed (error already shown above)
                    if (result.user.identities && result.user.identities.length === 0) {
                        showError('Account created, but requires manual verification. Please contact support.');
                    } else {
                        // Don't override the upload error message
                        console.log('Account created but upload failed - error message already shown');
                    }
                } else {
                    // Upload was successful, success message already shown above
                    console.log('Account and upload both successful - success message already shown');
                }

                this.reset();
                submitButton.disabled = true; // Keep disabled after success

                setTimeout(() => {
                    window.location.href = 'login.html?registered=true';
                }, 4000);
            } else {
                // This case handles a successful API call that didn't return a user object.
                console.error('Signup succeeded but no user object was returned.', result);
                throw new Error('An unexpected error occurred during signup. Please try again.');
            }

        } catch (error) {
            console.error('Signup error:', error);
            let errorMessage = error.message || 'An unknown error occurred during signup.';
            if (error.message.includes('User already registered')) {
                errorMessage = 'This email address is already registered. Please <a href="login.html">sign in</a> or use a different email.';
                showError(errorMessage, 'error-message', true);
            } else if (error.message.includes('rate limit')) {
                errorMessage = 'You are trying to sign up too frequently. Please wait a moment and try again.';
                showError(errorMessage);
            } else {
                showError(errorMessage);
            }
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