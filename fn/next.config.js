/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'books.google.com',
      'www.google.com',
      'googleusercontent.com',
      'lh3.googleusercontent.com',
      'lh5.googleusercontent.com'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'books.google.com',
      }
    ],
    unoptimized: true // To allow SVG placeholders to work properly
  },
}

module.exports = nextConfig 