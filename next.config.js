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
  },  // Removed headers config to avoid conflicts with middleware
}

module.exports = nextConfig
