// Modern Layout Injector - Injects Tailwind-styled header and footer into static pages
(function() {
    'use strict';

    // Modern Header HTML
    const modernHeader = `
        <!-- Travel Tools Bar -->
        <div class="travel-tools-bar">
            <div class="travel-tools-container">
                <span class="font-medium">Complete your travel experience:</span>
                <div class="travel-tools-grid">
                    <a href="https://trip.tpk.mx/qhlnnQh8" target="_blank" rel="noopener noreferrer" class="tool-link">
                        <span>✈️</span>
                        <span>Flights</span>
                    </a>
                    <a href="https://kiwitaxi.tpk.mx/NGL3ovB3" target="_blank" rel="noopener noreferrer" class="tool-link">
                        <span>🚖</span>
                        <span>Transfers</span>
                    </a>
                    <a href="https://ektatraveling.tpk.mx/IUGS6Ovk" target="_blank" rel="noopener noreferrer" class="tool-link">
                        <span>🛡️</span>
                        <span>Insurance</span>
                    </a>
                    <a href="https://airalo.tpk.mx/M99krJZy" target="_blank" rel="noopener noreferrer" class="tool-link">
                        <span>📶</span>
                        <span>eSIM</span>
                    </a>
                    <a href="https://getrentacar.tpk.mx/I3FuOWfB" target="_blank" rel="noopener noreferrer" class="tool-link">
                        <span>🚗</span>
                        <span>Cars</span>
                    </a>
                    <a href="https://wise.com/invite/ihpc/rodneyowenp" target="_blank" rel="noopener noreferrer" class="tool-link">
                        <span>💳</span>
                        <span>Currency</span>
                    </a>
                </div>
            </div>
        </div>

        <!-- Main Navigation -->
        <div class="header-container bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
            <div class="nav-container">
                <!-- Brand -->
                <div class="nav-brand">
                    <a href="/" class="flex items-center space-x-3">
                        <div class="brand-icon">IA</div>
                        <div class="brand-text">
                            <span class="brand-name">Interline Asia</span>
                            <span class="brand-subtitle">Luxury Cruise Experiences</span>
                        </div>
                    </a>
                </div>

                <!-- Desktop Navigation -->
                <div class="nav-menu">
                    <a href="/" class="nav-link">Home</a>
                    <a href="/about.html" class="nav-link">About</a>
                    <a href="/partners.html" class="nav-link">Partners</a>
                    <a href="/login.html" class="nav-cta">Member Login</a>
                </div>

                <!-- Mobile menu button -->
                <div class="mobile-menu-button" id="mobile-menu-button">
                    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </div>
            </div>

            <!-- Mobile Navigation -->
            <div id="mobile-menu" class="mobile-menu">
                <a href="/" class="nav-link">Home</a>
                <a href="/about.html" class="nav-link">About</a>
                <a href="/partners.html" class="nav-link">Partners</a>
                <a href="/login.html" class="nav-cta">Member Login</a>
            </div>
        </div>
    `;

    // Modern Footer HTML
    const modernFooter = `
        <footer class="bg-slate-900 border-t border-slate-700 shadow-lg">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <!-- Main Footer Content -->
                <div class="flex flex-col lg:flex-row items-center justify-between gap-6">
                    <!-- Left: Brand -->
                    <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-md">
                            IA
                        </div>
                        <div class="flex flex-col">
                            <span class="text-xl font-bold text-white tracking-tight">Interline Asia</span>
                            <span class="text-sm text-slate-400 font-medium">Luxury Cruise Experiences</span>
                        </div>
                    </div>

                    <!-- Center: Trust Line -->
                    <div class="text-center lg:flex-1 lg:mx-8">
                        <p class="text-slate-300 text-sm sm:text-base font-medium leading-relaxed max-w-2xl mx-auto">
                            Built by travel insiders. Connecting the industry with exclusive interline deals — fast, secure, and verified.
                        </p>
                    </div>

                    <!-- Right: Social Media Icons -->
                    <div class="flex items-center space-x-4">
                        
                        <a href="#" class="text-slate-400 hover:text-white hover:scale-110 transition-all duration-200" aria-label="YouTube">
                                <span class="sr-only">YouTube</span>
                                <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                                </svg>
                            </a>
                        <a href="#" class="text-slate-400 hover:text-white hover:scale-110 transition-all duration-200" aria-label="TikTok">
                                <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                                </svg>
                            </a>
                        <a href="#" class="text-slate-400 hover:text-white hover:scale-110 transition-all duration-200" aria-label="LinkedIn">
                                <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                                </svg>
                            </a>
                        <a href="#" class="text-slate-400 hover:text-white hover:scale-110 transition-all duration-200" aria-label="Facebook">
                                <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                </svg>
                            </a>
                    </div>
                </div>

                <!-- Bottom Copyright -->
                <div class="border-t border-slate-700 mt-6 pt-6">
                    <p class="text-center text-slate-400 text-sm">
                        &copy; 2024 Interline Asia. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    `;

    // Function to inject modern layout
    function injectModernLayout() {
        // Inject header
        const headerPlaceholder = document.getElementById('header-placeholder');
        if (headerPlaceholder) {
            headerPlaceholder.innerHTML = modernHeader;
        } else {
            // If no placeholder, inject at the beginning of body
            document.body.insertAdjacentHTML('afterbegin', modernHeader);
        }

        // Inject footer
        const footerPlaceholder = document.getElementById('footer-placeholder');
        if (footerPlaceholder) {
            footerPlaceholder.innerHTML = modernFooter;
        } else {
            // If no placeholder, inject at the end of body
            document.body.insertAdjacentHTML('beforeend', modernFooter);
        }

        // Add mobile menu functionality
        const mobileMenuButton = document.getElementById('mobile-menu-button');
        const mobileMenu = document.getElementById('mobile-menu');
        
        if (mobileMenuButton && mobileMenu) {
            mobileMenuButton.addEventListener('click', function() {
                if (mobileMenu.style.display === 'none' || mobileMenu.style.display === '') {
                    mobileMenu.style.display = 'block';
                } else {
                    mobileMenu.style.display = 'none';
                }
            });
        }

        // Add smooth scrolling
        document.documentElement.style.scrollBehavior = 'smooth';

        // Add modern body classes
        document.body.className = (document.body.className + ' font-sans antialiased').trim();
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectModernLayout);
    } else {
        injectModernLayout();
    }
})();