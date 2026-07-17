"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";

import {
  EMPTY_FILTERS,
  useTaskStore,
  type TaskFilters,
} from "@/lib/store/useTaskStore";
import {
  applyFiltersToParams,
  parseFiltersFromParams,
} from "@/lib/utils/urlFilters";

/**
 * Filter state synced both ways with the URL (?priority=&status=&assignee=).
 * On first render the URL is the source of truth (so shared links reproduce
 * the exact view); afterwards every change writes through to store + URL.
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
    setStoreFilters(parseFiltersFromParams(new URLSearchParams(searchParams)));
  }, [searchParams, setStoreFilters]);

  const setFilters = useCallback(
    (next: TaskFilters) => {
      setStoreFilters(next);
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
