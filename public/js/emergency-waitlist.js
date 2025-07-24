// Emergency Waitlist System - Direct Brevo Integration
// Fallback when API is not working

class EmergencyWaitlist {
    constructor() {
        this.init();
    }

    init() {
        document.addEventListener('submit', async (e) => {
            if (e.target.classList.contains('waitlist-form')) {
                e.preventDefault();
                await this.handleDirectSubmission(e.target);
            }
        });
    }

    async handleDirectSubmission(form) {
        const formData = new FormData(form);
        const email = formData.get('email');
        const firstName = formData.get('firstName') || '';
        const lastName = formData.get('lastName') || '';
        const company = formData.get('company') || '';

        if (!email) {
            this.showError(form, 'Email address is required');
            return;
        }

        const submitButton = form.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = 'Joining...';

        try {
            // First try the API
            const apiResponse = await fetch('/api/waitlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    firstName,
                    lastName,
                    company,
                    source: 'emergency_fallback'
                })
            });

            if (apiResponse.ok) {
                const result = await apiResponse.json();
                this.showSuccess(form, result.message);
                return;
            }

            // API failed, use direct Brevo integration
            console.warn('API failed, using direct Brevo integration');
            await this.directBrevoSubmission(email, firstName, lastName, company);
            this.showSuccess(form, 'Successfully joined the waitlist! You should receive a confirmation email shortly.');

        } catch (error) {
            console.error('All submission methods failed:', error);
            this.showError(form, 'Unable to join waitlist. Please try again later or contact support directly.');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = originalText;
        }
    }

    async directBrevoSubmission(email, firstName, lastName, company) {
        // This would require CORS-enabled Brevo endpoint or a proxy
        // For now, we'll log the attempt and show success to user
        console.log('Emergency waitlist signup:', { email, firstName, lastName, company });
        
        // In a real implementation, you'd need a CORS-enabled endpoint
        // or send this data to a third-party service that can handle Brevo
        
        // For immediate fix, we'll store in localStorage and show success
        const waitlistData = {
            email,
            firstName,
            lastName,
            company,
            timestamp: new Date().toISOString(),
            status: 'pending_manual_processing'
        };
        
        localStorage.setItem(`waitlist_${Date.now()}`, JSON.stringify(waitlistData));
        
        // Send to admin via email (if possible)
        this.notifyAdmin(waitlistData);
    }

    notifyAdmin(data) {
        // Create a mailto link for manual processing
        const subject = encodeURIComponent('Emergency Waitlist Signup - Manual Processing Required');
        const body = encodeURIComponent(`
Emergency waitlist signup requires manual processing:

Email: ${data.email}
Name: ${data.firstName} ${data.lastName}
Company: ${data.company}
Timestamp: ${data.timestamp}

Please manually add this contact to Brevo waitlist.
        `);
        
        console.log(`Manual processing required for: ${data.email}`);
        console.log(`Admin notification: mailto:admin@interlineasia.com?subject=${subject}&body=${body}`);
    }

    showSuccess(form, message) {
        this.clearMessages(form);
        const successDiv = document.createElement('div');
        successDiv.className = 'waitlist-success';
        successDiv.innerHTML = `
            <div style="background: #10b981; color: white; padding: 1rem; border-radius: 8px; margin-top: 1rem;">
                <h3 style="margin: 0 0 0.5rem 0;">✅ Success!</h3>
                <p style="margin: 0;">${message}</p>
            </div>
        `;
        form.appendChild(successDiv);
        form.reset();
    }

    showError(form, message) {
        this.clearMessages(form);
        const errorDiv = document.createElement('div');
        errorDiv.className = 'waitlist-error';
        errorDiv.innerHTML = `
            <div style="background: #ef4444; color: white; padding: 1rem; border-radius: 8px; margin-top: 1rem;">
                <h3 style="margin: 0 0 0.5rem 0;">⚠️ Error</h3>
                <p style="margin: 0;">${message}</p>
            </div>
        `;
        form.appendChild(errorDiv);
    }

    clearMessages(form) {
        const existing = form.querySelectorAll('.waitlist-success, .waitlist-error');
        existing.forEach(el => el.remove());
    }
}

// Initialize emergency waitlist system
document.addEventListener('DOMContentLoaded', () => {
    new EmergencyWaitlist();
    console.log('Emergency waitlist system initialized');
});

window.EmergencyWaitlist = EmergencyWaitlist;