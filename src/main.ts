import "./style.css";
import { formatDateLabel, getTodayKey } from "./date";
import {
  addSubtaskToItem,
  addTodoItem,
  deleteSubtaskFromItem,
  deleteTodoItem,
  getDailyScore,
  reorderSubtasksOnItem,
  reorderTodoItemsByVisibleOrder,
  updateSubtaskOnItem,
  updateTodoItem,
} from "./state";
import { loadDailyTodos, saveDailyTodos } from "./storage";
import {
  isTodoCategory,
  isTodoPriority,
  isTodoStatus,
  TODO_CATEGORIES,
  TODO_PRIORITIES,
  TODO_STATUSES,
  type TodoItem,
} from "./types";

const THEME_STORAGE_KEY = "vulcan.theme";

function getStoredTheme(): "light" | "dark" | null {
  const raw = localStorage.getItem(THEME_STORAGE_KEY);
  return raw === "light" || raw === "dark" ? raw : null;
}

function applyTheme(theme: "light" | "dark", persist: boolean): void {
  document.documentElement.dataset.theme = theme;
  if (persist) {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }
}

function initTheme(): void {
  const stored = getStoredTheme();
  if (stored) {
    applyTheme(stored, false);
    return;
  }
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  applyTheme(prefersDark ? "dark" : "light", false);
}

function syncThemeToggleButton(button: HTMLButtonElement): void {
  const dark = document.documentElement.dataset.theme === "dark";
  button.setAttribute("aria-checked", dark ? "true" : "false");
  button.setAttribute(
    "aria-label",
    dark ? "Dark theme is on. Switch to light theme." : "Light theme is on. Switch to dark theme.",
  );
  const label = button.querySelector(".theme-toggle__text");
  if (label) {
    label.textContent = dark ? "Dark" : "Light";
  }
}

initTheme();

const todayKey = getTodayKey();
let activeDateKey = todayKey;
let dailyState = loadDailyTodos(activeDateKey);
let statusFilter: "all" | (typeof TODO_STATUSES)[number] = "all";
let categoryFilter: "all" | (typeof TODO_CATEGORIES)[number] = "all";
let priorityFilter: "all" | (typeof TODO_PRIORITIES)[number] = "all";
let sortMode:
  | "manual"
  | "created-desc"
  | "created-asc"
  | "points-desc"
  | "status" = "manual";
let editingItemId: string | null = null;
let deletingItemId: string | null = null;
const expandedTaskIds = new Set<string>();
let draggedTodoId: string | null = null;
let draggedSubtask: { itemId: string; subtaskId: string } | null = null;

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("App root not found.");
}

