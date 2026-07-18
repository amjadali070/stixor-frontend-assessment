"use client";

import { useEffect } from "react";

interface UseKeyboardShortcutsOptions {
  onFocusSearch: () => void;
  onCreateTask: () => void;
  /** Suppresses `/` and `n` while any dialog is already open -- opening a
   * second one via shortcut would violate the app's own "never stack two
   * dialogs" rule, and focusing search behind an open modal wouldn't do
   * anything useful anyway. `Esc` isn't handled here at all: every dialog
   * already closes itself on Escape via `useDialogBehavior`'s own global
   * listener, so there's nothing left for this hook to do for that key. */
  isAnyDialogOpen: boolean;
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT" ||
    target.isContentEditable
  );
}

/**
 * Task 13.1: `/` focuses search, `n` opens Create Task. Neither fires
 * while focus is already in a text input/textarea/select (typing a
 * literal "n" or "/" into a field must never be hijacked) -- checked via
 * the event's own `target`, not a ref, so it stays correct regardless of
 * which field currently has focus.
 */
export function useKeyboardShortcuts({
  onFocusSearch,
  onCreateTask,
  isAnyDialogOpen,
}: UseKeyboardShortcutsOptions): void {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (isTypingTarget(event.target) || isAnyDialogOpen) return;

      if (event.key === "/") {
        event.preventDefault();
        onFocusSearch();
      } else if (event.key === "n") {
        event.preventDefault();
        onCreateTask();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onFocusSearch, onCreateTask, isAnyDialogOpen]);
}
