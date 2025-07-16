// instrumentation.ts
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Only initialize Sentry on the server side
    const { init } = await import('@sentry/nextjs');
    
    init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: 0.1,
      debug: false,
      enabled: !!process.env.SENTRY_DSN,
    });
  }
}