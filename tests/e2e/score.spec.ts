import { test } from "@playwright/test";
import { VulcanPage } from "./pages/vulcan-page";

test.beforeEach(async ({ page }) => {
  const vulcan = new VulcanPage(page);
  await vulcan.setupFreshState();
});

test.afterEach(async ({ page }) => {
  const vulcan = new VulcanPage(page);
  await vulcan.cleanupData();
});

test("can add task and update score", async ({ page }) => {
  const vulcan = new VulcanPage(page);

  const uniqueTask = `Playwright task ${Date.now()}`;
  await vulcan.addTask(uniqueTask, 7);

  await vulcan.expectTaskVisible(uniqueTask);
  await vulcan.expectDailyScore(0);

  await vulcan.setTaskStatus(uniqueTask, "done");
  await vulcan.expectDailyScore(7);
});
