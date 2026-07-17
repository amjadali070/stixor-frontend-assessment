import type { TaskFilters } from "@/lib/store/useTaskStore";
import { PRIORITIES, STATUSES, type Priority, type Status } from "@/types/task";

/**
 * Pure helpers for the URL contract: ?q=&priority=&status=&assignee=
 * Multi-value facets are comma-separated. Unknown values are dropped so a
 * hand-edited or stale URL can never put invalid state into the store.
 */

const QUERY_PARAM = "q";
export const FILTER_PARAM_KEYS = ["priority", "status", "assignee"] as const;

function parseList(params: URLSearchParams, key: string): string[] {
  const raw = params.get(key);
  if (!raw) return [];
  return raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

export function parseFiltersFromParams(params: URLSearchParams): TaskFilters {
  return {
    priority: parseList(params, "priority").filter((v): v is Priority =>
      (PRIORITIES as readonly string[]).includes(v),
    ),
    status: parseList(params, "status").filter((v): v is Status =>
      (STATUSES as readonly string[]).includes(v),
    ),
    assignee: parseList(params, "assignee"),
  };
}

export function parseSearchFromParams(params: URLSearchParams): string {
  return params.get(QUERY_PARAM) ?? "";
}

/** Writes filter facets into a copy of `base`, preserving unrelated params. */
export function applyFiltersToParams(
  base: URLSearchParams,
  filters: TaskFilters,
): URLSearchParams {
  const params = new URLSearchParams(base);
  for (const key of FILTER_PARAM_KEYS) {
    const values = filters[key];
    if (values.length > 0) {
      params.set(key, values.join(","));
    } else {
      params.delete(key);
    }
  }
  return params;
}

export function applySearchToParams(
  base: URLSearchParams,
  query: string,
): URLSearchParams {
  const params = new URLSearchParams(base);
  if (query) {
    params.set(QUERY_PARAM, query);
  } else {
    params.delete(QUERY_PARAM);
  }
  return params;
}
