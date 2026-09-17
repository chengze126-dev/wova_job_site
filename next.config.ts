import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ["node:sqlite", "node:vm"],
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
    qualities: [75, 90],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
      allowedOrigins: ["www.wova.cc", "wova.cc", "*.vercel.app"],
    },
  },
};

export default nextConfig;