app.innerHTML = `
  <main class="app-shell">
    <div class="theme-bar" aria-label="Display theme">
      <span class="theme-bar__label" id="theme-description">Appearance</span>
      <button type="button" id="theme-toggle" class="theme-toggle" role="switch" aria-checked="false" aria-labelledby="theme-description">
        <span class="theme-toggle__track" aria-hidden="true">
          <span class="theme-toggle__thumb" aria-hidden="true"></span>
        </span>
        <span class="theme-toggle__text">Light</span>
      </button>
    </div>
    <section class="card card--brand" aria-label="Branding and daily score">
      <div class="brand-block">
        <p class="brand-eyebrow">Daily to-do</p>
        <h1 class="brand-name">Vulcan</h1>
        <p class="date-label" id="date-label"></p>
      </div>
      <section class="score-card" aria-label="Daily score">
        <p class="score-label">Daily Score</p>
        <p class="score-value" id="daily-score">0</p>
      </section>
    </section>

    <section class="card card--controls" aria-label="Date, filters, and new task">
      <div class="controls-stack">
        <div class="controls-grid controls-grid--date">
          <label class="field">
            <span>Date</span>
            <input id="date-picker" type="date" />
          </label>
          <div class="field field--today">
            <span class="field-label-spacer" aria-hidden="true">Date</span>
            <button id="jump-today-button" type="button" class="secondary-button secondary-button--today">Today</button>
          </div>
        </div>
        <form id="todo-form" class="controls-form">
        <div class="controls-grid controls-grid--task-row">
          <label class="field field--task">
            <span>Task</span>
            <input id="title-input" name="title" type="text" placeholder="Enter a task for today" maxlength="120" required />
          </label>
          <label class="field field--points">
            <span>Points</span>
            <input id="points-input" name="points" type="number" value="1" min="0" step="1" required />
          </label>
          <label class="field field--category">
            <span>Category</span>
            <select id="new-category-select" class="app-select">
              ${TODO_CATEGORIES.map(
                (cat) =>
                  `<option value="${cat}" ${cat === "Other" ? "selected" : ""}>${cat}</option>`,
              ).join("")}
            </select>
          </label>
          <label class="field field--priority">
            <span>Priority</span>
            <select id="new-priority-select" class="app-select">
              ${TODO_PRIORITIES.map(
                (p) =>
                  `<option value="${p}" ${p === "Medium" ? "selected" : ""}>${p}</option>`,
              ).join("")}
            </select>
          </label>
          <div class="field field--submit">
            <span class="field-label-spacer" aria-hidden="true">Add</span>
            <button type="submit" class="add-button">Add Task</button>
          </div>
        </div>
        <div class="subtasks-new-block">
          <div class="subtasks-new-header">
            <span class="subtasks-new-label">Sub-tasks (optional)</span>
            <button type="button" id="add-new-subtask-row" class="secondary-button secondary-button--compact">Add line</button>
          </div>
          <div id="new-subtask-rows" class="new-subtask-rows" aria-label="New sub-tasks"></div>
        </div>
        <p id="form-error" class="form-error" role="alert" aria-live="polite"></p>
        </form>
      </div>
    </section>

    <section id="tasks-section" class="card card--tasks" aria-label="Today's tasks">
      <div class="tasks-header">
        <h2 id="tasks-heading" class="tasks-heading">Today's Tasks</h2>
        <div class="tasks-toolbar" aria-label="Filter and sort tasks">
          <label class="field">
            <span>Status</span>
            <select id="filter-select" class="app-select">
              <option value="all">All</option>
              ${TODO_STATUSES.map((status) => `<option value="${status}">${status}</option>`).join("")}
            </select>
          </label>
          <label class="field">
            <span>Category</span>
            <select id="category-filter-select" class="app-select">
              <option value="all">All</option>
              ${TODO_CATEGORIES.map((c) => `<option value="${c}">${c}</option>`).join("")}
            </select>
          </label>
          <label class="field">
            <span>Priority</span>
            <select id="priority-filter-select" class="app-select">
              <option value="all">All</option>
              ${TODO_PRIORITIES.map((p) => `<option value="${p}">${p}</option>`).join("")}
            </select>
          </label>
          <label class="field">
            <span>Sort</span>
            <select id="sort-select" class="app-select">
              <option value="manual" selected>Custom order</option>
              <option value="created-desc">Newest first</option>
              <option value="created-asc">Oldest first</option>
              <option value="points-desc">Points (high to low)</option>
              <option value="status">Status</option>
            </select>
          </label>
        </div>
      </div>
      <ul id="todo-list" class="todo-list"></ul>
    </section>
  </main>

  <div id="edit-modal" class="modal-backdrop hidden" aria-hidden="true">
    <section class="modal" role="dialog" aria-modal="true" aria-labelledby="edit-modal-title">
      <h3 id="edit-modal-title">Edit Task</h3>
      <form id="edit-form" class="modal-form">
        <label class="field">
          <span>Task</span>
          <input id="edit-title-input" name="edit-title" type="text" maxlength="120" required />
        </label>
        <label class="field">
          <span>Points</span>
          <input id="edit-points-input" name="edit-points" type="number" min="0" step="1" required />
        </label>
        <label class="field">
          <span>Category</span>
          <select id="edit-category-select" class="app-select"></select>
        </label>
        <label class="field">
          <span>Priority</span>
          <select id="edit-priority-select" class="app-select"></select>
        </label>
        <label class="field">
          <span>Status</span>
          <select id="edit-status-select" class="app-select"></select>
        </label>
        <p id="edit-error" class="form-error" role="alert" aria-live="polite"></p>
        <div class="modal-actions">
          <button type="button" id="edit-cancel-button" class="secondary-button">Cancel</button>
          <button type="submit" id="edit-save-button" class="add-button">Save</button>
        </div>
      </form>
    </section>
  </div>

  <div id="delete-modal" class="modal-backdrop hidden" aria-hidden="true">
    <section class="modal" role="dialog" aria-modal="true" aria-labelledby="delete-modal-title">
      <h3 id="delete-modal-title">Delete Task</h3>
      <p id="delete-modal-message" class="delete-modal-message"></p>
      <div class="modal-actions">
        <button type="button" id="delete-cancel-button" class="secondary-button">Cancel</button>
        <button type="button" id="delete-confirm-button" class="danger-button">Confirm Delete</button>
      </div>
    </section>
  </div>
`;

