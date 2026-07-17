"use client";

import { TaskTable } from "@/components/task-list/TaskTable";
import { useTasks } from "@/hooks/useTasks";

export default function DashboardPage() {
  const { tasks, isLoading, error } = useTasks();

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Tasks</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {isLoading ? "Loading…" : `${tasks.length} tasks`}
        </p>
      </header>

      {/* Interim states; dedicated skeleton, empty, and error components land
          with the rest of the list-view work. */}
      {isLoading ? (
        <p className="text-muted-foreground text-sm">Loading tasks…</p>
      ) : error ? (
        <p className="text-destructive text-sm">{error}</p>
      ) : (
        <TaskTable />
      )}
    </main>
  );
}
