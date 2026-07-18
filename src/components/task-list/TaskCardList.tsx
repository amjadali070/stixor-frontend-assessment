"use client";

import { memo, useEffect, useRef, type CSSProperties } from "react";
import { List, useListRef, type RowComponentProps } from "react-window";

import { formatDueDate } from "@/lib/utils/formatDueDate";
import { getUrgencyReason } from "@/lib/utils/urgency";
import { VIRTUALIZATION_THRESHOLD } from "@/lib/utils/virtualization";
import { STATUSES, type Status, type Task } from "@/types/task";

import { HighlightedText } from "./HighlightedText";
import { WarningTriangleIcon } from "./icons";
import { PriorityBadge } from "./PriorityBadge";
import { QuickStatusSelect } from "./QuickStatusSelect";
import { StatusBadge } from "./StatusBadge";

// Measured directly off a rendered card (Task 11.1) -- every card is
// exactly this tall regardless of content, since (unlike the desktop
// table's customer cell) the card's customer line always renders as one
// truncated "name · company" span rather than two stacked lines.
const VIRTUALIZED_CARD_HEIGHT = 129;

interface TaskCardProps {
  task: Task;
  onOpen: (id: string) => void;
  now: Date;
  searchQuery: string;
  isRecentlyCreated: boolean;
  onStatusChange: (taskId: string, status: Status) => void;
  isSelected: boolean;
  onToggleSelect: (taskId: string) => void;
  /** Only set when rendered inside react-window's virtualized List. */
  style?: CSSProperties;
}

/**
 * Task 11.2: wrapped in `React.memo`, same reasoning as `TaskRow`. No
 * longer owns its own scroll-into-view effect (Task 7.6) -- moved to
 * `TaskCardList`, since a virtualized card scrolled out of the visible
 * window may not be mounted at all.
 */
const TaskCard = memo(function TaskCard({
  task,
  onOpen,
  now,
  searchQuery,
  isRecentlyCreated,
  onStatusChange,
  isSelected,
  onToggleSelect,
  style,
}: TaskCardProps) {
  const open = () => onOpen(task.id);
  const urgencyReason = getUrgencyReason(task, now);
  const hasRecognizedStatus = (STATUSES as readonly string[]).includes(
    task.status,
  );

  return (
    <li
      role="button"
      tabIndex={0}
      onClick={open}
      data-task-id={task.id}
      aria-label={`Open details for ${task.title}`}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          open();
        }
      }}
      style={style}
      className={`border-border bg-surface active:bg-muted focus-visible:ring-ring flex min-h-[44px] cursor-pointer flex-col gap-2 border-b border-l-4 p-4 transition-colors duration-150 outline-none last:border-b-0 focus-visible:ring-2 focus-visible:ring-inset ${
        urgencyReason ? "border-l-destructive" : "border-l-transparent"
      } ${isRecentlyCreated ? "bg-primary/10" : ""}`}
    >
      <div className="flex min-w-0 items-start justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(task.id)}
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
            aria-label={`Select ${task.title}`}
            className="accent-primary h-[18px] w-[18px] shrink-0 cursor-pointer"
          />
          <span className="flex min-w-0 items-center gap-1.5">
            {urgencyReason && (
              <span
                role="img"
                aria-label={
                  urgencyReason === "overdue" ? "Overdue" : "Due soon"
                }
                title={
                  urgencyReason === "overdue"
                    ? "Overdue"
                    : "Due within 24 hours"
                }
                className="text-destructive mt-0.5 shrink-0"
              >
                <WarningTriangleIcon />
              </span>
            )}
            <span
              className="min-w-0 truncate text-sm font-medium"
              title={task.title}
            >
              <HighlightedText text={task.title} query={searchQuery} />
            </span>
          </span>
        </span>
        <span className="shrink-0 font-mono text-xs whitespace-nowrap tabular-nums">
          {formatDueDate(task.dueDate)}
        </span>
      </div>

      <div className="min-w-0">
        <span
          className="text-muted-foreground block truncate text-xs"
          title={
            task.customer.company
              ? `${task.customer.name} · ${task.customer.company}`
              : task.customer.name
          }
        >
          <HighlightedText text={task.customer.name} query={searchQuery} />
          {task.customer.company ? ` · ${task.customer.company}` : ""}
        </span>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <PriorityBadge priority={task.priority} />
          {hasRecognizedStatus ? (
            <QuickStatusSelect
              task={task}
              onStatusChange={onStatusChange}
              touchTarget
            />
          ) : (
            <StatusBadge status={task.status} />
          )}
        </div>
        <span className="text-muted-foreground truncate text-xs">
          {task.assignee?.name ?? <span className="italic">Unassigned</span>}
        </span>
      </div>
    </li>
  );
});
TaskCard.displayName = "TaskCard";

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
    <TaskCard
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

