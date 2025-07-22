// SENTRY DISABLED FOR LOCAL DEV - COMMENTED OUT TO PREVENT CRASHES
// import * as Sentry from "@sentry/nextjs";

// Sentry.init({
//   dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
//   
//   // Adjust this value in production, or use tracesSampler for greater control
//   tracesSampleRate: 0.1,
//   
//   // Setting this option to true will print useful information to the console while you're setting up Sentry.
//   debug: false,
//   
//   replaysOnErrorSampleRate: 1.0,
//   
//   // This sets the sample rate to be 10%. You may want this to be 100% while
//   // in development and sample at a lower rate in production
//   replaysSessionSampleRate: 0.1,
//   
//   // You can remove this option if you're not planning to use the Sentry Session Replay feature:
//   integrations: [
//     Sentry.replayIntegration({
//       // Additional Replay configuration goes in here, for example:
//       maskAllText: true,
//       blockAllMedia: true,
//     }),
//     // Send console.log, console.error, and console.warn calls as logs to Sentry
//     Sentry.consoleLoggingIntegration({ levels: ["error", "warn"] }),
//   ],
//   
//   // Enable experimental logging
//   _experiments: {
//     enableLogs: true,
//   },
//   
//   // Only enable in production
//   enabled: process.env.NODE_ENV === 'production',
// });