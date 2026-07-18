"use client";

import { useFilters } from "@/hooks/useFilters";
import { useTaskStore } from "@/lib/store/useTaskStore";
import { UNASSIGNED_FILTER_KEY } from "@/lib/utils/applyFilters";
import { getAssigneeOptions } from "@/lib/utils/getAssigneeOptions";
import { PRIORITIES, STATUSES, type Priority, type Status } from "@/types/task";

import { FilterDropdown, type FilterDropdownOption } from "./FilterDropdown";
import { PRIORITY_STYLES } from "../task-list/PriorityBadge";
import { STATUS_STYLES } from "../task-list/StatusBadge";
import { SignalBarsIcon } from "../task-list/icons";

/**
 * Inline desktop filter bar: one compact "select"-style dropdown per facet
 * (Priority/Status/Assignee), all in a single row -- the multi-group
 * checkbox layout this replaced took three separate labeled rows and
 * wrapped unpredictably depending on how many assignees existed, which
 * didn't read as a "filter bar" so much as a form. `FilterDropdown` keeps
 * every option reachable (nothing hides behind truncation) while the
 * closed state stays a fixed, predictable size regardless of how many
 * values are selected. The old always-visible-chip layout wasn't wasted --
 * it's `FilterChipsPanel`, reused as-is inside `MobileFilterSheet`, where a
 * dedicated full-screen sheet has room for it and a second "open this
 * facet" tap would just add friction.
 */
export function FilterBar() {
  const { filters, toggleFilterValue } = useFilters();
  const tasks = useTaskStore((s) => s.tasks);
  const assigneeOptions = getAssigneeOptions(tasks);

  const priorityOptions: FilterDropdownOption[] = PRIORITIES.map((priority) => {
    const { level, className } = PRIORITY_STYLES[priority];
    return {
      value: priority,
      label: priority,
      icon: <SignalBarsIcon level={level} />,
      badgeClassName: className,
    };
  });

  const statusOptions: FilterDropdownOption[] = STATUSES.map((status) => {
    const { Icon, className } = STATUS_STYLES[status];
    return {
      value: status,
      label: status,
      icon: <Icon />,
      badgeClassName: className,
    };
  });

  const assigneeSelectOptions: FilterDropdownOption[] = [
    { value: UNASSIGNED_FILTER_KEY, label: "Unassigned" },
    ...assigneeOptions.map((assignee) => ({
      value: assignee.id,
      label: assignee.name,
    })),
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <FilterDropdown
        label="Priority"
        options={priorityOptions}
        selected={filters.priority}
        onToggle={(value) => toggleFilterValue("priority", value as Priority)}
      />
      <FilterDropdown
        label="Status"
        options={statusOptions}
        selected={filters.status}
        onToggle={(value) => toggleFilterValue("status", value as Status)}
      />
      <FilterDropdown
        label="Assignee"
        options={assigneeSelectOptions}
        selected={filters.assignee}
        onToggle={(value) => toggleFilterValue("assignee", value)}
        searchable
      />
    </div>
  );
}
