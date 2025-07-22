// SENTRY DISABLED FOR LOCAL DEV - COMMENTED OUT TO PREVENT CRASHES
// import * as Sentry from '@sentry/node';

// Safe Sentry initialization with validation
// const sentryDsn = process.env.SENTRY_DSN;

// if (sentryDsn && sentryDsn.trim() !== '' && sentryDsn !== 'your_sentry_dsn_here') {
//   try {
//     Sentry.init({
//       dsn: sentryDsn,
//       environment: process.env.NODE_ENV || 'development',
//       // Set sample rate for performance monitoring
//       tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
//       // Disable in development to reduce noise
//       enabled: process.env.NODE_ENV === 'production' || process.env.FORCE_SENTRY === 'true',
//     });
//     console.log('Sentry initialized successfully');
//   } catch (error) {
//     console.warn('Failed to initialize Sentry:', error);
//   }
// } else {
//   console.warn('Sentry DSN not configured - error tracking disabled');
// }

// Create safe wrapper that won't crash if Sentry isn't initialized
const SafeSentry = {
  captureException: (error: any) => {
    console.error('Error (Sentry disabled):', error);
  },
  captureMessage: (message: string, level?: any) => {
    console.log('Message (Sentry disabled):', message);
  }
};

export default SafeSentry;