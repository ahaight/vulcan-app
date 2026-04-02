import { test } from "./fixtures";

test("edit modal shows error when title is only whitespace", async ({
  vulcanPage,
}) => {
  const title = `Edit val ${Date.now()}`;
  await vulcanPage.addTask(title, "Medium", "Not started");
  await vulcanPage.clickEditTask(title);
  await vulcanPage.expectEditModalVisible();
  await vulcanPage.editTitleInput.fill("   ");
  await vulcanPage.editSaveButton.click();
  await vulcanPage.expectEditError("Task title is required.");
});
