import type { DailyTodos, SubTask, TodoItem } from "./types";
import {
  isTodoCategory,
  isTodoPriority,
  isTodoStatus,
  TODO_CATEGORIES,
  TODO_PRIORITIES,
} from "./types";
import { createEmptyDay } from "./state";

const STORAGE_PREFIX = "vulcan.daily.";

function getStorageKey(dateKey: string): string {
  return `${STORAGE_PREFIX}${dateKey}`;
}

function sanitizeSubtasks(raw: unknown): SubTask[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .map((entry): SubTask | null => {
      if (!entry || typeof entry !== "object") {
        return null;
      }
      const candidate = entry as Partial<SubTask>;
      if (typeof candidate.id !== "string" || typeof candidate.title !== "string") {
        return null;
      }
      const title = candidate.title.trim();
      if (!title) {
        return null;
      }
      return { id: candidate.id, title };
    })
    .filter((st): st is SubTask => st !== null);
}

function sanitizeItems(items: unknown): TodoItem[] {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item): TodoItem | null => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const candidate = item as Partial<TodoItem>;
      const statusCandidate = candidate.status;
      if (
        typeof candidate.id !== "string" ||
        typeof candidate.title !== "string" ||
        typeof candidate.createdAt !== "string" ||
        typeof candidate.points !== "number" ||
        typeof statusCandidate !== "string" ||
        !isTodoStatus(statusCandidate)
      ) {
        return null;
      }

      const categoryRaw =
        typeof candidate.category === "string" && isTodoCategory(candidate.category)
          ? candidate.category
          : TODO_CATEGORIES[TODO_CATEGORIES.length - 1];

      const priorityRaw =
        typeof candidate.priority === "string" && isTodoPriority(candidate.priority)
          ? candidate.priority
          : TODO_PRIORITIES[1];

      return {
        id: candidate.id,
        title: candidate.title,
        createdAt: candidate.createdAt,
        points: Math.max(0, Math.floor(candidate.points)),
        status: statusCandidate,
        category: categoryRaw,
        priority: priorityRaw,
        subtasks: sanitizeSubtasks(candidate.subtasks),
      };
    })
    .filter((item): item is TodoItem => item !== null);
}

export function loadDailyTodos(dateKey: string): DailyTodos {
  const key = getStorageKey(dateKey);
  const raw = localStorage.getItem(key);
  if (!raw) {
    return createEmptyDay(dateKey);
  }

  try {
    const parsed = JSON.parse(raw) as Partial<DailyTodos>;
    return {
      date: dateKey,
      items: sanitizeItems(parsed.items),
    };
  } catch {
    return createEmptyDay(dateKey);
  }
}

export function saveDailyTodos(state: DailyTodos): void {
  const key = getStorageKey(state.date);
  localStorage.setItem(key, JSON.stringify(state));
}
