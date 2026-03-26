export const TODO_STATUSES = ["Not started", "In progress", "Done"] as const;

export type TodoStatus = (typeof TODO_STATUSES)[number];

export const TODO_CATEGORIES = [
  "Work",
  "Personal",
  "Housework",
  "Health",
  "Shopping",
  "Errands",
  "Other",
] as const;

export type TodoCategory = (typeof TODO_CATEGORIES)[number];

export const TODO_PRIORITIES = ["High", "Medium", "Low"] as const;

export type TodoPriority = (typeof TODO_PRIORITIES)[number];

export interface SubTask {
  id: string;
  title: string;
}

export interface TodoItem {
  id: string;
  title: string;
  points: number;
  status: TodoStatus;
  createdAt: string;
  category: TodoCategory;
  priority: TodoPriority;
  subtasks: SubTask[];
}

export interface DailyTodos {
  date: string;
  items: TodoItem[];
}

export function isTodoStatus(value: string): value is TodoStatus {
  return TODO_STATUSES.includes(value as TodoStatus);
}

export function isTodoCategory(value: string): value is TodoCategory {
  return TODO_CATEGORIES.includes(value as TodoCategory);
}

export function isTodoPriority(value: string): value is TodoPriority {
  return TODO_PRIORITIES.includes(value as TodoPriority);
}
