/** Truly cross-cutting icons shared across feature areas (filters/,
 * task-detail/, ...). Started in components/filters/icons.tsx when only
 * SearchBar needed it; moved here once task-detail needed the same glyph
 * too — a generic "X/close" icon has no filters-specific meaning, so
 * importing it across feature-area boundaries was the wrong dependency
 * direction. See DECISIONS.md. */

interface IconProps {
  className?: string;
}

export function XIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      width="14"
      height="14"
      aria-hidden="true"
      className={className ?? "shrink-0"}
    >
      <line
        x1="4"
        y1="4"
        x2="12"
        y2="12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="12"
        y1="4"
        x2="4"
        y2="12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CheckCircleIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      width="16"
      height="16"
      aria-hidden="true"
      className={className ?? "shrink-0"}
    >
      <circle
        cx="8"
        cy="8"
        r="6.25"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M5.3 8.3 7.1 10 10.7 6.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function WarningTriangleIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      width="16"
      height="16"
      aria-hidden="true"
      className={className ?? "shrink-0"}
    >
      <path
        d="M8 2.4 14.1 12.8H1.9L8 2.4Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <line
        x1="8"
        y1="6.4"
        x2="8"
        y2="9.4"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <circle cx="8" cy="11.1" r="0.9" fill="currentColor" />
    </svg>
  );
}

export function SpinnerIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      width="14"
      height="14"
      aria-hidden="true"
      className={`motion-safe:animate-spin ${className ?? ""}`}
    >
      <circle
        cx="8"
        cy="8"
        r="6.25"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeOpacity="0.25"
      />
      <path
        d="M14.25 8a6.25 6.25 0 0 0-6.25-6.25"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
