"use client";

import { TaskTable } from "@/components/task-list/TaskTable";
import { useTasks } from "@/hooks/useTasks";

export default function DashboardPage() {
  const { tasks, isLoading, error } = useTasks();

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          Tasks
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {isLoading ? "Loading…" : `${tasks.length} tasks`}
        </p>
      </header>

      {/* Interim states; dedicated skeleton, empty, and error components land
          with the rest of the list-view work. */}
      {isLoading ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Loading tasks…
        </p>
      ) : error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : (
        <TaskTable />
      )}
    </main>
  );
}
