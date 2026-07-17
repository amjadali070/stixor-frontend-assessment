"use client";

import { format } from "date-fns";
import { useCallback } from "react";

import { useTaskStore } from "@/lib/store/useTaskStore";
import type { Task } from "@/types/task";

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
}

function TaskRow({ task, onOpen }: TaskRowProps) {
  const open = () => onOpen(task.id);

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
      <td className="truncate px-4 py-3 font-medium" title={task.title}>
        {task.title}
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
          {tasks.map((task) => (
            <TaskRow key={task.id} task={task} onOpen={handleOpen} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
