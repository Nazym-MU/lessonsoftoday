import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    forceSwcTransforms: false,
  },
  webpack: (config, { isServer }) => {
    // Handle Node.js modules for client-side
    if (!isServer) {
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
      };
    }

    // Suppress the critical dependency warnings from Supabase realtime
    config.module = {
      ...config.module,
      exprContextCritical: false,
      unknownContextCritical: false,
    };

    return config;
  },
};

export default nextConfig;
