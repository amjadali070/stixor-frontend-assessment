"use client";

import { XIcon } from "@/components/ui/icons";
import { useFilters } from "@/hooks/useFilters";
import { useTaskStore } from "@/lib/store/useTaskStore";
import { UNASSIGNED_FILTER_KEY } from "@/lib/utils/applyFilters";
import { getAssigneeOptions } from "@/lib/utils/getAssigneeOptions";

interface ChipProps {
  label: string;
  onRemove: () => void;
}

function Chip({ label, onRemove }: ChipProps) {
  return (
    <span className="bg-muted text-foreground border-border inline-flex items-center gap-1 rounded-full border py-1 pr-1 pl-3 text-xs font-medium">
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${label} filter`}
        className="hover:bg-border focus-visible:ring-ring cursor-pointer rounded-full p-1 transition-colors focus-visible:ring-2 focus-visible:outline-none"
      >
        <XIcon />
      </button>
    </span>
  );
}

/**
 * One removable chip per active filter *value* (not the search query,
 * which already has its own clear affordance from Task 4.3) plus a
 * "Clear all" action once 2+ are active. Scoped to filter facets only —
 * see DECISIONS.md for why this differs from NoMatchesEmptyState's
 * "Clear filters", which clears search too.
 */
export function ActiveFilterChips() {
  const { filters, toggleFilterValue, clearFilters } = useFilters();
  const tasks = useTaskStore((s) => s.tasks);
  const assigneeOptions = getAssigneeOptions(tasks);

  const totalActive =
    filters.priority.length + filters.status.length + filters.assignee.length;

  if (totalActive === 0) return null;

  const assigneeLabel = (id: string) =>
    id === UNASSIGNED_FILTER_KEY
      ? "Unassigned"
      : (assigneeOptions.find((a) => a.id === id)?.name ?? id);

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      {filters.priority.map((value) => (
        <Chip
          key={`priority-${value}`}
          label={value}
          onRemove={() => toggleFilterValue("priority", value)}
        />
      ))}
      {filters.status.map((value) => (
        <Chip
          key={`status-${value}`}
          label={value}
          onRemove={() => toggleFilterValue("status", value)}
        />
      ))}
      {filters.assignee.map((value) => (
        <Chip
          key={`assignee-${value}`}
          label={assigneeLabel(value)}
          onRemove={() => toggleFilterValue("assignee", value)}
        />
      ))}
      {totalActive >= 2 && (
        <button
          type="button"
          onClick={clearFilters}
          className="text-muted-foreground hover:text-foreground focus-visible:ring-ring cursor-pointer text-xs font-medium underline transition-colors focus-visible:ring-2 focus-visible:outline-none"
        >
          Clear all
        </button>
      )}
    </div>
  );
}
