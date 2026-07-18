"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  memo,
  useCallback,
  useEffect,
  useRef,
  type CSSProperties,
} from "react";
import { List, useListRef, type RowComponentProps } from "react-window";

import { useNow } from "@/hooks/useNow";
import { ApiError, updateTask } from "@/lib/api/tasks";
import { EMPTY_FILTERS, useTaskStore } from "@/lib/store/useTaskStore";
import { useToastStore } from "@/lib/store/useToastStore";
import { applyFilters, getActiveFilterCount } from "@/lib/utils/applyFilters";
import { formatDueDate } from "@/lib/utils/formatDueDate";
import { writePersistedFilters } from "@/lib/utils/persistedFilters";
import { sortTasks } from "@/lib/utils/sortTasks";
import { getUrgencyReason } from "@/lib/utils/urgency";
import {
  applyFiltersToParams,
  applySearchToParams,
} from "@/lib/utils/urlFilters";
import { VIRTUALIZATION_THRESHOLD } from "@/lib/utils/virtualization";
import { STATUSES, type Status, type Task } from "@/types/task";

import { HighlightedText } from "./HighlightedText";
import { WarningTriangleIcon } from "./icons";
import { NoMatchesEmptyState } from "./NoMatchesEmptyState";
import { NoTasksEmptyState } from "./NoTasksEmptyState";
import { PriorityBadge } from "./PriorityBadge";
import { QuickStatusSelect } from "./QuickStatusSelect";
import { StatusBadge } from "./StatusBadge";
import { TaskCardList } from "./TaskCardList";

// Explicit widths so `truncate` on the title/customer cells actually has a
// bound to clip against instead of the row growing to fit the longest
// title and pushing every other column off-screen. `shrink-0 grow-0` on
// each cell (Task 11.1) makes these percentages behave the same way
// `table-layout: fixed` used to, now that rows are flex divs, not <tr>.
const COLUMNS = [
  { label: "Title", width: "w-[28%]" },
  { label: "Customer", width: "w-[18%]" },
  { label: "Priority", width: "w-[12%]" },
  { label: "Status", width: "w-[14%]" },
  { label: "Due Date", width: "w-[14%]" },
  { label: "Assignee", width: "w-[14%]" },
] as const;

// Task 11.1: react-window can't virtualize real <tr> rows (it renders each
// row as an absolutely-positioned element, which breaks native table
// layout), so the row/header markup uses a div-based grid with explicit
// ARIA roles (role="table"/"row"/"columnheader"/"cell") -- Task 10.1's own
// pre-approved alternative to a native table -- regardless of row count.
// Below VIRTUALIZATION_THRESHOLD, the exact same row-rendering component
// is just `.map()`-ed directly with no virtualization overhead, since a
// few dozen simple rows render cheaply on their own and virtualizing them
// would only add complexity for no benefit.
const VIRTUALIZED_ROW_HEIGHT = 60;

interface TaskRowProps {
  task: Task;
  onOpen: (id: string) => void;
  now: Date;
  searchQuery: string;
  isRecentlyCreated: boolean;
  onStatusChange: (taskId: string, status: Status) => void;
  /** Only set when rendered inside react-window's virtualized List --
   * absolute positioning + a fixed height for that row's slot. */
  style?: CSSProperties;
}

/**
 * Task 11.2: wrapped in `React.memo` so an unrelated re-render of
 * `TaskTable` (typing in search before the debounce settles, a toast
 * elsewhere dismissing, another row's status changing) doesn't force
 * all ~180 rows to re-render too -- as long as `now`/`onOpen`/
 * `onStatusChange` stay referentially stable (via `useNow`/`useCallback`
 * in the parent) and this row's own `task`/`isRecentlyCreated` didn't
 * actually change, `memo`'s shallow comparison bails out.
 *
 * No longer owns its own scroll-into-view effect (Task 7.6) -- moved to
 * `TaskTable` itself, since a virtualized row that's scrolled out of the
 * visible window may not even be mounted, so it couldn't scroll itself
 * into view anyway. That also means one effect total instead of one per
 * row.
 */
