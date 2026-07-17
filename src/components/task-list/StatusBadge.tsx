import type { ComponentType } from "react";

import type { Status } from "@/types/task";

import {
  CheckCircleIcon,
  ClockIcon,
  OpenCircleIcon,
  QuestionMarkIcon,
} from "./icons";

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

// Verified 7.03:1 (light) / 6.28:1 (dark) contrast — see DECISIONS.md.
const UNKNOWN_CLASSNAME =
  "bg-zinc-100 text-zinc-600 border-zinc-300 border-dashed dark:border-zinc-500/40 dark:bg-zinc-500/10 dark:text-zinc-400";

interface StatusBadgeProps {
  status: Status;
}

/**
 * `status` is typed as `Status`, but malformed/legacy runtime data can
 * violate that contract — the object lookup below must never throw, so an
 * unrecognized value falls back to a visibly distinct neutral badge instead.
 */
export function StatusBadge({ status }: StatusBadgeProps) {
  const style = STATUS_STYLES[status];

  if (!style) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium ${UNKNOWN_CLASSNAME}`}
      >
        <QuestionMarkIcon />
        {status == null ? "Unknown" : String(status)}
      </span>
    );
  }

  const { Icon, className } = style;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium ${className}`}
    >
      <Icon className="shrink-0" />
      {status}
    </span>
  );
}
