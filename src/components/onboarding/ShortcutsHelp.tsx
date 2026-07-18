"use client";

import { useRef, useState } from "react";

import { XIcon } from "@/components/ui/icons";
import { useDialogBehavior } from "@/hooks/useDialogBehavior";

const SHORTCUTS = [
  { keys: ["/"], description: "Focus search" },
  { keys: ["n"], description: "Create new task" },
  { keys: ["Esc"], description: "Close any open dialog" },
] as const;

/**
 * Task 12.2: a small, easy-to-ignore "?" affordance (not a footer hint —
 * picking one of the task's two options) revealing Task 13.1's keyboard
 * shortcuts. Fixed bottom-right so it's reachable from anywhere on the
 * page without competing for space with the primary UI — hidden by
 * default in the sense that it adds one small, low-contrast button, not
 * that it's invisible; a new CSM can ignore it entirely, an experienced
 * one can find it. Reuses `useDialogBehavior` (Escape/backdrop/focus-trap)
 * like every other dialog in the app, even though this one is read-only,
 * for the same consistent behavior instead of a bespoke popover.
 */
export function ShortcutsHelp() {
  const [isOpen, setIsOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const { trapTab } = useDialogBehavior(dialogRef, () => setIsOpen(false));

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Keyboard shortcuts"
        title="Keyboard shortcuts"
        className="border-border bg-surface text-muted-foreground hover:text-foreground hover:bg-muted focus-visible:ring-ring fixed right-4 bottom-4 z-40 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border text-sm font-semibold shadow-md transition-colors focus-visible:ring-2 focus-visible:outline-none"
      >
        ?
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            aria-hidden="true"
            onClick={() => setIsOpen(false)}
          />

          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="shortcuts-help-heading"
            onKeyDown={trapTab}
            className="bg-surface relative flex w-full max-w-sm flex-col gap-4 rounded-lg p-6 shadow-xl"
          >
            <div className="flex items-center justify-between gap-4">
              <h2
                id="shortcuts-help-heading"
                className="text-base font-semibold"
              >
                Keyboard Shortcuts
              </h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close"
                className="text-muted-foreground hover:text-foreground hover:bg-muted focus-visible:ring-ring cursor-pointer rounded-full p-1.5 transition-colors focus-visible:ring-2 focus-visible:outline-none"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>

            <dl className="flex flex-col gap-3">
              {SHORTCUTS.map(({ keys, description }) => (
                <div
                  key={description}
                  className="flex items-center justify-between gap-4"
                >
                  <dt className="text-sm">{description}</dt>
                  <dd className="flex gap-1">
                    {keys.map((key) => (
                      <kbd
                        key={key}
                        className="border-border bg-muted rounded border px-2 py-1 font-mono text-xs"
                      >
                        {key}
                      </kbd>
                    ))}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      )}
    </>
  );
}
