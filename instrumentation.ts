// SENTRY DISABLED FOR LOCAL DEV - COMMENTED OUT TO PREVENT CRASHES
// instrumentation.ts
export async function register() {
  // SENTRY DISABLED
  // if (process.env.NEXT_RUNTIME === 'nodejs') {
  //   // Only initialize Sentry on the server side
  //   const { init } = await import('@sentry/nextjs');
  //   
  //   init({
  //     dsn: process.env.SENTRY_DSN,
  //     environment: process.env.NODE_ENV || 'development',
  //     tracesSampleRate: 0.1,
  //     debug: false,
  //     enabled: !!process.env.SENTRY_DSN,
  //   });
  // }
}

export async function onRequestError(err: unknown, request: Request, context: { routerKind: string; routePath: string }) {
  // SENTRY DISABLED
  // // Only capture errors in production
  // if (process.env.NODE_ENV === 'production') {
  //   const { captureRequestError } = await import('@sentry/nextjs');
  //   captureRequestError(err, request, context);
  // }
}