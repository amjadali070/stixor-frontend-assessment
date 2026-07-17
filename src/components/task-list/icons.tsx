/**
 * Small inline SVG icons for task badges. Hand-built rather than pulled from
 * an icon library — keeps this to exactly the handful of glyphs needed and
 * matches the project's "no third-party UI kit" stance (see DECISIONS.md).
 * All are `aria-hidden` since the badge's visible text is the accessible name.
 */

interface IconProps {
  className?: string;
}

/** Three signal bars; `level` of them opaque, the rest faint — differs by
 * silhouette as well as color so priority reads without relying on hue. */
export function SignalBarsIcon({ level }: { level: 1 | 2 | 3 }) {
  const bars: { x: number; height: number }[] = [
    { x: 0, height: 4 },
    { x: 4, height: 7 },
    { x: 8, height: 10 },
  ];

  return (
    <svg
      viewBox="0 0 12 12"
      width="12"
      height="12"
      aria-hidden="true"
      className="shrink-0"
    >
      {bars.map((bar, index) => (
        <rect
          key={bar.x}
          x={bar.x}
          y={11 - bar.height}
          width="3"
          height={bar.height}
          rx="0.5"
          fill="currentColor"
          opacity={index < level ? 1 : 0.3}
        />
      ))}
    </svg>
  );
}

export function OpenCircleIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      width="12"
      height="12"
      aria-hidden="true"
      className={className ?? "shrink-0"}
    >
      <circle
        cx="8"
        cy="8"
        r="5.75"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export function ClockIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      width="12"
      height="12"
      aria-hidden="true"
      className={className ?? "shrink-0"}
    >
      <circle
        cx="8"
        cy="8"
        r="5.75"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M8 5v3.2l2.2 1.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CheckCircleIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      width="12"
      height="12"
      aria-hidden="true"
      className={className ?? "shrink-0"}
    >
      <circle
        cx="8"
        cy="8"
        r="5.75"
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

/** Urgency marker (overdue / due-soon-and-high-priority) — deliberately a
 * different silhouette from every badge icon above so it can't be confused
 * with a priority or status glyph at a glance. */
export function WarningTriangleIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      width="12"
      height="12"
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

/** Empty clipboard/checklist — "no tasks exist at all". Larger (hero-sized,
 * not inline) since it anchors a full empty-state block rather than sitting
 * beside text in a table cell. */
export function EmptyTasksIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      width="40"
      height="40"
      aria-hidden="true"
      className={className}
    >
      <rect
        x="10"
        y="6"
        width="28"
        height="36"
        rx="3"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <rect
        x="17"
        y="3"
        width="14"
        height="7"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <line
        x1="16"
        y1="21"
        x2="32"
        y2="21"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="16"
        y1="28"
        x2="32"
        y2="28"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="16"
        y1="35"
        x2="25"
        y2="35"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Magnifying glass with an X — "search/filters matched nothing". A
 * deliberately different silhouette from EmptyTasksIcon so the two empty
 * states are distinguishable even without reading the text. */
export function NoMatchesIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      width="40"
      height="40"
      aria-hidden="true"
      className={className}
    >
      <circle
        cx="21"
        cy="21"
        r="12"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <line
        x1="30"
        y1="30"
        x2="42"
        y2="42"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="17"
        y1="17"
        x2="25"
        y2="25"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="25"
        y1="17"
        x2="17"
        y2="25"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Unrecognized/malformed enum value — badge-sized (matches SignalBarsIcon's
 * 12px), deliberately distinct from every priority/status glyph so a fallback
 * badge never looks like it might be a real value. */
export function QuestionMarkIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      width="12"
      height="12"
      aria-hidden="true"
      className={className ?? "shrink-0"}
    >
      <circle
        cx="8"
        cy="8"
        r="5.75"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="2.2 1.6"
      />
      <text
        x="8"
        y="11"
        textAnchor="middle"
        fontSize="7.5"
        fontWeight="700"
        fill="currentColor"
        stroke="none"
      >
        ?
      </text>
    </svg>
  );
}
