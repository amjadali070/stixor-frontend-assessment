import type { Task } from "@/types/task";

const URGENT_WINDOW_MS = 24 * 60 * 60 * 1000;

export type UrgencyReason = "overdue" | "due-soon";

/**
 * A task is urgent if it's overdue, or due within 24h and High priority.
 * `now` is injectable so callers (and tests) get deterministic results
 * instead of depending on the real clock.
 */
export function getUrgencyReason(
  task: Task,
  now: Date = new Date(),
): UrgencyReason | null {
  const due = new Date(task.dueDate).getTime();
  if (Number.isNaN(due)) return null;

  const msUntilDue = due - now.getTime();
  if (msUntilDue < 0) return "overdue";
  if (msUntilDue < URGENT_WINDOW_MS && task.priority === "High") {
    return "due-soon";
  }
  return null;
}

export function isUrgent(task: Task, now: Date = new Date()): boolean {
  return getUrgencyReason(task, now) !== null;
}
