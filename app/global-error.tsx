'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to Sentry
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen font-sans p-8">
      <h1 className="text-2xl mb-4 text-red-500">
        Something went wrong!
      </h1>
      <p className="mb-8 text-gray-500 text-center">
        We're sorry, but something unexpected happened. Our team has been notified.
        {error?.digest && (
          <span className="block mt-2 text-xs text-gray-400">
            Error ID: {error.digest}
          </span>
        )}
      </p>
      <button
        onClick={reset}
        className="px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600"
      >
        Try again
      </button>
    </div>
  );
}