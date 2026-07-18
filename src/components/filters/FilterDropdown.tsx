"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { CheckIcon, ChevronDownIcon } from "@/components/ui/icons";

// Same portal + fixed-position + viewport-clamped pattern as StatusMenu
// (see its own doc comment for why: a native <select multiple> can't be
// themed and its popup position can't be controlled). The difference here
// is this stays open across multiple toggles instead of closing on the
// first pick -- a facet like Status is usually filtered by more than one
// value at a time, so auto-closing after the first checkbox would mean
// re-opening the same menu for every additional value.
const VIEWPORT_MARGIN = 8;
const OPTION_ROW_HEIGHT = 36;
const SEARCH_ROW_HEIGHT = 44;
const MAX_PANEL_HEIGHT = 288;
const PANEL_WIDTH = 224;

export interface FilterDropdownOption {
  value: string;
  label: string;
  icon?: ReactNode;
  /** Badge className (PRIORITY_STYLES/STATUS_STYLES) for a colored pill
   * next to the checkbox; omitted for facets with no inherent color
   * (Assignee), which render as a plain label instead. */
  badgeClassName?: string;
}

interface FilterDropdownProps {
  label: string;
  options: FilterDropdownOption[];
  selected: string[];
  onToggle: (value: string) => void;
  /** Adds a search box pinned above the option list -- worth it for
   * Assignee, where scanning a long name list is slower than just typing a
   * few letters; not worth the extra control for Priority/Status, which
   * only ever have a handful of fixed values. */
  searchable?: boolean;
}

export function FilterDropdown({
  label,
  options,
  selected,
  onToggle,
  searchable = false,
}: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();

  const filteredOptions =
    searchable && query.trim() !== ""
      ? options.filter((option) =>
          option.label.toLowerCase().includes(query.trim().toLowerCase()),
        )
      : options;

  const listHeight = Math.min(
    MAX_PANEL_HEIGHT - (searchable ? SEARCH_ROW_HEIGHT : 0),
    Math.max(filteredOptions.length, 1) * OPTION_ROW_HEIGHT + 8,
  );
  const panelHeight = listHeight + (searchable ? SEARCH_ROW_HEIGHT : 0);

  function open() {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;

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
    setQuery("");
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
    // Scrolling the *page* out from under the trigger would leave this
    // fixed-position panel visually detached, so that should close it --
    // but scrolling *within the panel's own option list* is normal use
    // (that's the whole point of it being scrollable) and must not close
    // it. `capture: true` is what lets the window listener see the
    // option list's own scroll events at all (they don't bubble), so the
    // panel-contains check below is what tells the two cases apart.
    function handleScroll(event: Event) {
      if (panelRef.current?.contains(event.target as Node)) return;
      close(false);
    }
    function handleResize() {
      close(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleResize);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleResize);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (searchable) {
      searchInputRef.current?.focus();
    } else {
      panelRef.current?.querySelector<HTMLElement>("button")?.focus();
    }
  }, [isOpen, searchable]);

  function handlePanelKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    const items = Array.from(
      panelRef.current?.querySelectorAll<HTMLElement>('[role="option"]') ?? [],
    );
    if (items.length === 0) return;
    const currentIndex = items.findIndex((el) => el === document.activeElement);
    // Starting from the search input (currentIndex -1), either arrow just
    // enters the list at the top -- there's no "previous" option before it.
    const nextIndex =
      currentIndex === -1
        ? 0
        : (currentIndex + (event.key === "ArrowDown" ? 1 : -1) + items.length) %
          items.length;
    items[nextIndex]?.focus();
  }

  const count = selected.length;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        onClick={() => (isOpen ? close(false) : open())}
        className={`focus-visible:ring-ring inline-flex min-h-[38px] cursor-pointer items-center gap-1.5 rounded-md border px-3 text-sm font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-2 ${
          count > 0
            ? "border-primary/40 bg-primary/5 text-foreground"
            : "border-border bg-surface text-foreground hover:bg-muted"
        }`}
      >
        {label}
        {count > 0 && (
          <span className="bg-primary text-primary-foreground inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-semibold">
            {count}
          </span>
        )}
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
            style={{
              position: "fixed",
              top: coords.top,
              left: coords.left,
              width: PANEL_WIDTH,
              maxHeight: MAX_PANEL_HEIGHT,
            }}
            className="border-border bg-surface z-[60] flex flex-col overflow-hidden rounded-lg border shadow-lg"
            onKeyDown={handlePanelKeyDown}
          >
            {searchable && (
              <div className="border-border shrink-0 border-b p-1.5">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={`Search ${label.toLowerCase()}…`}
                  aria-label={`Search ${label.toLowerCase()}`}
                  className="bg-muted placeholder:text-muted-foreground w-full rounded-md border-none px-2 py-1.5 text-sm outline-none"
                />
              </div>
            )}

            <div
              role="listbox"
              aria-multiselectable="true"
              aria-label={label}
              className="overflow-y-auto py-1"
              style={{ maxHeight: listHeight }}
            >
              {filteredOptions.length === 0 ? (
                <p className="text-muted-foreground px-3 py-2 text-sm">
                  No matches.
                </p>
              ) : (
                filteredOptions.map((option) => {
                  const checked = selected.includes(option.value);
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="option"
                      aria-selected={checked}
                      onClick={() => onToggle(option.value)}
                      className="hover:bg-muted focus-visible:bg-muted flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-left text-sm outline-none"
                    >
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                          checked
                            ? "border-primary bg-primary"
                            : "border-border bg-surface"
                        }`}
                      >
                        {checked && (
                          <CheckIcon className="text-primary-foreground" />
                        )}
                      </span>
                      {option.badgeClassName ? (
                        <span
                          className={`inline-flex min-w-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium ${option.badgeClassName}`}
                        >
                          {option.icon}
                          <span className="truncate">{option.label}</span>
                        </span>
                      ) : (
                        <span className="min-w-0 truncate">{option.label}</span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
