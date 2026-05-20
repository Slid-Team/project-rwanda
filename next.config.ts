import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
        pathname: '/ondoprotocol/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.ondo.finance',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
