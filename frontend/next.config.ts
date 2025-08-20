import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config: any, { isServer }: { isServer: boolean }) => {
    if (!isServer) {
      // Fallbacks for Node.js modules in the browser
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
        electron: false,
      };
    }
    return config;
  },
  // Disable webpack cache to avoid issues with dynamic imports
  experimental: {
    webpackBuildWorker: true,
  },
};

export default nextConfig;
