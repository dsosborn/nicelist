import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/ct",
  fullyParallel: false,
  retries: 0,
  timeout: 30_000,
  use: {
    baseURL: "http://127.0.0.1:6006",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command:
      "pnpm exec storybook build -o storybook-static --quiet && node scripts/serve-storybook.mjs",
    url: "http://127.0.0.1:6006",
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
