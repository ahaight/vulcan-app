import { test } from "./fixtures";

test("keeps tasks isolated by date and persists on reload", async ({
  vulcanPage,
  page,
}) => {
  const todayTask = `Today task ${Date.now()}`;
  await vulcanPage.addTask(todayTask, 3);
  await vulcanPage.expectTaskVisible(todayTask);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowKey = tomorrow.toISOString().slice(0, 10);

  await vulcanPage.setDate(tomorrowKey);
  await vulcanPage.expectTaskNotVisible(todayTask);

  const tomorrowTask = `Tomorrow task ${Date.now()}`;
  await vulcanPage.addTask(tomorrowTask, 5);
  await vulcanPage.expectTaskVisible(tomorrowTask);

  await page.reload();
  await vulcanPage.setDate(tomorrowKey);
  await vulcanPage.expectTaskVisible(tomorrowTask);
  await vulcanPage.expectTaskNotVisible(todayTask);

  await vulcanPage.goToToday();
  await vulcanPage.expectTaskVisible(todayTask);
  await vulcanPage.expectTaskNotVisible(tomorrowTask);
});
