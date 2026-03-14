import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  turbopack: {
    root: __dirname,
  },
  allowedDevOrigins: ['local-origin.dev', '*.local-origin.dev'],

  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'riyan.com.mv',
      },
      {
        protocol: 'http',
        hostname: 'riyan.com.mv',
      },
      {
        protocol: 'https',
        hostname: 'res.hals.io',
      },

    ],

  },
};

export default nextConfig;
