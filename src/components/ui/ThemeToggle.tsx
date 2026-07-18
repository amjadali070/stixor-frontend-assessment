"use client";

import { MoonIcon, SunIcon } from "@/components/ui/icons";
import { setTheme, useTheme } from "@/hooks/useTheme";

/**
 * Task 13.3: Tailwind `dark:` variants are already driven by the
 * `--*` custom properties in globals.css flipping under `data-theme` --
 * this button just toggles that attribute (and persists the choice).
 * Shows the icon for the theme a click would switch *to* (sun while
 * dark, moon while light), matching common toggle-button convention.
 */
export function ThemeToggle() {
  const theme = useTheme();

  return (
    <button
      type="button"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label={
        theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
      }
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className="border-border bg-surface text-muted-foreground hover:text-foreground hover:bg-muted focus-visible:ring-ring inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-md border transition-colors focus-visible:ring-2 focus-visible:outline-none"
    >
      {theme === "dark" ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
