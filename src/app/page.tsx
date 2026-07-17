"use client";

import { TaskTable } from "@/components/task-list/TaskTable";
import { TaskTableSkeleton } from "@/components/task-list/TaskTableSkeleton";
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

      {/* Dedicated empty and error components land with later list-view
          tasks; this interim error text is a plain fallback until then. */}
      {isLoading ? (
        <TaskTableSkeleton />
      ) : error ? (
        <p className="text-destructive text-sm">{error}</p>
      ) : (
        <TaskTable />
      )}
    </main>
  );
}
