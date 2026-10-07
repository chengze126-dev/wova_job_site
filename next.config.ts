import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  poweredByHeader: false,
  compress: true,
  outputFileTracingExcludes: {
    "/*": ["./public/uploads/**/*", "./data/**/*", "./.git/**/*"],
  },
  serverExternalPackages: ["node:sqlite", "node:vm", "@libsql/client"],
  optimizePackageImports: ["lucide-react"],
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
    qualities: [70, 75, 90],
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "40mb",
      allowedOrigins: ["www.wova.cc", "wova.cc", "*.vercel.app"],
    },
  },
};

export default nextConfig;
