// Main JavaScript for Redesigned Website

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all components
    initNavigation();
    initChatBot();
    initScrollEffects();
    initFooter();
    
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const offsetTop = target.offsetTop - 80; // Account for fixed nav
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
});

// Navigation functionality
function initNavigation() {
    const nav = document.querySelector('.main-nav');
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    // Navbar scroll effect
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            nav.style.background = 'rgba(15, 23, 42, 0.98)';
            nav.style.backdropFilter = 'blur(25px)';
        } else {
            nav.style.background = 'rgba(15, 23, 42, 0.95)';
            nav.style.backdropFilter = 'blur(20px)';
        }
    });
    
    // Mobile menu toggle
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            navToggle.classList.toggle('active');
        });
    }
    
    // Active nav link highlighting
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section[id]');
    
    window.addEventListener('scroll', function() {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            const sectionHeight = section.clientHeight;
            if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
                current = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });
}

// Chat Bot functionality
function initChatBot() {
    const chatToggle = document.getElementById('chatToggle');
    const chatWindow = document.getElementById('chatWindow');
    const chatClose = document.getElementById('chatClose');
    const chatInput = document.getElementById('chatInput');
    const chatSend = document.getElementById('chatSend');
    const chatMessages = document.getElementById('chatMessages');
    
    if (!chatToggle || !chatWindow) return;
    
    // Toggle chat window
    chatToggle.addEventListener('click', function() {
        const isVisible = chatWindow.style.display === 'flex';
        chatWindow.style.display = isVisible ? 'none' : 'flex';
        
        if (!isVisible) {
            chatInput.focus();
        }
    });
    
    // Close chat window
    if (chatClose) {
        chatClose.addEventListener('click', function() {
            chatWindow.style.display = 'none';
        });
    }
    
    // Send message functionality
    function sendMessage() {
        const message = chatInput.value.trim();
        if (!message) return;
        
        // Add user message
        addChatMessage(message, 'user');
        chatInput.value = '';
        
        // Show typing indicator
        showTypingIndicator();
        
        // Process message with cruise bot
        setTimeout(() => {
            hideTypingIndicator();
            processCruiseQuery(message);
        }, 1000);
    }
    
    // Send button click
    if (chatSend) {
        chatSend.addEventListener('click', sendMessage);
    }
    
    // Enter key to send
    if (chatInput) {
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }
    
    // Add message to chat
    function addChatMessage(message, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${sender}`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.textContent = message;
        
        messageDiv.appendChild(contentDiv);
        chatMessages.appendChild(messageDiv);
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // Show typing indicator
    function showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'chat-message bot typing-indicator';
        typingDiv.innerHTML = '<div class="message-content">Typing...</div>';
        chatMessages.appendChild(typingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // Hide typing indicator
    function hideTypingIndicator() {
        const typingIndicator = chatMessages.querySelector('.typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }
    
    // Process cruise query (simplified version)
    function processCruiseQuery(query) {
        let response = '';
        
        // Simple keyword matching for demo
        const lowerQuery = query.toLowerCase();
        
        if (lowerQuery.includes('mediterranean')) {
            response = "I found some great Mediterranean cruises! Our Royal Caribbean Wonder of the Seas offers a 7-day Barcelona to Rome cruise starting from $1,299. Would you like more details about Mediterranean itineraries?";
        } else if (lowerQuery.includes('caribbean')) {
            response = "The Caribbean is perfect for cruising! I recommend our Norwegian Prima 10-day Eastern Caribbean cruise from Miami starting at $1,899. It includes beautiful stops at pristine beaches. Interested in learning more?";
        } else if (lowerQuery.includes('asia') || lowerQuery.includes('japan') || lowerQuery.includes('singapore')) {
            response = "Asia cruises are incredible! Our Celebrity Solstice offers a 14-day Singapore to Japan cruise from $2,499, featuring cultural treasures and amazing cuisine. Would you like to explore Asian cruise options?";
        } else if (lowerQuery.includes('price') || lowerQuery.includes('cost') || lowerQuery.includes('budget')) {
            response = "Our exclusive interline rates offer savings up to 70% off published prices! Prices start from $1,299 for Mediterranean cruises, $1,899 for Caribbean, and $2,499 for Asia. What's your preferred destination?";
        } else if (lowerQuery.includes('hello') || lowerQuery.includes('hi')) {
            response = "Hello! I'm here to help you find the perfect cruise. I can search by destination, dates, cruise lines, or budget. Try asking me something like 'Show me Mediterranean cruises' or 'What's available in December?'";
        } else {
            response = "I'd be happy to help you find the perfect cruise! I can search by destination (Mediterranean, Caribbean, Asia), dates, cruise lines, or budget. What type of cruise experience are you looking for?";
        }
        
        addChatMessage(response, 'bot');
    }
}

// Scroll effects and animations
function initScrollEffects() {
    // Intersection Observer for fade-in animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in-up');
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    const animateElements = document.querySelectorAll('.feature-card, .cruise-card, .partner-logo');
    animateElements.forEach(el => observer.observe(el));
    
    // Parallax effect for hero section
    window.addEventListener('scroll', function() {
        const scrolled = window.pageYOffset;
        const heroBackground = document.querySelector('.hero-background');
        
        if (heroBackground) {
            const speed = scrolled * 0.5;
            heroBackground.style.transform = `translateY(${speed}px)`;
        }
    });
}

// Load footer and travel tools
function initFooter() {
    // Load footer
    const footerPlaceholder = document.getElementById('footer-placeholder');
    if (footerPlaceholder) {
        fetch('/partials/footer.html')
            .then(response => response.text())
            .then(html => {
                footerPlaceholder.innerHTML = html;
            })
            .catch(error => {
                console.error('Error loading footer:', error);
            });
    }
    
    // Load travel tools bar
    const travelToolsPlaceholder = document.getElementById('travel-tools-placeholder');
    if (travelToolsPlaceholder) {
        fetch('/partials/travel-tools-bar.html')
            .then(response => response.text())
            .then(html => {
                travelToolsPlaceholder.innerHTML = html;
            })
            .catch(error => {
                console.error('Error loading travel tools bar:', error);
            });
    }
}

// Utility functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Mobile menu styles (if needed)
const mobileMenuStyles = `
@media (max-width: 768px) {
    .nav-menu {
        position: fixed;
        top: 80px;
        left: 0;
        right: 0;
        background: rgba(15, 23, 42, 0.98);
        backdrop-filter: blur(25px);
        flex-direction: column;
        padding: 2rem;
        gap: 1rem;
        transform: translateY(-100%);
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .nav-menu.active {
        display: flex;
        transform: translateY(0);
        opacity: 1;
        visibility: visible;
    }
    
    .nav-toggle.active span:nth-child(1) {
        transform: rotate(45deg) translate(5px, 5px);
    }
    
    .nav-toggle.active span:nth-child(2) {
        opacity: 0;
    }
    
    .nav-toggle.active span:nth-child(3) {
        transform: rotate(-45deg) translate(7px, -6px);
    }
}
`;

// Add mobile menu styles to head
const styleSheet = document.createElement('style');
styleSheet.textContent = mobileMenuStyles;
document.head.appendChild(styleSheet);