import { test } from "./fixtures";

test("add task form shows error when title is only whitespace", async ({
  vulcanPage,
}) => {
  await vulcanPage.titleInput.fill("   ");
  await vulcanPage.submitAddTaskForm();
  await vulcanPage.expectFormError("Task title is required.");
  await vulcanPage.expectTodoItemCount(0);
});
