import { test as base } from "@playwright/test";
import { VulcanPage } from "./pages/vulcan-page";

/**
 * Extended test with a `vulcanPage` fixture: fresh localStorage + loaded app before each test,
 * and storage cleared after each test. Import `test` (and `expect`) from this file instead of
 * `@playwright/test` in Vulcan E2E specs.
 */
export const test = base.extend<{ vulcanPage: VulcanPage }>({
  vulcanPage: async ({ page }, use) => {
    const vulcanPage = new VulcanPage(page);
    await vulcanPage.setupFreshState();
    await use(vulcanPage);
    await vulcanPage.cleanupData();
  },
});

export { expect } from "@playwright/test";
