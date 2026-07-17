"use client";

import { Suspense } from "react";

import { FilterBar } from "@/components/filters/FilterBar";
import { SearchBar } from "@/components/filters/SearchBar";
import { ErrorBanner } from "@/components/task-list/ErrorBanner";
import { TaskTable } from "@/components/task-list/TaskTable";
import { TaskTableSkeleton } from "@/components/task-list/TaskTableSkeleton";
import { useTasks } from "@/hooks/useTasks";

export default function DashboardPage() {
  const { tasks, isLoading, error, refetch } = useTasks();

  // TODO(Task 7.1): open CreateTaskModal. No-op until that exists.
  const handleCreateTask = () => {};

  const hasStaleData = error !== null && tasks.length > 0;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Tasks</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {isLoading ? "Loading…" : `${tasks.length} tasks`}
        </p>
      </header>

      {/* useSearchParams (inside useSearch/useFilters) needs a Suspense
          boundary so this static page can still prerender; fallbacks match
          each real control's height to avoid layout jump. */}
      <div className="mb-4 max-w-sm">
        <Suspense
          fallback={
            <div className="bg-muted h-[38px] w-full animate-pulse rounded-md" />
          }
        >
          <SearchBar />
        </Suspense>
      </div>

      <div className="mb-4">
        <Suspense
          fallback={
            <div className="bg-muted h-[52px] w-full animate-pulse rounded-md" />
          }
        >
          <FilterBar />
        </Suspense>
      </div>

      {error && (
        <ErrorBanner
          message={
            hasStaleData
              ? `Couldn't refresh tasks: ${error} Showing the last loaded data.`
              : error
          }
          onRetry={() => void refetch()}
        />
      )}

      {isLoading ? (
        <TaskTableSkeleton />
      ) : error && !hasStaleData ? null : (
        <Suspense fallback={<TaskTableSkeleton />}>
          <TaskTable onCreateTask={handleCreateTask} />
        </Suspense>
      )}
    </main>
  );
}
