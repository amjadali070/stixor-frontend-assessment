"use client";

import { useSyncExternalStore } from "react";

import { InfoIcon, XIcon } from "@/components/ui/icons";

const DISMISSED_STORAGE_KEY = "stixor-cs-onboarding-dismissed-v1";
const listeners = new Set<() => void>();

function subscribe(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);
  return () => listeners.delete(onStoreChange);
}

function getSnapshot(): boolean {
  try {
    return window.localStorage.getItem(DISMISSED_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

// SSR has no localStorage -- render as "already dismissed" on the server
// so the client's first (hydration) render matches it exactly, then
// useSyncExternalStore re-checks the real value right after and re-renders
// if it differs. No effect, no setState-in-effect, no hydration mismatch.
function getServerSnapshot(): boolean {
  return true;
}

function dismiss(): void {
  try {
    window.localStorage.setItem(DISMISSED_STORAGE_KEY, "true");
  } catch {
    // Persistence is a convenience, not a correctness requirement -- if
    // this fails (private browsing, quota), the hint just reappears next
    // visit rather than the app breaking.
  }
  listeners.forEach((listener) => listener());
}

/**
 * Task 12.1: a single dismissible banner pointing at search, filters, and
 * Create Task, rather than three separately-positioned per-element
 * tooltips -- simpler to build correctly across every breakpoint (no
 * anchor-positioning math against elements that move between the mobile
 * card layout and desktop table), and just as effective at orienting a
 * new CSM on first load. Dismissal is permanent (Task 12.1's own
 * wording: "never reappears once closed").
 *
 * Reads the dismissed flag via `useSyncExternalStore`, not
 * `useEffect` + `useState` -- this is the hook React itself recommends
 * for a value backed by an external source that can differ between
 * server and client (no `window`/`localStorage` during SSR), and avoids
 * both a hydration mismatch and eslint-plugin-react-hooks' "no
 * synchronous setState in an effect" rule, since there's no effect here
 * at all.
 */
export function FirstVisitHint() {
  const isDismissed = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  if (isDismissed) return null;

  return (
    <div className="border-primary/30 bg-primary/5 mb-4 flex items-start gap-3 rounded-lg border px-4 py-3 text-sm">
      <span className="text-primary mt-0.5 shrink-0">
        <InfoIcon />
      </span>
      <p className="flex-1">
        New here? Use <strong>search</strong> to find tasks by title or
        customer, <strong>filters</strong> to narrow by priority, status, or
        assignee, or <strong>+ Create Task</strong> to add a new one.
      </p>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss hint"
        className="text-muted-foreground hover:text-foreground hover:bg-muted focus-visible:ring-ring shrink-0 cursor-pointer rounded-full p-1 transition-colors focus-visible:ring-2 focus-visible:outline-none"
      >
        <XIcon />
      </button>
    </div>
  );
}
