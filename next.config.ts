import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    skipWaiting: false,
    clientsClaim: true,
  },
});

// Standalone output is only needed in Docker/CI production builds.
// On Windows dev machines it fails with EPERM symlink errors.
// Set NEXT_STANDALONE=true to enable (done automatically in Dockerfile).
const nextConfig: NextConfig = {
  ...(process.env.NEXT_STANDALONE === "true" && { output: "standalone" as const }),
  turbopack: {},
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ticketingapi.codevertexitsolutions.com",
      },
      {
        protocol: "https",
        hostname: "sso.codevertexitsolutions.com",
      },
      {
        protocol: "https",
        hostname: "accounts.codevertexitsolutions.com",
      },
    ],
  },
};

export default withPWA(nextConfig);
