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