const dateLabel = document.querySelector<HTMLParagraphElement>("#date-label")!;
const scoreValue = document.querySelector<HTMLParagraphElement>("#daily-score")!;
const todoList = document.querySelector<HTMLUListElement>("#todo-list")!;
const todoForm = document.querySelector<HTMLFormElement>("#todo-form")!;
const titleInput = document.querySelector<HTMLInputElement>("#title-input")!;
const pointsInput = document.querySelector<HTMLInputElement>("#points-input")!;
const themeToggleButton = document.querySelector<HTMLButtonElement>("#theme-toggle")!;
const newCategorySelect = document.querySelector<HTMLSelectElement>("#new-category-select")!;
const newPrioritySelect = document.querySelector<HTMLSelectElement>("#new-priority-select")!;
const newSubtaskRows = document.querySelector<HTMLDivElement>("#new-subtask-rows")!;
const addNewSubtaskRowButton = document.querySelector<HTMLButtonElement>(
  "#add-new-subtask-row",
)!;
const datePicker = document.querySelector<HTMLInputElement>("#date-picker")!;
const jumpTodayButton = document.querySelector<HTMLButtonElement>("#jump-today-button")!;
const filterSelect = document.querySelector<HTMLSelectElement>("#filter-select")!;
const categoryFilterSelect = document.querySelector<HTMLSelectElement>(
  "#category-filter-select",
)!;
const priorityFilterSelect = document.querySelector<HTMLSelectElement>(
  "#priority-filter-select",
)!;
const sortSelect = document.querySelector<HTMLSelectElement>("#sort-select")!;
const tasksSection = document.querySelector<HTMLElement>("#tasks-section")!;
const tasksHeading = document.querySelector<HTMLHeadingElement>("#tasks-heading")!;
const formError = document.querySelector<HTMLParagraphElement>("#form-error")!;
const editModal = document.querySelector<HTMLDivElement>("#edit-modal")!;
const editForm = document.querySelector<HTMLFormElement>("#edit-form")!;
const editTitleInput = document.querySelector<HTMLInputElement>("#edit-title-input")!;
const editPointsInput = document.querySelector<HTMLInputElement>("#edit-points-input")!;
const editCategorySelect = document.querySelector<HTMLSelectElement>("#edit-category-select")!;
const editPrioritySelect = document.querySelector<HTMLSelectElement>("#edit-priority-select")!;
const editStatusSelect = document.querySelector<HTMLSelectElement>("#edit-status-select")!;
const editError = document.querySelector<HTMLParagraphElement>("#edit-error")!;
const editCancelButton = document.querySelector<HTMLButtonElement>("#edit-cancel-button")!;
const deleteModal = document.querySelector<HTMLDivElement>("#delete-modal")!;
const deleteModalMessage = document.querySelector<HTMLParagraphElement>("#delete-modal-message")!;
const deleteCancelButton = document.querySelector<HTMLButtonElement>("#delete-cancel-button")!;
const deleteConfirmButton = document.querySelector<HTMLButtonElement>("#delete-confirm-button")!;

editCategorySelect.innerHTML = TODO_CATEGORIES.map(
  (c) => `<option value="${c}">${c}</option>`,
).join("");
editPrioritySelect.innerHTML = TODO_PRIORITIES.map(
  (p) => `<option value="${p}">${p}</option>`,
).join("");
editStatusSelect.innerHTML = TODO_STATUSES.map(
  (s) => `<option value="${s}">${s}</option>`,
).join("");

