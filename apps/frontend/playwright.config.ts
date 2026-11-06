import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/integration",
  fullyParallel: false,
  retries: 0,
  timeout: 45_000,
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "pnpm build && node scripts/serve-export.mjs",
    url: "http://127.0.0.1:3100",
    reuseExistingServer: false,
    timeout: 180_000,
    env: {
      NEXT_PUBLIC_COGNITO_USER_POOL_ID: "us-east-1_fixture",
      NEXT_PUBLIC_COGNITO_APP_CLIENT_ID: "fixtureclientid123456",
      NEXT_PUBLIC_COGNITO_REGION: "us-east-1",
      NEXT_PUBLIC_APPSYNC_ENDPOINT:
        "https://fixture.appsync-api.us-east-1.amazonaws.com/graphql",
      NEXT_PUBLIC_APPSYNC_API_KEY: "da2-fixtureapikey",
      NEXT_PUBLIC_COGNITO_DOMAIN:
        "nicelist-fixture.auth.us-east-1.amazoncognito.com",
      NEXT_PUBLIC_OAUTH_REDIRECT_SIGN_IN: "http://127.0.0.1:3100/login",
      NEXT_PUBLIC_OAUTH_REDIRECT_SIGN_OUT: "http://127.0.0.1:3100/login",
      NEXT_PUBLIC_GTM_ID: "GTM-FIXTURE",
    },
  },
});
