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
  // Framing: the embeddable widget is the only page any site may frame. Every other route,
  // including the signed-in console, may be framed only by this app itself (clickjacking guard).
  // The lookahead keeps the two policies from both applying to the widget. The loader script is
  // cached briefly so a fix reaches every host site within the hour.
  async headers() {
    return [
      {
        source: "/support/widget",
        headers: [{ key: "Content-Security-Policy", value: "frame-ancestors *" }],
      },
      {
        source: "/((?!support/widget).*)",
        headers: [
          { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
      {
        source: "/widget.js",
        headers: [{ key: "Cache-Control", value: "public, max-age=3600" }],
      },
    ];
  },
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
