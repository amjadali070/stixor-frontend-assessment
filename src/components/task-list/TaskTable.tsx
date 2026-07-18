"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";

import { ApiError, updateTask } from "@/lib/api/tasks";
import { EMPTY_FILTERS, useTaskStore } from "@/lib/store/useTaskStore";
import { useToastStore } from "@/lib/store/useToastStore";
import { applyFilters } from "@/lib/utils/applyFilters";
import { formatDueDate } from "@/lib/utils/formatDueDate";
import { writePersistedFilters } from "@/lib/utils/persistedFilters";
import { sortTasks } from "@/lib/utils/sortTasks";
import { getUrgencyReason } from "@/lib/utils/urgency";
import {
  applyFiltersToParams,
  applySearchToParams,
} from "@/lib/utils/urlFilters";
import { STATUSES, type Status, type Task } from "@/types/task";

import { HighlightedText } from "./HighlightedText";
import { WarningTriangleIcon } from "./icons";
import { NoMatchesEmptyState } from "./NoMatchesEmptyState";
import { NoTasksEmptyState } from "./NoTasksEmptyState";
import { PriorityBadge } from "./PriorityBadge";
import { StatusBadge, STATUS_STYLES } from "./StatusBadge";

// Explicit widths (table-layout: fixed) so `truncate` on the title/customer
// cells actually has a bound to clip against instead of the table growing
// to fit the longest title and pushing every other column off-screen.
const COLUMNS = [
  { label: "Title", width: "w-[28%]" },
  { label: "Customer", width: "w-[18%]" },
  { label: "Priority", width: "w-[12%]" },
  { label: "Status", width: "w-[14%]" },
  { label: "Due Date", width: "w-[14%]" },
  { label: "Assignee", width: "w-[14%]" },
] as const;

interface QuickStatusSelectProps {
  task: Task;
  onStatusChange: (taskId: string, status: Status) => void;
}

/**
 * Task 8.2: inline status control, no detail view needed. Styled with the
 * same per-status colors as StatusBadge (STATUS_STYLES, exported from
 * there) for visual consistency. Only rendered for tasks with a
 * recognized status — Task 3.8's defensive StatusBadge fallback covers
 * the malformed-data case instead, since "pick a new status" doesn't
 * mean much when the current one is already corrupted.
 */
function QuickStatusSelect({ task, onStatusChange }: QuickStatusSelectProps) {
  const { className } = STATUS_STYLES[task.status];

  return (
    <select
      value={task.status}
      onChange={(event) =>
        onStatusChange(task.id, event.target.value as Status)
      }
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
      aria-label={`Change status for ${task.title}`}
      className={`focus-visible:ring-ring cursor-pointer rounded-full border px-2 py-0.5 text-xs font-medium outline-none focus-visible:ring-2 ${className}`}
    >
      {STATUSES.map((status) => (
        <option key={status} value={status}>
          {status}
        </option>
      ))}
    </select>
  );
}

interface TaskRowProps {
  task: Task;
  onOpen: (id: string) => void;
  now: Date;
  searchQuery: string;
  isRecentlyCreated: boolean;
  onHighlightExpire: () => void;
  onStatusChange: (taskId: string, status: Status) => void;
}

