import { expect, test } from "./fixtures";

test("creates task with optional sub-tasks from the form", async ({
  vulcanPage,
}) => {
  const title = `Parent ST ${Date.now()}`;
  await vulcanPage.addTask(title, 1, "Not started", {
    subtaskTitles: ["Step one", "Step two"],
  });

  await vulcanPage.expandSubtasks(title);
  await vulcanPage.expectSubtasksPanelVisible(title);
  await expect(
    vulcanPage.subtaskRowByText(title, "Step one").locator(".subtask-title-text"),
  ).toBeVisible();
  await expect(
    vulcanPage.subtaskRowByText(title, "Step two").locator(".subtask-title-text"),
  ).toBeVisible();
});

test("sub-tasks section starts collapsed", async ({ vulcanPage }) => {
  const title = `Collapsed ${Date.now()}`;
  await vulcanPage.addTask(title, 1);
  await vulcanPage.expectSubtasksPanelHidden(title);
});

test("adds, edits, and deletes sub-tasks on an existing task", async ({
  vulcanPage,
}) => {
  const title = `Sub CRUD ${Date.now()}`;
  await vulcanPage.addTask(title, 1);

  await vulcanPage.expandSubtasks(title);
  const panel = vulcanPage.subtasksPanelForTask(title);
  await panel.locator(".add-subtask-input").fill("New sub");
  await panel.getByRole("button", { name: "Add" }).click();

  await expect(
    vulcanPage.subtaskRowByText(title, "New sub").locator(".subtask-title-text"),
  ).toBeVisible();

  await vulcanPage
    .subtaskRowByText(title, "New sub")
    .locator(".subtask-edit-toggle")
    .click();
  await vulcanPage
    .subtaskRowByText(title, "New sub")
    .locator(".subtask-title-input")
    .fill("Renamed sub");
  await vulcanPage
    .subtaskRowByText(title, "New sub")
    .locator(".subtask-save")
    .click();

  await expect(
    vulcanPage.subtaskRowByText(title, "Renamed sub").locator(".subtask-title-text"),
  ).toBeVisible();

  await vulcanPage
    .subtaskRowByText(title, "Renamed sub")
    .getByRole("button", { name: "Delete" })
    .click();
  await expect(vulcanPage.subtaskRowByText(title, "Renamed sub")).toHaveCount(0);
});

test("reorders sub-tasks with drag and drop", async ({ vulcanPage }) => {
  const title = `Sub reorder ${Date.now()}`;
  await vulcanPage.addTask(title, 1, "Not started", {
    subtaskTitles: ["Alpha", "Beta"],
  });

  await vulcanPage.expandSubtasks(title);
  await vulcanPage
    .subtaskDragHandle(title, "Beta")
    .dragTo(vulcanPage.subtaskRowByText(title, "Alpha"));

  const rows = vulcanPage.subtasksPanelForTask(title).locator(".subtask-row");
  await expect(rows.nth(0).locator(".subtask-title-text")).toHaveText("Beta");
  await expect(rows.nth(1).locator(".subtask-title-text")).toHaveText("Alpha");

  await vulcanPage.page.reload();
  await vulcanPage.expectLoaded();
  await vulcanPage.expandSubtasks(title);
  const rowsAfter = vulcanPage.subtasksPanelForTask(title).locator(".subtask-row");
  await expect(rowsAfter.nth(0).locator(".subtask-title-text")).toHaveText("Beta");
  await expect(rowsAfter.nth(1).locator(".subtask-title-text")).toHaveText("Alpha");
});

test("toggle collapses and expands sub-tasks", async ({ vulcanPage }) => {
  const title = `Toggle ${Date.now()}`;
  await vulcanPage.addTask(title, 1, "Not started", {
    subtaskTitles: ["Only one"],
  });

  await vulcanPage.expandSubtasks(title);
  await vulcanPage.expectSubtasksPanelVisible(title);
  await vulcanPage.subtasksToggleForTask(title).click();
  await vulcanPage.expectSubtasksPanelHidden(title);
  await vulcanPage.subtasksToggleForTask(title).click();
  await vulcanPage.expectSubtasksPanelVisible(title);
});
