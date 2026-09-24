/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow isolated verification while a local dev server is using .next.
  distDir: process.env.NEXT_BUILD_DIR || '.next',
  experimental: {
    forceSwcTransforms: true,
    serverComponentsExternalPackages: ['googleapis'],
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.amazonaws.com' },
    ],
  },
};

module.exports = nextConfig;
