// Interline Asia - Signup Form Logic
// Handles form submission, file upload validation, and reCAPTCHA integration

// File upload validation for signup process
function validateUploads() {
    const businessCard = document.getElementById('businessCardUpload').files[0];
    const letter = document.getElementById('letterUpload').files[0];
    const submitButton = document.getElementById('create-account-btn');
    const uploadError = document.getElementById('upload-error');
    
    // Reset error state
    uploadError.style.display = 'none';
    
    // Validate file size and type if files are selected
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    
    let hasValidFile = false;
    let errorMessage = '';
    
    // Validate business card if uploaded
    if (businessCard) {
        if (businessCard.size > maxSize) {
            errorMessage = 'Business card file size must be less than 5MB';
            showFileValidation('businessCard', false, errorMessage);
        } else if (!allowedTypes.includes(businessCard.type)) {
            errorMessage = 'Business card must be a PDF, PNG, or JPG file';
            showFileValidation('businessCard', false, errorMessage);
        } else {
            hasValidFile = true;
            showFileValidation('businessCard', true, 'Valid: ' + businessCard.name + ' (' + (businessCard.size / 1024 / 1024).toFixed(2) + ' MB)');
        }
    } else {
        hideFileValidation('businessCard');
    }
    
    // Validate employment letter if uploaded (independent of business card validation)
    if (letter) {
        if (letter.size > maxSize) {
            errorMessage = 'Employment letter file size must be less than 5MB';
            showFileValidation('letter', false, errorMessage);
        } else if (!allowedTypes.includes(letter.type)) {
            errorMessage = 'Employment letter must be a PDF, PNG, or JPG file';
            showFileValidation('letter', false, errorMessage);
        } else {
            hasValidFile = true;
            showFileValidation('letter', true, 'Valid: ' + letter.name + ' (' + (letter.size / 1024 / 1024).toFixed(2) + ' MB)');
        }
    } else {
        hideFileValidation('letter');
    }
    
    // Show error if validation failed
    if (errorMessage) {
        uploadError.textContent = errorMessage;
        uploadError.style.display = 'block';
        submitButton.disabled = true;
        return;
    }
    
    // Enable button if at least one valid file is selected
    if (hasValidFile) {
        submitButton.disabled = false;
        uploadError.style.display = 'none';
    } else {
        submitButton.disabled = true;
        uploadError.textContent = 'Please upload at least one document to continue.';
        uploadError.style.display = 'block';
    }
}

// Show file validation indicator
function showFileValidation(fileType, isValid, message) {
    const indicator = document.getElementById(fileType + '-indicator');
    indicator.className = 'file-validation-indicator ' + (isValid ? 'valid' : 'invalid');
    indicator.innerHTML = '<i class="ri-' + (isValid ? 'check' : 'error-warning') + '-line"></i> ' + message;
    indicator.style.display = 'flex';
}

// Hide file validation indicator
function hideFileValidation(fileType) {
    const indicator = document.getElementById(fileType + '-indicator');
    indicator.style.display = 'none';
}