datePicker.value = activeDateKey;

syncThemeToggleButton(themeToggleButton);

themeToggleButton.addEventListener("click", () => {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(next, true);
  syncThemeToggleButton(themeToggleButton);
});

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function createNewSubtaskRow(): void {
  const row = document.createElement("div");
  row.className = "new-subtask-row";
  row.innerHTML = `
    <input type="text" class="new-subtask-title" placeholder="Sub-task title" maxlength="120" />
    <button type="button" class="secondary-button secondary-button--compact remove-subtask-row" aria-label="Remove sub-task line">Remove</button>
  `;
  newSubtaskRows.appendChild(row);
}

function collectNewSubtaskTitles(): string[] {
  return Array.from(newSubtaskRows.querySelectorAll<HTMLInputElement>(".new-subtask-title"))
    .map((input) => input.value.trim())
    .filter((v) => v.length > 0);
}

function clearNewSubtaskRows(): void {
  newSubtaskRows.innerHTML = "";
}

addNewSubtaskRowButton.addEventListener("click", () => {
  createNewSubtaskRow();
});

newSubtaskRows.addEventListener("click", (event) => {
  const target = event.target as HTMLElement | null;
  const btn = target?.closest<HTMLButtonElement>(".remove-subtask-row");
  if (!btn) {
    return;
  }
  btn.closest(".new-subtask-row")?.remove();
});

function compareBySort(left: TodoItem, right: TodoItem): number {
  if (sortMode === "created-asc") {
    return left.createdAt.localeCompare(right.createdAt);
  }
  if (sortMode === "points-desc") {
    return right.points - left.points;
  }
  if (sortMode === "status") {
    return left.status.localeCompare(right.status);
  }

  return right.createdAt.localeCompare(left.createdAt);
}

function getVisibleItems(): TodoItem[] {
  const filtered = dailyState.items.filter((item) => {
    const statusOk = statusFilter === "all" ? true : item.status === statusFilter;
    const categoryOk =
      categoryFilter === "all" ? true : item.category === categoryFilter;
    const priorityOk =
      priorityFilter === "all" ? true : item.priority === priorityFilter;
    return statusOk && categoryOk && priorityOk;
  });

  if (sortMode === "manual") {
    return filtered;
  }

  return filtered.sort(compareBySort);
}

function isManualSort(): boolean {
  return sortMode === "manual";
}

function renderSubtasksBlock(item: TodoItem): string {
  const count = item.subtasks.length;
  const expanded = expandedTaskIds.has(item.id);
  const chevron = expanded ? "▾" : "▸";
  const panelHidden = expanded ? "" : " hidden";
  const rows =
    item.subtasks.length === 0
      ? '<li class="subtask-empty">No sub-tasks yet.</li>'
      : item.subtasks
          .map(
            (st, index) => `
        <li class="subtask-row" data-item-id="${item.id}" data-subtask-id="${st.id}" data-subtask-index="${index}">
          <button type="button" class="subtask-drag-handle" draggable="true" aria-label="Drag to reorder sub-task" data-item-id="${item.id}" data-subtask-id="${st.id}">⋮⋮</button>
          <span class="subtask-title-text">${escapeHtml(st.title)}</span>
          <input type="text" class="subtask-title-input hidden" value="${escapeHtml(st.title)}" maxlength="120" aria-label="Edit sub-task title" />
          <div class="subtask-row-actions">
            <button type="button" class="secondary-button secondary-button--compact subtask-edit-toggle" data-item-id="${item.id}" data-subtask-id="${st.id}">Edit</button>
            <button type="button" class="secondary-button secondary-button--compact subtask-save hidden" data-item-id="${item.id}" data-subtask-id="${st.id}">Save</button>
            <button type="button" class="danger-button danger-button--compact subtask-delete" data-item-id="${item.id}" data-subtask-id="${st.id}">Delete</button>
          </div>
        </li>`,
          )
          .join("");

  return `
    <div class="subtasks-block">
      <button type="button" class="subtasks-toggle secondary-button secondary-button--compact" data-item-id="${item.id}" aria-expanded="${expanded}" aria-controls="subtasks-panel-${item.id}">
        ${chevron} Sub-tasks (${count})
      </button>
      <div id="subtasks-panel-${item.id}" class="subtasks-panel${panelHidden}" role="region" aria-label="Sub-tasks for ${escapeHtml(item.title)}">
        <ul class="subtask-list" data-item-id="${item.id}">
          ${rows}
        </ul>
        <div class="add-subtask-row">
          <input type="text" class="add-subtask-input" data-item-id="${item.id}" placeholder="New sub-task" maxlength="120" aria-label="New sub-task title" />
          <button type="button" class="secondary-button secondary-button--compact add-subtask-button" data-item-id="${item.id}">Add</button>
        </div>
      </div>
    </div>
  `;
}

