"use client";

import dynamic from "next/dynamic";
import { Suspense, useState } from "react";

import { ActiveFilterChips } from "@/components/filters/ActiveFilterChips";
import { FilterBar } from "@/components/filters/FilterBar";
import { MobileFilterSheet } from "@/components/filters/MobileFilterSheet";
import { SearchBar } from "@/components/filters/SearchBar";
import { FirstVisitHint } from "@/components/onboarding/FirstVisitHint";
import { ShortcutsHelp } from "@/components/onboarding/ShortcutsHelp";
import { TaskDetailPanel } from "@/components/task-detail/TaskDetailPanel";
import { ErrorBanner } from "@/components/task-list/ErrorBanner";
import { TaskTable } from "@/components/task-list/TaskTable";
import { TaskTableSkeleton } from "@/components/task-list/TaskTableSkeleton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { SpinnerIcon } from "@/components/ui/icons";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useDeleteWithUndo } from "@/hooks/useDeleteWithUndo";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useTasks } from "@/hooks/useTasks";
import { useTaskStore } from "@/lib/store/useTaskStore";

// Task 11.4: neither modal is needed for the initial dashboard render (both
// are gated behind `isCreateModalOpen`/`editingTaskId`, which start
// false/null) -- dynamically importing them keeps their code, and
// react-hook-form/zod's validation logic along with it, out of the initial
// bundle entirely, fetched only the first time a user actually opens one.
// `ssr: false` since a closed modal has no SSR/SEO value and this whole
// page is already a client component.
const CreateTaskModal = dynamic(
  () =>
    import("@/components/task-form/CreateTaskModal").then(
      (m) => m.CreateTaskModal,
    ),
  { ssr: false, loading: () => <ModalLoadingFallback /> },
);
const EditTaskModal = dynamic(
  () =>
    import("@/components/task-form/EditTaskModal").then((m) => m.EditTaskModal),
  { ssr: false, loading: () => <ModalLoadingFallback /> },
);

/** Brief loading state while a code-split modal's chunk downloads on its
 * first open -- otherwise a button click would appear to do nothing for
 * however long that fetch takes. */
function ModalLoadingFallback() {
  return (
    <div
      role="status"
      aria-label="Loading"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
    >
      <span className="text-primary-foreground">
        <SpinnerIcon className="h-8 w-8" />
      </span>
    </div>
  );
}

export default function DashboardPage() {
  const { tasks, isLoading, error, refetch } = useTasks();
  const selectedTaskId = useTaskStore((s) => s.selectedTaskId);
  const setSelectedTaskId = useTaskStore((s) => s.setSelectedTaskId);
  const deleteTasksWithUndo = useDeleteWithUndo();
  // Looked up from the raw (unfiltered) task list -- an open panel should
  // stay showing its task even if a filter change would hide that row.
  const selectedTask = tasks.find((t) => t.id === selectedTaskId) ?? null;

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const handleCreateTask = () => setIsCreateModalOpen(true);

  // Never stacked with TaskDetailPanel: opening either one closes the
  // detail panel first (see TaskDetailPanel's own doc comment) so exactly
  // one useDialogBehavior-driven dialog is ever mounted at a time.
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const editingTask = tasks.find((t) => t.id === editingTaskId) ?? null;

  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const deletingTask = tasks.find((t) => t.id === deletingTaskId) ?? null;

  // TaskTable owns the bulk-delete confirm dialog itself (selection state
  // lives there), but this still needs to know it's open -- otherwise
  // pressing "n" while it's up would stack the Create Task modal on top.
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);

  const hasStaleData = error !== null && tasks.length > 0;

  // Task 13.1: suppressed while any dialog is already open -- opening a
  // second one via shortcut would break the app's own "never stack two
  // dialogs" rule, and focusing search behind an open modal wouldn't do
  // anything useful anyway.
  const isAnyDialogOpen =
    !!selectedTask ||
    isCreateModalOpen ||
    !!editingTask ||
    !!deletingTask ||
    isBulkDeleteConfirmOpen;

  useKeyboardShortcuts({
    onFocusSearch: () => document.getElementById("task-search")?.focus(),
    onCreateTask: handleCreateTask,
    isAnyDialogOpen,
  });

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Tasks</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {isLoading ? "Loading…" : `${tasks.length} tasks`}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            onClick={handleCreateTask}
            className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring cursor-pointer rounded-md px-4 py-2 text-sm font-medium shadow-sm transition-all hover:shadow-md focus-visible:ring-2 focus-visible:outline-none"
          >
            + Create Task
          </button>
        </div>
      </header>

      {/* Task 12.1: points at search/filters/Create Task below, so it
          renders above all three rather than at the very end of the
          page. */}
      <FirstVisitHint />

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

      {/* Task 9.4: FilterBar's multi-group layout doesn't fit inline on a
          phone -- MobileFilterSheet (a "Filters" trigger + bottom sheet
          wrapping this same FilterBar) replaces it below `md`. */}
      <div className="mb-4">
        <Suspense
          fallback={
            <div className="bg-muted h-[52px] w-full animate-pulse rounded-md" />
          }
        >
          <div className="hidden md:block">
            <FilterBar />
          </div>
          <div className="md:hidden">
            <MobileFilterSheet />
          </div>
        </Suspense>
      </div>

      <Suspense fallback={null}>
        <ActiveFilterChips />
      </Suspense>

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
          <TaskTable
            onCreateTask={handleCreateTask}
            onBulkDeleteConfirmChange={setIsBulkDeleteConfirmOpen}
          />
        </Suspense>
      )}

      {selectedTask && (
        <TaskDetailPanel
          key={selectedTask.id}
          task={selectedTask}
          onClose={() => setSelectedTaskId(null)}
          onEdit={() => {
            setSelectedTaskId(null);
            setEditingTaskId(selectedTask.id);
          }}
          onDelete={() => {
            setSelectedTaskId(null);
            setDeletingTaskId(selectedTask.id);
          }}
        />
      )}

      {isCreateModalOpen && (
        <CreateTaskModal onClose={() => setIsCreateModalOpen(false)} />
      )}

      {editingTask && (
        <EditTaskModal
          key={editingTask.id}
          task={editingTask}
          onClose={() => setEditingTaskId(null)}
        />
      )}

      {deletingTask && (
        <ConfirmDialog
          title="Delete this task?"
          message="You can undo this for a few seconds after."
          confirmLabel="Delete"
          onConfirm={() => {
            deleteTasksWithUndo([deletingTask.id]);
            setDeletingTaskId(null);
          }}
          onCancel={() => {
            // Reopens the detail view rather than just closing outright --
            // a delete cancel means "I still want to look at this task,"
            // unlike a form cancel.
            const cancelledId = deletingTask.id;
            setDeletingTaskId(null);
            setSelectedTaskId(cancelledId);
          }}
        />
      )}

      <ShortcutsHelp />
    </main>
  );
}
