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

export const TODO_EFFORTS = ["Quick", "Medium", "Deep"] as const;

export type TodoEffort = (typeof TODO_EFFORTS)[number];

export const EFFORT_POINTS: Record<TodoEffort, number> = {
  Quick: 5,
  Medium: 15,
  Deep: 30,
};

export function pointsForEffort(effort: TodoEffort): number {
  return EFFORT_POINTS[effort];
}

export interface SubTask {
  id: string;
  title: string;
}

export interface TodoItem {
  id: string;
  title: string;
  effort: TodoEffort;
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

export function isTodoEffort(value: string): value is TodoEffort {
  return TODO_EFFORTS.includes(value as TodoEffort);
}
