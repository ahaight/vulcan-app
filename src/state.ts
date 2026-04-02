import {
  pointsForEffort,
  type DailyTodos,
  type SubTask,
  type TodoCategory,
  type TodoEffort,
  type TodoItem,
  type TodoPriority,
  type TodoStatus,
} from "./types";

export function createEmptyDay(date: string): DailyTodos {
  return { date, items: [] };
}

export function addTodoItem(
  state: DailyTodos,
  input: {
    title: string;
    effort: TodoEffort;
    status?: TodoStatus;
    category?: TodoCategory;
    priority?: TodoPriority;
    subtaskTitles?: string[];
  },
): DailyTodos {
  const title = input.title.trim();

  const subtasks: SubTask[] = (input.subtaskTitles ?? [])
    .map((st) => st.trim())
    .filter((st) => st.length > 0)
    .map((st) => ({
      id: crypto.randomUUID(),
      title: st,
    }));

  const newItem: TodoItem = {
    id: crypto.randomUUID(),
    title,
    effort: input.effort,
    status: input.status ?? "Not started",
    createdAt: new Date().toISOString(),
    category: input.category ?? "Other",
    priority: input.priority ?? "Medium",
    subtasks,
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
  input: {
    title: string;
    effort: TodoEffort;
    category?: TodoCategory;
    priority?: TodoPriority;
    status?: TodoStatus;
  },
): DailyTodos {
  const title = input.title.trim();

  return {
    ...state,
    items: state.items.map((item) =>
      item.id === itemId
        ? {
            ...item,
            title,
            effort: input.effort,
            ...(input.category !== undefined ? { category: input.category } : {}),
            ...(input.priority !== undefined ? { priority: input.priority } : {}),
            ...(input.status !== undefined ? { status: input.status } : {}),
          }
        : item,
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
    return item.status === "Done" ? total + pointsForEffort(item.effort) : total;
  }, 0);
}

export function reorderTodoItemsByVisibleOrder(
  state: DailyTodos,
  visibleIdsInOrder: string[],
  fromIndex: number,
  toIndex: number,
): DailyTodos {
  if (
    fromIndex < 0 ||
    fromIndex >= visibleIdsInOrder.length ||
    toIndex < 0 ||
    toIndex >= visibleIdsInOrder.length
  ) {
    return state;
  }

  const dropTargetId = visibleIdsInOrder[toIndex];
  const ids = [...visibleIdsInOrder];
  const [moved] = ids.splice(fromIndex, 1);
  let insertAt = ids.indexOf(dropTargetId);
  if (insertAt === -1) {
    return state;
  }
  if (fromIndex < toIndex) {
    insertAt += 1;
  }
  ids.splice(insertAt, 0, moved);

  const visibleSet = new Set(ids);
  const firstVisibleInFull = state.items.findIndex((item) => visibleSet.has(item.id));
  if (firstVisibleInFull === -1) {
    return state;
  }

  const before = state.items
    .slice(0, firstVisibleInFull)
    .filter((item) => !visibleSet.has(item.id));
  const after = state.items
    .slice(firstVisibleInFull)
    .filter((item) => !visibleSet.has(item.id));

  const byId = new Map(state.items.map((item) => [item.id, item]));
  const reorderedVisible = ids.map((id) => byId.get(id)!);

  return {
    ...state,
    items: [...before, ...reorderedVisible, ...after],
  };
}

export function addSubtaskToItem(
  state: DailyTodos,
  itemId: string,
  title: string,
): DailyTodos {
  const trimmed = title.trim();
  if (!trimmed) {
    return state;
  }

  const subtask: SubTask = { id: crypto.randomUUID(), title: trimmed };

  return {
    ...state,
    items: state.items.map((item) =>
      item.id === itemId ? { ...item, subtasks: [...item.subtasks, subtask] } : item,
    ),
  };
}

export function updateSubtaskOnItem(
  state: DailyTodos,
  itemId: string,
  subtaskId: string,
  title: string,
): DailyTodos {
  const trimmed = title.trim();
  if (!trimmed) {
    return state;
  }

  return {
    ...state,
    items: state.items.map((item) => {
      if (item.id !== itemId) {
        return item;
      }
      return {
        ...item,
        subtasks: item.subtasks.map((st) =>
          st.id === subtaskId ? { ...st, title: trimmed } : st,
        ),
      };
    }),
  };
}

export function deleteSubtaskFromItem(
  state: DailyTodos,
  itemId: string,
  subtaskId: string,
): DailyTodos {
  return {
    ...state,
    items: state.items.map((item) =>
      item.id === itemId
        ? { ...item, subtasks: item.subtasks.filter((st) => st.id !== subtaskId) }
        : item,
    ),
  };
}

export function reorderSubtasksOnItem(
  state: DailyTodos,
  itemId: string,
  fromIndex: number,
  toIndex: number,
): DailyTodos {
  return {
    ...state,
    items: state.items.map((item) => {
      if (item.id !== itemId) {
        return item;
      }
      const next = [...item.subtasks];
      if (
        fromIndex < 0 ||
        fromIndex >= next.length ||
        toIndex < 0 ||
        toIndex >= next.length
      ) {
        return item;
      }
      const dropTargetId = item.subtasks[toIndex]!.id;
      const [removed] = next.splice(fromIndex, 1);
      let insertAt = next.findIndex((st) => st.id === dropTargetId);
      if (insertAt === -1) {
        return item;
      }
      if (fromIndex < toIndex) {
        insertAt += 1;
      }
      next.splice(insertAt, 0, removed);
      return { ...item, subtasks: next };
    }),
  };
}