const TaskRow = memo(function TaskRow({
  task,
  onOpen,
  now,
  searchQuery,
  isRecentlyCreated,
  onStatusChange,
  style,
}: TaskRowProps) {
  const open = () => onOpen(task.id);
  const urgencyReason = getUrgencyReason(task, now);
  const hasRecognizedStatus = (STATUSES as readonly string[]).includes(
    task.status,
  );

  return (
    <div
      role="row"
      data-task-id={task.id}
      tabIndex={0}
      onClick={open}
      onKeyDown={(event) => {
        // Space scrolls the page by default; Enter/Space both open the row.
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          open();
        }
      }}
      style={style}
      className={`border-border hover:bg-muted focus-visible:bg-muted focus-visible:ring-ring group flex cursor-pointer border-b transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-inset ${
        isRecentlyCreated ? "bg-primary/10" : ""
      }`}
    >
      <div
        role="cell"
        className={`shrink-0 grow-0 border-l-4 px-4 py-3 font-medium ${COLUMNS[0].width} ${
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
      </div>
      <div
        role="cell"
        className={`shrink-0 grow-0 px-4 py-3 ${COLUMNS[1].width}`}
      >
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
      </div>
      <div
        role="cell"
        className={`shrink-0 grow-0 px-4 py-3 ${COLUMNS[2].width}`}
      >
        <PriorityBadge priority={task.priority} />
      </div>
      <div
        role="cell"
        className={`shrink-0 grow-0 px-4 py-3 ${COLUMNS[3].width}`}
      >
        {hasRecognizedStatus ? (
          <QuickStatusSelect task={task} onStatusChange={onStatusChange} />
        ) : (
          <StatusBadge status={task.status} />
        )}
      </div>
      <div
        role="cell"
        className={`shrink-0 grow-0 px-4 py-3 font-mono whitespace-nowrap tabular-nums ${COLUMNS[4].width}`}
      >
        {formatDueDate(task.dueDate)}
      </div>
      <div
        role="cell"
        className={`shrink-0 grow-0 px-4 py-3 ${COLUMNS[5].width}`}
      >
        {task.assignee?.name ?? (
          <span className="text-muted-foreground italic">Unassigned</span>
        )}
      </div>
    </div>
  );
});
TaskRow.displayName = "TaskRow";

interface RowRendererProps {
  tasks: Task[];
  now: Date;
  searchQuery: string;
  recentlyCreatedTaskId: string | null;
  onOpen: (id: string) => void;
  onStatusChange: (taskId: string, status: Status) => void;
}

// The function react-window actually calls per visible row (index, style,
// and its own ariaAttributes, which we discard in favor of role="row" --
// see the module docblock above on role="table" vs role="grid").
function RowRenderer({
  index,
  style,
  tasks,
  now,
  searchQuery,
  recentlyCreatedTaskId,
  onOpen,
  onStatusChange,
}: RowComponentProps<RowRendererProps>) {
  const task = tasks[index];
  return (
    <TaskRow
      task={task}
      now={now}
      searchQuery={searchQuery}
      isRecentlyCreated={task.id === recentlyCreatedTaskId}
      onOpen={onOpen}
      onStatusChange={onStatusChange}
      style={style}
    />
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

  // Ticks once a minute, not once a render (Task 11.2) -- see useNow.ts.
  const now = useNow();

  const visibleTasks = applyFilters(tasks, filters, searchQuery);
  const sortedTasks = sortTasks(visibleTasks, now);
  const isVirtualized = sortedTasks.length > VIRTUALIZATION_THRESHOLD;

  const handleOpen = useCallback(
    (id: string) => setSelectedTaskId(id),
    [setSelectedTaskId],
  );

  // Task 8.2 + 8.3: optimistic status change with rollback on failure,
  // same pattern as Create/Edit. Task 11.2 needs this to be *stable*
  // across renders (it's passed to memoized TaskRow/TaskCard as a prop),
  // but the retry action calling this function by name recursively makes
  // a plain `useCallback` trip an eslint-plugin-react-hooks TDZ check
  // ("accessed before it is declared") -- the retry closure would read
  // `handleStatusChange` before its own `const` finishes initializing,
  // even though it's only actually invoked later (safe at runtime, but
  // the rule can't prove that). Routing the retry call through a ref
  // that's kept in sync every render sidesteps the self-reference
  // entirely while keeping `handleStatusChange` itself referentially
  // stable -- the standard "latest closure" pattern for exactly this.
  const handleStatusChangeRef =
    useRef<(taskId: string, status: Status) => void>(null);

  const handleStatusChange = useCallback(
    (taskId: string, status: Status) => {
      const previous = patchTask(taskId, { status });
      if (!previous) return;

      updateTask(taskId, { status })
        .then((updated) => {
          replaceTask(taskId, updated);
          addToast({
            message: `"${updated.title}" status changed to ${status}.`,
            variant: "success",
          });
        })
        .catch((err: unknown) => {
          replaceTask(taskId, previous);
          const message =
            err instanceof ApiError ? err.message : "Failed to update status.";
          addToast({
            message,
            variant: "error",
            action: {
              label: "Retry",
              onClick: () => handleStatusChangeRef.current?.(taskId, status),
            },
          });
        });
    },
    [patchTask, replaceTask, addToast],
  );

  // Refs can't be written during render (React Compiler-era lint rule) --
  // an effect keeps the ref in sync after each commit instead. The retry
  // button is only ever clicked well after mount/at least one effect
  // pass, so the ref is always populated by the time it's read.
  useEffect(() => {
    handleStatusChangeRef.current = handleStatusChange;
  }, [handleStatusChange]);

  const handleHighlightExpire = useCallback(
    () => setRecentlyCreatedTaskId(null),
    [setRecentlyCreatedTaskId],
  );

  // Task 7.6, moved out of TaskRow (see its docblock): scroll the newly
  // created row into view and clear the highlight after a beat. When
  // virtualized, the row may not be mounted at all if it's off-screen,
  // so this uses react-window's own imperative scrollToRow instead of
  // DOM scrollIntoView; when not virtualized, every row really is in the
  // DOM, so a plain querySelector + scrollIntoView still works.
  const listRef = useListRef(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!recentlyCreatedTaskId) return;
    const index = sortedTasks.findIndex((t) => t.id === recentlyCreatedTaskId);

    // Scrolling only makes sense if the new task is actually in the
    // current (filtered) view -- but the highlight flag still needs
    // clearing either way, otherwise a task created while a filter hid
    // it would leave `recentlyCreatedTaskId` set indefinitely.
    if (index !== -1) {
      if (isVirtualized) {
        listRef.current?.scrollToRow({
          index,
          align: "center",
          behavior: "smooth",
        });
      } else {
        containerRef.current
          ?.querySelector(
            `[data-task-id="${CSS.escape(recentlyCreatedTaskId)}"]`,
          )
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }

    const timeout = setTimeout(handleHighlightExpire, 2500);
    return () => clearTimeout(timeout);
  }, [
    recentlyCreatedTaskId,
    sortedTasks,
    isVirtualized,
    listRef,
    handleHighlightExpire,
  ]);

  const activeFilterCount = getActiveFilterCount(filters);
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
    <>
      {/* Task 9.1: the table doesn't work under ~768px -- TaskCardList
          replaces it below `md`, fed the exact same sortedTasks/handlers
          computed above so there's one source of truth. */}
      <div className="hidden md:block">
        <div
          ref={containerRef}
          role="table"
          aria-label="Customer success tasks: title, customer, priority, status, due date, and assignee. Rows open the task's details."
          className={`border-border bg-surface rounded-lg border ${
            isVirtualized ? "" : "max-h-[70vh] overflow-auto"
          }`}
        >
          <div role="rowgroup">
            <div
              role="row"
              className="border-border bg-muted sticky top-0 z-10 flex border-b"
            >
              {COLUMNS.map((column) => (
                <div
                  key={column.label}
                  role="columnheader"
                  className={`text-muted-foreground shrink-0 grow-0 px-4 py-3 text-xs font-semibold tracking-wide uppercase ${column.width}`}
                >
                  {column.label}
                </div>
              ))}
            </div>
          </div>

          <div role="rowgroup">
            {isVirtualized ? (
              <List
                listRef={listRef}
                rowCount={sortedTasks.length}
                rowHeight={VIRTUALIZED_ROW_HEIGHT}
                rowComponent={RowRenderer}
                rowProps={{
                  tasks: sortedTasks,
                  now,
                  searchQuery,
                  recentlyCreatedTaskId,
                  onOpen: handleOpen,
                  onStatusChange: handleStatusChange,
                }}
                style={{ height: "70vh" }}
              />
            ) : (
              sortedTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onOpen={handleOpen}
                  now={now}
                  searchQuery={searchQuery}
                  isRecentlyCreated={task.id === recentlyCreatedTaskId}
                  onStatusChange={handleStatusChange}
                />
              ))
            )}
          </div>
        </div>
      </div>

      <div className="md:hidden">
        <TaskCardList
          tasks={sortedTasks}
          now={now}
          searchQuery={searchQuery}
          recentlyCreatedTaskId={recentlyCreatedTaskId}
          onOpen={handleOpen}
          onHighlightExpire={handleHighlightExpire}
          onStatusChange={handleStatusChange}
        />
      </div>
    </>
  );
}
