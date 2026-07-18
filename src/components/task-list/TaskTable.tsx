"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { List, useListRef, type RowComponentProps } from "react-window";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useDeleteWithUndo } from "@/hooks/useDeleteWithUndo";
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

import { BulkActionBar } from "./BulkActionBar";
import { HighlightedText } from "./HighlightedText";
import { WarningTriangleIcon } from "./icons";
import { NoMatchesEmptyState } from "./NoMatchesEmptyState";
import { NoTasksEmptyState } from "./NoTasksEmptyState";
import { PriorityBadge } from "./PriorityBadge";
import { QuickStatusSelect } from "./QuickStatusSelect";
import { StatusBadge } from "./StatusBadge";
import { TaskCardList } from "./TaskCardList";

// `grow-[N]` + `basis-0` (Task 11.1's replacement for literal `w-[X%]`)
// distributes the row's free space by ratio, same intent as before, but
// structurally can't overflow: percentage widths summed to 100% *in
// addition to* the checkbox column's fixed 40px, which meant every row
// was guaranteed to render 40px wider than its container (visible as a
// permanent horizontal scrollbar on the virtualized list, even though the
// page had plenty of unused width). Flex-grow distributes whatever space
// is actually left after the 40px checkbox column, so the six columns
// always sum to exactly 100% of what remains, never more.
//
// `min-w-0` (Title/Customer/Assignee) lets `truncate` do its job -- a flex
// item's default `min-width: auto` otherwise refuses to shrink a cell
// below its content's width, which is the other half of what caused the
// original overflow. Priority/Status/Due Date instead get a real
// `min-w-[Npx]` floor: their content (a badge, the status control, a
// `whitespace-nowrap` date) shouldn't ever be squeezed below its own
// natural size, but unlike the old `shrink-0`, that floor is an explicit
// pixel value verified against real content, not "whatever `w-[X%]`
// happens to compute to at a given viewport width."
const COLUMNS = [
  { label: "Title", className: "min-w-0 basis-0 grow-[28]" },
  { label: "Customer", className: "min-w-0 basis-0 grow-[18]" },
  { label: "Priority", className: "min-w-[132px] basis-0 grow-[12]" },
  { label: "Status", className: "min-w-[180px] basis-0 grow-[14]" },
  { label: "Due Date", className: "min-w-[104px] basis-0 grow-[14]" },
  { label: "Assignee", className: "min-w-0 basis-0 grow-[18]" },
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
  isSelected: boolean;
  onToggleSelect: (taskId: string) => void;
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
  isSelected,
  onToggleSelect,
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
        className="flex w-10 shrink-0 grow-0 items-center justify-center px-2 py-3"
      >
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(task.id)}
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
          aria-label={`Select ${task.title}`}
          className="accent-primary h-4 w-4 cursor-pointer"
        />
      </div>
      <div
        role="cell"
        className={`border-l-4 px-4 py-3 font-medium ${COLUMNS[0].className} ${
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
      <div role="cell" className={`px-4 py-3 ${COLUMNS[1].className}`}>
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
      <div role="cell" className={`px-4 py-3 ${COLUMNS[2].className}`}>
        {/* A fixed-width, centered slot so every priority pill in the
            column lines up regardless of label length ("Low" vs.
            "Medium") -- PriorityBadge itself stays content-hugging, since
            TaskDetailPanel/ErrorBanner use it inline where that's correct. */}
        <div className="mx-auto w-24">
          <PriorityBadge
            priority={task.priority}
            className="w-full justify-center"
          />
        </div>
      </div>
      <div role="cell" className={`px-4 py-3 ${COLUMNS[3].className}`}>
        <div className="mx-auto w-36">
          {hasRecognizedStatus ? (
            <QuickStatusSelect
              task={task}
              onStatusChange={onStatusChange}
              className="w-full"
            />
          ) : (
            <StatusBadge
              status={task.status}
              className="w-full justify-center"
            />
          )}
        </div>
      </div>
      <div
        role="cell"
        className={`px-4 py-3 font-mono whitespace-nowrap tabular-nums ${COLUMNS[4].className}`}
      >
        {formatDueDate(task.dueDate)}
      </div>
      <div role="cell" className={`px-4 py-3 ${COLUMNS[5].className}`}>
        <span className="block truncate">
          {task.assignee?.name ?? (
            <span className="text-muted-foreground italic">Unassigned</span>
          )}
        </span>
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
  selectedIds: Set<string>;
  onOpen: (id: string) => void;
  onStatusChange: (taskId: string, status: Status) => void;
  onToggleSelect: (taskId: string) => void;
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
  selectedIds,
  onOpen,
  onStatusChange,
  onToggleSelect,
}: RowComponentProps<RowRendererProps>) {
  const task = tasks[index];
  return (
    <TaskRow
      task={task}
      now={now}
      searchQuery={searchQuery}
      isRecentlyCreated={task.id === recentlyCreatedTaskId}
      isSelected={selectedIds.has(task.id)}
      onOpen={onOpen}
      onStatusChange={onStatusChange}
      onToggleSelect={onToggleSelect}
      style={style}
    />
  );
}

interface TaskTableProps {
  onCreateTask: () => void;
  /** The bulk-delete confirm dialog is owned here (selection state lives
   * here too), but page.tsx's keyboard-shortcut suppression needs to know
   * about *every* open dialog, not just the ones it renders itself --
   * without this, pressing "n" while this confirm is open would stack the
   * Create Task modal right on top of it. */
  onBulkDeleteConfirmChange?: (open: boolean) => void;
}

export function TaskTable({
  onCreateTask,
  onBulkDeleteConfirmChange,
}: TaskTableProps) {
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
  const deleteTasksWithUndo = useDeleteWithUndo();

  // Ticks once a minute, not once a render (Task 11.2) -- see useNow.ts.
  const now = useNow();

  const visibleTasks = applyFilters(tasks, filters, searchQuery);
  const sortedTasks = sortTasks(visibleTasks, now);
  const isVirtualized = sortedTasks.length > VIRTUALIZATION_THRESHOLD;

  const handleOpen = useCallback(
    (id: string) => setSelectedTaskId(id),
    [setSelectedTaskId],
  );

  // Task 13.2: selection lives here (not in the Zustand store) since it's
  // ephemeral, purely-UI state that nothing outside this component tree
  // needs -- shared between the desktop table and `TaskCardList` (both
  // rendered by this component), so a single "N selected" bulk action
  // bar works regardless of which layout is currently visible.
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkApplying, setIsBulkApplying] = useState(false);
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);

  useEffect(() => {
    onBulkDeleteConfirmChange?.(isBulkDeleteConfirmOpen);
  }, [isBulkDeleteConfirmOpen, onBulkDeleteConfirmChange]);

  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Scoped to the *currently visible* (filtered) tasks -- selecting
  // "all" while a search/filter is active selects what's actually on
  // screen, not the full unfiltered 180-task set the user isn't looking
  // at. Selections outside the current view (if any survived a filter
  // change) are preserved either way, not clobbered.
  const handleToggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const visibleIds = sortedTasks.map((t) => t.id);
      const allVisibleSelected =
        visibleIds.length > 0 && visibleIds.every((id) => next.has(id));
      if (allVisibleSelected) {
        visibleIds.forEach((id) => next.delete(id));
      } else {
        visibleIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }, [sortedTasks]);

  const handleClearSelection = useCallback(() => setSelectedIds(new Set()), []);

  // Task 13.2: bulk status update, same optimistic-patch/rollback pattern
  // as the single-row version (Task 8.3), just run across every selected
  // id via Promise.allSettled instead of one updateTask call. Takes `ids`
  // as an explicit argument rather than reading `selectedIds` from the
  // closure so a partial-failure retry can target *just* the ids that
  // actually failed, not whatever `selectedIds` has since become.
  async function applyBulkStatusChange(ids: string[], status: Status) {
    if (ids.length === 0) return;
    setIsBulkApplying(true);

    const previousById = new Map<string, Task>();
    for (const id of ids) {
      const previous = patchTask(id, { status });
      if (previous) previousById.set(id, previous);
    }

    const results = await Promise.allSettled(
      ids.map((id) =>
        updateTask(id, { status }).then((updated) => ({ id, updated })),
      ),
    );

    const failedIds: string[] = [];
    results.forEach((result, i) => {
      const id = ids[i];
      if (result.status === "fulfilled") {
        replaceTask(id, result.value.updated);
      } else {
        const previous = previousById.get(id);
        if (previous) replaceTask(id, previous);
        failedIds.push(id);
      }
    });

    setIsBulkApplying(false);
    setSelectedIds(failedIds.length === 0 ? new Set() : new Set(failedIds));

    const succeededCount = ids.length - failedIds.length;
    if (failedIds.length === 0) {
      addToast({
        message: `${succeededCount} task${succeededCount === 1 ? "" : "s"} updated to ${status}.`,
        variant: "success",
      });
    } else {
      addToast({
        message:
          succeededCount > 0
            ? `${succeededCount} updated, ${failedIds.length} failed to update.`
            : `Failed to update ${failedIds.length} task${failedIds.length === 1 ? "" : "s"}.`,
        variant: "error",
        action: {
          label: "Retry failed",
          onClick: () => void applyBulkStatusChange(failedIds, status),
        },
      });
    }
  }

  // Bulk delete goes through the same undo-window mechanism as the
  // single-task delete (useDeleteWithUndo) rather than a bespoke bulk
  // path -- "delete N tasks" doesn't need special-casing just because N
  // came from a selection instead of one row's menu.
  function handleConfirmBulkDelete() {
    setIsBulkDeleteConfirmOpen(false);
    deleteTasksWithUndo([...selectedIds]);
    setSelectedIds(new Set());
  }

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

  // Tri-state "select all" checkbox: checked when every currently-visible
  // task is selected, indeterminate when some (but not all) are. HTML
  // checkboxes have no declarative `indeterminate` JSX prop -- it's a DOM
  // property, not an attribute, so it has to be set imperatively.
  const selectAllRef = useRef<HTMLInputElement>(null);
  const selectedCountInView = sortedTasks.filter((t) =>
    selectedIds.has(t.id),
  ).length;
  const allVisibleSelected =
    sortedTasks.length > 0 && selectedCountInView === sortedTasks.length;
  const someVisibleSelected = selectedCountInView > 0 && !allVisibleSelected;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someVisibleSelected;
    }
  }, [someVisibleSelected]);

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
      <BulkActionBar
        selectedCount={selectedIds.size}
        isApplying={isBulkApplying}
        onApply={(status) =>
          void applyBulkStatusChange([...selectedIds], status)
        }
        onDelete={() => setIsBulkDeleteConfirmOpen(true)}
        onClear={handleClearSelection}
      />

      {isBulkDeleteConfirmOpen && (
        <ConfirmDialog
          title={`Delete ${selectedIds.size} task${selectedIds.size === 1 ? "" : "s"}?`}
          message="You can undo this for a few seconds after."
          confirmLabel="Delete"
          onConfirm={handleConfirmBulkDelete}
          onCancel={() => setIsBulkDeleteConfirmOpen(false)}
        />
      )}

      {/* Task 9.1: the table doesn't work under ~768px -- TaskCardList
          replaces it below `md`, fed the exact same sortedTasks/handlers
          computed above so there's one source of truth. */}
      <div className="hidden md:block">
        <div
          ref={containerRef}
          role="table"
          aria-label="Customer success tasks: title, customer, priority, status, due date, and assignee. Rows open the task's details."
          className={`border-border bg-surface rounded-lg border shadow-sm ${
            isVirtualized ? "" : "max-h-[70vh] overflow-auto"
          }`}
        >
          <div role="rowgroup">
            <div
              role="row"
              className="border-border bg-muted sticky top-0 z-10 flex border-b"
            >
              <div
                role="columnheader"
                className="flex w-10 shrink-0 grow-0 items-center justify-center px-2 py-3"
              >
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={handleToggleSelectAll}
                  aria-label={
                    allVisibleSelected
                      ? "Deselect all tasks"
                      : "Select all tasks"
                  }
                  className="accent-primary h-4 w-4 cursor-pointer"
                />
              </div>
              {COLUMNS.map((column) => (
                <div
                  key={column.label}
                  role="columnheader"
                  className={`text-muted-foreground px-4 py-3 text-xs font-semibold tracking-wide uppercase ${column.className}`}
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
                  selectedIds,
                  onOpen: handleOpen,
                  onStatusChange: handleStatusChange,
                  onToggleSelect: handleToggleSelect,
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
                  isSelected={selectedIds.has(task.id)}
                  onToggleSelect={handleToggleSelect}
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
          selectedIds={selectedIds}
          onOpen={handleOpen}
          onHighlightExpire={handleHighlightExpire}
          onStatusChange={handleStatusChange}
          onToggleSelect={handleToggleSelect}
        />
      </div>
    </>
  );
}
