import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.BASE_URL ?? "http://localhost:3000";

/**
 * Optional auto-start of the dev server.
 * Set WEB_SERVER_COMMAND and WEB_SERVER_CWD in your .env to enable.
 * When unset, the runner expects the app to already be running at BASE_URL.
 */
const webServer = process.env.WEB_SERVER_COMMAND
  ? {
      command: process.env.WEB_SERVER_COMMAND,
      url: baseURL,
      reuseExistingServer: true,
      timeout: 120_000,
      cwd: process.env.WEB_SERVER_CWD,
    }
  : undefined;

export default defineConfig({
  testDir: "./specs",
  timeout: 90_000,
  reporter: "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer,
});