function applyDayFromPicker(): void {
  const picked = datePicker.value;
  if (!picked || picked === activeDateKey) {
    return;
  }
  activeDateKey = picked;
  dailyState = loadDailyTodos(activeDateKey);
  expandedTaskIds.clear();
  renderTodos();
}

function renderTodos(): void {
  dateLabel.textContent = formatDateLabel(activeDateKey);
  scoreValue.textContent = String(getDailyScore(dailyState));

  const isViewingToday = activeDateKey === getTodayKey();
  tasksHeading.textContent = isViewingToday
    ? "Today's Tasks"
    : `Tasks for ${formatDateLabel(activeDateKey)}`;
  tasksSection.setAttribute(
    "aria-label",
    isViewingToday ? "Today's tasks" : `Tasks for ${formatDateLabel(activeDateKey)}`,
  );

  const visibleItems = getVisibleItems();
  if (visibleItems.length === 0) {
    todoList.innerHTML =
      '<li class="empty-state">No matching tasks for this day. Add one or change the filters.</li>';
    return;
  }

  const showDrag = isManualSort();

  todoList.innerHTML = visibleItems
    .map(
      (item) => `
      <li class="todo-item" data-item-id="${item.id}">
        ${
          showDrag
            ? `<button type="button" class="drag-handle" draggable="true" aria-label="Drag to reorder task" data-item-id="${item.id}">⋮⋮</button>`
            : '<span class="drag-handle drag-handle--disabled" aria-hidden="true" title="Choose Custom order sort to reorder tasks">⋮⋮</span>'
        }
        <div class="todo-body">
          <div class="todo-main">
            <p class="todo-title">${escapeHtml(item.title)}</p>
            <p class="todo-meta">${item.points} point${item.points === 1 ? "" : "s"} · ${escapeHtml(item.category)} · ${escapeHtml(item.priority)} · ${escapeHtml(item.status)}</p>
          </div>
          ${renderSubtasksBlock(item)}
        </div>
        <div class="item-actions">
          <button type="button" class="secondary-button edit-button" data-id="${item.id}">Edit</button>
          <button type="button" class="danger-button delete-button" data-id="${item.id}">Delete</button>
        </div>
      </li>
    `,
    )
    .join("");

  bindTodoDragHandlers();
  bindSubtaskDragHandlers();
}

function bindTodoDragHandlers(): void {
  if (!isManualSort()) {
    return;
  }

  const handles = todoList.querySelectorAll<HTMLButtonElement>(".drag-handle[draggable='true']");
  handles.forEach((handle) => {
    handle.addEventListener("dragstart", (e) => {
      draggedTodoId = handle.dataset.itemId ?? null;
      e.dataTransfer?.setData("text/plain", draggedTodoId ?? "");
      e.dataTransfer!.effectAllowed = "move";
      handle.closest(".todo-item")?.classList.add("todo-item--dragging");
    });
    handle.addEventListener("dragend", () => {
      draggedTodoId = null;
      todoList.querySelectorAll(".todo-item--dragging").forEach((el) => {
        el.classList.remove("todo-item--dragging");
      });
      todoList.querySelectorAll(".todo-item--drop-target").forEach((el) => {
        el.classList.remove("todo-item--drop-target");
      });
    });
  });

  const items = todoList.querySelectorAll<HTMLLIElement>(".todo-item");
  items.forEach((li) => {
    li.addEventListener("dragover", (e) => {
      if (!draggedTodoId) {
        return;
      }
      e.preventDefault();
      e.dataTransfer!.dropEffect = "move";
      li.classList.add("todo-item--drop-target");
    });
    li.addEventListener("dragleave", () => {
      li.classList.remove("todo-item--drop-target");
    });
    li.addEventListener("drop", (e) => {
      if (!draggedTodoId) {
        return;
      }
      e.preventDefault();
      li.classList.remove("todo-item--drop-target");
      const dropId = li.dataset.itemId;
      if (!dropId || draggedTodoId === dropId) {
        return;
      }
      const visible = getVisibleItems();
      const ids = visible.map((i) => i.id);
      const fromIndex = ids.indexOf(draggedTodoId);
      const toIndex = ids.indexOf(dropId);
      if (fromIndex === -1 || toIndex === -1) {
        return;
      }
      dailyState = reorderTodoItemsByVisibleOrder(dailyState, ids, fromIndex, toIndex);
      saveDailyTodos(dailyState);
      renderTodos();
    });
  });
}

