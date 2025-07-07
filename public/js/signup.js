// public/js/signup.js

// ✅ Cloudflare Turnstile Site Key (used in signup.html widget)
// Site Key: 0x4AAAAAABkLNMf0cRO37SRL
// 🚫 Secret Key: 0x4AAAAAABkLNCChkuNkZYu6XPeq34ueKXU (use only on the server)

function onTurnstileSuccess(token) {
  console.log('✅ Cloudflare Turnstile verification successful.');
  const tokenInput = document.getElementById('cf-turnstile-response');
  if (tokenInput) {
    tokenInput.value = token;
  }
}

function validateUpload() {
  const documentFile = document.getElementById('documentUpload').files[0];
  const submitButton = document.getElementById('create-account-btn');
  const uploadError = document.getElementById('upload-error');

  uploadError.style.display = 'none';

  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];

  let hasValidFile = false;
  let errorMessage = '';

  if (documentFile) {
    if (documentFile.size > maxSize) {
      errorMessage = 'File size must be less than 5MB';
      showFileValidation('document', false, errorMessage);
    } else if (!allowedTypes.includes(documentFile.type)) {
      errorMessage = 'File must be a PDF, PNG, or JPG';
      showFileValidation('document', false, errorMessage);
    } else {
      hasValidFile = true;
      showFileValidation('document', true, 'Valid: ' + documentFile.name + ' (' + (documentFile.size / 1024 / 1024).toFixed(2) + ' MB)');
    }
  } else {
    hideFileValidation('document');
  }

  if (errorMessage) {
    uploadError.textContent = errorMessage;
    uploadError.style.display = 'block';
    submitButton.disabled = true;
    return;
  }

  if (hasValidFile) {
    submitButton.disabled = false;
    uploadError.style.display = 'none';
  } else {
    submitButton.disabled = true;
    uploadError.textContent = 'Please upload a verification document to continue.';
    uploadError.style.display = 'block';
  }
}

function showFileValidation(fileType, isValid, message) {
  const indicator = document.getElementById(fileType + '-indicator');
  indicator.className = 'file-validation-indicator ' + (isValid ? 'valid' : 'invalid');
  indicator.innerHTML = '<i class="ri-' + (isValid ? 'check' : 'error-warning') + '-line"></i> ' + message;
  indicator.style.display = 'flex';
}

function hideFileValidation(fileType) {
  const indicator = document.getElementById(fileType + '-indicator');
  indicator.style.display = 'none';
}

async function handleFormSubmission(e) {
  e.preventDefault();

  hideError();
  hideSuccess();

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

    const documentFile = document.getElementById('documentUpload').files[0];
    if (!documentFile) {
      document.getElementById('upload-error').style.display = 'block';
      throw new Error('Please upload a verification document to continue');
    }

    const maxSize = 5 * 1024 * 1024;
    if (documentFile.size > maxSize) throw new Error('File size must be less than 5MB');

    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(documentFile.type)) throw new Error('File must be a PDF, PNG, or JPG');

    if (!userData.fullName || !userData.email || !userData.password)
      throw new Error('Please fill in all required fields');

    if (userData.password.length < 8)
      throw new Error('Password must be at least 8 characters long');

    if (userData.password !== userData.confirmPassword)
      throw new Error('Passwords do not match');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email))
      throw new Error('Please enter a valid email address');

    const turnstileToken = document.getElementById('cf-turnstile-response').value;
    if (!turnstileToken)
      throw new Error('Security verification failed. Please try again.');

    userData.recaptchaToken = turnstileToken;

    console.log('Creating account with Supabase...', userData);
    const result = await window.supabaseClient.signUp(userData);

    if (result.user) {
      let uploadSuccess = false;
      try {
        await window.supabaseClient.uploadFile(documentFile, result.user.id);
        uploadSuccess = true;
        console.log('File uploaded successfully');
      } catch (uploadError) {
        console.error('File upload failed:', uploadError);
        showError('Account created but file upload failed. Please upload your document from the dashboard after logging in.');
      }

      if (typeof gtag !== 'undefined') {
        gtag('event', 'sign_up', { method: 'email' });
      }

      const successMessage = uploadSuccess
        ? 'Account created successfully! Your document has been uploaded. Please check your email to verify your account, then log in to complete your profile.'
        : 'Account created successfully! Please check your email to verify your account, then sign in.';

      showSuccess(successMessage);
      e.target.reset();
      hideFileValidation('document');

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

function initializeSignupForm() {
  console.log('Initializing signup form...');

  const form = document.getElementById('signup-form');
  if (form) {
    form.addEventListener('submit', handleFormSubmission);
  }

  const documentInput = document.getElementById('documentUpload');
  if (documentInput) {
    documentInput.addEventListener('change', validateUpload);
  }

  setTimeout(async () => {
    if (window.supabaseClient && window.supabaseClient.isLoggedIn()) {
      window.location.href = 'dashboard.html';
    }
  }, 500);
}

document.addEventListener('DOMContentLoaded', function () {
  console.log('DOM loaded, initializing signup form...');
  setTimeout(initializeSignupForm, 100);
});

window.addEventListener('load', function () {
  const form = document.getElementById('signup-form');
  if (form && !form.hasAttribute('data-initialized')) {
    form.setAttribute('data-initialized', 'true');
    initializeSignupForm();
  }
});