import { defineConfig, devices } from "@playwright/test";

/**
 * Set BASE_URL env var to point at the app under test.
 * When BASE_URL is localhost the runner expects the dev server to already be running.
 */
export default defineConfig({
  testDir: "./specs",
  timeout: 60_000,
  reporter: "list",
  use: {
    baseURL: process.env.BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
