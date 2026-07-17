import type { Task } from "@/types/task";

import { isUrgent } from "./urgency";

function dueTime(task: Task): number {
  const time = new Date(task.dueDate).getTime();
  // Unparseable dates sort last within their bucket rather than producing
  // NaN, which would make the comparator's result undefined per spec.
  return Number.isNaN(time) ? Number.POSITIVE_INFINITY : time;
}

/**
 * Default ordering: urgent tasks first, then due date ascending within
 * each group. Pure — returns a new array, never mutates `tasks`. `now` is
 * injectable (passed through to isUrgent) so results are deterministic
 * for testing.
 */
export function sortTasks(tasks: Task[], now: Date = new Date()): Task[] {
  return [...tasks].sort((a, b) => {
    const aUrgent = isUrgent(a, now);
    const bUrgent = isUrgent(b, now);
    if (aUrgent !== bUrgent) return aUrgent ? -1 : 1;
    return dueTime(a) - dueTime(b);
  });
}
