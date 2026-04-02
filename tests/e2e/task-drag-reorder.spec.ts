import { expect, test } from "./fixtures";

test("reorders tasks with drag and drop in custom order sort", async ({
  vulcanPage,
}) => {
  const t = Date.now();
  const firstTitle = `Drag A ${t}`;
  const secondTitle = `Drag B ${t}`;

  await vulcanPage.setSort("manual");
  await vulcanPage.addTask(firstTitle, "Quick");
  await vulcanPage.addTask(secondTitle, "Quick");

  await expect(vulcanPage.todoItems.nth(0).locator(".todo-title")).toHaveText(
    firstTitle,
  );
  await expect(vulcanPage.todoItems.nth(1).locator(".todo-title")).toHaveText(
    secondTitle,
  );

  await vulcanPage
    .taskDragHandle(secondTitle)
    .dragTo(vulcanPage.todoItemByTitle(firstTitle));

  await expect(vulcanPage.todoItems.nth(0).locator(".todo-title")).toHaveText(
    secondTitle,
  );
  await expect(vulcanPage.todoItems.nth(1).locator(".todo-title")).toHaveText(
    firstTitle,
  );

  await vulcanPage.page.reload();
  await vulcanPage.expectLoaded();
  await vulcanPage.setSort("manual");

  await expect(vulcanPage.todoItems.nth(0).locator(".todo-title")).toHaveText(
    secondTitle,
  );
  await expect(vulcanPage.todoItems.nth(1).locator(".todo-title")).toHaveText(
    firstTitle,
  );
});

test("dragging the first task onto the second moves it below (swap two tasks)", async ({
  vulcanPage,
}) => {
  const t = Date.now();
  const topTitle = `Top ${t}`;
  const bottomTitle = `Bottom ${t}`;

  await vulcanPage.setSort("manual");
  await vulcanPage.addTask(topTitle, "Quick");
  await vulcanPage.addTask(bottomTitle, "Quick");

  await vulcanPage.taskDragHandle(topTitle).dragTo(vulcanPage.todoItemByTitle(bottomTitle));

  await expect(vulcanPage.todoItems.nth(0).locator(".todo-title")).toHaveText(bottomTitle);
  await expect(vulcanPage.todoItems.nth(1).locator(".todo-title")).toHaveText(topTitle);
});

test("drag handles are disabled when sort is not custom order", async ({
  vulcanPage,
}) => {
  const title = `No drag ${Date.now()}`;
  await vulcanPage.addTask(title, "Quick");
  await vulcanPage.setSort("effort-asc");
  await expect(
    vulcanPage.todoItemByTitle(title).locator(".drag-handle[draggable='true']"),
  ).toHaveCount(0);
  await expect(
    vulcanPage.todoItemByTitle(title).locator(".drag-handle--disabled"),
  ).toBeVisible();
});
