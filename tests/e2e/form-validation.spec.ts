import { test } from "./fixtures";

test("add task form shows error when title is only whitespace", async ({
  vulcanPage,
}) => {
  await vulcanPage.titleInput.fill("   ");
  await vulcanPage.pointsInput.fill("1");
  await vulcanPage.submitAddTaskForm();
  await vulcanPage.expectFormError("Task title is required.");
  await vulcanPage.expectTodoItemCount(0);
});

test("add task form shows error for negative points", async ({
  vulcanPage,
  page,
}) => {
  await page.locator("#todo-form").evaluate((form) => {
    form.setAttribute("novalidate", "");
  });
  await vulcanPage.titleInput.fill(`Valid title ${Date.now()}`);
  await vulcanPage.setPointsInputValueRaw("-1");
  await vulcanPage.submitAddTaskForm();
  await vulcanPage.expectFormError("Points must be zero or greater.");
  await vulcanPage.expectTodoItemCount(0);
});
