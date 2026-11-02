import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "umfuturoproximo.vercel.app",
          },
        ],
        destination: "https://umfuturoproximo.com.br/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
