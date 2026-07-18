import { STATUSES, type Status, type Task } from "@/types/task";

import { STATUS_STYLES } from "./StatusBadge";

interface QuickStatusSelectProps {
  task: Task;
  onStatusChange: (taskId: string, status: Status) => void;
  /** Task 9.1's 44px touch-target minimum, opt-in — the desktop table
   * (mouse-primary, data-dense by design since Phase 3) stays compact;
   * `TaskCardList` (touch-primary) passes this. An explicit prop rather
   * than an ambient breakpoint class, since this component doesn't know
   * which parent it's rendered inside. */
  touchTarget?: boolean;
}

/**
 * Task 8.2's inline status control, extracted out of `TaskTable` once
 * `TaskCardList` (Task 9.1) needed the identical control — same
 * "second consumer, extract now" pattern as `useDialogBehavior`/
 * `formatDueDate`. Styled with the same per-status colors as `StatusBadge`
 * (`STATUS_STYLES`, exported from there) for visual consistency. Only
 * rendered for tasks with a recognized status — the desktop row and the
 * mobile card both fall back to the read-only `StatusBadge` (Task 3.8's
 * defensive fallback) instead, since "pick a new status" doesn't mean much
 * when the current one is already corrupted.
 */
export function QuickStatusSelect({
  task,
  onStatusChange,
  touchTarget = false,
}: QuickStatusSelectProps) {
  const { className } = STATUS_STYLES[task.status];

  return (
    <select
      value={task.status}
      onChange={(event) =>
        onStatusChange(task.id, event.target.value as Status)
      }
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
      aria-label={`Change status for ${task.title}`}
      className={`focus-visible:ring-ring cursor-pointer rounded-full border px-2 text-xs font-medium outline-none focus-visible:ring-2 ${touchTarget ? "min-h-[44px]" : "py-0.5"} ${className}`}
    >
      {STATUSES.map((status) => (
        <option key={status} value={status}>
          {status}
        </option>
      ))}
    </select>
  );
}
