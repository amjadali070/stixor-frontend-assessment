"use client";

import { format } from "date-fns";
import { useCallback } from "react";

import { useTaskStore } from "@/lib/store/useTaskStore";
import { sortTasks } from "@/lib/utils/sortTasks";
import { getUrgencyReason } from "@/lib/utils/urgency";
import type { Task } from "@/types/task";

import { WarningTriangleIcon } from "./icons";
import { PriorityBadge } from "./PriorityBadge";
import { StatusBadge } from "./StatusBadge";

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

function formatDueDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? "No due date"
    : format(date, "MMM d, yyyy");
}

interface TaskRowProps {
  task: Task;
  onOpen: (id: string) => void;
  now: Date;
}

function TaskRow({ task, onOpen, now }: TaskRowProps) {
  const open = () => onOpen(task.id);
  const urgencyReason = getUrgencyReason(task, now);

  return (
    <tr
      tabIndex={0}
      onClick={open}
      onKeyDown={(event) => {
        // Space scrolls the page by default; Enter/Space both open the row.
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          open();
        }
      }}
      className="border-border hover:bg-muted focus-visible:bg-muted focus-visible:ring-ring group cursor-pointer border-b transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-inset"
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
            {task.title}
          </span>
        </span>
      </td>
      <td className="px-4 py-3">
        <span className="block truncate" title={task.customer.name}>
          {task.customer.name}
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
        <StatusBadge status={task.status} />
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

export function TaskTable() {
  const tasks = useTaskStore((s) => s.tasks);
  const setSelectedTaskId = useTaskStore((s) => s.setSelectedTaskId);

  // One snapshot per render, shared by the sort and every row's urgency
  // marker, so they always agree on "now" instead of drifting by
  // milliseconds across separate `new Date()` calls. Memoizing this
  // further is Task 11.2/11.3's job, not this one's.
  const now = new Date();
  const sortedTasks = sortTasks(tasks, now);

  const handleOpen = useCallback(
    (id: string) => setSelectedTaskId(id),
    [setSelectedTaskId],
  );

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
            <TaskRow key={task.id} task={task} onOpen={handleOpen} now={now} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
