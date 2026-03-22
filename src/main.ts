import "./style.css";
import { formatDateLabel, getTodayKey } from "./date";
import {
  addTodoItem,
  deleteTodoItem,
  getDailyScore,
  updateTodoItem,
  updateTodoStatus,
} from "./state";
import { loadDailyTodos, saveDailyTodos } from "./storage";
import { isTodoStatus, TODO_STATUSES, type TodoItem } from "./types";

const todayKey = getTodayKey();
let activeDateKey = todayKey;
let dailyState = loadDailyTodos(activeDateKey);
let statusFilter: "all" | (typeof TODO_STATUSES)[number] = "all";
let sortMode: "created-desc" | "created-asc" | "points-desc" | "status" =
  "created-desc";
let editingItemId: string | null = null;
let deletingItemId: string | null = null;

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("App root not found.");
}

app.innerHTML = `
  <main class="app-shell">
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
      <form id="todo-form" class="controls-form">
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
        <div class="controls-grid controls-grid--task-row">
          <label class="field field--task">
            <span>Task</span>
            <input id="title-input" name="title" type="text" placeholder="Enter a task for today" maxlength="120" required />
          </label>
          <label class="field field--points">
            <span>Points</span>
            <input id="points-input" name="points" type="number" value="1" min="0" step="1" required />
          </label>
          <label class="field field--new-status">
            <span>Status</span>
            <select id="new-status-select" class="status-select app-select">
              ${TODO_STATUSES.map(
                (status) =>
                  `<option value="${status}" ${status === "Not started" ? "selected" : ""}>${status}</option>`,
              ).join("")}
            </select>
          </label>
          <div class="field field--submit">
            <span class="field-label-spacer" aria-hidden="true">Add</span>
            <button type="submit" class="add-button">Add Task</button>
          </div>
        </div>
        <p id="form-error" class="form-error" role="alert" aria-live="polite"></p>
      </form>
    </section>

    <section class="card card--tasks" aria-label="Today's tasks">
      <div class="tasks-header">
        <h2 class="tasks-heading">Today's Tasks</h2>
        <div class="tasks-toolbar" aria-label="Filter and sort tasks">
          <label class="field">
            <span>Filter</span>
            <select id="filter-select" class="app-select">
              <option value="all">All</option>
              ${TODO_STATUSES.map((status) => `<option value="${status}">${status}</option>`).join("")}
            </select>
          </label>
          <label class="field">
            <span>Sort</span>
            <select id="sort-select" class="app-select">
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

const dateLabelElement =
  document.querySelector<HTMLParagraphElement>("#date-label");
const scoreValueElement =
  document.querySelector<HTMLParagraphElement>("#daily-score");
const todoListElement = document.querySelector<HTMLUListElement>("#todo-list");
const todoFormElement = document.querySelector<HTMLFormElement>("#todo-form");
const titleInputElement =
  document.querySelector<HTMLInputElement>("#title-input");
const pointsInputElement =
  document.querySelector<HTMLInputElement>("#points-input");
const newStatusSelectElement =
  document.querySelector<HTMLSelectElement>("#new-status-select");
const datePickerElement =
  document.querySelector<HTMLInputElement>("#date-picker");
const jumpTodayButtonElement =
  document.querySelector<HTMLButtonElement>("#jump-today-button");
const filterSelectElement =
  document.querySelector<HTMLSelectElement>("#filter-select");
const sortSelectElement = document.querySelector<HTMLSelectElement>("#sort-select");
const formErrorElement =
  document.querySelector<HTMLParagraphElement>("#form-error");
const editModalElement = document.querySelector<HTMLDivElement>("#edit-modal");
const editFormElement = document.querySelector<HTMLFormElement>("#edit-form");
const editTitleInputElement =
  document.querySelector<HTMLInputElement>("#edit-title-input");
const editPointsInputElement =
  document.querySelector<HTMLInputElement>("#edit-points-input");
const editErrorElement = document.querySelector<HTMLParagraphElement>("#edit-error");
const editCancelButtonElement =
  document.querySelector<HTMLButtonElement>("#edit-cancel-button");
const deleteModalElement = document.querySelector<HTMLDivElement>("#delete-modal");
const deleteModalMessageElement =
  document.querySelector<HTMLParagraphElement>("#delete-modal-message");
const deleteCancelButtonElement =
  document.querySelector<HTMLButtonElement>("#delete-cancel-button");
const deleteConfirmButtonElement =
  document.querySelector<HTMLButtonElement>("#delete-confirm-button");

if (
  !dateLabelElement ||
  !scoreValueElement ||
  !todoListElement ||
  !todoFormElement ||
  !titleInputElement ||
  !pointsInputElement ||
  !newStatusSelectElement ||
  !datePickerElement ||
  !jumpTodayButtonElement ||
  !filterSelectElement ||
  !sortSelectElement ||
  !formErrorElement ||
  !editModalElement ||
  !editFormElement ||
  !editTitleInputElement ||
  !editPointsInputElement ||
  !editErrorElement ||
  !editCancelButtonElement ||
  !deleteModalElement ||
  !deleteModalMessageElement ||
  !deleteCancelButtonElement ||
  !deleteConfirmButtonElement
) {
  throw new Error("One or more required DOM elements are missing.");
}

const dateLabel = dateLabelElement;
const scoreValue = scoreValueElement;
const todoList = todoListElement;
const todoForm = todoFormElement;
const titleInput = titleInputElement;
const pointsInput = pointsInputElement;
const newStatusSelect = newStatusSelectElement;
const datePicker = datePickerElement;
const jumpTodayButton = jumpTodayButtonElement;
const filterSelect = filterSelectElement;
const sortSelect = sortSelectElement;
const formError = formErrorElement;
const editModal = editModalElement;
const editForm = editFormElement;
const editTitleInput = editTitleInputElement;
const editPointsInput = editPointsInputElement;
const editError = editErrorElement;
const editCancelButton = editCancelButtonElement;
const deleteModal = deleteModalElement;
const deleteModalMessage = deleteModalMessageElement;
const deleteCancelButton = deleteCancelButtonElement;
const deleteConfirmButton = deleteConfirmButtonElement;

datePicker.value = activeDateKey;

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
    return statusFilter === "all" ? true : item.status === statusFilter;
  });

  return filtered.sort(compareBySort);
}

function renderTodos(): void {
  dateLabel.textContent = formatDateLabel(activeDateKey);
  scoreValue.textContent = String(getDailyScore(dailyState));

  const visibleItems = getVisibleItems();
  if (visibleItems.length === 0) {
    todoList.innerHTML =
      '<li class="empty-state">No matching tasks for this day. Add one or change the filters.</li>';
    return;
  }

  todoList.innerHTML = visibleItems
    .map(
      (item) => `
      <li class="todo-item">
        <div class="todo-main">
          <p class="todo-title">${item.title}</p>
          <p class="todo-meta">${item.points} point${item.points === 1 ? "" : "s"}</p>
        </div>
        <label class="status-control">
          <span class="sr-only">Update status for ${item.title}</span>
          <select data-id="${item.id}" class="status-select">
            ${TODO_STATUSES.map(
              (status) =>
                `<option value="${status}" ${item.status === status ? "selected" : ""}>${status}</option>`,
            ).join("")}
          </select>
        </label>
        <div class="item-actions">
          <button type="button" class="secondary-button edit-button" data-id="${item.id}">Edit</button>
          <button type="button" class="danger-button delete-button" data-id="${item.id}">Delete</button>
        </div>
      </li>
    `,
    )
    .join("");
}

function openEditModal(item: TodoItem): void {
  editingItemId = item.id;
  editError.textContent = "";
  editTitleInput.value = item.title;
  editPointsInput.value = String(item.points);
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
  const selectedStatus = newStatusSelect.value;

  if (!title) {
    formError.textContent = "Task title is required.";
    return;
  }

  if (Number.isNaN(parsedPoints) || parsedPoints < 0) {
    formError.textContent = "Points must be zero or greater.";
    return;
  }
  if (!isTodoStatus(selectedStatus)) {
    formError.textContent = "Please choose a valid status.";
    return;
  }

  dailyState = addTodoItem(dailyState, {
    title,
    points: parsedPoints,
    status: selectedStatus,
  });
  saveDailyTodos(dailyState);
  renderTodos();

  todoForm.reset();
  pointsInput.value = "1";
  newStatusSelect.value = "Not started";
  titleInput.focus();
});

todoList.addEventListener("change", (event) => {
  const target = event.target as HTMLSelectElement | null;
  if (!target || !target.matches(".status-select")) {
    return;
  }

  const itemId = target.dataset.id;
  const nextStatus = target.value;
  if (!itemId || !isTodoStatus(nextStatus)) {
    return;
  }

  dailyState = updateTodoStatus(dailyState, itemId, nextStatus);
  saveDailyTodos(dailyState);
  renderTodos();
});

todoList.addEventListener("click", (event) => {
  const target = event.target as HTMLElement | null;
  if (!target) {
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
  if (!updatedTitle) {
    editError.textContent = "Task title is required.";
    return;
  }
  if (Number.isNaN(updatedPoints) || updatedPoints < 0) {
    editError.textContent = "Points must be zero or greater.";
    return;
  }

  dailyState = updateTodoItem(dailyState, editingItemId, {
    title: updatedTitle,
    points: updatedPoints,
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
  saveDailyTodos(dailyState);
  closeDeleteModal();
  renderTodos();
});

datePicker.addEventListener("change", () => {
  if (!datePicker.value) {
    return;
  }

  activeDateKey = datePicker.value;
  dailyState = loadDailyTodos(activeDateKey);
  renderTodos();
});

jumpTodayButton.addEventListener("click", () => {
  activeDateKey = getTodayKey();
  datePicker.value = activeDateKey;
  dailyState = loadDailyTodos(activeDateKey);
  renderTodos();
});

filterSelect.addEventListener("change", () => {
  const selected = filterSelect.value;
  if (selected === "all" || isTodoStatus(selected)) {
    statusFilter = selected;
    renderTodos();
  }
});

sortSelect.addEventListener("change", () => {
  const selected = sortSelect.value;
  if (
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
