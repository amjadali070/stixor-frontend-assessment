"use client";

import { useEffect, useRef, useState } from "react";

import { useSearch } from "@/hooks/useSearch";

import { XIcon } from "./icons";

const DEBOUNCE_MS = 300;

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      width="16"
      height="16"
      aria-hidden="true"
      className="shrink-0"
    >
      <circle
        cx="7"
        cy="7"
        r="4.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <line
        x1="10.5"
        y1="10.5"
        x2="14"
        y2="14"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Controlled input, debounced 300ms before writing to the store/URL (via
 * Task 2.3's `useSearch`). Note: typing here doesn't yet visibly filter the
 * task list — that's Task 5.2's `applyFilters`, not this component's job.
 * See DECISIONS.md.
 */
export function SearchBar() {
  const { query, setQuery } = useSearch();
  const [inputValue, setInputValue] = useState(query);
  const [lastSyncedQuery, setLastSyncedQuery] = useState(query);
  const inputRef = useRef<HTMLInputElement>(null);

  // React's documented "adjust state when a prop changes" pattern: resync
  // from external query changes (URL hydration, a future "Clear filters"
  // action from Task 5.3) during render, not via a setState-in-effect,
  // which eslint-plugin-react-hooks flags as a derived-state anti-pattern.
  if (query !== lastSyncedQuery) {
    setLastSyncedQuery(query);
    setInputValue(query);
  }

  // Debounce: only push to the store/URL 300ms after typing stops.
  useEffect(() => {
    if (inputValue === query) return;
    const timeout = setTimeout(() => setQuery(inputValue), DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [inputValue, query, setQuery]);

  const handleClear = () => {
    // Immediate, not debounced — a pending timeout (if any) becomes a
    // no-op next render since inputValue and query both become "".
    setInputValue("");
    setQuery("");
    inputRef.current?.focus();
  };

  return (
    <div className="relative">
      <label htmlFor="task-search" className="sr-only">
        Search tasks by title or customer name
      </label>
      <span className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2">
        <SearchIcon />
      </span>
      <input
        ref={inputRef}
        id="task-search"
        type="search"
        value={inputValue}
        onChange={(event) => setInputValue(event.target.value)}
        placeholder="Search by title or customer…"
        className="border-border bg-surface focus-visible:ring-ring w-full rounded-md border py-2 pr-9 pl-9 text-sm outline-none focus-visible:ring-2 [&::-webkit-search-cancel-button]:appearance-none"
      />
      {inputValue && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search"
          className="text-muted-foreground hover:text-foreground focus-visible:ring-ring absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer rounded focus-visible:ring-2 focus-visible:outline-none"
        >
          <XIcon />
        </button>
      )}
    </div>
  );
}
