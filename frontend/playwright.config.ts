import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: [["list"], ["html", { outputFolder: "playwright-report", open: "never" }]],

  use: {
    baseURL:    "http://localhost:3000",
    trace:      "retain-on-failure",
    screenshot: "only-on-failure",
    video:      "retain-on-failure",
    headless:   true,
  },

  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } }
  ],

  webServer: {
    command:             "npm run dev",
    url:                 "http://localhost:3000",
    reuseExistingServer: true,
    timeout:             60_000,
  },
});
