"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";

import { useTaskStore } from "@/lib/store/useTaskStore";
import {
  applySearchToParams,
  parseSearchFromParams,
} from "@/lib/utils/urlFilters";

/**
 * Search query synced both ways with the URL (?q=). URL wins on first render
 * so a shared link reproduces the view. Debouncing is the input component's
 * job — this hook applies whatever it's given immediately.
 */
export function useSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const query = useTaskStore((s) => s.searchQuery);
  const setStoreQuery = useTaskStore((s) => s.setSearchQuery);

  const hydrated = useRef(false);
  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    setStoreQuery(parseSearchFromParams(new URLSearchParams(searchParams)));
  }, [searchParams, setStoreQuery]);

  const setQuery = useCallback(
    (next: string) => {
      setStoreQuery(next);
      const params = applySearchToParams(
        new URLSearchParams(searchParams),
        next,
      );
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams, setStoreQuery],
  );

  const clearQuery = useCallback(() => setQuery(""), [setQuery]);

  return { query, setQuery, clearQuery };
}
