"use client";

import { useEffect, useState } from "react";

const DEFAULT_INTERVAL_MS = 60_000;

/**
 * Task 11.2/11.3: `TaskTable` used to call `new Date()` directly in its
 * render body -- a fresh object every render, which defeats `React.memo`
 * on `TaskRow`/`TaskCard` the moment `now` is passed down as a prop
 * (every row would see a "changed" prop on every unrelated re-render,
 * e.g. a toast dismissing or another row's status changing). Ticking
 * once a minute is frequent enough that "overdue"/"due soon" badges
 * stay accurate, while the returned value stays referentially stable
 * between ticks so memoized rows can actually bail out.
 */
export function useNow(intervalMs: number = DEFAULT_INTERVAL_MS): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(interval);
  }, [intervalMs]);

  return now;
}
