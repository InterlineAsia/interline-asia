import { withSentryConfig } from '@sentry/nextjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Vercel deployment configuration
  experimental: {
    // Enable if needed
  },
  // Remove static export for dynamic Vercel deployment
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // Ensure proper routing for Vercel
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
      // Serve static HTML files from public folder
      {
        source: '/((?!api|_next|favicon.ico).*)',
        destination: '/$1.html',
        has: [
          {
            type: 'header',
            key: 'accept',
            value: '(.*text/html.*)',
          },
        ],
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
