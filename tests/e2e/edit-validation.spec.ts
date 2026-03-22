import { test } from "./fixtures";

test("edit modal shows error when title is only whitespace", async ({
  vulcanPage,
}) => {
  const title = `Edit val ${Date.now()}`;
  await vulcanPage.addTask(title, 5, "Not started");
  await vulcanPage.clickEditTask(title);
  await vulcanPage.expectEditModalVisible();
  await vulcanPage.editTitleInput.fill("   ");
  await vulcanPage.editSaveButton.click();
  await vulcanPage.expectEditError("Task title is required.");
});

test("edit modal shows error for negative points", async ({
  vulcanPage,
  page,
}) => {
  const title = `Edit pts ${Date.now()}`;
  await vulcanPage.addTask(title, 3, "Not started");
  await vulcanPage.clickEditTask(title);
  await vulcanPage.expectEditModalVisible();
  await page.locator("#edit-form").evaluate((form) => {
    form.setAttribute("novalidate", "");
  });
  await vulcanPage.setEditPointsInputValueRaw("-2");
  await vulcanPage.editSaveButton.click();
  await vulcanPage.expectEditError("Points must be zero or greater.");
});
