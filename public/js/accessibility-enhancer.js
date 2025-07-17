// Accessibility Enhancements for Interline Asia
class AccessibilityEnhancer {
    constructor() {
        this.init();
    }

    init() {
        this.setupKeyboardNavigation();
        this.setupFocusManagement();
        this.setupARIALabels();
        this.setupSkipLinks();
        this.setupColorContrastMode();
        this.setupReducedMotion();
        this.setupScreenReaderSupport();
    }

    // Enhanced keyboard navigation
    setupKeyboardNavigation() {
        // Add keyboard support for custom elements
        document.addEventListener('keydown', (e) => {
            // Handle Enter key as click for custom buttons
            if (e.key === 'Enter' && e.target.getAttribute('role') === 'button') {
                e.target.click();
            }

            // Handle Escape key for modals and dropdowns
            if (e.key === 'Escape') {
                this.closeModalsAndDropdowns();
            }

            // Handle Tab key for focus trapping in modals
            if (e.key === 'Tab') {
                this.handleTabNavigation(e);
            }
        });
    }

    // Focus management for better UX
    setupFocusManagement() {
        // Add visible focus indicators
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                document.body.classList.add('keyboard-navigation');
            }
        });

        document.addEventListener('mousedown', () => {
            document.body.classList.remove('keyboard-navigation');
        });

        // Focus management for dynamic content
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            this.enhanceNewContent(node);
                        }
                    });
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Add missing ARIA labels and roles
    setupARIALabels() {
        // Add ARIA labels to buttons without text
        document.querySelectorAll('button:not([aria-label]):not([aria-labelledby])').forEach(button => {
            if (!button.textContent.trim()) {
                const icon = button.querySelector('i, svg');
                if (icon) {
                    button.setAttribute('aria-label', this.getButtonLabel(button));
                }
            }
        });

        // Add ARIA labels to links without text
        document.querySelectorAll('a:not([aria-label]):not([aria-labelledby])').forEach(link => {
            if (!link.textContent.trim()) {
                const icon = link.querySelector('i, svg');
                if (icon) {
                    link.setAttribute('aria-label', this.getLinkLabel(link));
                }
            }
        });

        // Add ARIA roles to custom elements
        document.querySelectorAll('.nav-toggle').forEach(toggle => {
            toggle.setAttribute('role', 'button');
            toggle.setAttribute('aria-label', 'Toggle navigation menu');
            toggle.setAttribute('aria-expanded', 'false');
        });
    }

    // Add skip links for better navigation
    setupSkipLinks() {
        const skipLink = document.createElement('a');
        skipLink.href = '#main-content';
        skipLink.textContent = 'Skip to main content';
        skipLink.className = 'skip-link';
        skipLink.style.cssText = `
            position: absolute;
            top: -40px;
            left: 6px;
            background: #000;
            color: #fff;
            padding: 8px;
            text-decoration: none;
            border-radius: 4px;
            z-index: 10000;
            transition: top 0.3s;
        `;

        skipLink.addEventListener('focus', () => {
            skipLink.style.top = '6px';
        });

        skipLink.addEventListener('blur', () => {
            skipLink.style.top = '-40px';
        });

        document.body.insertBefore(skipLink, document.body.firstChild);

        // Add main content ID if not present
        const mainContent = document.querySelector('main, .hero-section, #home');
        if (mainContent && !mainContent.id) {
            mainContent.id = 'main-content';
        }
    }

    // High contrast mode support
    setupColorContrastMode() {
        // Detect high contrast preference
        if (window.matchMedia('(prefers-contrast: high)').matches) {
            document.body.classList.add('high-contrast');
        }

        // Add toggle for high contrast mode
        const contrastToggle = document.createElement('button');
        contrastToggle.textContent = 'Toggle High Contrast';
        contrastToggle.className = 'contrast-toggle';
        contrastToggle.setAttribute('aria-label', 'Toggle high contrast mode');
        contrastToggle.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: #000;
            color: #fff;
            border: 2px solid #fff;
            padding: 8px 12px;
            border-radius: 4px;
            z-index: 9999;
            font-size: 12px;
            cursor: pointer;
            display: none;
        `;

        contrastToggle.addEventListener('click', () => {
            document.body.classList.toggle('high-contrast');
            const isHighContrast = document.body.classList.contains('high-contrast');
            localStorage.setItem('high-contrast', isHighContrast);
        });

        // Show toggle on focus or when keyboard navigation is detected
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                contrastToggle.style.display = 'block';
            }
        });

        document.body.appendChild(contrastToggle);

        // Restore saved preference
        if (localStorage.getItem('high-contrast') === 'true') {
            document.body.classList.add('high-contrast');
        }
    }

    // Reduced motion support
    setupReducedMotion() {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            document.body.classList.add('reduced-motion');
            
            // Disable animations and transitions
            const style = document.createElement('style');
            style.textContent = `
                .reduced-motion *,
                .reduced-motion *::before,
                .reduced-motion *::after {
                    animation-duration: 0.01ms !important;
                    animation-iteration-count: 1 !important;
                    transition-duration: 0.01ms !important;
                    scroll-behavior: auto !important;
                }
            `;
            document.head.appendChild(style);
        }
    }

    // Screen reader support
    setupScreenReaderSupport() {
        // Add live region for dynamic content announcements
        const liveRegion = document.createElement('div');
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.className = 'sr-only';
        liveRegion.style.cssText = `
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            white-space: nowrap;
            border: 0;
        `;
        document.body.appendChild(liveRegion);

        // Store reference for announcements
        this.liveRegion = liveRegion;

        // Add screen reader only text for icons
        document.querySelectorAll('.travel-tool-icon, .header-tool-icon').forEach(icon => {
            const srText = document.createElement('span');
            srText.className = 'sr-only';
            srText.textContent = this.getIconDescription(icon);
            icon.appendChild(srText);
        });
    }

    // Utility methods
    closeModalsAndDropdowns() {
        // Close chat if open
        const chatWindow = document.getElementById('chat-window');
        if (chatWindow && chatWindow.style.display !== 'none') {
            const closeButton = document.getElementById('chat-close');
            if (closeButton) closeButton.click();
        }

        // Close any open dropdowns
        document.querySelectorAll('.dropdown-open').forEach(dropdown => {
            dropdown.classList.remove('dropdown-open');
        });
    }

    handleTabNavigation(e) {
        // Focus trapping for modals
        const modal = document.querySelector('.modal:not([style*="display: none"])');
        if (modal) {
            const focusableElements = modal.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            if (e.shiftKey && document.activeElement === firstElement) {
                lastElement.focus();
                e.preventDefault();
            } else if (!e.shiftKey && document.activeElement === lastElement) {
                firstElement.focus();
                e.preventDefault();
            }
        }
    }

    enhanceNewContent(element) {
        // Add ARIA labels to new buttons and links
        element.querySelectorAll('button:not([aria-label])').forEach(button => {
            if (!button.textContent.trim()) {
                button.setAttribute('aria-label', this.getButtonLabel(button));
            }
        });

        element.querySelectorAll('a:not([aria-label])').forEach(link => {
            if (!link.textContent.trim()) {
                link.setAttribute('aria-label', this.getLinkLabel(link));
            }
        });
    }

    getButtonLabel(button) {
        const classes = button.className;
        if (classes.includes('chat-close')) return 'Close chat';
        if (classes.includes('chat-send')) return 'Send message';
        if (classes.includes('nav-toggle')) return 'Toggle navigation';
        return 'Button';
    }

    getLinkLabel(link) {
        const href = link.getAttribute('href');
        if (href && href.includes('facebook')) return 'Facebook';
        if (href && href.includes('instagram')) return 'Instagram';
        if (href && href.includes('twitter')) return 'Twitter';
        if (href && href.includes('linkedin')) return 'LinkedIn';
        if (href && href.includes('youtube')) return 'YouTube';
        return 'Link';
    }

    getIconDescription(icon) {
        const text = icon.textContent || icon.innerHTML;
        if (text.includes('✈️')) return 'Flights';
        if (text.includes('🚖')) return 'Transfers';
        if (text.includes('🛡️')) return 'Insurance';
        if (text.includes('📶')) return 'eSIM';
        if (text.includes('🚗')) return 'Car rentals';
        if (text.includes('💳')) return 'Currency';
        return 'Icon';
    }

    // Public method to announce messages to screen readers
    announce(message) {
        if (this.liveRegion) {
            this.liveRegion.textContent = message;
            setTimeout(() => {
                this.liveRegion.textContent = '';
            }, 1000);
        }
    }
}

// Initialize accessibility enhancer
document.addEventListener('DOMContentLoaded', () => {
    const accessibilityEnhancer = new AccessibilityEnhancer();
    window.AccessibilityEnhancer = accessibilityEnhancer;
});

// Add CSS for accessibility features
const accessibilityCSS = document.createElement('style');
accessibilityCSS.textContent = `
    /* Keyboard navigation focus styles */
    .keyboard-navigation *:focus {
        outline: 2px solid #3b82f6 !important;
        outline-offset: 2px !important;
    }

    /* High contrast mode */
    .high-contrast {
        filter: contrast(150%) brightness(120%);
    }

    .high-contrast * {
        border-color: #000 !important;
        text-shadow: none !important;
        box-shadow: none !important;
    }

    /* Screen reader only content */
    .sr-only {
        position: absolute !important;
        width: 1px !important;
        height: 1px !important;
        padding: 0 !important;
        margin: -1px !important;
        overflow: hidden !important;
        clip: rect(0, 0, 0, 0) !important;
        white-space: nowrap !important;
        border: 0 !important;
    }

    /* Skip link styles */
    .skip-link:focus {
        top: 6px !important;
    }

    /* Focus indicators for custom elements */
    [role="button"]:focus,
    .travel-tool-item:focus,
    .header-tool-item:focus {
        outline: 2px solid #3b82f6;
        outline-offset: 2px;
    }
`;
document.head.appendChild(accessibilityCSS);