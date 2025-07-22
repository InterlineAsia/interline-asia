'use client';

// SENTRY DISABLED FOR LOCAL DEV
// import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to console instead of Sentry
    console.error('Global error:', error);
    // Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '100vh',
          fontFamily: 'Inter, sans-serif',
          padding: '2rem'
        }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#ef4444' }}>
            Something went wrong!
          </h1>
          <p style={{ marginBottom: '2rem', color: '#64748b', textAlign: 'center' }}>
            We're sorry, but something unexpected happened. Our team has been notified.
          </p>
          <button
            onClick={reset}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '600'
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}