interface TaskCardListProps {
  tasks: Task[];
  now: Date;
  searchQuery: string;
  recentlyCreatedTaskId: string | null;
  selectedIds: Set<string>;
  onOpen: (id: string) => void;
  onHighlightExpire: () => void;
  onStatusChange: (taskId: string, status: Status) => void;
  onToggleSelect: (taskId: string) => void;
}

/**
 * Task 9.1: a phone-width table doesn't work — shown instead of
 * `TaskTable` below `md`, fed the exact same sorted/filtered `tasks` and
 * event handlers `TaskTable` already computed.
 *
 * Task 11.1: above `VIRTUALIZATION_THRESHOLD`, rows render through
 * react-window's `List` (a real `<ul>` via `tagName="ul"`, each row a
 * real `<li>`); below it, the same `TaskCard` is just `.map()`-ed
 * directly. Overflow (Task 9.3) still needs no new mechanism -- see
 * `TaskCard`'s own truncate + native `title` attribute.
 */
export function TaskCardList({
  tasks,
  now,
  searchQuery,
  recentlyCreatedTaskId,
  selectedIds,
  onOpen,
  onHighlightExpire,
  onStatusChange,
  onToggleSelect,
}: TaskCardListProps) {
  const isVirtualized = tasks.length > VIRTUALIZATION_THRESHOLD;
  const listRef = useListRef(null);
  const containerRef = useRef<HTMLUListElement>(null);

  // Task 7.6, moved out of TaskCard (see its docblock) for the same
  // reason as TaskRow's: a virtualized, off-screen card may not be
  // mounted, so it can't scroll itself into view.
  useEffect(() => {
    if (!recentlyCreatedTaskId) return;
    const index = tasks.findIndex((t) => t.id === recentlyCreatedTaskId);

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

    const timeout = setTimeout(onHighlightExpire, 2500);
    return () => clearTimeout(timeout);
  }, [recentlyCreatedTaskId, tasks, isVirtualized, listRef, onHighlightExpire]);

  if (isVirtualized) {
    return (
      <List
        listRef={listRef}
        tagName="ul"
        className="border-border bg-surface rounded-lg border shadow-sm"
        rowCount={tasks.length}
        rowHeight={VIRTUALIZED_CARD_HEIGHT}
        rowComponent={RowRenderer}
        rowProps={{
          tasks,
          now,
          searchQuery,
          recentlyCreatedTaskId,
          selectedIds,
          onOpen,
          onStatusChange,
          onToggleSelect,
        }}
        style={{ height: "70vh" }}
      />
    );
  }

  return (
    <ul
      ref={containerRef}
      className="border-border bg-surface max-h-[70vh] overflow-auto rounded-lg border"
    >
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          onOpen={onOpen}
          now={now}
          searchQuery={searchQuery}
          isRecentlyCreated={task.id === recentlyCreatedTaskId}
          onStatusChange={onStatusChange}
          isSelected={selectedIds.has(task.id)}
          onToggleSelect={onToggleSelect}
        />
      ))}
    </ul>
  );
}
