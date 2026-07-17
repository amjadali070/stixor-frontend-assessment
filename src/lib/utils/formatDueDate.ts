import { format } from "date-fns";

/** Extracted from TaskTable once TaskDetailPanel needed the same
 * malformed-date-safe formatting (Task 3.8's guard, reused here). */
export function formatDueDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? "No due date"
    : format(date, "MMM d, yyyy");
}
