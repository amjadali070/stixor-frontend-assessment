import { NoMatchesIcon } from "./icons";

interface NoMatchesEmptyStateProps {
  searchQuery: string;
  activeFilterCount: number;
  onClearFilters: () => void;
}

/** "Tasks exist but the active search/filters matched none" — distinct
 * from NoTasksEmptyState in icon, heading, and a secondary (not primary)
 * CTA, since clearing filters is a corrective action, not a conversion. */
export function NoMatchesEmptyState({
  searchQuery,
  activeFilterCount,
  onClearFilters,
}: NoMatchesEmptyStateProps) {
  const parts: string[] = [];
  if (searchQuery) parts.push(`“${searchQuery}”`);
  if (activeFilterCount > 0) {
    parts.push(
      `${activeFilterCount} active filter${activeFilterCount === 1 ? "" : "s"}`,
    );
  }

  return (
    <div className="border-border bg-surface flex flex-col items-center gap-3 rounded-lg border px-6 py-16 text-center">
      <NoMatchesIcon className="text-muted-foreground" />
      <h2 className="text-base font-semibold">No matching tasks</h2>
      <p className="text-muted-foreground max-w-sm text-sm">
        No tasks match {parts.join(" and ")}. Try adjusting your search or
        filters.
      </p>
      <button
        type="button"
        onClick={onClearFilters}
        className="border-border hover:bg-muted focus-visible:ring-ring mt-2 inline-flex cursor-pointer items-center rounded-md border px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
      >
        Clear filters
      </button>
    </div>
  );
}
