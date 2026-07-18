"use client";

import { useEffect, useRef } from "react";

import { formatDueDate } from "@/lib/utils/formatDueDate";
import { getUrgencyReason } from "@/lib/utils/urgency";
import { STATUSES, type Status, type Task } from "@/types/task";

import { HighlightedText } from "./HighlightedText";
import { WarningTriangleIcon } from "./icons";
import { PriorityBadge } from "./PriorityBadge";
import { QuickStatusSelect } from "./QuickStatusSelect";
import { StatusBadge } from "./StatusBadge";

interface TaskCardProps {
  task: Task;
  onOpen: (id: string) => void;
  now: Date;
  searchQuery: string;
  isRecentlyCreated: boolean;
  onHighlightExpire: () => void;
  onStatusChange: (taskId: string, status: Status) => void;
}

function TaskCard({
  task,
  onOpen,
  now,
  searchQuery,
  isRecentlyCreated,
  onHighlightExpire,
  onStatusChange,
}: TaskCardProps) {
  const open = () => onOpen(task.id);
  const urgencyReason = getUrgencyReason(task, now);
  const cardRef = useRef<HTMLLIElement>(null);
  const hasRecognizedStatus = (STATUSES as readonly string[]).includes(
    task.status,
  );

  // Same highlight/scroll-into-view behavior as TaskRow (Task 7.6) — the
  // mobile card list gets a freshly created task scrolled into view too.
  useEffect(() => {
    if (!isRecentlyCreated) return;
    cardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    const timeout = setTimeout(onHighlightExpire, 2500);
    return () => clearTimeout(timeout);
  }, [isRecentlyCreated, onHighlightExpire]);

  return (
    <li
      ref={cardRef}
      role="button"
      tabIndex={0}
      onClick={open}
      aria-label={`Open details for ${task.title}`}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          open();
        }
      }}
      className={`border-border bg-surface active:bg-muted focus-visible:ring-ring flex min-h-[44px] cursor-pointer flex-col gap-2 border-b border-l-4 p-4 transition-colors duration-150 outline-none last:border-b-0 focus-visible:ring-2 focus-visible:ring-inset ${
        urgencyReason ? "border-l-destructive" : "border-l-transparent"
      } ${isRecentlyCreated ? "bg-primary/10" : ""}`}
    >
      <div className="flex min-w-0 items-start justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1.5">
          {urgencyReason && (
            <span
              role="img"
              aria-label={urgencyReason === "overdue" ? "Overdue" : "Due soon"}
              title={
                urgencyReason === "overdue" ? "Overdue" : "Due within 24 hours"
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
}

interface TaskCardListProps {
  tasks: Task[];
  now: Date;
  searchQuery: string;
  recentlyCreatedTaskId: string | null;
  onOpen: (id: string) => void;
  onHighlightExpire: () => void;
  onStatusChange: (taskId: string, status: Status) => void;
}

/**
 * Task 9.1: a phone-width table doesn't work — `TaskTable`'s own
 * `min-w-[720px]` forces a horizontal scroll, and desktop-density row
 * heights are too small a tap target. Shown instead of `TaskTable` below
 * `md` (768px, matching the point most content stops fitting a 6-column
 * table); fed the exact same sorted/filtered `tasks` and event handlers
 * `TaskTable` already computed, so this is presentation only, not a
 * second independent data source that could drift from the table's.
 *
 * Overflow (Task 9.3): long titles/customer names truncate with the
 * native `title` attribute for the full string — no separate tap-to-
 * expand affordance was built, since tapping the card already opens
 * `TaskDetailPanel`, which shows the untruncated text. Building a second
 * expand mechanism on the card itself would duplicate that for no gain.
 */
export function TaskCardList({
  tasks,
  now,
  searchQuery,
  recentlyCreatedTaskId,
  onOpen,
  onHighlightExpire,
  onStatusChange,
}: TaskCardListProps) {
  return (
    <ul className="border-border bg-surface max-h-[70vh] overflow-auto rounded-lg border">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          onOpen={onOpen}
          now={now}
          searchQuery={searchQuery}
          isRecentlyCreated={task.id === recentlyCreatedTaskId}
          onHighlightExpire={onHighlightExpire}
          onStatusChange={onStatusChange}
        />
      ))}
    </ul>
  );
}
