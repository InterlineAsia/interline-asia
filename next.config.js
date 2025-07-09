const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Your existing Next.js config options
  experimental: {
    // Enable if needed
  },
  // Ensure static export if using Vercel static hosting
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  }
};

const sentryWebpackPluginOptions = {
  // Additional config options for the Sentry Webpack plugin
  silent: true, // Suppresses source map uploading logs during build
  org: "interline-asia",
  project: "interline-asia-frontend",
};

module.exports = withSentryConfig(nextConfig, sentryWebpackPluginOptions);