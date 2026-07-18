"use client";

import type { ReactNode } from "react";

import { CheckIcon } from "@/components/ui/icons";
import { UNASSIGNED_FILTER_KEY } from "@/lib/utils/applyFilters";
import { getAssigneeOptions } from "@/lib/utils/getAssigneeOptions";
import { useFilters } from "@/hooks/useFilters";
import { useTaskStore } from "@/lib/store/useTaskStore";
import { PRIORITIES, STATUSES } from "@/types/task";

import { PRIORITY_STYLES } from "../task-list/PriorityBadge";
import { STATUS_STYLES } from "../task-list/StatusBadge";
import { SignalBarsIcon } from "../task-list/icons";

interface FilterChipProps {
  label: string;
  checked: boolean;
  onChange: () => void;
  icon?: ReactNode;
  /** The exact badge className for this value (from PRIORITY_STYLES/
   * STATUS_STYLES) — reused as-is rather than inventing a new "selected"
   * palette, so a checked filter chip is contrast-verified for free instead
   * of needing its own pass. Omitted for Assignee, which has no inherent
   * color, and falls back to the plain neutral/primary toggle instead. */
  colorClassName?: string;
}

/** Real checkbox (visually hidden) + a styled sibling pill, so the chip is
 * fully keyboard-operable and screen-reader-correct with zero custom JS for
 * focus/checked state — it's all native <input> behavior under the hood.
 *
 * Priority/Status chips are always tinted with the same color they filter
 * by (the exact PriorityBadge/StatusBadge classes), not just once checked —
 * a plain gray pill for "High" or "Completed" told the user nothing until
 * they'd already clicked it. Checking one thickens its border and adds a
 * checkmark rather than swapping to a different color, so "selected" reads
 * as an emphasis on the existing color, not a new one. */
function FilterChip({
  label,
  checked,
  onChange,
  icon,
  colorClassName,
}: FilterChipProps) {
  const colorClasses =
    colorClassName ??
    "border-border bg-surface text-foreground hover:bg-muted peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground";

  return (
    <label className="cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="peer sr-only"
      />
      <span
        className={`peer-focus-visible:ring-ring inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all peer-focus-visible:ring-2 ${colorClasses} ${
          checked && colorClassName
            ? "border-2 py-[calc(0.25rem_-_1px)] font-semibold"
            : ""
        }`}
      >
        {icon}
        {label}
        {checked && colorClassName && <CheckIcon className="shrink-0" />}
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
 * The full, spacious multi-group checkbox layout -- every option visible
 * and directly tappable at once, no extra open/close step per facet. Used
 * inside `MobileFilterSheet`, which already dedicates a full bottom sheet
 * to filtering, so there's no "fit in one row" pressure the way there is
 * for the inline desktop `FilterBar` (which instead uses `FilterDropdown`
 * per facet to stay compact). Assignee options are derived from currently
 * loaded tasks (not `lib/mock/seed.ts` directly, per the API-boundary
 * constraint), plus a synthetic "Unassigned" option using the same
 * sentinel key `applyFilters` checks against.
 */
export function FilterChipsPanel() {
  const { filters, toggleFilterValue } = useFilters();
  const tasks = useTaskStore((s) => s.tasks);
  const assigneeOptions = getAssigneeOptions(tasks);

  return (
    <div className="flex flex-wrap gap-4">
      <FilterGroup legend="Priority">
        {PRIORITIES.map((priority) => {
          const { level, className } = PRIORITY_STYLES[priority];
          return (
            <FilterChip
              key={priority}
              label={priority}
              checked={filters.priority.includes(priority)}
              onChange={() => toggleFilterValue("priority", priority)}
              icon={<SignalBarsIcon level={level} />}
              colorClassName={className}
            />
          );
        })}
      </FilterGroup>

      <FilterGroup legend="Status">
        {STATUSES.map((status) => {
          const { Icon, className } = STATUS_STYLES[status];
          return (
            <FilterChip
              key={status}
              label={status}
              checked={filters.status.includes(status)}
              onChange={() => toggleFilterValue("status", status)}
              icon={<Icon />}
              colorClassName={className}
            />
          );
        })}
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
