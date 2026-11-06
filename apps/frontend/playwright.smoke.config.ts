import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/smoke",
  fullyParallel: false,
  retries: 1,
  timeout: 45_000,
  use: {
    baseURL: process.env.SMOKE_BASE_URL || "https://nicelist.co",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
