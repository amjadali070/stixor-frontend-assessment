import type { Priority } from "@/types/task";

import { SignalBarsIcon } from "./icons";

/**
 * Colors verified at ≥6.3:1 contrast (light: text-800 on bg-100; dark:
 * text-300 on 15%-alpha-500 composited over the app's dark surface). See
 * DECISIONS.md for the full contrast table.
 */
const PRIORITY_STYLES: Record<
  Priority,
  { level: 1 | 2 | 3; className: string }
> = {
  High: {
    level: 3,
    className:
      "bg-red-100 text-red-800 border-red-200 dark:border-red-500/30 dark:bg-red-500/15 dark:text-red-300",
  },
  Medium: {
    level: 2,
    className:
      "bg-amber-100 text-amber-800 border-amber-200 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300",
  },
  Low: {
    level: 1,
    className:
      "bg-slate-100 text-slate-700 border-slate-200 dark:border-slate-500/30 dark:bg-slate-500/15 dark:text-slate-300",
  },
};

interface PriorityBadgeProps {
  priority: Priority;
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const { level, className } = PRIORITY_STYLES[priority];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium ${className}`}
    >
      <SignalBarsIcon level={level} />
      {priority}
    </span>
  );
}
