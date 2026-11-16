import type { NextConfig } from "next";

// Offline and caching come from the committed hand-written service worker at public/sw.js,
// registered by the shared OfflineBar. This is the maskani-ui setup: next-pwa ran only under
// webpack, so the Turbopack build shipped no worker at all, and no build step writes public/sw.js now.

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
        hostname: "ticketingapi.codevertexafrica.com",
      },
      {
        protocol: "https",
        hostname: "sso.codevertexafrica.com",
      },
      {
        protocol: "https",
        hostname: "accounts.codevertexafrica.com",
      },
    ],
  },
};

export default nextConfig;
