import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  serverExternalPackages: ['@whop-apps/sdk'],
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  async headers() {
    return [
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NODE_ENV === 'production' 
              ? 'https://whop.com' 
              : 'http://localhost:3000'
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, whop-signature'
          }
        ]
      }
    ]
  },
  async rewrites() {
    return [
      {
        source: '/api/webhook',
        destination: '/api/webhook'
      }
    ]
  }
}

export default nextConfig