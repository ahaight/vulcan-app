import { defineConfig, devices } from "@playwright/test";

const runtimeEnv =
  typeof globalThis !== "undefined" && "process" in globalThis
    ? (globalThis as { process?: { env?: Record<string, string | undefined> } })
        .process?.env
    : undefined;

const isCI = Boolean(runtimeEnv?.CI);

function parseHeadlessToggle(value: string | undefined): boolean | undefined {
  if (value === undefined) {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();
  if (["false", "0", "no", "off"].includes(normalized)) {
    return false;
  }
  if (["true", "1", "yes", "on"].includes(normalized)) {
    return true;
  }
  return undefined;
}

const headlessOverride = parseHeadlessToggle(runtimeEnv?.PW_HEADLESS);
const headless = headlessOverride ?? false;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://127.0.0.1:4173",
    headless,
    screenshot: "on",
    video: "on",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 4173",
    port: 4173,
    reuseExistingServer: !isCI,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