// Enhanced reCAPTCHA validation with retry logic
async function validateRecaptcha(retryCount = 0) {
    const maxRetries = 3;
    
    console.log(`Attempting reCAPTCHA validation (attempt ${retryCount + 1}/${maxRetries})...`);
    
    try {
        // Check if reCAPTCHA is loaded
        if (typeof grecaptcha === 'undefined') {
            throw new Error('reCAPTCHA library not loaded');
        }
        
        if (!window.RECAPTCHA_SITE_KEY) {
            throw new Error('reCAPTCHA site key not configured');
        }
        
        // Execute reCAPTCHA with timeout
        const recaptchaToken = await Promise.race([
            new Promise((resolve, reject) => {
                grecaptcha.ready(async () => {
                    try {
                        const token = await grecaptcha.execute(window.RECAPTCHA_SITE_KEY, {
                            action: 'signup'
                        });
                        resolve(token);
                    } catch (err) {
                        reject(err);
                    }
                });
            }),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('reCAPTCHA timeout')), 10000)
            )
        ]);
        
        // Validate token
        if (!recaptchaToken || recaptchaToken.length < 10) {
            throw new Error('Invalid reCAPTCHA token received');
        }
        
        console.log('reCAPTCHA validation successful');
        return recaptchaToken;
        
    } catch (error) {
        console.error(`reCAPTCHA validation failed (attempt ${retryCount + 1}):`, error);
        
        // Retry logic
        if (retryCount < maxRetries - 1) {
            console.log(`Retrying reCAPTCHA validation in 2 seconds...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            return validateRecaptcha(retryCount + 1);
        }
        
        // Show user-friendly error message
        showRecaptchaError('reCAPTCHA verification failed. Please refresh the page and try again.');
        throw error;
    }
}

// Show reCAPTCHA error message
function showRecaptchaError(message) {
    let errorDiv = document.getElementById('recaptcha-error');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.id = 'recaptcha-error';
        errorDiv.className = 'error-message';
        errorDiv.style.marginBottom = '1rem';
        
        // Insert before the submit button
        const submitButton = document.getElementById('create-account-btn');
        submitButton.parentElement.insertBefore(errorDiv, submitButton);
    }
    
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}

// Hide reCAPTCHA error message
function hideRecaptchaError() {
    const errorDiv = document.getElementById('recaptcha-error');
    if (errorDiv) {
        errorDiv.style.display = 'none';
    }
}

// Form submission handler
async function handleFormSubmission(e) {
    e.preventDefault();
    
    hideError();
    hideSuccess();
    hideRecaptchaError();
    
    const submitButton = document.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Creating Account...';
    submitButton.disabled = true;
    
    try {
        const formData = new FormData(e.target);
        const userData = {
            fullName: formData.get('fullName').trim(),
            email: formData.get('email').trim().toLowerCase(),
            password: formData.get('password'),
            confirmPassword: formData.get('confirmPassword')
        };
        
        console.log('Starting signup process for:', userData.email);
        
        // File upload validation
        const businessCard = document.getElementById('businessCardUpload').files[0];
        const letter = document.getElementById('letterUpload').files[0];
        
        if (!businessCard && !letter) {
            document.getElementById('upload-error').style.display = 'block';
            throw new Error('Please upload at least one document to continue');
        }
        
        // File size validation (5MB max)
        const maxSize = 5 * 1024 * 1024;
        if (businessCard && businessCard.size > maxSize) {
            throw new Error('Business card file size must be less than 5MB');
        }
        if (letter && letter.size > maxSize) {
            throw new Error('Employment letter file size must be less than 5MB');
        }
        
        // File type validation
        const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
        if (businessCard && !allowedTypes.includes(businessCard.type)) {
            throw new Error('Business card must be a PDF, PNG, or JPG file');
        }
        if (letter && !allowedTypes.includes(letter.type)) {
            throw new Error('Employment letter must be a PDF, PNG, or JPG file');
        }
        
        // Basic validation
        if (!userData.fullName || !userData.email || !userData.password) {
            throw new Error('Please fill in all required fields');
        }
        
        if (userData.password.length < 8) {
            throw new Error('Password must be at least 8 characters long');
        }
        
        if (userData.password !== userData.confirmPassword) {
            throw new Error('Passwords do not match');
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(userData.email)) {
            throw new Error('Please enter a valid email address');
        }
        
        // reCAPTCHA validation with enhanced error handling
        console.log('Validating reCAPTCHA...');
        const recaptchaToken = await validateRecaptcha();
        
        if (!recaptchaToken) {
            throw new Error('reCAPTCHA verification failed. Please try again.');
        }
        
        // Add reCAPTCHA token to user data
        userData.recaptchaToken = recaptchaToken;
        
        // Sign up with Supabase
        console.log('Creating account with Supabase...');
        const result = await window.supabaseClient.signUp(userData);
        
        if (result.user) {
            // Upload file after successful signup
            console.log('Uploading verification document...');
            const file = businessCard || letter;
            let uploadSuccess = false;
            
            if (file) {
                try {
                    await window.supabaseClient.uploadFile(file, result.user.id);
                    console.log('File uploaded successfully');
                    uploadSuccess = true;
                } catch (uploadError) {
                    console.error('File upload failed:', uploadError);
                    // Don't fail the signup if file upload fails
                    showError('Account created but file upload failed. Please upload your document from the dashboard after logging in.');
                }
            }
            
            // Track successful signup
            if (typeof gtag !== 'undefined') {
                gtag('event', 'sign_up', {
                    method: 'email'
                });
            }
            
            const successMessage = uploadSuccess 
                ? 'Account created successfully! Your document has been uploaded. Please check your email to verify your account, then log in to complete your profile.'
                : 'Account created successfully! Please check your email to verify your account, then sign in.';
            
            showSuccess(successMessage);
            
            // Clear form
            e.target.reset();
            
            // Reset file validation indicators
            hideFileValidation('businessCard');
            hideFileValidation('letter');
            
            // Redirect to login after 4 seconds (longer message)
            setTimeout(() => {
                window.location.href = 'login.html?registered=true';
            }, 4000);
        }
        
    } catch (error) {
        console.error('Signup error:', error);
        showError(error.message || 'An error occurred during signup. Please try again.');
    } finally {
        submitButton.textContent = originalText;
        submitButton.disabled = false;
    }
}

// Initialize signup form
function initializeSignupForm() {
    console.log('Initializing signup form...');
    
    // Add form submission handler
    const form = document.getElementById('signup-form');
    if (form) {
        form.addEventListener('submit', handleFormSubmission);
    }
    
    // Add file upload validation listeners
    const businessCardInput = document.getElementById('businessCardUpload');
    const letterInput = document.getElementById('letterUpload');
    
    if (businessCardInput) {
        businessCardInput.addEventListener('change', validateUploads);
    }
    
    if (letterInput) {
        letterInput.addEventListener('change', validateUploads);
    }
    
    // Check if user is already logged in
    setTimeout(async () => {
        if (window.supabaseClient && window.supabaseClient.isLoggedIn()) {
            window.location.href = 'dashboard.html';
        }
    }, 500);
    
    // Initialize reCAPTCHA
    if (typeof grecaptcha !== 'undefined') {
        grecaptcha.ready(() => {
            console.log('reCAPTCHA v3 ready for signup');
        });
    } else {
        console.warn('reCAPTCHA not loaded, will attempt to load on form submission');
    }
}

// Wait for DOM and dependencies to load
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing signup form...');
    // Wait a bit for other scripts to load
    setTimeout(initializeSignupForm, 100);
});

// Also initialize on window load as backup
window.addEventListener('load', function() {
    const form = document.getElementById('signup-form');
    if (form && !form.hasAttribute('data-initialized')) {
        form.setAttribute('data-initialized', 'true');
        initializeSignupForm();
    }
});
