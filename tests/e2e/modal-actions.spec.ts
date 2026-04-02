import { test } from "./fixtures";

test("edit modal supports cancel and save", async ({ vulcanPage }) => {
  const originalTitle = `Original task ${Date.now()}`;
  await vulcanPage.addTask(originalTitle, "Quick");
  await vulcanPage.expectTaskVisible(originalTitle);

  await vulcanPage.clickEditTask(originalTitle);
  await vulcanPage.expectEditModalVisible();
  await vulcanPage.cancelEditTask();

  await vulcanPage.expectTaskVisible(originalTitle);

  await vulcanPage.clickEditTask(originalTitle);
  await vulcanPage.expectEditModalVisible();
  const updatedTitle = `Updated task ${Date.now()}`;
  await vulcanPage.saveEditTask({ title: updatedTitle, effort: "Deep" });

  await vulcanPage.expectTaskVisible(updatedTitle);
  await vulcanPage.setTaskStatus(updatedTitle, "Done");
  await vulcanPage.expectDailyScore(30);
});

test("delete confirmation supports cancel and confirm", async ({
  vulcanPage,
}) => {
  const deleteTarget = `Delete target ${Date.now()}`;
  await vulcanPage.addTask(deleteTarget, "Quick");
  await vulcanPage.expectTaskVisible(deleteTarget);

  await vulcanPage.clickDeleteTask(deleteTarget);
  await vulcanPage.expectDeleteModalVisible();
  await vulcanPage.cancelDeleteTask();
  await vulcanPage.expectTaskVisible(deleteTarget);

  await vulcanPage.clickDeleteTask(deleteTarget);
  await vulcanPage.expectDeleteModalVisible();
  await vulcanPage.confirmDeleteTask();
  await vulcanPage.expectTaskNotVisible(deleteTarget);
});
