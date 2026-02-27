/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      { source: '/favicon.ico', destination: '/favicon.svg', permanent: false },
    ]
  },
}

module.exports = nextConfig







