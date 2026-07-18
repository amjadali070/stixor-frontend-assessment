import type { Status, Task } from "@/types/task";

import { StatusMenu } from "./StatusMenu";

interface QuickStatusSelectProps {
  task: Task;
  onStatusChange: (taskId: string, status: Status) => void;
  /** Task 9.1's 44px touch-target minimum, opt-in — the desktop table
   * (mouse-primary, data-dense by design since Phase 3) stays compact;
   * `TaskCardList` (touch-primary) passes this. An explicit prop rather
   * than an ambient breakpoint class, since this component doesn't know
   * which parent it's rendered inside. */
  touchTarget?: boolean;
  /** Forwarded to `StatusMenu` -- see its own doc comment. */
  className?: string;
}

/**
 * Task 8.2's inline status control, extracted out of `TaskTable` once
 * `TaskCardList` (Task 9.1) needed the identical control — same
 * "second consumer, extract now" pattern as `useDialogBehavior`/
 * `formatDueDate`. A thin wrapper around `StatusMenu` (styled with the same
 * per-status colors as `StatusBadge`, exported from there) rather than a
 * native `<select>` — the open option list of a native select is drawn by
 * the browser, not by our CSS, so it can't be themed consistently (or at
 * all in dark mode). Only rendered for tasks with a recognized status — the
 * desktop row and the mobile card both fall back to the read-only
 * `StatusBadge` (Task 3.8's defensive fallback) instead, since "pick a new
 * status" doesn't mean much when the current one is already corrupted.
 */
export function QuickStatusSelect({
  task,
  onStatusChange,
  touchTarget = false,
  className,
}: QuickStatusSelectProps) {
  return (
    <StatusMenu
      value={task.status}
      onChange={(status) => onStatusChange(task.id, status)}
      ariaLabel={`Change status for ${task.title}`}
      touchTarget={touchTarget}
      className={className}
    />
  );
}