function bindSubtaskDragHandlers(): void {
  const handles = todoList.querySelectorAll<HTMLButtonElement>(".subtask-drag-handle");
  handles.forEach((handle) => {
    handle.addEventListener("dragstart", (e) => {
      const itemId = handle.dataset.itemId;
      const subtaskId = handle.dataset.subtaskId;
      if (!itemId || !subtaskId) {
        return;
      }
      draggedSubtask = { itemId, subtaskId };
      e.dataTransfer?.setData("text/plain", subtaskId);
      e.dataTransfer!.effectAllowed = "move";
      handle.closest(".subtask-row")?.classList.add("subtask-row--dragging");
    });
    handle.addEventListener("dragend", () => {
      draggedSubtask = null;
      todoList.querySelectorAll(".subtask-row--dragging").forEach((el) => {
        el.classList.remove("subtask-row--dragging");
      });
      todoList.querySelectorAll(".subtask-row--drop-target").forEach((el) => {
        el.classList.remove("subtask-row--drop-target");
      });
    });
  });

  const rows = todoList.querySelectorAll<HTMLLIElement>(".subtask-row");
  rows.forEach((row) => {
    row.addEventListener("dragover", (e) => {
      if (!draggedSubtask) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer!.dropEffect = "move";
      row.classList.add("subtask-row--drop-target");
    });
    row.addEventListener("dragleave", () => {
      row.classList.remove("subtask-row--drop-target");
    });
    row.addEventListener("drop", (e) => {
      if (!draggedSubtask) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      row.classList.remove("subtask-row--drop-target");
      const itemId = row.dataset.itemId;
      const dropSubtaskId = row.dataset.subtaskId;
      if (!itemId || !dropSubtaskId || draggedSubtask.itemId !== itemId) {
        return;
      }
      const parent = dailyState.items.find((i) => i.id === itemId);
      if (!parent) {
        return;
      }
      const ids = parent.subtasks.map((s) => s.id);
      const fromIndex = ids.indexOf(draggedSubtask.subtaskId);
      const toIndex = ids.indexOf(dropSubtaskId);
      if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
        return;
      }
      dailyState = reorderSubtasksOnItem(dailyState, itemId, fromIndex, toIndex);
      saveDailyTodos(dailyState);
      renderTodos();
    });
  });
}

function openEditModal(item: TodoItem): void {
  editingItemId = item.id;
  editError.textContent = "";
  editTitleInput.value = item.title;
  editPointsInput.value = String(item.points);
  editCategorySelect.value = item.category;
  editPrioritySelect.value = item.priority;
  editStatusSelect.value = item.status;
  editModal.classList.remove("hidden");
  editModal.setAttribute("aria-hidden", "false");
  editTitleInput.focus();
}

function closeEditModal(): void {
  editingItemId = null;
  editForm.reset();
  editError.textContent = "";
  editModal.classList.add("hidden");
  editModal.setAttribute("aria-hidden", "true");
}

function openDeleteModal(item: TodoItem): void {
  deletingItemId = item.id;
  deleteModalMessage.textContent = `Are you sure you want to delete "${item.title}"?`;
  deleteModal.classList.remove("hidden");
  deleteModal.setAttribute("aria-hidden", "false");
}

