import type { TaskFilters } from "@/lib/store/useTaskStore";
import type { Task } from "@/types/task";

export const UNASSIGNED_FILTER_KEY = "unassigned";

/**
 * Shared by `TaskTable` (empty-state messaging) and the mobile "Filters"
 * trigger badge (Task 9.4) — one definition of "how many filters are
 * active" so the two can't silently drift out of agreement.
 */
export function getActiveFilterCount(filters: TaskFilters): number {
  return (
    filters.priority.length + filters.status.length + filters.assignee.length
  );
}

/**
 * Search AND every active filter facet, OR within a facet's selected values.
 * A facet with zero selected values doesn't filter anything (matches all).
 * Pure — returns a new array, never mutates `tasks`.
 */
export function applyFilters(
  tasks: Task[],
  filters: TaskFilters,
  query: string,
): Task[] {
  const trimmedQuery = query.trim().toLowerCase();

  return tasks.filter((task) => {
    const matchesSearch =
      !trimmedQuery ||
      task.title.toLowerCase().includes(trimmedQuery) ||
      task.customer.name.toLowerCase().includes(trimmedQuery);
    if (!matchesSearch) return false;

    if (
      filters.priority.length > 0 &&
      !filters.priority.includes(task.priority)
    ) {
      return false;
    }

    if (filters.status.length > 0 && !filters.status.includes(task.status)) {
      return false;
    }

    if (filters.assignee.length > 0) {
      const assigneeKey = task.assignee?.id ?? UNASSIGNED_FILTER_KEY;
      if (!filters.assignee.includes(assigneeKey)) return false;
    }

    return true;
  });
}
