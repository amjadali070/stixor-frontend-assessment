"use client";

import { useState } from "react";

import { SpinnerIcon } from "@/components/ui/icons";
import { STATUSES, type Status } from "@/types/task";

interface BulkActionBarProps {
  selectedCount: number;
  isApplying: boolean;
  onApply: (status: Status) => void;
  onClear: () => void;
}

/**
 * Task 13.2: appears whenever 1+ rows/cards are selected (shared between
 * `TaskTable` and `TaskCardList`, since selection state lives once in
 * `TaskTable` regardless of which layout is currently visible). Requires
 * an explicit "Apply" click rather than applying immediately on
 * selecting a status the way `QuickStatusSelect` does for a single row —
 * a bulk action's blast radius is bigger, so a small deliberate
 * confirmation step is worth the extra click here specifically.
 */
export function BulkActionBar({
  selectedCount,
  isApplying,
  onApply,
  onClear,
}: BulkActionBarProps) {
  const [pendingStatus, setPendingStatus] = useState<Status | "">("");

  if (selectedCount === 0) return null;

  return (
    <div
      role="toolbar"
      aria-label="Bulk actions"
      className="border-primary/30 bg-primary/5 mb-4 flex flex-wrap items-center gap-3 rounded-lg border px-4 py-3 text-sm"
    >
      <span className="font-medium">
        {selectedCount} task{selectedCount === 1 ? "" : "s"} selected
      </span>

      <select
        value={pendingStatus}
        onChange={(event) =>
          setPendingStatus(event.target.value as Status | "")
        }
        disabled={isApplying}
        aria-label="Change status to"
        className="border-border bg-surface focus-visible:ring-ring rounded-md border px-2 py-1.5 text-sm outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <option value="" disabled>
          Change status to…
        </option>
        {STATUSES.map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </select>

      <button
        type="button"
        disabled={!pendingStatus || isApplying}
        onClick={() => {
          if (!pendingStatus) return;
          onApply(pendingStatus);
          setPendingStatus("");
        }}
        className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring inline-flex cursor-pointer items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isApplying && <SpinnerIcon />}
        {isApplying ? "Applying…" : "Apply"}
      </button>

      <button
        type="button"
        onClick={onClear}
        disabled={isApplying}
        className="text-muted-foreground hover:text-foreground focus-visible:ring-ring cursor-pointer text-sm font-medium underline transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
      >
        Clear selection
      </button>
    </div>
  );
}
