import { EmptyTasksIcon } from "./icons";

interface NoTasksEmptyStateProps {
  onCreateTask: () => void;
}

/** "No tasks exist at all" — distinct from NoMatchesEmptyState in icon,
 * heading, message, and a primary (not secondary) CTA, per Task 3.6's
 * constraint that the two cases must not share one generic component. */
export function NoTasksEmptyState({ onCreateTask }: NoTasksEmptyStateProps) {
  return (
    <div className="border-border bg-surface flex flex-col items-center gap-3 rounded-lg border px-6 py-16 text-center">
      <EmptyTasksIcon className="text-muted-foreground" />
      <h2 className="text-base font-semibold">No tasks yet</h2>
      <p className="text-muted-foreground max-w-sm text-sm">
        Get started by creating your first task to track customer success work.
      </p>
      <button
        type="button"
        onClick={onCreateTask}
        className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring mt-2 inline-flex cursor-pointer items-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
      >
        Create your first task
      </button>
    </div>
  );
}
