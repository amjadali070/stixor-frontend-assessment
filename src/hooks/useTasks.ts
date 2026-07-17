"use client";

import { useCallback, useEffect } from "react";

import { getTasks } from "@/lib/api/tasks";
import { useTaskStore } from "@/lib/store/useTaskStore";

/**
 * Wires the API layer to the store: fetches on mount, exposes refetch().
 * The single entry point the dashboard needs for task data.
 */
export function useTasks() {
  const tasks = useTaskStore((s) => s.tasks);
  const isLoading = useTaskStore((s) => s.isLoading);
  const error = useTaskStore((s) => s.error);
  const setTasks = useTaskStore((s) => s.setTasks);
  const setLoading = useTaskStore((s) => s.setLoading);
  const setError = useTaskStore((s) => s.setError);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setTasks(await getTasks());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tasks.");
    } finally {
      setLoading(false);
    }
  }, [setTasks, setLoading, setError]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { tasks, isLoading, error, refetch };
}
