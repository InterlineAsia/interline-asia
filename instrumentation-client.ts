import * as Sentry from '@sentry/nextjs';
import { captureRouterTransitionStart } from '@sentry/react';

// Initialize Sentry
Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  debug: false,
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
    Sentry.consoleLoggingIntegration({ levels: ["log", "error", "warn"] }),
  ],
  _experiments: {
    enableLogs: true,
  },
  enabled: process.env.NODE_ENV === 'production',
});

// Export the router transition handler for Next.js 15
export const onRouterTransitionStart = captureRouterTransitionStart;