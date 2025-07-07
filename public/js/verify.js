// Interline Asia - Verification Form Logic
// Handles form submission, file upload, and Supabase integration

// File upload handling
document.getElementById('document').addEventListener('change', function(e) {
    const file = e.target.files[0];
    const fileSelected = document.getElementById('fileSelected');
    const fileUploadLabel = document.querySelector('.file-upload-label span');
    
    if (file) {
        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            showError('documentError', 'File size must be less than 5MB');
            e.target.value = '';
            return;
        }
        
        // Validate file type
        const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
        if (!allowedTypes.includes(file.type)) {
            showError('documentError', 'Please upload a PDF, PNG, or JPG file');
            e.target.value = '';
            return;
        }
        
        fileSelected.style.display = 'block';
        fileSelected.innerHTML = `<i class="ri-file-line"></i> ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
        fileUploadLabel.textContent = 'Change file';
        hideError('documentError');
    } else {
        fileSelected.style.display = 'none';
        fileUploadLabel.textContent = 'Click to upload business card or employment letter';
    }
});

// Form submission
document.getElementById('verificationForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    if (!validateForm()) {
        return;
    }
    
    const submitBtn = document.getElementById('submitBtn');
    const loading = document.getElementById('loading');
    
    submitBtn.disabled = true;
    loading.style.display = 'block';
    
    try {
        await submitVerification();
    } catch (error) {
        console.error('Submission error:', error);
        // Error handling is done in submitVerification function
    } finally {
        submitBtn.disabled = false;
        loading.style.display = 'none';
    }
});

function validateForm() {
    let isValid = true;
    
    // Clear previous errors
    document.querySelectorAll('.error-message').forEach(el => el.style.display = 'none');
    
    // Validate required fields
    const requiredFields = ['firstName', 'surname', 'dateOfBirth', 'email', 'phone', 'employer'];
    
    requiredFields.forEach(field => {
        const input = document.getElementById(field);
        if (!input.value.trim()) {
            showError(field + 'Error', 'This field is required');
            isValid = false;
        }
    });
    
    // Validate email format
    const email = document.getElementById('email').value;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
        showError('emailError', 'Please enter a valid email address');
        isValid = false;
    }
    
    // Validate file upload
    const fileInput = document.getElementById('document');
    if (!fileInput.files || !fileInput.files[0]) {
        showError('documentError', 'Please upload a business card or employment letter');
        isValid = false;
    }
    
    // Validate age (must be 18+)
    const dob = document.getElementById('dateOfBirth').value;
    if (dob) {
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        
        if (age < 18) {
            showError('dateOfBirthError', 'You must be at least 18 years old');
            isValid = false;
        }
    }
    
    return isValid;
}

function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    errorElement.textContent = message;
    errorElement.style.display = 'block';
}

function hideError(elementId) {
    const errorElement = document.getElementById(elementId);
    errorElement.style.display = 'none';
}

async function submitVerification() {
    const formData = new FormData(document.getElementById('verificationForm'));
    const file = document.getElementById('document').files[0];
    
    console.log('Starting verification submission...');
    console.log('Form data:', {
        firstName: formData.get('firstName'),
        surname: formData.get('surname'),
        email: formData.get('email'),
        employer: formData.get('employer'),
        fileName: file?.name,
        fileSize: file?.size
    });
    
    try {
        // Check if Supabase client is available
        if (!window.supabaseClient || !window.supabaseClient.supabase) {
            console.error('Supabase client not initialized');
            throw new Error('Supabase client not initialized');
        }
        
        const supabase = window.supabaseClient.supabase;
        console.log('Supabase client found');
        console.log('Supabase URL:', window.SUPABASE_URL);
        console.log('Supabase client instance:', supabase);
        
        // reCAPTCHA verification (if available)
        let recaptchaToken = null;
        if (typeof grecaptcha !== 'undefined' && window.RECAPTCHA_SITE_KEY) {
            try {
                console.log('Executing reCAPTCHA verification...');
                recaptchaToken = await new Promise((resolve, reject) => {
                    grecaptcha.ready(async () => {
                        try {
                            const token = await grecaptcha.execute(window.RECAPTCHA_SITE_KEY, {
                                action: 'verify_application'
                            });
                            resolve(token);
                        } catch (err) {
                            reject(err);
                        }
                    });
                });
                console.log('reCAPTCHA verification successful');
            } catch (recaptchaError) {
                console.warn('reCAPTCHA verification failed:', recaptchaError);
                // Don't fail the whole process if reCAPTCHA fails
            }
        } else {
            console.log('reCAPTCHA not available, skipping verification');
        }
        
        // 1. Upload file to Supabase Storage
        console.log('Uploading file to storage...');
        const fileName = `${Date.now()}_${file.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('verification-uploads')
            .upload(fileName, file);
        
        if (uploadError) {
            console.error('File upload error:', uploadError);
            throw new Error('File upload failed: ' + uploadError.message);
        }
        
        console.log('File uploaded successfully:', uploadData);
        
        // 2. Get the file URL
        console.log('Getting file URL...');
        const { data: urlData } = supabase.storage
            .from('verification-uploads')
            .getPublicUrl(fileName);
        
        console.log('File URL obtained:', urlData.publicUrl);
        
        // 3. Save verification data to database
        console.log('Saving to database...');
        const verificationData = {
            first_name: formData.get('firstName'),
            surname: formData.get('surname'),
            date_of_birth: formData.get('dateOfBirth'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            employer: formData.get('employer'),
            file_url: urlData.publicUrl,
            status: 'pending',
            created_at: new Date().toISOString(),
            recaptcha_token: recaptchaToken
        };
        
        console.log('Verification data to insert:', verificationData);
        
        const { data, error } = await supabase
            .from('verifications')
            .insert([verificationData])
            .select()
            .single();
        
        if (error) {
            console.error('Database save error:', error);
            console.error('Error details:', {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
            });
            throw new Error('Database save failed: ' + error.message);
        }
        
        console.log('Data saved to database:', data);
        
        // 4. Send email notifications
        console.log('Sending email notifications...');
        try {
            const emailResponse = await fetch('/api/send-verification-emails', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    applicantEmail: verificationData.email,
                    applicantName: `${verificationData.first_name} ${verificationData.surname}`,
                    employer: verificationData.employer,
                    verificationId: data.id,
                    recaptchaToken: recaptchaToken
                })
            });
            
            if (emailResponse.ok) {
                console.log('Email notifications sent successfully');
            } else {
                const errorText = await emailResponse.text();
                console.warn('Email notification failed with status:', emailResponse.status, errorText);
            }
        } catch (emailError) {
            console.error('Email notification error:', emailError);
            // Don't fail the whole process if emails fail
        }
        
        // 5. Redirect to success page
        console.log('Verification submitted successfully! Redirecting...');
        window.location.href = 'application-received.html';
        
    } catch (error) {
        console.error('SUBMISSION ERROR:', error);
        console.error('Error stack:', error.stack);
        
        // Show user-friendly error message
        if (error.message.includes('Supabase client not initialized')) {
            alert('System error: Database connection not available. Please refresh the page and try again.');
        } else if (error.message.includes('File upload failed')) {
            showError('documentError', 'Failed to upload file. Please check your internet connection and try again.');
        } else if (error.message.includes('Database save failed')) {
            alert('Failed to save your application. Please try again. If the problem persists, contact support.');
        } else {
            alert('There was an error submitting your application. Please check the browser console for details and try again.');
        }
        
        throw error;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Verification form script loaded');
    
    // Check if required dependencies are available
    if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
        console.error('Supabase configuration missing');
    }
    
    // Wait for Supabase client to initialize
    const checkSupabaseClient = () => {
        if (window.supabaseClient && window.supabaseClient.supabase) {
            console.log('Supabase client ready for verification form');
        } else {
            console.log('Waiting for Supabase client to initialize...');
            setTimeout(checkSupabaseClient, 100);
        }
    };
    
    checkSupabaseClient();
});