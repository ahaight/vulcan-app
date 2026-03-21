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

test("edit modal supports cancel and save", async ({ page }) => {
  const vulcan = new VulcanPage(page);
  const originalTitle = `Original task ${Date.now()}`;
  await vulcan.addTask(originalTitle, 3);
  await vulcan.expectTaskVisible(originalTitle);

  await vulcan.clickEditTask(originalTitle);
  await vulcan.expectEditModalVisible();
  await vulcan.cancelEditTask();

  await vulcan.expectTaskVisible(originalTitle);

  await vulcan.clickEditTask(originalTitle);
  await vulcan.expectEditModalVisible();
  const updatedTitle = `Updated task ${Date.now()}`;
  await vulcan.saveEditTask({ title: updatedTitle, points: 9 });

  await vulcan.expectTaskVisible(updatedTitle);
  await vulcan.setTaskStatus(updatedTitle, "done");
  await vulcan.expectDailyScore(9);
});

test("delete confirmation supports cancel and confirm", async ({ page }) => {
  const vulcan = new VulcanPage(page);
  const deleteTarget = `Delete target ${Date.now()}`;
  await vulcan.addTask(deleteTarget, 4);
  await vulcan.expectTaskVisible(deleteTarget);

  await vulcan.clickDeleteTask(deleteTarget);
  await vulcan.expectDeleteModalVisible();
  await vulcan.cancelDeleteTask();
  await vulcan.expectTaskVisible(deleteTarget);

  await vulcan.clickDeleteTask(deleteTarget);
  await vulcan.expectDeleteModalVisible();
  await vulcan.confirmDeleteTask();
  await vulcan.expectTaskNotVisible(deleteTarget);
});
