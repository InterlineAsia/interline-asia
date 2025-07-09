// Safe Sentry Server Configuration - Bulletproof Edition
import * as Sentry from '@sentry/node';

// Safe Sentry initialization with validation
const sentryDsn = process.env.SENTRY_DSN;

if (sentryDsn && sentryDsn.trim() !== '' && sentryDsn !== 'your_sentry_dsn_here') {
  try {
    Sentry.init({
      dsn: sentryDsn,
      environment: process.env.NODE_ENV || 'development',
      // Set sample rate for performance monitoring
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      // Disable in development to reduce noise
      enabled: process.env.NODE_ENV === 'production' || process.env.FORCE_SENTRY === 'true',
    });
    console.log('Sentry initialized successfully');
  } catch (error) {
    console.warn('Failed to initialize Sentry:', error);
  }
} else {
  console.warn('Sentry DSN not configured - error tracking disabled');
}

// Create safe wrapper that won't crash if Sentry isn't initialized
const SafeSentry = {
  captureException: (error: any) => {
    try {
      if (sentryDsn && sentryDsn.trim() !== '' && sentryDsn !== 'your_sentry_dsn_here') {
        Sentry.captureException(error);
      } else {
        console.error('Error (Sentry disabled):', error);
      }
    } catch (sentryError) {
      console.error('Sentry capture failed:', sentryError);
      console.error('Original error:', error);
    }
  },
  captureMessage: (message: string, level?: any) => {
    try {
      if (sentryDsn && sentryDsn.trim() !== '' && sentryDsn !== 'your_sentry_dsn_here') {
        Sentry.captureMessage(message, level);
      } else {
        console.log('Message (Sentry disabled):', message);
      }
    } catch (sentryError) {
      console.error('Sentry capture failed:', sentryError);
      console.log('Original message:', message);
    }
  },
  // Pass through other Sentry methods safely
  ...Sentry,
};

export default SafeSentry;