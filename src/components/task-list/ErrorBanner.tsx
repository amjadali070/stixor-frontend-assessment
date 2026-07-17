import { WarningTriangleIcon } from "./icons";

interface ErrorBannerProps {
  message: string;
  onRetry: () => void;
}

/**
 * Reuses PriorityBadge's "High" red pairing (verified 6.80:1 light /
 * 8.10:1 dark contrast in Task 3.2) rather than deriving a new one.
 */
export function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  return (
    <div
      role="alert"
      className="mb-4 flex items-center justify-between gap-4 rounded-lg border border-red-200 bg-red-100 px-4 py-3 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-500/15 dark:text-red-300"
    >
      <span className="flex items-center gap-2">
        <WarningTriangleIcon className="shrink-0" />
        {message}
      </span>
      <button
        type="button"
        onClick={onRetry}
        className="shrink-0 cursor-pointer rounded-md border border-current px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors hover:bg-red-200 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-none dark:hover:bg-red-500/25"
      >
        Retry
      </button>
    </div>
  );
}
