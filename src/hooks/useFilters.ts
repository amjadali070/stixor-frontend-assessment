"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";

import {
  EMPTY_FILTERS,
  useTaskStore,
  type TaskFilters,
} from "@/lib/store/useTaskStore";
import {
  readPersistedFilters,
  writePersistedFilters,
} from "@/lib/utils/persistedFilters";
import {
  applyFiltersToParams,
  FILTER_PARAM_KEYS,
  parseFiltersFromParams,
} from "@/lib/utils/urlFilters";

/**
 * Filter state synced both ways with the URL (?priority=&status=&assignee=).
 * On first render: URL wins if it has any filter param present (so shared
 * links reproduce the exact view); otherwise falls back to the last-used
 * filters persisted in localStorage (Task 5.4), then to none. Afterwards
 * every change writes through to store + URL + localStorage.
 */
export function useFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = useTaskStore((s) => s.filters);
  const setStoreFilters = useTaskStore((s) => s.setFilters);

  const hydrated = useRef(false);
  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;

    const params = new URLSearchParams(searchParams);
    const urlHasFilters = FILTER_PARAM_KEYS.some((key) => params.has(key));
    if (urlHasFilters) {
      setStoreFilters(parseFiltersFromParams(params));
    } else {
      setStoreFilters(readPersistedFilters() ?? EMPTY_FILTERS);
    }
  }, [searchParams, setStoreFilters]);

  const setFilters = useCallback(
    (next: TaskFilters) => {
      setStoreFilters(next);
      writePersistedFilters(next);
      const params = applyFiltersToParams(
        new URLSearchParams(searchParams),
        next,
      );
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams, setStoreFilters],
  );

  const toggleFilterValue = useCallback(
    <K extends keyof TaskFilters>(facet: K, value: TaskFilters[K][number]) => {
      const current = filters[facet] as string[];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      setFilters({ ...filters, [facet]: next });
    },
    [filters, setFilters],
  );

  const clearFilters = useCallback(() => {
    setFilters(EMPTY_FILTERS);
  }, [setFilters]);

  const hasActiveFilters =
    filters.priority.length > 0 ||
    filters.status.length > 0 ||
    filters.assignee.length > 0;

  return {
    filters,
    hasActiveFilters,
    setFilters,
    toggleFilterValue,
    clearFilters,
  };
}
