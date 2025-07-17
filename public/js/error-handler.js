// Global Error Handler for Interline Asia
class ErrorHandler {
    constructor() {
        this.setupGlobalErrorHandling();
        this.setupUnhandledRejectionHandling();
    }

    setupGlobalErrorHandling() {
        window.addEventListener('error', (event) => {
            this.logError('JavaScript Error', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error
            });
        });
    }

    setupUnhandledRejectionHandling() {
        window.addEventListener('unhandledrejection', (event) => {
            this.logError('Unhandled Promise Rejection', {
                reason: event.reason,
                promise: event.promise
            });
        });
    }

    logError(type, details) {
        // Log to console in development
        if (window.location.hostname === 'localhost' || window.location.hostname.includes('127.0.0.1')) {
            console.error(`[${type}]`, details);
        }

        // Send to monitoring service in production
        if (window.location.hostname.includes('interlineasia.com')) {
            this.sendToMonitoring(type, details);
        }
    }

    sendToMonitoring(type, details) {
        try {
            // Send to Sentry or other monitoring service
            if (window.Sentry) {
                window.Sentry.captureException(new Error(`${type}: ${JSON.stringify(details)}`));
            }
        } catch (error) {
            // Fail silently to avoid infinite error loops
        }
    }

    // Utility method for wrapping async functions with error handling
    static async safeAsync(asyncFunction, fallback = null) {
        try {
            return await asyncFunction();
        } catch (error) {
            console.error('Async operation failed:', error);
            return fallback;
        }
    }

    // Utility method for wrapping functions with error handling
    static safe(func, fallback = null) {
        try {
            return func();
        } catch (error) {
            console.error('Operation failed:', error);
            return fallback;
        }
    }
}

// Initialize global error handler
const errorHandler = new ErrorHandler();

// Export for use in other modules
window.ErrorHandler = ErrorHandler;