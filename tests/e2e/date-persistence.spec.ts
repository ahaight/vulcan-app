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

test("keeps tasks isolated by date and persists on reload", async ({ page }) => {
  const vulcan = new VulcanPage(page);

  const todayTask = `Today task ${Date.now()}`;
  await vulcan.addTask(todayTask, 3);
  await vulcan.expectTaskVisible(todayTask);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowKey = tomorrow.toISOString().slice(0, 10);

  await vulcan.setDate(tomorrowKey);
  await vulcan.expectTaskNotVisible(todayTask);

  const tomorrowTask = `Tomorrow task ${Date.now()}`;
  await vulcan.addTask(tomorrowTask, 5);
  await vulcan.expectTaskVisible(tomorrowTask);

  await page.reload();
  await vulcan.setDate(tomorrowKey);
  await vulcan.expectTaskVisible(tomorrowTask);
  await vulcan.expectTaskNotVisible(todayTask);

  await vulcan.goToToday();
  await vulcan.expectTaskVisible(todayTask);
  await vulcan.expectTaskNotVisible(tomorrowTask);
});
