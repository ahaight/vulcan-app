import { test } from "./fixtures";

test("adding a task as Done immediately adds points to daily score", async ({
  vulcanPage,
}) => {
  const title = `Pre-done ${Date.now()}`;
  await vulcanPage.addTask(title, "Medium", "Done");
  await vulcanPage.expectDailyScore(15);
  await vulcanPage.expectTaskVisible(title);
  await vulcanPage.expectStatusForTask(title, "Done");
});

test("In progress tasks do not contribute to daily score", async ({
  vulcanPage,
}) => {
  await vulcanPage.addTask(`IP ${Date.now()}`, "Deep", "In progress");
  await vulcanPage.expectDailyScore(0);
});

test("multiple Done tasks sum in daily score", async ({ vulcanPage }) => {
  const t = Date.now();
  await vulcanPage.addTask(`D1 ${t}`, "Quick", "Done");
  await vulcanPage.addTask(`D2 ${t}`, "Medium", "Done");
  await vulcanPage.expectDailyScore(20);
});

test("changing status away from Done reduces score", async ({
  vulcanPage,
}) => {
  const title = `Revert ${Date.now()}`;
  await vulcanPage.addTask(title, "Quick", "Done");
  await vulcanPage.expectDailyScore(5);
  await vulcanPage.setTaskStatus(title, "Not started");
  await vulcanPage.expectDailyScore(0);
});
