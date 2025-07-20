import { withSentryConfig } from '@sentry/nextjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // Ensure proper static file serving
  async rewrites() {
    return [
      {
        source: '/',
        destination: '/index.html',
      },
      {
        source: '/((?!api|_next|favicon.ico).*)',
        destination: '/$1.html',
      },
    ];
  },
};

const sentryWebpackPluginOptions = {
  // Additional config options for the Sentry Webpack plugin
  silent: true, // Suppresses source map uploading logs during build
  org: "interline-asia",
  project: "interline-asia-frontend",
};

export default withSentryConfig(nextConfig, sentryWebpackPluginOptions);/* FORCE DEPLOY - BUILD FIX - $(date +%s) */
