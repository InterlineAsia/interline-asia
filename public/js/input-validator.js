// Comprehensive Input Validation & Sanitization Service
class InputValidator {
    constructor() {
        this.patterns = {
            email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
            phone: /^[\+]?[1-9][\d]{0,15}$/,
            name: /^[a-zA-Z\s\-'\.]{2,50}$/,
            company: /^[a-zA-Z0-9\s\-&'\.]{2,100}$/,
            url: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
            alphanumeric: /^[a-zA-Z0-9]+$/,
            numeric: /^\d+$/,
            password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/
        };

        this.maxLengths = {
            email: 254,
            name: 50,
            company: 100,
            phone: 20,
            message: 1000,
            address: 200,
            city: 50,
            country: 50,
            postalCode: 20
        };

        this.dangerousPatterns = [
            /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
            /javascript:/gi,
            /on\w+\s*=/gi,
            /data:text\/html/gi,
            /vbscript:/gi,
            /<iframe/gi,
            /<object/gi,
            /<embed/gi,
            /<link/gi,
            /<meta/gi
        ];
    }

    // Main validation method
    validate(input, type, options = {}) {
        try {
            const result = {
                isValid: false,
                sanitized: '',
                errors: []
            };

            // Check if input exists
            if (input === null || input === undefined) {
                result.errors.push('Input is required');
                return result;
            }

            // Convert to string and trim
            let sanitized = String(input).trim();

            // Check length limits
            const maxLength = options.maxLength || this.maxLengths[type] || 255;
            if (sanitized.length > maxLength) {
                result.errors.push(`Input exceeds maximum length of ${maxLength} characters`);
                return result;
            }

            // Check minimum length
            const minLength = options.minLength || 0;
            if (sanitized.length < minLength) {
                result.errors.push(`Input must be at least ${minLength} characters`);
                return result;
            }

            // Sanitize input
            sanitized = this.sanitize(sanitized, options);

            // Type-specific validation
            switch (type) {
                case 'email':
                    result.isValid = this.validateEmail(sanitized);
                    if (!result.isValid) result.errors.push('Invalid email format');
                    break;

                case 'password':
                    result.isValid = this.validatePassword(sanitized);
                    if (!result.isValid) result.errors.push('Password must be at least 8 characters with uppercase, lowercase, and number');
                    break;

                case 'name':
                    result.isValid = this.patterns.name.test(sanitized);
                    if (!result.isValid) result.errors.push('Name contains invalid characters');
                    break;

                case 'company':
                    result.isValid = this.patterns.company.test(sanitized);
                    if (!result.isValid) result.errors.push('Company name contains invalid characters');
                    break;

                case 'phone':
                    result.isValid = this.validatePhone(sanitized);
                    if (!result.isValid) result.errors.push('Invalid phone number format');
                    break;

                case 'url':
                    result.isValid = this.patterns.url.test(sanitized);
                    if (!result.isValid) result.errors.push('Invalid URL format');
                    break;

                case 'text':
                    result.isValid = this.validateText(sanitized, options);
                    if (!result.isValid) result.errors.push('Text contains invalid content');
                    break;

                case 'numeric':
                    result.isValid = this.patterns.numeric.test(sanitized);
                    if (!result.isValid) result.errors.push('Must contain only numbers');
                    break;

                case 'alphanumeric':
                    result.isValid = this.patterns.alphanumeric.test(sanitized);
                    if (!result.isValid) result.errors.push('Must contain only letters and numbers');
                    break;

                default:
                    result.isValid = true; // Default to valid for unknown types
            }

            result.sanitized = sanitized;
            return result;

        } catch (error) {
            console.error('Validation error:', error);
            return {
                isValid: false,
                sanitized: '',
                errors: ['Validation failed due to internal error']
            };
        }
    }

    // Sanitize input to remove dangerous content
    sanitize(input, options = {}) {
        if (typeof input !== 'string') {
            input = String(input);
        }

        let sanitized = input;

        // Remove dangerous patterns
        this.dangerousPatterns.forEach(pattern => {
            sanitized = sanitized.replace(pattern, '');
        });

        // HTML encode if requested
        if (options.htmlEncode !== false) {
            sanitized = this.htmlEncode(sanitized);
        }

        // Remove null bytes
        sanitized = sanitized.replace(/\0/g, '');

        // Normalize whitespace
        if (options.normalizeWhitespace !== false) {
            sanitized = sanitized.replace(/\s+/g, ' ').trim();
        }

        return sanitized;
    }

    // HTML encode special characters
    htmlEncode(str) {
        const htmlEntities = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#x27;',
            '/': '&#x2F;'
        };

        return str.replace(/[&<>"'/]/g, (match) => htmlEntities[match]);
    }

    // Validate email
    validateEmail(email) {
        if (!email || email.length > 254) return false;
        
        // Check for dangerous patterns
        if (this.containsDangerousContent(email)) return false;
        
        return this.patterns.email.test(email);
    }

    // Validate password
    validatePassword(password) {
        if (!password || password.length < 8) return false;
        
        // Check for dangerous patterns
        if (this.containsDangerousContent(password)) return false;
        
        return this.patterns.password.test(password);
    }

    // Validate phone number
    validatePhone(phone) {
        if (!phone) return false;
        
        // Remove common formatting
        const cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
        
        return this.patterns.phone.test(cleaned);
    }

    // Validate text content
    validateText(text, options = {}) {
        if (!text) return options.required !== true;
        
        // Check for dangerous content
        if (this.containsDangerousContent(text)) return false;
        
        // Check for excessive special characters (potential injection)
        const specialCharCount = (text.match(/[<>{}[\]\\\/]/g) || []).length;
        if (specialCharCount > text.length * 0.1) return false; // More than 10% special chars
        
        return true;
    }

    // Check for dangerous content
    containsDangerousContent(input) {
        return this.dangerousPatterns.some(pattern => pattern.test(input));
    }

    // Validate file upload
    validateFile(file, options = {}) {
        const result = {
            isValid: false,
            errors: []
        };

        if (!file) {
            result.errors.push('No file provided');
            return result;
        }

        // Check file size
        const maxSize = options.maxSize || window.FILE_CONFIG?.maxSize || 5 * 1024 * 1024; // 5MB default
        if (file.size > maxSize) {
            result.errors.push(`File size exceeds ${Math.round(maxSize / 1024 / 1024)}MB limit`);
            return result;
        }

        // Check file type
        const allowedTypes = options.allowedTypes || window.FILE_CONFIG?.allowedTypes || [];
        if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
            result.errors.push('File type not allowed');
            return result;
        }

        // Check file extension
        const allowedExtensions = options.allowedExtensions || window.FILE_CONFIG?.allowedExtensions || [];
        if (allowedExtensions.length > 0) {
            const extension = file.name.split('.').pop().toLowerCase();
            if (!allowedExtensions.includes(extension)) {
                result.errors.push('File extension not allowed');
                return result;
            }
        }

        // Check filename for dangerous patterns
        if (this.containsDangerousContent(file.name)) {
            result.errors.push('Filename contains invalid characters');
            return result;
        }

        result.isValid = true;
        return result;
    }

    // Validate form data
    validateForm(formData, schema) {
        const results = {};
        let isValid = true;

        for (const [field, rules] of Object.entries(schema)) {
            const value = formData[field];
            const validation = this.validate(value, rules.type, rules.options || {});
            
            results[field] = validation;
            
            if (!validation.isValid) {
                isValid = false;
            }
        }

        return {
            isValid,
            fields: results,
            sanitizedData: Object.keys(results).reduce((acc, field) => {
                acc[field] = results[field].sanitized;
                return acc;
            }, {})
        };
    }

    // Validate query parameters
    validateQueryParams(params, allowedParams = []) {
        const sanitized = {};
        const errors = [];

        for (const [key, value] of Object.entries(params)) {
            // Check if parameter is allowed
            if (allowedParams.length > 0 && !allowedParams.includes(key)) {
                errors.push(`Parameter '${key}' is not allowed`);
                continue;
            }

            // Sanitize parameter name and value
            const sanitizedKey = this.sanitize(key, { htmlEncode: true });
            const sanitizedValue = this.sanitize(value, { htmlEncode: true });

            // Check for dangerous content
            if (this.containsDangerousContent(sanitizedKey) || this.containsDangerousContent(sanitizedValue)) {
                errors.push(`Parameter '${key}' contains dangerous content`);
                continue;
            }

            sanitized[sanitizedKey] = sanitizedValue;
        }

        return {
            isValid: errors.length === 0,
            sanitized,
            errors
        };
    }

    // Rate limiting validation
    validateRateLimit(action, identifier, customLimits = {}) {
        const limits = {
            ...window.SECURITY_CONFIG?.rateLimits || {},
            ...customLimits
        };

        const limit = limits[action];
        if (!limit) return true; // No limit defined

        const key = `rateLimit_${action}_${identifier}`;
        const now = Date.now();
        
        let attempts = JSON.parse(localStorage.getItem(key) || '[]');
        
        // Remove old attempts outside the window
        attempts = attempts.filter(timestamp => now - timestamp < limit.window);
        
        if (attempts.length >= limit.attempts) {
            return false; // Rate limit exceeded
        }

        // Add current attempt
        attempts.push(now);
        localStorage.setItem(key, JSON.stringify(attempts));
        
        return true;
    }

    // CSRF token validation
    validateCSRFToken(token) {
        const storedToken = sessionStorage.getItem('csrfToken');
        return token && storedToken && token === storedToken;
    }

    // Generate CSRF token
    generateCSRFToken() {
        const token = window.SecureConfig?.generateSecureToken() || this.generateFallbackToken();
        sessionStorage.setItem('csrfToken', token);
        return token;
    }

    // Fallback token generation
    generateFallbackToken() {
        return Array.from(crypto.getRandomValues(new Uint8Array(32)))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    // Validate JSON input
    validateJSON(jsonString, maxDepth = 10) {
        try {
            const parsed = JSON.parse(jsonString);
            
            // Check depth to prevent deeply nested objects
            if (this.getObjectDepth(parsed) > maxDepth) {
                return {
                    isValid: false,
                    error: 'JSON structure too deeply nested'
                };
            }

            return {
                isValid: true,
                parsed
            };

        } catch (error) {
            return {
                isValid: false,
                error: 'Invalid JSON format'
            };
        }
    }

    // Get object depth
    getObjectDepth(obj, depth = 0) {
        if (depth > 50) return depth; // Prevent infinite recursion
        
        if (obj === null || typeof obj !== 'object') {
            return depth;
        }

        return Math.max(depth, ...Object.values(obj).map(value => 
            this.getObjectDepth(value, depth + 1)
        ));
    }
}

// Initialize input validator
window.InputValidator = new InputValidator();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = InputValidator;
}