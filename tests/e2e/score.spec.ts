import { test } from "./fixtures";

test("can add task and update score", async ({ vulcanPage }) => {
  const uniqueTask = `Playwright task ${Date.now()}`;
  await vulcanPage.addTask(uniqueTask, "Deep");

  await vulcanPage.expectTaskVisible(uniqueTask);
  await vulcanPage.expectDailyScore(0);

  await vulcanPage.setTaskStatus(uniqueTask, "Done");
  await vulcanPage.expectDailyScore(30);
});
