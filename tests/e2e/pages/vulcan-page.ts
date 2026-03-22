import { expect, type Locator, type Page } from "@playwright/test";

export class VulcanPage {
  readonly page: Page;
  readonly titleInput: Locator;
  readonly pointsInput: Locator;
  readonly newStatusSelect: Locator;
  readonly addTaskButton: Locator;
  readonly dailyScore: Locator;
  readonly datePicker: Locator;
  readonly todayButton: Locator;
  readonly filterSelect: Locator;
  readonly sortSelect: Locator;
  readonly editModal: Locator;
  readonly editTitleInput: Locator;
  readonly editPointsInput: Locator;
  readonly editSaveButton: Locator;
  readonly editCancelButton: Locator;
  readonly deleteModal: Locator;
  readonly deleteConfirmButton: Locator;
  readonly deleteCancelButton: Locator;
  readonly formError: Locator;
  readonly editError: Locator;
  readonly todoItems: Locator;

  constructor(page: Page) {
    this.page = page;
    this.titleInput = page.locator("#title-input");
    this.pointsInput = page.locator("#points-input");
    this.newStatusSelect = page.locator("#new-status-select");
    this.addTaskButton = page.getByRole("button", { name: "Add Task" });
    this.dailyScore = page.locator("#daily-score");
    this.datePicker = page.locator("#date-picker");
    this.todayButton = page.locator("#jump-today-button");
    this.filterSelect = page.locator("#filter-select");
    this.sortSelect = page.locator("#sort-select");
    this.editModal = page.locator("#edit-modal");
    this.editTitleInput = page.locator("#edit-title-input");
    this.editPointsInput = page.locator("#edit-points-input");
    this.editSaveButton = page.locator("#edit-save-button");
    this.editCancelButton = page.locator("#edit-cancel-button");
    this.deleteModal = page.locator("#delete-modal");
    this.deleteConfirmButton = page.locator("#delete-confirm-button");
    this.deleteCancelButton = page.locator("#delete-cancel-button");
    this.formError = page.locator("#form-error");
    this.editError = page.locator("#edit-error");
    this.todoItems = page.locator(".todo-item");
  }

  async goto(): Promise<void> {
    await this.page.goto("/");
  }

  async setupFreshState(): Promise<void> {
    await this.goto();
    await this.clearStorageAndReload();
    await this.expectLoaded();
  }

  async cleanupData(): Promise<void> {
    await this.page.evaluate(() => localStorage.clear());
  }

  async clearStorageAndReload(): Promise<void> {
    await this.page.evaluate(() => localStorage.clear());
    await this.page.reload();
  }

  async expectLoaded(): Promise<void> {
    await expect(this.page.getByRole("heading", { name: "Vulcan" })).toBeVisible();
    await expect(this.page.getByText("Daily Score")).toBeVisible();
  }

  async addTask(
    title: string,
    points: number,
    status: "Not started" | "In progress" | "Done" = "Not started",
  ): Promise<void> {
    await this.titleInput.fill(title);
    await this.pointsInput.fill(String(points));
    await this.newStatusSelect.selectOption(status);
    await this.addTaskButton.click();
  }

  todoItemByTitle(title: string): Locator {
    return this.page.locator(".todo-item", { hasText: title });
  }

  async expectTaskVisible(title: string): Promise<void> {
    await expect(this.page.locator(".todo-title", { hasText: title })).toBeVisible();
  }

  async expectTaskNotVisible(title: string): Promise<void> {
    await expect(this.page.locator(".todo-title", { hasText: title })).toHaveCount(0);
  }

  async clickEditTask(title: string): Promise<void> {
    await this.todoItemByTitle(title).locator(".edit-button").click();
  }

  async clickDeleteTask(title: string): Promise<void> {
    await this.todoItemByTitle(title).locator(".delete-button").click();
  }

  async expectEditModalVisible(): Promise<void> {
    await expect(this.editModal).toBeVisible();
  }

  async saveEditTask(input: { title?: string; points?: number }): Promise<void> {
    if (input.title !== undefined) {
      await this.editTitleInput.fill(input.title);
    }
    if (input.points !== undefined) {
      await this.editPointsInput.fill(String(input.points));
    }
    await this.editSaveButton.click();
  }

  async cancelEditTask(): Promise<void> {
    await this.editCancelButton.click();
  }

  async expectDeleteModalVisible(): Promise<void> {
    await expect(this.deleteModal).toBeVisible();
  }

  async confirmDeleteTask(): Promise<void> {
    await this.deleteConfirmButton.click();
  }

  async cancelDeleteTask(): Promise<void> {
    await this.deleteCancelButton.click();
  }

  async setTaskStatus(
    title: string,
    status: "Not started" | "In progress" | "Done",
  ): Promise<void> {
    await this.todoItemByTitle(title).locator(".status-select").selectOption(status);
  }

  async expectDailyScore(score: number): Promise<void> {
    await expect(this.dailyScore).toHaveText(String(score));
  }

  async setDate(dateKey: string): Promise<void> {
    await this.datePicker.fill(dateKey);
    await this.datePicker.dispatchEvent("change");
  }

  async goToToday(): Promise<void> {
    await this.todayButton.click();
  }

  async setFilter(
    value: "all" | "Not started" | "In progress" | "Done",
  ): Promise<void> {
    await this.filterSelect.selectOption(value);
  }

  async setSort(
    value:
      | "created-desc"
      | "created-asc"
      | "points-desc"
      | "status",
  ): Promise<void> {
    await this.sortSelect.selectOption(value);
  }

  async expectFormError(message: string): Promise<void> {
    await expect(this.formError).toHaveText(message);
  }

  async expectEditError(message: string): Promise<void> {
    await expect(this.editError).toHaveText(message);
  }

  async submitAddTaskForm(): Promise<void> {
    await this.addTaskButton.click();
  }

  async expectTodoItemCount(count: number): Promise<void> {
    await expect(this.todoItems).toHaveCount(count);
  }

  async firstTodoTitle(): Promise<string | null> {
    const first = this.page.locator(".todo-item").first().locator(".todo-title");
    return first.textContent();
  }

  async expectStatusForTask(
    title: string,
    status: "Not started" | "In progress" | "Done",
  ): Promise<void> {
    await expect(
      this.todoItemByTitle(title).locator(".status-select"),
    ).toHaveValue(status);
  }

  /** Sets points input value directly (for testing app validation; avoids browser number clamp). */
  async setPointsInputValueRaw(value: string): Promise<void> {
    await this.pointsInput.evaluate((el, v) => {
      (el as HTMLInputElement).value = v;
    }, value);
  }

  async setEditPointsInputValueRaw(value: string): Promise<void> {
    await this.editPointsInput.evaluate((el, v) => {
      (el as HTMLInputElement).value = v;
    }, value);
  }
}
