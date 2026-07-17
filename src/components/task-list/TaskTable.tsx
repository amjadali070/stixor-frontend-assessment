"use client";

import { format } from "date-fns";
import { useCallback } from "react";

import { useTaskStore } from "@/lib/store/useTaskStore";
import type { Task } from "@/types/task";

const COLUMNS = [
  "Title",
  "Customer",
  "Priority",
  "Status",
  "Due Date",
  "Assignee",
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
      <td className="min-h-11 truncate px-4 py-3 font-medium">{task.title}</td>
      <td className="px-4 py-3">
        <span className="block truncate">{task.customer.name}</span>
        {task.customer.company && (
          <span className="text-muted-foreground block truncate text-xs">
            {task.customer.company}
          </span>
        )}
      </td>
      <td className="px-4 py-3">{task.priority}</td>
      <td className="px-4 py-3">{task.status}</td>
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
      <table className="w-full min-w-[720px] border-collapse text-left text-sm">
        <caption className="sr-only">
          Customer success tasks: title, customer, priority, status, due date,
          and assignee. Rows open the task&apos;s details.
        </caption>
        <thead className="border-border bg-muted sticky top-0 z-10 border-b">
          <tr>
            {COLUMNS.map((column) => (
              <th
                key={column}
                scope="col"
                className="text-muted-foreground px-4 py-3 text-xs font-semibold tracking-wide uppercase"
              >
                {column}
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
