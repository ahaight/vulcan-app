import { test } from "./fixtures";

test("adding a task as Done immediately adds points to daily score", async ({
  vulcanPage,
}) => {
  const title = `Pre-done ${Date.now()}`;
  await vulcanPage.addTask(title, 6, "Done");
  await vulcanPage.expectDailyScore(6);
  await vulcanPage.expectTaskVisible(title);
  await vulcanPage.expectStatusForTask(title, "Done");
});

test("In progress tasks do not contribute to daily score", async ({
  vulcanPage,
}) => {
  await vulcanPage.addTask(`IP ${Date.now()}`, 99, "In progress");
  await vulcanPage.expectDailyScore(0);
});

test("multiple Done tasks sum in daily score", async ({ vulcanPage }) => {
  const t = Date.now();
  await vulcanPage.addTask(`D1 ${t}`, 2, "Done");
  await vulcanPage.addTask(`D2 ${t}`, 5, "Done");
  await vulcanPage.expectDailyScore(7);
});

test("changing status away from Done reduces score", async ({
  vulcanPage,
}) => {
  const title = `Revert ${Date.now()}`;
  await vulcanPage.addTask(title, 4, "Done");
  await vulcanPage.expectDailyScore(4);
  await vulcanPage.setTaskStatus(title, "Not started");
  await vulcanPage.expectDailyScore(0);
});
