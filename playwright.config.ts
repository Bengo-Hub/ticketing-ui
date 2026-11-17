import { defineConfig, devices } from "@playwright/test";

/**
 * The five Fix requirements of the ticketing revamp, at phone (390 px) and desktop (1280 px)
 * widths. Every API call is answered by the stateful mock in e2e/mocks.ts (page.route), so no
 * backend is needed.
 *
 * Locally (no BASE_URL) Playwright runs `pnpm start` on port 3011; build first with `pnpm build`.
 * `pnpm dev` uses 3000, the port the SSO dev redirect is registered for, so the test server never
 * reuses a dev server of this or another app. With BASE_URL set no server starts.
 */
const base = process.env.BASE_URL || "http://localhost:3011";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Two workers keep the run light on a shared build machine.
  workers: 2,
  reporter: [["list"], ["html", { outputFolder: "playwright-report", open: "never" }]],
  outputDir: "test-results",
  use: { baseURL: base, trace: "on-first-retry", screenshot: "only-on-failure" },
  projects: [
    { name: "phone", use: { ...devices["Pixel 7"], viewport: { width: 390, height: 844 } } },
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } } },
  ],
  webServer: process.env.BASE_URL
    ? undefined
    : { command: "pnpm start -p 3011", url: base, reuseExistingServer: true, timeout: 120_000 },
  timeout: 30_000,
});
