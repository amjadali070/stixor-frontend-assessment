import type { Assignee, Task } from "@/types/task";

/**
 * Distinct assignees present in the currently loaded tasks, sorted by name.
 * Deliberately reads from already-loaded `Task[]`, not `lib/mock/seed.ts`
 * directly — Task 1.1 reserves seed data access to the API layer alone.
 * Also means filter options only ever show assignees who actually have
 * visible tasks, not a static roster that might include unused names.
 */
export function getAssigneeOptions(tasks: Task[]): Assignee[] {
  const byId = new Map<string, Assignee>();
  for (const task of tasks) {
    if (task.assignee) byId.set(task.assignee.id, task.assignee);
  }
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
}
