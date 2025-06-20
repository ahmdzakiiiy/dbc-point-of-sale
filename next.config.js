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
  },
  output: 'standalone',
  swcMinify: true,
  experimental: {
    esmExternals: 'loose'
  },  // Allow CORS for API routes and enforce JSON content type
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, PUT, DELETE, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" },
          { key: "Content-Type", value: "application/json" },
          { key: "Cache-Control", value: "no-store, max-age=0" }
        ],
      },
    ];
  }
}

module.exports = nextConfig
