/** Shared small icons for filters/ components — extracted from SearchBar
 * once ActiveFilterChips needed the same "remove" glyph (see DECISIONS.md). */

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