function closeDeleteModal(): void {
  deletingItemId = null;
  deleteModalMessage.textContent = "";
  deleteModal.classList.add("hidden");
  deleteModal.setAttribute("aria-hidden", "true");
}

todoForm.addEventListener("submit", (event) => {
  event.preventDefault();
  formError.textContent = "";

  const title = titleInput.value.trim();
  const parsedPoints = Number.parseInt(pointsInput.value, 10);
  const selectedCategory = newCategorySelect.value;
  const selectedPriority = newPrioritySelect.value;

  if (!title) {
    formError.textContent = "Task title is required.";
    return;
  }

  if (Number.isNaN(parsedPoints) || parsedPoints < 0) {
    formError.textContent = "Points must be zero or greater.";
    return;
  }
  if (!isTodoCategory(selectedCategory)) {
    formError.textContent = "Please choose a valid category.";
    return;
  }
  if (!isTodoPriority(selectedPriority)) {
    formError.textContent = "Please choose a valid priority.";
    return;
  }

  applyDayFromPicker();

  dailyState = addTodoItem(dailyState, {
    title,
    points: parsedPoints,
    category: selectedCategory,
    priority: selectedPriority,
    subtaskTitles: collectNewSubtaskTitles(),
  });
  saveDailyTodos(dailyState);
  renderTodos();

  todoForm.reset();
  pointsInput.value = "1";
  newCategorySelect.value = "Other";
  newPrioritySelect.value = "Medium";
  clearNewSubtaskRows();
  titleInput.focus();
});

todoList.addEventListener("click", (event) => {
  const target = event.target as HTMLElement | null;
  if (!target) {
    return;
  }

  const toggle = target.closest<HTMLButtonElement>(".subtasks-toggle");
  if (toggle) {
    const itemId = toggle.dataset.itemId;
    if (!itemId) {
      return;
    }
    if (expandedTaskIds.has(itemId)) {
      expandedTaskIds.delete(itemId);
    } else {
      expandedTaskIds.add(itemId);
    }
    renderTodos();
    return;
  }

  const addSubBtn = target.closest<HTMLButtonElement>(".add-subtask-button");
  if (addSubBtn) {
    const itemId = addSubBtn.dataset.itemId;
    if (!itemId) {
      return;
    }
    const panel = addSubBtn.closest(".subtasks-panel");
    const input = panel?.querySelector<HTMLInputElement>(".add-subtask-input");
    const title = input?.value.trim() ?? "";
    if (!title) {
      return;
    }
    dailyState = addSubtaskToItem(dailyState, itemId, title);
    saveDailyTodos(dailyState);
    expandedTaskIds.add(itemId);
    renderTodos();
    return;
  }

  const delSub = target.closest<HTMLButtonElement>(".subtask-delete");
  if (delSub) {
    const itemId = delSub.dataset.itemId;
    const subtaskId = delSub.dataset.subtaskId;
    if (!itemId || !subtaskId) {
      return;
    }
    dailyState = deleteSubtaskFromItem(dailyState, itemId, subtaskId);
    saveDailyTodos(dailyState);
    renderTodos();
    return;
  }

  const editToggle = target.closest<HTMLButtonElement>(".subtask-edit-toggle");
  if (editToggle) {
    const row = editToggle.closest(".subtask-row");
    if (!row) {
      return;
    }
    row.querySelector(".subtask-title-text")?.classList.add("hidden");
    row.querySelector(".subtask-title-input")?.classList.remove("hidden");
    editToggle.classList.add("hidden");
    row.querySelector(".subtask-save")?.classList.remove("hidden");
    const inp = row.querySelector<HTMLInputElement>(".subtask-title-input");
    inp?.focus();
    inp?.select();
    return;
  }

  const saveSub = target.closest<HTMLButtonElement>(".subtask-save");
  if (saveSub) {
    const itemId = saveSub.dataset.itemId;
    const subtaskId = saveSub.dataset.subtaskId;
    const row = saveSub.closest(".subtask-row");
    const inp = row?.querySelector<HTMLInputElement>(".subtask-title-input");
    if (!itemId || !subtaskId || !inp) {
      return;
    }
    const nextTitle = inp.value.trim();
    if (!nextTitle) {
      return;
    }
    dailyState = updateSubtaskOnItem(dailyState, itemId, subtaskId, nextTitle);
    saveDailyTodos(dailyState);
    renderTodos();
    return;
  }

  const editButton = target.closest<HTMLButtonElement>(".edit-button");
  if (editButton) {
    const itemId = editButton.dataset.id;
    const item = dailyState.items.find((candidate) => candidate.id === itemId);
    if (!item) {
      return;
    }
    openEditModal(item);
    return;
  }

  const deleteButton = target.closest<HTMLButtonElement>(".delete-button");
  if (deleteButton) {
    const itemId = deleteButton.dataset.id;
    if (!itemId) {
      return;
    }
    const item = dailyState.items.find((candidate) => candidate.id === itemId);
    if (!item) {
      return;
    }
    openDeleteModal(item);
  }
});

