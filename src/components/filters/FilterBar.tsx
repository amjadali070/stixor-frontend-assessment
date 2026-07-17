"use client";

import type { ReactNode } from "react";

import { UNASSIGNED_FILTER_KEY } from "@/lib/utils/applyFilters";
import { getAssigneeOptions } from "@/lib/utils/getAssigneeOptions";
import { useFilters } from "@/hooks/useFilters";
import { useTaskStore } from "@/lib/store/useTaskStore";
import { PRIORITIES, STATUSES } from "@/types/task";

interface FilterChipProps {
  label: string;
  checked: boolean;
  onChange: () => void;
}

/** Real checkbox (visually hidden) + a styled sibling pill, so the chip is
 * fully keyboard-operable and screen-reader-correct with zero custom JS for
 * focus/checked state — it's all native <input> behavior under the hood. */
function FilterChip({ label, checked, onChange }: FilterChipProps) {
  return (
    <label className="cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="peer sr-only"
      />
      <span className="border-border bg-surface text-foreground hover:bg-muted peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:ring-ring inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors peer-focus-visible:ring-2">
        {label}
      </span>
    </label>
  );
}

interface FilterGroupProps {
  legend: string;
  children: ReactNode;
}

function FilterGroup({ legend, children }: FilterGroupProps) {
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
        {legend}
      </legend>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </fieldset>
  );
}

/**
 * Multi-select filters for priority, status, and assignee — all wired
 * through Task 2.3's `useFilters` hook. Assignee options are derived from
 * currently loaded tasks (not `lib/mock/seed.ts` directly, per Task 1.1's
 * API-boundary constraint), plus a synthetic "Unassigned" option using the
 * same sentinel key `applyFilters` (Task 5.2) checks against.
 */
export function FilterBar() {
  const { filters, toggleFilterValue } = useFilters();
  const tasks = useTaskStore((s) => s.tasks);
  const assigneeOptions = getAssigneeOptions(tasks);

  return (
    <div className="flex flex-wrap gap-4">
      <FilterGroup legend="Priority">
        {PRIORITIES.map((priority) => (
          <FilterChip
            key={priority}
            label={priority}
            checked={filters.priority.includes(priority)}
            onChange={() => toggleFilterValue("priority", priority)}
          />
        ))}
      </FilterGroup>

      <FilterGroup legend="Status">
        {STATUSES.map((status) => (
          <FilterChip
            key={status}
            label={status}
            checked={filters.status.includes(status)}
            onChange={() => toggleFilterValue("status", status)}
          />
        ))}
      </FilterGroup>

      <FilterGroup legend="Assignee">
        <FilterChip
          label="Unassigned"
          checked={filters.assignee.includes(UNASSIGNED_FILTER_KEY)}
          onChange={() => toggleFilterValue("assignee", UNASSIGNED_FILTER_KEY)}
        />
        {assigneeOptions.map((assignee) => (
          <FilterChip
            key={assignee.id}
            label={assignee.name}
            checked={filters.assignee.includes(assignee.id)}
            onChange={() => toggleFilterValue("assignee", assignee.id)}
          />
        ))}
      </FilterGroup>
    </div>
  );
}
