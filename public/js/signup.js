// Interline Asia - Signup Form Logic
// Handles form submission, file upload validation, and reCAPTCHA integration

// File upload validation removed - users upload documents from dashboard after signup

// Add visual validation indicator for file inputs
function addFileValidationIndicator(inputId, isValid) {
    const input = document.getElementById(inputId);
    const container = input.parentElement;
    
    // Remove existing indicators
    removeFileValidationIndicator(inputId);
    
    // Add new indicator
    const indicator = document.createElement('div');
    indicator.className = `file-validation-indicator ${isValid ? 'valid' : 'invalid'}`;
    indicator.innerHTML = isValid ? 
        '<i class="ri-check-line"></i> File valid' : 
        '<i class="ri-error-warning-line"></i> Invalid file';
    
    container.appendChild(indicator);
}

// Remove validation indicator
function removeFileValidationIndicator(inputId) {
    const input = document.getElementById(inputId);
    const container = input.parentElement;
    const existing = container.querySelector('.file-validation-indicator');
    if (existing) {
        existing.remove();
    }
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
        
        // No file upload validation needed - files will be uploaded from dashboard
        
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
            // Track successful signup
            if (typeof gtag !== 'undefined') {
                gtag('event', 'sign_up', {
                    method: 'email'
                });
            }
            
            showSuccess('Account created successfully! Please check your email to verify your account, then sign in.');
            
            // Clear form
            e.target.reset();
            
            // Reset file validation indicators
            removeFileValidationIndicator('businessCardUpload');
            removeFileValidationIndicator('letterUpload');
            
            // Redirect to login after 3 seconds
            setTimeout(() => {
                window.location.href = 'login.html?registered=true';
            }, 3000);
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
    
    // File upload listeners removed - no file uploads in signup form
    
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
    // Wait a bit for other scripts to load
    setTimeout(initializeSignupForm, 100);
});

// Also initialize on window load as backup
window.addEventListener('load', function() {
    if (!document.getElementById('signup-form').hasAttribute('data-initialized')) {
        document.getElementById('signup-form').setAttribute('data-initialized', 'true');
        initializeSignupForm();
    }
});