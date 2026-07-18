"use client";

import { useRef, useState } from "react";

import { FilterIcon, XIcon } from "@/components/ui/icons";
import { useDialogBehavior } from "@/hooks/useDialogBehavior";
import { useFilters } from "@/hooks/useFilters";
import { getActiveFilterCount } from "@/lib/utils/applyFilters";

import { FilterBar } from "./FilterBar";

/**
 * Task 9.4: `FilterBar`'s multi-group checkbox layout takes too much
 * vertical space to sit inline on a phone (it'd push the task list below
 * the fold before a single row is visible). Below `md`, this replaces it
 * with a "Filters" trigger button (badge showing the active count) that
 * opens `FilterBar` — reused as-is, not duplicated — inside a bottom
 * sheet. `SearchBar` deliberately stays inline on both breakpoints (not
 * collapsed into the sheet too, despite the task naming it as a
 * candidate): search is used far more often than multi-select filters,
 * and hiding it behind an extra tap would cost both personas more than
 * it saves. See DECISIONS.md.
 *
 * Filters apply live (the same `useFilters().toggleFilterValue` `FilterBar`
 * already calls on desktop) — there's no separate "Apply" step anywhere
 * in this app, so "Done" below is just a close affordance, not a commit
 * action.
 */
export function MobileFilterSheet() {
  const [isOpen, setIsOpen] = useState(false);
  const { filters } = useFilters();
  const activeCount = getActiveFilterCount(filters);

  const dialogRef = useRef<HTMLDivElement>(null);
  const { trapTab } = useDialogBehavior(dialogRef, () => setIsOpen(false));

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="border-border bg-surface hover:bg-muted focus-visible:ring-ring relative inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-md border px-4 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
      >
        <FilterIcon />
        Filters
        {activeCount > 0 && (
          <span className="bg-primary text-primary-foreground ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-semibold">
            {activeCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div
            className="absolute inset-0 bg-black/40"
            aria-hidden="true"
            onClick={() => setIsOpen(false)}
          />

          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-filter-heading"
            onKeyDown={trapTab}
            className="bg-surface relative flex max-h-[85vh] w-full flex-col overflow-y-auto rounded-t-lg shadow-xl"
          >
            <div className="border-border flex items-center justify-between gap-4 border-b px-6 py-4">
              <h2 id="mobile-filter-heading" className="text-lg font-semibold">
                Filters
              </h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close"
                className="text-muted-foreground hover:text-foreground hover:bg-muted focus-visible:ring-ring flex min-h-[44px] min-w-[44px] shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors focus-visible:ring-2 focus-visible:outline-none"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="px-6 py-5">
              <FilterBar />
            </div>

            <div className="border-border mt-2 border-t px-6 py-4">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring min-h-[44px] w-full cursor-pointer rounded-md text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
