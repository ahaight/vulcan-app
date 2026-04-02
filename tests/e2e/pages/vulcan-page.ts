import { expect, type Locator, type Page } from "@playwright/test";

export type TodoCategory =
  | "Work"
  | "Personal"
  | "Housework"
  | "Health"
  | "Shopping"
  | "Errands"
  | "Other";

export type TodoPriority = "High" | "Medium" | "Low";

export type TodoEffort = "Quick" | "Medium" | "Deep";

export class VulcanPage {
  readonly page: Page;
  readonly titleInput: Locator;
  readonly effortSelect: Locator;
  readonly newCategorySelect: Locator;
  readonly newPrioritySelect: Locator;
  readonly addNewSubtaskRowButton: Locator;
  readonly newSubtaskRows: Locator;
  readonly addTaskButton: Locator;
  readonly dailyScore: Locator;
  readonly datePicker: Locator;
  readonly todayButton: Locator;
  readonly filterSelect: Locator;
  readonly categoryFilterSelect: Locator;
  readonly priorityFilterSelect: Locator;
  readonly sortSelect: Locator;
  readonly editModal: Locator;
  readonly editTitleInput: Locator;
  readonly editEffortSelect: Locator;
  readonly editCategorySelect: Locator;
  readonly editPrioritySelect: Locator;
  readonly editStatusSelect: Locator;
  readonly editSaveButton: Locator;
  readonly editCancelButton: Locator;
  readonly deleteModal: Locator;
  readonly deleteConfirmButton: Locator;
  readonly deleteCancelButton: Locator;
  readonly formError: Locator;
  readonly editError: Locator;
  readonly todoItems: Locator;
  readonly todoList: Locator;

  constructor(page: Page) {
    this.page = page;
    this.titleInput = page.locator("#title-input");
    this.effortSelect = page.locator("#effort-select");
    this.newCategorySelect = page.locator("#new-category-select");
    this.newPrioritySelect = page.locator("#new-priority-select");
    this.addNewSubtaskRowButton = page.locator("#add-new-subtask-row");
    this.newSubtaskRows = page.locator("#new-subtask-rows");
    this.addTaskButton = page.getByRole("button", { name: "Add Task" });
    this.dailyScore = page.locator("#daily-score");
    this.datePicker = page.locator("#date-picker");
    this.todayButton = page.locator("#jump-today-button");
    this.filterSelect = page.locator("#filter-select");
    this.categoryFilterSelect = page.locator("#category-filter-select");
    this.priorityFilterSelect = page.locator("#priority-filter-select");
    this.sortSelect = page.locator("#sort-select");
    this.editModal = page.locator("#edit-modal");
    this.editTitleInput = page.locator("#edit-title-input");
    this.editEffortSelect = page.locator("#edit-effort-select");
    this.editCategorySelect = page.locator("#edit-category-select");
    this.editPrioritySelect = page.locator("#edit-priority-select");
    this.editStatusSelect = page.locator("#edit-status-select");
    this.editSaveButton = page.locator("#edit-save-button");
    this.editCancelButton = page.locator("#edit-cancel-button");
    this.deleteModal = page.locator("#delete-modal");
    this.deleteConfirmButton = page.locator("#delete-confirm-button");
    this.deleteCancelButton = page.locator("#delete-cancel-button");
    this.formError = page.locator("#form-error");
    this.editError = page.locator("#edit-error");
    this.todoItems = page.locator(".todo-item");
    this.todoList = page.locator("#todo-list");
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
    effort: TodoEffort,
    status: "Not started" | "In progress" | "Done" = "Not started",
    options?: {
      category?: TodoCategory;
      priority?: TodoPriority;
      subtaskTitles?: string[];
    },
  ): Promise<void> {
    await this.titleInput.fill(title);
    await this.effortSelect.selectOption(effort);
    if (options?.category) {
      await this.newCategorySelect.selectOption(options.category);
    }
    if (options?.priority) {
      await this.newPrioritySelect.selectOption(options.priority);
    }
    if (options?.subtaskTitles?.length) {
      for (let i = 0; i < options.subtaskTitles.length; i += 1) {
        await this.addNewSubtaskRowButton.click();
        const row = this.newSubtaskRows.locator(".new-subtask-row").nth(i);
        await row.locator(".new-subtask-title").fill(options.subtaskTitles[i]!);
      }
    }
    await this.addTaskButton.click();
    await this.expectTaskVisible(title);
    if (status !== "Not started") {
      await this.setTaskStatus(title, status);
    }
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

  async saveEditTask(input: {
    title?: string;
    effort?: TodoEffort;
    category?: TodoCategory;
    priority?: TodoPriority;
    status?: "Not started" | "In progress" | "Done";
  }): Promise<void> {
    if (input.title !== undefined) {
      await this.editTitleInput.fill(input.title);
    }
    if (input.effort !== undefined) {
      await this.editEffortSelect.selectOption(input.effort);
    }
    if (input.category !== undefined) {
      await this.editCategorySelect.selectOption(input.category);
    }
    if (input.priority !== undefined) {
      await this.editPrioritySelect.selectOption(input.priority);
    }
    if (input.status !== undefined) {
      await this.editStatusSelect.selectOption(input.status);
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
    await this.clickEditTask(title);
    await this.expectEditModalVisible();
    await this.editStatusSelect.selectOption(status);
    await this.editSaveButton.click();
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

  async setCategoryFilter(value: "all" | TodoCategory): Promise<void> {
    await this.categoryFilterSelect.selectOption(value);
  }

  async setPriorityFilter(value: "all" | TodoPriority): Promise<void> {
    await this.priorityFilterSelect.selectOption(value);
  }

  async setSort(
    value:
      | "manual"
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
    await expect(this.todoItemByTitle(title).locator(".todo-meta")).toContainText(status);
  }

  async expectTaskShowsCategoryAndPriority(
    title: string,
    category: TodoCategory,
    priority: TodoPriority,
  ): Promise<void> {
    const meta = this.todoItemByTitle(title).locator(".todo-meta");
    await expect(meta).toContainText(category);
    await expect(meta).toContainText(priority);
  }

  subtasksToggleForTask(title: string): Locator {
    return this.todoItemByTitle(title).locator(".subtasks-toggle");
  }

  subtasksPanelForTask(title: string): Locator {
    return this.todoItemByTitle(title).locator(".subtasks-panel");
  }

  async expandSubtasks(title: string): Promise<void> {
    const toggle = this.subtasksToggleForTask(title);
    if ((await toggle.getAttribute("aria-expanded")) === "true") {
      return;
    }
    await toggle.click();
  }

  async expectSubtasksPanelHidden(title: string): Promise<void> {
    await expect(this.subtasksPanelForTask(title)).toHaveClass(/hidden/);
  }

  async expectSubtasksPanelVisible(title: string): Promise<void> {
    await expect(this.subtasksPanelForTask(title)).not.toHaveClass(/hidden/);
  }

  subtaskRowByText(taskTitle: string, subtaskText: string): Locator {
    return this.todoItemByTitle(taskTitle).locator(".subtask-row", {
      hasText: subtaskText,
    });
  }

  taskDragHandle(title: string): Locator {
    return this.todoItemByTitle(title).locator(".drag-handle[draggable='true']");
  }

  subtaskDragHandle(taskTitle: string, subtaskText: string): Locator {
    return this.subtaskRowByText(taskTitle, subtaskText).locator(".subtask-drag-handle");
  }

}
