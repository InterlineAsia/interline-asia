import { withSentryConfig } from '@sentry/nextjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Your existing Next.js config options
  experimental: {
    // Enable if needed
  },
  // Remove static export for Vercel deployment
  // output: 'export',
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

export default withSentryConfig(nextConfig, sentryWebpackPluginOptions);/* FORCE DEPLOY Wed Jul 16 16:02:58 +07 2025 */
