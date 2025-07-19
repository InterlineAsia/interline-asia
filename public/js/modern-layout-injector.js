// Modern Layout Injector - Injects Tailwind-styled header and footer into static pages
(function() {
    'use strict';

    // Modern Header HTML
    const modernHeader = `
        <!-- Tailwind CSS -->
        <script src="https://cdn.tailwindcss.com"></script>
        <script>
            tailwind.config = {
                theme: {
                    extend: {
                        fontFamily: {
                            'sans': ['Inter', 'system-ui', 'sans-serif'],
                            'display': ['Playfair Display', 'serif'],
                        },
                        colors: {
                            ocean: {
                                50: '#f0f9ff',
                                100: '#e0f2fe',
                                200: '#bae6fd',
                                300: '#7dd3fc',
                                400: '#38bdf8',
                                500: '#0ea5e9',
                                600: '#0284c7',
                                700: '#0369a1',
                                800: '#075985',
                                900: '#0c4a6e',
                            },
                            cruise: {
                                50: '#fefdf8',
                                100: '#fefbf0',
                                200: '#fdf4d9',
                                300: '#fce7a6',
                                400: '#f9d071',
                                500: '#f5b942',
                                600: '#e6a532',
                                700: '#c18b28',
                                800: '#9b6f26',
                                900: '#7d5a23',
                            }
                        }
                    }
                }
            }
        </script>
        
        <!-- Travel Tools Bar -->
        <div class="bg-gradient-to-r from-ocean-600 to-ocean-700 text-white py-2 px-4">
            <div class="max-w-7xl mx-auto">
                <div class="flex flex-wrap items-center justify-center gap-4 text-sm">
                    <span class="font-medium">Complete your travel experience:</span>
                    <div class="flex flex-wrap items-center gap-4">
                        <a href="https://trip.tpk.mx/qhlnnQh8" target="_blank" rel="noopener noreferrer" 
                           class="flex items-center gap-1 hover:text-ocean-200 transition-colors">
                            <span>✈️</span>
                            <span>Flights</span>
                        </a>
                        <a href="https://kiwitaxi.tpk.mx/NGL3ovB3" target="_blank" rel="noopener noreferrer"
                           class="flex items-center gap-1 hover:text-ocean-200 transition-colors">
                            <span>🚖</span>
                            <span>Transfers</span>
                        </a>
                        <a href="https://ektatraveling.tpk.mx/IUGS6Ovk" target="_blank" rel="noopener noreferrer"
                           class="flex items-center gap-1 hover:text-ocean-200 transition-colors">
                            <span>🛡️</span>
                            <span>Insurance</span>
                        </a>
                        <a href="https://airalo.tpk.mx/M99krJZy" target="_blank" rel="noopener noreferrer"
                           class="flex items-center gap-1 hover:text-ocean-200 transition-colors">
                            <span>📶</span>
                            <span>eSIM</span>
                        </a>
                        <a href="https://getrentacar.tpk.mx/I3FuOWfB" target="_blank" rel="noopener noreferrer"
                           class="flex items-center gap-1 hover:text-ocean-200 transition-colors">
                            <span>🚗</span>
                            <span>Cars</span>
                        </a>
                        <a href="https://wise.com/invite/ihpc/rodneyowenp" target="_blank" rel="noopener noreferrer"
                           class="flex items-center gap-1 hover:text-ocean-200 transition-colors">
                            <span>💳</span>
                            <span>Currency</span>
                        </a>
                    </div>
                </div>
            </div>
        </div>

        <!-- Main Navigation -->
        <nav class="bg-white shadow-lg sticky top-0 z-50">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between items-center h-16">
                    <!-- Brand -->
                    <div class="flex items-center">
                        <a href="/" class="flex items-center space-x-3">
                            <div class="w-10 h-10 bg-gradient-to-br from-ocean-500 to-ocean-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                                IA
                            </div>
                            <div class="flex flex-col">
                                <span class="text-xl font-bold text-gray-900 tracking-tight">Interline Asia</span>
                                <span class="text-xs text-gray-500 font-medium">Luxury Cruise Experiences</span>
                            </div>
                        </a>
                    </div>

                    <!-- Desktop Navigation -->
                    <div class="hidden md:flex items-center space-x-8">
                        <a href="/" class="text-gray-700 hover:text-ocean-600 font-medium transition-colors">
                            Home
                        </a>
                        <a href="/about.html" class="text-gray-700 hover:text-ocean-600 font-medium transition-colors">
                            About
                        </a>
                        <a href="/partners.html" class="text-gray-700 hover:text-ocean-600 font-medium transition-colors">
                            Partners
                        </a>
                        <a href="/login.html" 
                           class="bg-ocean-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-ocean-700 transition-colors">
                            Member Login
                        </a>
                    </div>

                    <!-- Mobile menu button -->
                    <div class="md:hidden">
                        <button id="mobile-menu-button" class="text-gray-700 hover:text-ocean-600 focus:outline-none focus:text-ocean-600">
                            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                    </div>
                </div>

                <!-- Mobile Navigation -->
                <div id="mobile-menu" class="md:hidden hidden">
                    <div class="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-50 rounded-lg mt-2">
                        <a href="/" class="block px-3 py-2 text-gray-700 hover:text-ocean-600 font-medium">
                            Home
                        </a>
                        <a href="/about.html" class="block px-3 py-2 text-gray-700 hover:text-ocean-600 font-medium">
                            About
                        </a>
                        <a href="/partners.html" class="block px-3 py-2 text-gray-700 hover:text-ocean-600 font-medium">
                            Partners
                        </a>
                        <a href="/login.html" 
                           class="block px-3 py-2 bg-ocean-600 text-white rounded-lg font-medium hover:bg-ocean-700 transition-colors text-center">
                            Member Login
                        </a>
                    </div>
                </div>
            </div>
        </nav>
    `;

    // Modern Footer HTML
    const modernFooter = `
        <footer class="bg-gray-900 text-white">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <!-- Brand Section -->
                    <div class="md:col-span-2">
                        <div class="flex items-center space-x-3 mb-4">
                            <div class="w-10 h-10 bg-gradient-to-br from-ocean-500 to-ocean-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                                IA
                            </div>
                            <div class="flex flex-col">
                                <span class="text-xl font-bold tracking-tight">Interline Asia</span>
                                <span class="text-sm text-gray-400">Luxury Cruise Experiences</span>
                            </div>
                        </div>
                        <p class="text-gray-300 mb-6 max-w-md">
                            The world's most exclusive cruise booking platform for verified travel industry professionals.
                        </p>
                        
                        <!-- Social Media Links -->
                        <div class="flex space-x-4">
                            <a href="#" class="text-gray-400 hover:text-white transition-colors">
                                <span class="sr-only">YouTube</span>
                                <svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                                </svg>
                            </a>
                            <a href="#" class="text-gray-400 hover:text-white transition-colors">
                                <span class="sr-only">TikTok</span>
                                <svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                                </svg>
                            </a>
                            <a href="#" class="text-gray-400 hover:text-white transition-colors">
                                <span class="sr-only">LinkedIn</span>
                                <svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                                </svg>
                            </a>
                            <a href="#" class="text-gray-400 hover:text-white transition-colors">
                                <span class="sr-only">Facebook</span>
                                <svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                </svg>
                            </a>
                        </div>
                    </div>

                    <!-- Company Links -->
                    <div>
                        <h3 class="text-lg font-semibold mb-4">Company</h3>
                        <ul class="space-y-2">
                            <li>
                                <a href="/about.html" class="text-gray-300 hover:text-white transition-colors">
                                    About Us
                                </a>
                            </li>
                            <li>
                                <a href="/partners.html" class="text-gray-300 hover:text-white transition-colors">
                                    Partners
                                </a>
                            </li>
                            <li>
                                <a href="/contact.html" class="text-gray-300 hover:text-white transition-colors">
                                    Contact
                                </a>
                            </li>
                        </ul>
                    </div>

                    <!-- Legal Links -->
                    <div>
                        <h3 class="text-lg font-semibold mb-4">Legal</h3>
                        <ul class="space-y-2">
                            <li>
                                <a href="/terms-and-conditions.html" class="text-gray-300 hover:text-white transition-colors">
                                    Terms & Conditions
                                </a>
                            </li>
                            <li>
                                <a href="/privacy-policy.html" class="text-gray-300 hover:text-white transition-colors">
                                    Privacy Policy
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                <!-- Bottom Bar -->
                <div class="border-t border-gray-800 mt-8 pt-8">
                    <p class="text-center text-gray-400">
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
                mobileMenu.classList.toggle('hidden');
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