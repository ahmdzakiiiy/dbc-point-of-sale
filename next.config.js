/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ["placeholder.svg"],
    unoptimized: true,
  }, output: 'standalone',
  swcMinify: true,
  experimental: {
    esmExternals: 'loose'
  },  // More permissive CORS config with rewrites for direct file access
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, PUT, DELETE, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization, X-Requested-With" }
        ],
      },
      {
        // Also apply CORS to static files in api-static
        source: "/api-static/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Content-Type", value: "application/json" }
        ],
      }
    ];
  },  // Rewrites to ensure direct access to static JSON files
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/static-health',
          destination: '/api-static/health.json',
        },
        {
          source: '/static-login',
          destination: '/api-static/test-login.json',
        },
        {
          source: '/static-fallback',
          destination: '/api-static/fallback.json',
        },
        {
          source: '/static-debug',
          destination: '/api-static/debug.json',
        }
      ]
    }
  }
}

module.exports = nextConfig
