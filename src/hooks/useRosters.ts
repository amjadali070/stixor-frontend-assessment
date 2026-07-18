"use client";

import { useCallback, useEffect, useState } from "react";

import { getAssignees, getCustomers } from "@/lib/api/tasks";
import type { Assignee, Customer } from "@/types/task";

/**
 * Shared by CreateTaskModal and EditTaskModal — both need the full
 * canonical assignee/customer roster (not the task-derived filter options
 * from Task 5.1's getAssigneeOptions/getCustomerOptions, which would be
 * empty when opened with zero tasks loaded). Extracted once EditTaskModal
 * needed the identical fetch/loading/error/retry logic CreateTaskModal
 * already had, rather than duplicating it.
 */
export function useRosters() {
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // The manual-retry path (a button click, not an effect) — safe for
  // eslint-plugin-react-hooks' set-state-in-effect check since it isn't
  // called from inside an effect body itself.
  const retry = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [assigneeList, customerList] = await Promise.all([
        getAssignees(),
        getCustomers(),
      ]);
      setAssignees(assigneeList);
      setCustomers(customerList);
    } catch {
      setError("Couldn't load assignees and customers.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Inlined rather than calling `retry` from here: calling an externally
  // defined (useCallback-wrapped) function from inside an effect tripped
  // react-hooks/set-state-in-effect, even though the actual setState calls
  // are the same either way. A self-contained effect body (matching the
  // original CreateTaskModal pattern from Task 7.1) doesn't trigger it.
  useEffect(() => {
    let cancelled = false;

    async function loadOnMount() {
      setIsLoading(true);
      setError(null);
      try {
        const [assigneeList, customerList] = await Promise.all([
          getAssignees(),
          getCustomers(),
        ]);
        if (cancelled) return;
        setAssignees(assigneeList);
        setCustomers(customerList);
      } catch {
        if (!cancelled) setError("Couldn't load assignees and customers.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadOnMount();
    return () => {
      cancelled = true;
    };
  }, []);

  return { assignees, customers, isLoading, error, retry };
}
