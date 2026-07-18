import type { Priority } from "@/types/task";

import { QuestionMarkIcon, SignalBarsIcon } from "./icons";

/**
 * Colors verified at ≥6.3:1 contrast (light: text-800 on bg-100; dark:
 * text-300 on 15%-alpha-500 composited over the app's dark surface). See
 * DECISIONS.md for the full contrast table.
 */
export const PRIORITY_STYLES: Record<
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

// Verified 7.03:1 (light) / 6.28:1 (dark) contrast — see DECISIONS.md.
const UNKNOWN_CLASSNAME =
  "bg-zinc-100 text-zinc-600 border-zinc-300 border-dashed dark:border-zinc-500/40 dark:bg-zinc-500/10 dark:text-zinc-400";

interface PriorityBadgeProps {
  priority: Priority;
  /** Extra classes appended to the badge's own span -- lets a table column
   * force every badge to the same fixed width (`w-full justify-center`
   * inside a fixed-width centering wrapper) without hardcoding that here,
   * since TaskDetailPanel/ErrorBanner render this badge inline where its
   * default content-hugging width is the correct choice. */
  className?: string;
}

/**
 * `priority` is typed as `Priority`, but malformed/legacy runtime data can
 * violate that contract — the object lookup below must never throw, so an
 * unrecognized value falls back to a visibly distinct neutral badge instead.
 */
export function PriorityBadge({
  priority,
  className = "",
}: PriorityBadgeProps) {
  const style = PRIORITY_STYLES[priority];

  if (!style) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium ${UNKNOWN_CLASSNAME} ${className}`}
      >
        <QuestionMarkIcon />
        {priority == null ? "Unknown" : String(priority)}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium ${style.className} ${className}`}
    >
      <SignalBarsIcon level={style.level} />
      {priority}
    </span>
  );
}
