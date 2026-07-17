"use client";

import { useEffect, useRef, type KeyboardEvent, type RefObject } from "react";

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * Shared modal/dialog behavior — extracted from TaskDetailPanel (Task 6.3/
 * 6.4) once CreateTaskModal needed the identical Escape/focus-trap/focus-
 * restore logic, rather than duplicating ~40 lines across both.
 *
 * - Escape closes via a global `document` listener (works regardless of
 *   where focus currently is — a robust safety net even with Tab trapped).
 * - On mount: captures the pre-open focus target and moves focus to
 *   `initialFocusRef` (or the container's first focusable element).
 * - On unmount: restores focus to whatever was captured.
 * - While mounted: Tab is trapped within the container's own focusable
 *   elements (call the returned `trapTab` from the container's onKeyDown).
 */
export function useDialogBehavior(
  containerRef: RefObject<HTMLElement | null>,
  onClose: () => void,
  initialFocusRef?: RefObject<HTMLElement | null>,
) {
  const triggerElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    triggerElementRef.current = document.activeElement as HTMLElement | null;
    const initial =
      initialFocusRef?.current ??
      containerRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
    initial?.focus();

    return () => {
      triggerElementRef.current?.focus();
    };
    // Intentionally run once per mount/unmount only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function trapTab(event: KeyboardEvent<HTMLElement>) {
    if (event.key !== "Tab" || !containerRef.current) return;

    const focusable =
      containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return { trapTab };
}
