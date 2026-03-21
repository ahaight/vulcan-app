export const TODO_STATUSES = ["not started", "in progress", "done"] as const;

export type TodoStatus = (typeof TODO_STATUSES)[number];

export interface TodoItem {
  id: string;
  title: string;
  points: number;
  status: TodoStatus;
  createdAt: string;
}

export interface DailyTodos {
  date: string;
  items: TodoItem[];
}

export function isTodoStatus(value: string): value is TodoStatus {
  return TODO_STATUSES.includes(value as TodoStatus);
}
