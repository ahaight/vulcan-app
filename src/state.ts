import type { DailyTodos, TodoItem, TodoStatus } from "./types";

export function createEmptyDay(date: string): DailyTodos {
  return { date, items: [] };
}

export function addTodoItem(
  state: DailyTodos,
  input: { title: string; points: number; status?: TodoStatus },
): DailyTodos {
  const title = input.title.trim();
  const points = Number.isFinite(input.points) ? Math.max(0, input.points) : 0;

  const newItem: TodoItem = {
    id: crypto.randomUUID(),
    title,
    points,
    status: input.status ?? "not started",
    createdAt: new Date().toISOString(),
  };

  return {
    ...state,
    items: [...state.items, newItem],
  };
}

export function updateTodoStatus(
  state: DailyTodos,
  itemId: string,
  status: TodoStatus,
): DailyTodos {
  return {
    ...state,
    items: state.items.map((item) =>
      item.id === itemId ? { ...item, status } : item,
    ),
  };
}

export function updateTodoItem(
  state: DailyTodos,
  itemId: string,
  input: { title: string; points: number },
): DailyTodos {
  const title = input.title.trim();
  const points = Number.isFinite(input.points) ? Math.max(0, input.points) : 0;

  return {
    ...state,
    items: state.items.map((item) =>
      item.id === itemId ? { ...item, title, points } : item,
    ),
  };
}

export function deleteTodoItem(state: DailyTodos, itemId: string): DailyTodos {
  return {
    ...state,
    items: state.items.filter((item) => item.id !== itemId),
  };
}

export function getDailyScore(state: DailyTodos): number {
  return state.items.reduce((total, item) => {
    return item.status === "done" ? total + item.points : total;
  }, 0);
}
