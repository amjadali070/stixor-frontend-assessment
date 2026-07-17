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
      className="cursor-pointer border-b border-zinc-200 transition-colors outline-none hover:bg-zinc-50 focus-visible:bg-zinc-50 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset dark:border-zinc-800 dark:hover:bg-zinc-900 dark:focus-visible:bg-zinc-900"
    >
      <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
        {task.title}
      </td>
      <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
        <span className="block">{task.customer.name}</span>
        {task.customer.company && (
          <span className="block text-xs text-zinc-500 dark:text-zinc-400">
            {task.customer.company}
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
        {task.priority}
      </td>
      <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
        {task.status}
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-zinc-700 dark:text-zinc-300">
        {formatDueDate(task.dueDate)}
      </td>
      <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
        {task.assignee?.name ?? (
          <span className="text-zinc-400 italic dark:text-zinc-500">
            Unassigned
          </span>
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
    <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
      <table className="w-full border-collapse text-left text-sm">
        <caption className="sr-only">
          Customer success tasks: title, customer, priority, status, due date,
          and assignee. Rows open the task&apos;s details.
        </caption>
        <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
          <tr>
            {COLUMNS.map((column) => (
              <th
                key={column}
                scope="col"
                className="px-4 py-3 text-xs font-semibold tracking-wide text-zinc-600 uppercase dark:text-zinc-400"
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
