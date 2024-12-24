import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    // Add fallback for node modules
    config.resolve = {
      ...config.resolve,
      fallback: {
        ...config.resolve?.fallback,
        "webworker-threads": false,
      },
    };
    return config;
  },
};

export default nextConfig;
