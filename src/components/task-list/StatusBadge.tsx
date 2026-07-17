import type { ComponentType } from "react";

import type { Status } from "@/types/task";

import { CheckCircleIcon, ClockIcon, OpenCircleIcon } from "./icons";

/**
 * Colors verified at ≥6.4:1 contrast (light: text-800 on bg-100; dark:
 * text-300 on 15%-alpha-500 composited over the app's dark surface). See
 * DECISIONS.md for the full contrast table. Chosen to never overlap the
 * PriorityBadge palette (red/amber/slate) so priority and status read as
 * distinct dimensions at a glance.
 */
const STATUS_STYLES: Record<
  Status,
  { Icon: ComponentType<{ className?: string }>; className: string }
> = {
  Open: {
    Icon: OpenCircleIcon,
    className:
      "bg-blue-100 text-blue-800 border-blue-200 dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-300",
  },
  "In Progress": {
    Icon: ClockIcon,
    className:
      "bg-violet-100 text-violet-800 border-violet-200 dark:border-violet-500/30 dark:bg-violet-500/15 dark:text-violet-300",
  },
  Completed: {
    Icon: CheckCircleIcon,
    className:
      "bg-green-100 text-green-800 border-green-200 dark:border-green-500/30 dark:bg-green-500/15 dark:text-green-300",
  },
};

interface StatusBadgeProps {
  status: Status;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const { Icon, className } = STATUS_STYLES[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium ${className}`}
    >
      <Icon className="shrink-0" />
      {status}
    </span>
  );
}
