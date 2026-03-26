# Vulcan - Coverage Plan (Gaps + New Features)

This plan is designed to:
- Fill gaps in existing E2E coverage by targeting edge cases and cross-feature interactions.
- Provide a repeatable template for adding new-feature coverage as the product evolves.

**Seed:** `tests/e2e/seed.spec.ts`

## 1. Task creation and validation (edge cases)

### 1.1 Reject empty title
**Steps:**
1. Ensure the app is loaded in a fresh state.
2. Leave the Title input empty.
3. Enter a valid Points value (e.g., `1`).
4. Click “Add Task”.

**Expected:**
- A validation error is shown.
- No task is added to the list.

### 1.2 Reject non-positive points (0 and negative)
**Steps:**
1. Add a task with a valid title.
2. Attempt to submit with points `0`.
3. Attempt to submit with points `-1`.

**Expected:**
- Validation error for each invalid points value.
- No task added for invalid submissions.

### 1.3 Subtask rows: add/remove behavior and trimming
**Steps:**
1. Click “add new subtask row” twice.
2. Enter a subtask title with leading/trailing whitespace.
3. Submit the task.

**Expected:**
- Subtask titles render trimmed (or the app enforces the intended rule).
- Subtasks panel can be expanded and shows both subtasks.

## 2. Sorting + drag-and-drop interactions (cross-feature)

### 2.1 Manual sort persists after edits
**Steps:**
1. Set sort to “manual”.
2. Add two tasks A and B.
3. Drag B above A.
4. Edit task A (e.g., change status).
5. Reload the page.

**Expected:**
- The manual order is preserved after edit and reload.

### 2.2 Drag handles disabled when not in manual sort
**Steps:**
1. Add a task.
2. Change sort to “points-desc” (or any non-manual sort).

**Expected:**
- Drag handle is visibly disabled and not draggable.

## 3. Filters (category + priority + status)

### 3.1 Combined filters narrow results correctly
**Steps:**
1. Create 3 tasks with different categories and priorities.
2. Set category filter to a specific category.
3. Set priority filter to a specific priority.
4. Toggle status filter between “Not started”, “In progress”, “Done”.

**Expected:**
- List shows only tasks matching all selected filters.

### 3.2 Filters survive navigation (Today / date change) as designed
**Steps:**
1. Set a non-default filter combination.
2. Change date using the date picker.
3. Click “Today”.

**Expected:**
- Filters persist or reset according to the intended UX (assert the designed behavior).

## 4. Persistence + storage integrity

### 4.1 Reload retains tasks, subtasks, and metadata
**Steps:**
1. Add a task with category, priority, status, and subtasks.
2. Reload.

**Expected:**
- Task and all metadata remain.

### 4.2 No cross-test contamination (fresh state)
**Steps:**
1. Add a task.
2. Start a new test in fresh state (seed expectation).

**Expected:**
- No tasks are present at start of new test.

## 5. New feature template (use for upcoming work)

### 5.1 <Feature name> - happy path
**Steps:**
1. Describe the primary user flow.

**Expected:**
- Describe success criteria.

### 5.2 <Feature name> - validation / error path
**Steps:**
1. Attempt an invalid action.

**Expected:**
- Error state is shown and no data corruption occurs.

