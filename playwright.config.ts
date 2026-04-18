import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 180_000,
  expect: { timeout: 25_000 },
  use: {
    ...devices["Desktop Chrome"],
    locale: "en-US",
    trace: "retain-on-failure",
    video: "retain-on-failure",
  },
});
