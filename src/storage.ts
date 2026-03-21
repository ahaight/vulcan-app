import type { DailyTodos, TodoItem } from "./types";
import { createEmptyDay } from "./state";
import { isTodoStatus } from "./types";

const STORAGE_PREFIX = "vulcan.daily.";

function getStorageKey(dateKey: string): string {
  return `${STORAGE_PREFIX}${dateKey}`;
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

      return {
        id: candidate.id,
        title: candidate.title,
        createdAt: candidate.createdAt,
        points: Math.max(0, Math.floor(candidate.points)),
        status: statusCandidate,
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