editForm.addEventListener("submit", (event) => {
  event.preventDefault();
  editError.textContent = "";

  if (!editingItemId) {
    closeEditModal();
    return;
  }

  const updatedTitle = editTitleInput.value.trim();
  const updatedPoints = Number.parseInt(editPointsInput.value, 10);
  const cat = editCategorySelect.value;
  const pri = editPrioritySelect.value;
  const st = editStatusSelect.value;
  if (!updatedTitle) {
    editError.textContent = "Task title is required.";
    return;
  }
  if (Number.isNaN(updatedPoints) || updatedPoints < 0) {
    editError.textContent = "Points must be zero or greater.";
    return;
  }
  if (!isTodoCategory(cat)) {
    editError.textContent = "Please choose a valid category.";
    return;
  }
  if (!isTodoPriority(pri)) {
    editError.textContent = "Please choose a valid priority.";
    return;
  }
  if (!isTodoStatus(st)) {
    editError.textContent = "Please choose a valid status.";
    return;
  }

  dailyState = updateTodoItem(dailyState, editingItemId, {
    title: updatedTitle,
    points: updatedPoints,
    category: cat,
    priority: pri,
    status: st,
  });
  saveDailyTodos(dailyState);
  closeEditModal();
  renderTodos();
});

editCancelButton.addEventListener("click", () => {
  closeEditModal();
});

deleteCancelButton.addEventListener("click", () => {
  closeDeleteModal();
});

deleteConfirmButton.addEventListener("click", () => {
  if (!deletingItemId) {
    closeDeleteModal();
    return;
  }

  dailyState = deleteTodoItem(dailyState, deletingItemId);
  expandedTaskIds.delete(deletingItemId);
  saveDailyTodos(dailyState);
  closeDeleteModal();
  renderTodos();
});

datePicker.addEventListener("change", () => {
  applyDayFromPicker();
});

datePicker.addEventListener("input", () => {
  applyDayFromPicker();
});

jumpTodayButton.addEventListener("click", () => {
  activeDateKey = getTodayKey();
  datePicker.value = activeDateKey;
  dailyState = loadDailyTodos(activeDateKey);
  expandedTaskIds.clear();
  renderTodos();
});

filterSelect.addEventListener("change", () => {
  const selected = filterSelect.value;
  if (selected === "all" || isTodoStatus(selected)) {
    statusFilter = selected;
    renderTodos();
  }
});

categoryFilterSelect.addEventListener("change", () => {
  const selected = categoryFilterSelect.value;
  if (selected === "all" || isTodoCategory(selected)) {
    categoryFilter = selected;
    renderTodos();
  }
});

priorityFilterSelect.addEventListener("change", () => {
  const selected = priorityFilterSelect.value;
  if (selected === "all" || isTodoPriority(selected)) {
    priorityFilter = selected;
    renderTodos();
  }
});

sortSelect.addEventListener("change", () => {
  const selected = sortSelect.value;
  if (
    selected === "manual" ||
    selected === "created-desc" ||
    selected === "created-asc" ||
    selected === "points-desc" ||
    selected === "status"
  ) {
    sortMode = selected;
    renderTodos();
  }
});

renderTodos();
