import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Strict mode for React
  reactStrictMode: true,

  // ── Prisma / Neon fix ─────────────────────────────────────────────────────
  // Mark Prisma and Neon packages as server-external so Next.js/webpack skips
  // bundling them and lets Node.js require() handle them at runtime.
  // Required to avoid "Can't resolve query_engine_bg.js" and similar errors.
  serverExternalPackages: [
    '@prisma/client',
    '.prisma/client',
    '@prisma/adapter-neon',
    '@neondatabase/serverless',
  ],

  // Image optimization
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'image.pollinations.ai' },
      { protocol: 'https', hostname: 'placehold.co' },
    ],
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options',  value: 'nosniff' },
          { key: 'X-Frame-Options',          value: 'DENY' },
          { key: 'X-XSS-Protection',         value: '1; mode=block' },
          { key: 'Referrer-Policy',          value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;
