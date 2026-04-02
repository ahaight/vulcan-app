import { test } from "./fixtures";

test("add task form shows error when title is empty", async ({
  vulcanPage,
  page,
}) => {
  await page.locator("#todo-form").evaluate((form) => {
    form.setAttribute("novalidate", "");
  });
  await vulcanPage.titleInput.fill("");
  await vulcanPage.submitAddTaskForm();
  await vulcanPage.expectFormError("Task title is required.");
  await vulcanPage.expectTodoItemCount(0);
});

