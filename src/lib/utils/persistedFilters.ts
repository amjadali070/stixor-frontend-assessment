import type { TaskFilters } from "@/lib/store/useTaskStore";
import { PRIORITIES, STATUSES, type Priority, type Status } from "@/types/task";

const FILTERS_STORAGE_KEY = "stixor-cs-filters-v1";

/**
 * Deliberately a small, self-contained module rather than reusing
 * urlFilters.ts's parsing — that module is already verified/working
 * against real URL behavior, and duplicating its ~6-line enum guard here
 * avoids risking a regression in it for the sake of a little sharing.
 */
function sanitize(raw: unknown): TaskFilters | null {
  if (typeof raw !== "object" || raw === null) return null;
  const candidate = raw as Record<string, unknown>;

  const priority = Array.isArray(candidate.priority)
    ? candidate.priority.filter((v): v is Priority =>
        (PRIORITIES as readonly string[]).includes(v as string),
      )
    : [];
  const status = Array.isArray(candidate.status)
    ? candidate.status.filter((v): v is Status =>
        (STATUSES as readonly string[]).includes(v as string),
      )
    : [];
  const assignee = Array.isArray(candidate.assignee)
    ? candidate.assignee.filter((v): v is string => typeof v === "string")
    : [];

  return { priority, status, assignee };
}

/** localStorage can be unavailable (SSR, private browsing, quota) or hold
 * corrupted/stale data — never throw, just fall back to "nothing stored". */
export function readPersistedFilters(): TaskFilters | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(FILTERS_STORAGE_KEY);
    if (!raw) return null;
    return sanitize(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function writePersistedFilters(filters: TaskFilters): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filters));
  } catch {
    // Persistence is a convenience, not a correctness requirement.
  }
}
