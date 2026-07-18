"use client";

import { useSyncExternalStore } from "react";

export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "stixor-cs-theme-v1";
const THEME_CHANGE_EVENT = "stixor-theme-change";

function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark";
}

/**
 * The currently *effective* theme: an explicit `data-theme` override if
 * one is set (by `setTheme` below, or the before-hydration script in
 * layout.tsx), otherwise whatever `prefers-color-scheme` currently says.
 * Reading `data-theme` directly (rather than re-deriving from
 * `localStorage` here too) means there's exactly one place that decides
 * "what's the override" — this function only answers "what's currently
 * showing."
 */
function getSnapshot(): Theme {
  const attr = document.documentElement.getAttribute("data-theme");
  if (isTheme(attr)) return attr;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

// SSR has no `window`/`matchMedia` -- "light" matches the unconditional
// light values in globals.css's base `:root`, so this never disagrees
// with the actual server-rendered HTML.
function getServerSnapshot(): Theme {
  return "light";
}

function subscribe(onStoreChange: () => void): () => void {
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  mediaQuery.addEventListener("change", onStoreChange);
  window.addEventListener(THEME_CHANGE_EVENT, onStoreChange);
  return () => {
    mediaQuery.removeEventListener("change", onStoreChange);
    window.removeEventListener(THEME_CHANGE_EVENT, onStoreChange);
  };
}

/**
 * Sets an explicit theme override, persisted so it survives a reload
 * (Task 13.3). `localStorage`'s own `storage` event only fires in
 * *other* tabs/windows, never the one that made the change — dispatching
 * a custom event lets `useTheme`'s `useSyncExternalStore` subscription
 * notice the change in the same tab that called this.
 */
export function setTheme(theme: Theme): void {
  document.documentElement.setAttribute("data-theme", theme);
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Persistence is a convenience, not a correctness requirement -- the
    // theme still applies for this session, it just won't survive reload.
  }
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}

/**
 * `useSyncExternalStore`, not `useEffect` + `useState`, for the same
 * reason as `FirstVisitHint`'s dismissed flag: this value depends on
 * `window`/`matchMedia`/`data-theme`, none of which exist during SSR, so
 * reading it needs a server-snapshot fallback to avoid a hydration
 * mismatch and avoids `eslint-plugin-react-hooks`' "no synchronous
 * setState in an effect" rule entirely (there's no effect to have it in).
 */
export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