function TaskRow({
  task,
  onOpen,
  now,
  searchQuery,
  isRecentlyCreated,
  onHighlightExpire,
  onStatusChange,
}: TaskRowProps) {
  const open = () => onOpen(task.id);
  const urgencyReason = getUrgencyReason(task, now);
  const rowRef = useRef<HTMLTableRowElement>(null);
  const hasRecognizedStatus = (STATUSES as readonly string[]).includes(
    task.status,
  );

  // Task 7.6: scroll the newly created row into view and briefly highlight
  // it. The highlight clears itself (fading via the row's existing
  // transition-colors) rather than needing a separate fade-out animation.
  useEffect(() => {
    if (!isRecentlyCreated) return;
    rowRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    const timeout = setTimeout(onHighlightExpire, 2500);
    return () => clearTimeout(timeout);
  }, [isRecentlyCreated, onHighlightExpire]);

  return (
    <tr
      ref={rowRef}
      tabIndex={0}
      onClick={open}
      onKeyDown={(event) => {
        // Space scrolls the page by default; Enter/Space both open the row.
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          open();
        }
      }}
      className={`border-border hover:bg-muted focus-visible:bg-muted focus-visible:ring-ring group cursor-pointer border-b transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-inset ${
        isRecentlyCreated ? "bg-primary/10" : ""
      }`}
    >
      <td
        className={`border-l-4 px-4 py-3 font-medium ${
          urgencyReason ? "border-l-destructive" : "border-l-transparent"
        }`}
      >
        <span className="flex min-w-0 items-center gap-1.5">
          {urgencyReason && (
            <span
              role="img"
              aria-label={urgencyReason === "overdue" ? "Overdue" : "Due soon"}
              title={
                urgencyReason === "overdue" ? "Overdue" : "Due within 24 hours"
              }
              className="text-destructive shrink-0"
            >
              <WarningTriangleIcon />
            </span>
          )}
          <span className="min-w-0 truncate" title={task.title}>
            <HighlightedText text={task.title} query={searchQuery} />
          </span>
        </span>
      </td>
      <td className="px-4 py-3">
        <span className="block truncate" title={task.customer.name}>
          <HighlightedText text={task.customer.name} query={searchQuery} />
        </span>
        {task.customer.company && (
          <span
            className="text-muted-foreground block truncate text-xs"
            title={task.customer.company}
          >
            {task.customer.company}
          </span>
        )}
      </td>
      <td className="px-4 py-3">
        <PriorityBadge priority={task.priority} />
      </td>
      <td className="px-4 py-3">
        {hasRecognizedStatus ? (
          <QuickStatusSelect task={task} onStatusChange={onStatusChange} />
        ) : (
          <StatusBadge status={task.status} />
        )}
      </td>
      <td className="px-4 py-3 font-mono whitespace-nowrap tabular-nums">
        {formatDueDate(task.dueDate)}
      </td>
      <td className="px-4 py-3">
        {task.assignee?.name ?? (
          <span className="text-muted-foreground italic">Unassigned</span>
        )}
      </td>
    </tr>
  );
}

interface TaskTableProps {
  onCreateTask: () => void;
}

