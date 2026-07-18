"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { CheckIcon, ChevronDownIcon } from "@/components/ui/icons";
import { STATUSES, type Status } from "@/types/task";

import { STATUS_STYLES } from "./StatusBadge";

// A native <select>'s open option list is drawn by the browser/OS, not by
// our CSS -- the per-status colors below only ever reach the closed
// trigger. In practice that means the open list ignores dark mode
// entirely and, worse, uses the browser's own selected-item highlight
// (a solid accent fill with white text) that has no relationship to
// STATUS_STYLES, so two adjacent options can render in barely-related
// colors. This component replaces the native <select> in both
// QuickStatusSelect and BulkActionBar with a fully custom listbox so the
// open panel is themed exactly like the rest of the app.
const PANEL_WIDTH = 168;
const OPTION_HEIGHT = 36;
const VIEWPORT_MARGIN = 8;

const NEUTRAL_TRIGGER_CLASSNAME =
  "border-border bg-surface text-foreground hover:bg-muted";

interface StatusMenuProps {
  /** "" renders a neutral, unfilled trigger showing `placeholder` --
   * BulkActionBar's "nothing chosen yet" state. QuickStatusSelect always
   * passes a real Status, since it's changing an existing task. */
  value: Status | "";
  onChange: (status: Status) => void;
  ariaLabel: string;
  placeholder?: string;
  disabled?: boolean;
  /** Task 9.1's 44px touch-target minimum, opt-in -- see QuickStatusSelect. */
  touchTarget?: boolean;
  /** Extra classes appended to the trigger button -- lets QuickStatusSelect
   * force a fixed width (`w-full justify-center` inside a fixed-width
   * centering wrapper) so every status pill in the table lines up,
   * without baking that assumption into BulkActionBar's usage too. */
  className?: string;
}

export function StatusMenu({
  value,
  onChange,
  ariaLabel,
  placeholder = "Select status",
  disabled = false,
  touchTarget = false,
  className = "",
}: StatusMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  const isPlaceholder = value === "";
  const panelHeight = STATUSES.length * OPTION_HEIGHT + 8;

  function open() {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Viewport-clamped, not browser-decided: a native <select>'s popup is
    // positioned by the browser and can't be reasoned about at all. Fixed
    // (not absolute) coordinates plus a portal to <body> means neither a
    // virtualized row's own overflow:auto container nor a mobile card's
    // edge can clip or misplace this panel the way they could an
    // absolutely-positioned child.
    const openUpward =
      rect.bottom + panelHeight + VIEWPORT_MARGIN > window.innerHeight;
    let left = rect.left;
    if (left + PANEL_WIDTH > window.innerWidth - VIEWPORT_MARGIN) {
      left = window.innerWidth - PANEL_WIDTH - VIEWPORT_MARGIN;
    }
    left = Math.max(VIEWPORT_MARGIN, left);

    setCoords({
      top: openUpward ? rect.top - panelHeight - 4 : rect.bottom + 4,
      left,
    });
    setIsOpen(true);
  }

  function close(refocusTrigger: boolean) {
    setIsOpen(false);
    if (refocusTrigger) triggerRef.current?.focus();
  }

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) {
        return;
      }
      close(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close(true);
    }
    // A scrolled ancestor (the virtualized row's own scroll container, the
    // page itself) would leave this fixed-position panel visually detached
    // from its trigger -- simplest correct behavior is to close it, same
    // as most native/OS dropdowns do. `capture: true` catches scrolls on
    // any inner scroll container, not just the window itself.
    function handleScrollOrResize() {
      close(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const selected = panelRef.current?.querySelector<HTMLElement>(
      '[data-selected="true"]',
    );
    (
      selected ?? panelRef.current?.querySelector<HTMLElement>("button")
    )?.focus();
  }, [isOpen]);

  function handlePanelKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    const options = Array.from(
      panelRef.current?.querySelectorAll<HTMLElement>('[role="option"]') ?? [],
    );
    if (options.length === 0) return;
    const currentIndex = options.findIndex(
      (el) => el === document.activeElement,
    );
    const delta = event.key === "ArrowDown" ? 1 : -1;
    const nextIndex = (currentIndex + delta + options.length) % options.length;
    options[nextIndex]?.focus();
  }

  const triggerClassName = isPlaceholder
    ? NEUTRAL_TRIGGER_CLASSNAME
    : STATUS_STYLES[value].className;
  const TriggerIcon = isPlaceholder ? null : STATUS_STYLES[value].Icon;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-label={ariaLabel}
        onClick={(event) => {
          event.stopPropagation();
          if (isOpen) {
            close(false);
          } else {
            open();
          }
        }}
        onKeyDown={(event) => event.stopPropagation()}
        className={`relative focus-visible:ring-ring inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-full border px-2.5 text-xs font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 py-1 ${touchTarget ? "before:absolute before:-inset-y-2.5 before:inset-x-0" : ""} ${triggerClassName} ${className}`}
      >
        {TriggerIcon && <TriggerIcon className="shrink-0" />}
        {isPlaceholder ? placeholder : value}
        <ChevronDownIcon
          className={`shrink-0 transition-transform duration-150 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={panelRef}
            id={listboxId}
            role="listbox"
            aria-label={ariaLabel}
            style={{
              position: "fixed",
              top: coords.top,
              left: coords.left,
              width: PANEL_WIDTH,
            }}
            className="border-border bg-surface z-50 overflow-hidden rounded-lg border py-1 shadow-lg"
            onKeyDown={handlePanelKeyDown}
          >
            {STATUSES.map((status) => {
              const { className, Icon } = STATUS_STYLES[status];
              const selected = status === value;
              return (
                <button
                  key={status}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  data-selected={selected}
                  onClick={(event) => {
                    event.stopPropagation();
                    close(true);
                    if (status !== value) onChange(status);
                  }}
                  className="hover:bg-muted focus-visible:bg-muted flex w-full cursor-pointer items-center gap-2 px-2.5 py-1.5 text-left text-sm outline-none"
                >
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium ${className}`}
                  >
                    <Icon className="shrink-0" />
                    {status}
                  </span>
                  {selected && (
                    <CheckIcon className="text-primary ml-auto shrink-0" />
                  )}
                </button>
              );
            })}
          </div>,
          document.body,
        )}
    </>
  );
}
