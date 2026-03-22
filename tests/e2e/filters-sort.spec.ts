import { expect, test } from "./fixtures";

test("filter shows only tasks matching selected status", async ({
  vulcanPage,
}) => {
  const t = Date.now();
  const notStartedTitle = `Filter NS ${t}`;
  const doneTitle = `Filter Done ${t}`;

  await vulcanPage.addTask(notStartedTitle, 1, "Not started");
  await vulcanPage.addTask(doneTitle, 2, "Done");

  await vulcanPage.setFilter("Done");
  await vulcanPage.expectTaskNotVisible(notStartedTitle);
  await vulcanPage.expectTaskVisible(doneTitle);
  await vulcanPage.expectTodoItemCount(1);

  await vulcanPage.setFilter("Not started");
  await vulcanPage.expectTaskVisible(notStartedTitle);
  await vulcanPage.expectTaskNotVisible(doneTitle);
  await vulcanPage.expectTodoItemCount(1);

  await vulcanPage.setFilter("all");
  await vulcanPage.expectTaskVisible(notStartedTitle);
  await vulcanPage.expectTaskVisible(doneTitle);
  await vulcanPage.expectTodoItemCount(2);
});

test("sort by points shows highest points first", async ({ vulcanPage }) => {
  const t = Date.now();
  const lowTitle = `Low pts ${t}`;
  const highTitle = `High pts ${t}`;

  await vulcanPage.addTask(lowTitle, 2, "Not started");
  await vulcanPage.addTask(highTitle, 10, "Not started");

  await vulcanPage.setSort("points-desc");
  const first = await vulcanPage.firstTodoTitle();
  expect(first).toBe(highTitle);

  await vulcanPage.setSort("created-asc");
  const firstOldest = await vulcanPage.firstTodoTitle();
  expect(firstOldest).toBe(lowTitle);
});