export function TaskTable({ onCreateTask }: TaskTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const tasks = useTaskStore((s) => s.tasks);
  const searchQuery = useTaskStore((s) => s.searchQuery);
  const filters = useTaskStore((s) => s.filters);
  const setSelectedTaskId = useTaskStore((s) => s.setSelectedTaskId);
  const recentlyCreatedTaskId = useTaskStore((s) => s.recentlyCreatedTaskId);
  const setRecentlyCreatedTaskId = useTaskStore(
    (s) => s.setRecentlyCreatedTaskId,
  );
  const patchTask = useTaskStore((s) => s.patchTask);
  const replaceTask = useTaskStore((s) => s.replaceTask);
  const clearFiltersInStore = useTaskStore((s) => s.clearFilters);
  const setSearchQueryInStore = useTaskStore((s) => s.setSearchQuery);
  const addToast = useToastStore((s) => s.addToast);

  // One snapshot per render, shared by the sort and every row's urgency
  // marker, so they always agree on "now" instead of drifting by
  // milliseconds across separate `new Date()` calls. Memoizing this
  // further is Task 11.2/11.3's job, not this one's.
  const now = new Date();

  const visibleTasks = applyFilters(tasks, filters, searchQuery);
  const sortedTasks = sortTasks(visibleTasks, now);

  const handleOpen = useCallback(
    (id: string) => setSelectedTaskId(id),
    [setSelectedTaskId],
  );

  const handleHighlightExpire = useCallback(
    () => setRecentlyCreatedTaskId(null),
    [setRecentlyCreatedTaskId],
  );

  // Task 8.2 + 8.3: optimistic status change with rollback on failure,
  // same pattern as Create/Edit (patch immediately, call the real API,
  // reconcile or roll back once it resolves). A plain function
  // declaration, not useCallback -- the retry action below calls this
  // function by name recursively, which a `const x = useCallback(() =>
  // ... x() ...)` self-reference trips an eslint-plugin-react-hooks TDZ
  // check on; a hoisted declaration (same pattern as CreateTaskModal/
  // EditTaskModal's attemptCreate/attemptUpdate) doesn't have that issue.
  function handleStatusChange(taskId: string, status: Status) {
    const previous = patchTask(taskId, { status });
    if (!previous) return;

    updateTask(taskId, { status })
      .then((updated) => replaceTask(taskId, updated))
      .catch((err: unknown) => {
        replaceTask(taskId, previous);
        const message =
          err instanceof ApiError ? err.message : "Failed to update status.";
        addToast({
          message,
          variant: "error",
          action: {
            label: "Retry",
            onClick: () => handleStatusChange(taskId, status),
          },
        });
      });
  }

  const activeFilterCount =
    filters.priority.length + filters.status.length + filters.assignee.length;
  const hasActiveSearchOrFilters = searchQuery !== "" || activeFilterCount > 0;

  // Builds one combined URLSearchParams and issues a single router.replace,
  // rather than calling useFilters().clearFilters() and useSearch().setQuery
  // back-to-back — each of those independently reads its own snapshot of
  // the current URL and writes a full replacement, so calling both in the
  // same tick raced: the second call's snapshot didn't yet reflect the
  // first's update, and clobbered it (filters clearing dropped `q` but
  // left `priority`/`status` in the URL). See DECISIONS.md.
  const handleClearFilters = useCallback(() => {
    clearFiltersInStore();
    setSearchQueryInStore("");
    // Bypasses useFilters().setFilters (see the race-condition note above),
    // so it must also clear the persisted copy directly (Task 5.4) —
    // otherwise a later reload would resurrect the filters just cleared.
    writePersistedFilters(EMPTY_FILTERS);
    const params = applySearchToParams(
      applyFiltersToParams(new URLSearchParams(searchParams), EMPTY_FILTERS),
      "",
    );
    const queryString = params.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
      scroll: false,
    });
  }, [
    clearFiltersInStore,
    setSearchQueryInStore,
    searchParams,
    pathname,
    router,
  ]);

  if (tasks.length === 0) {
    return <NoTasksEmptyState onCreateTask={onCreateTask} />;
  }

  if (hasActiveSearchOrFilters && sortedTasks.length === 0) {
    return (
      <NoMatchesEmptyState
        searchQuery={searchQuery}
        activeFilterCount={activeFilterCount}
        onClearFilters={handleClearFilters}
      />
    );
  }

  return (
    <div className="border-border bg-surface max-h-[70vh] overflow-auto rounded-lg border">
      <table className="w-full min-w-[720px] table-fixed border-collapse text-left text-sm">
        <caption className="sr-only">
          Customer success tasks: title, customer, priority, status, due date,
          and assignee. Rows open the task&apos;s details.
        </caption>
        <thead className="border-border bg-muted sticky top-0 z-10 border-b">
          <tr>
            {COLUMNS.map((column) => (
              <th
                key={column.label}
                scope="col"
                className={`text-muted-foreground px-4 py-3 text-xs font-semibold tracking-wide uppercase ${column.width}`}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedTasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onOpen={handleOpen}
              now={now}
              searchQuery={searchQuery}
              isRecentlyCreated={task.id === recentlyCreatedTaskId}
              onHighlightExpire={handleHighlightExpire}
              onStatusChange={handleStatusChange}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
