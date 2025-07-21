// Server-side Validation - Comprehensive field validation
// Ensures all required fields are properly validated on the backend

/**
 * Validation rules for different data types
 */
const validationRules = {
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Please provide a valid email address'
  },
  phone: {
    pattern: /^[\+]?[1-9][\d]{0,15}$/,
    message: 'Please provide a valid phone number'
  },
  name: {
    pattern: /^[a-zA-Z\s\-'\.]{2,50}$/,
    message: 'Name must be 2-50 characters and contain only letters, spaces, hyphens, apostrophes, and periods'
  },
  date: {
    pattern: /^\d{4}-\d{2}-\d{2}$/,
    message: 'Date must be in YYYY-MM-DD format'
  },
  quoteId: {
    pattern: /^(Q-\d{4}-[A-Z]{3}-[A-Z]{3}|quote_\d+_[a-z0-9]+)$/,
    message: 'Invalid quote ID format'
  },
  cruiseId: {
    pattern: /^[a-zA-Z0-9_\-]{3,50}$/,
    message: 'Cruise ID must be 3-50 characters and contain only letters, numbers, underscores, and hyphens'
  }
};

/**
 * Validate a single field
 */
function validateField(value, fieldName, rules = {}) {
  const errors = [];
  
  // Check if field is required
  if (rules.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
    errors.push(`${fieldName} is required`);
    return errors;
  }
  
  // Skip further validation if field is empty and not required
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return errors;
  }
  
  // Type-specific validation
  if (rules.type && validationRules[rules.type]) {
    const typeRule = validationRules[rules.type];
    if (!typeRule.pattern.test(value)) {
      errors.push(typeRule.message);
    }
  }
  
  // Length validation
  if (rules.minLength && value.length < rules.minLength) {
    errors.push(`${fieldName} must be at least ${rules.minLength} characters`);
  }
  
  if (rules.maxLength && value.length > rules.maxLength) {
    errors.push(`${fieldName} must be no more than ${rules.maxLength} characters`);
  }
  
  // Custom pattern validation
  if (rules.pattern && !rules.pattern.test(value)) {
    errors.push(rules.message || `${fieldName} format is invalid`);
  }
  
  // Date validation
  if (rules.type === 'date') {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      errors.push(`${fieldName} must be a valid date`);
    } else if (rules.minDate && date < new Date(rules.minDate)) {
      errors.push(`${fieldName} must be after ${rules.minDate}`);
    } else if (rules.maxDate && date > new Date(rules.maxDate)) {
      errors.push(`${fieldName} must be before ${rules.maxDate}`);
    }
  }
  
  return errors;
}

/**
 * Validate quote request data
 */
function validateQuoteRequest(data) {
  const schema = {
    cruiseId: { required: true, type: 'cruiseId' },
    clientName: { required: true, type: 'name', minLength: 2, maxLength: 100 },
    userId: { required: true, minLength: 1 },
    userEmail: { required: false, type: 'email' },
    dealId: { required: false, type: 'cruiseId' }
  };
  
  return validateObject(data, schema);
}

/**
 * Validate booking request data
 */
function validateBookingRequest(data) {
  const schema = {
    quoteId: { required: true, type: 'quoteId' },
    firstName: { required: true, type: 'name', minLength: 1, maxLength: 50 },
    lastName: { required: true, type: 'name', minLength: 1, maxLength: 50 },
    middleName: { required: false, type: 'name', maxLength: 50 },
    dateOfBirth: { 
      required: true, 
      type: 'date',
      maxDate: new Date(Date.now() - 18 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Must be 18+
    },
    email: { required: true, type: 'email' },
    phone: { required: true, type: 'phone' },
    cabinType: { 
      required: true, 
      pattern: /^(Interior|Oceanview|Balcony|Suite)$/,
      message: 'Cabin type must be Interior, Oceanview, Balcony, or Suite'
    },
    specialRequests: { required: false, maxLength: 1000 }
  };
  
  return validateObject(data, schema);
}

/**
 * Validate an object against a schema
 */
function validateObject(data, schema) {
  const errors = {};
  let isValid = true;
  
  // Validate each field in the schema
  for (const [fieldName, rules] of Object.entries(schema)) {
    const fieldErrors = validateField(data[fieldName], fieldName, rules);
    if (fieldErrors.length > 0) {
      errors[fieldName] = fieldErrors;
      isValid = false;
    }
  }
  
  // Check for unexpected fields (security measure)
  const allowedFields = Object.keys(schema);
  const extraFields = Object.keys(data).filter(field => !allowedFields.includes(field));
  
  if (extraFields.length > 0) {
    console.warn('Unexpected fields in request:', extraFields);
    // Don't fail validation for extra fields, just log them
  }
  
  return {
    isValid,
    errors,
    extraFields
  };
}

/**
 * Sanitize input data
 */
function sanitizeInput(value) {
  if (typeof value !== 'string') return value;
  
  // Remove potentially dangerous characters
  return value
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .substring(0, 10000); // Limit length
}

/**
 * Sanitize an entire object
 */
function sanitizeObject(data) {
  const sanitized = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value)) {
      sanitized[key] = value.map(sanitizeInput);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = sanitizeInput(value);
    }
  }
  
  return sanitized;
}

/**
 * Express middleware for validation
 */
function validationMiddleware(validatorFn) {
  return (req, res, next) => {
    try {
      // Sanitize input first
      req.body = sanitizeObject(req.body);
      
      // Validate the request
      const validation = validatorFn(req.body);
      
      if (!validation.isValid) {
        return res.status(400).json({
          error: 'Validation failed',
          message: 'Please check your input and try again',
          details: validation.errors,
          code: 'VALIDATION_ERROR'
        });
      }
      
      // Add validation result to request for logging
      req.validation = validation;
      next();
      
    } catch (error) {
      console.error('Validation middleware error:', error);
      res.status(500).json({
        error: 'Validation error',
        message: 'Unable to process your request'
      });
    }
  };
}

module.exports = {
  validateQuoteRequest,
  validateBookingRequest,
  validateField,
  validateObject,
  sanitizeInput,
  sanitizeObject,
  validationMiddleware,
  validationRules
};