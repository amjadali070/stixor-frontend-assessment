"use client";

import { ApiError, deleteTask } from "@/lib/api/tasks";
import { useTaskStore } from "@/lib/store/useTaskStore";
import { useToastStore } from "@/lib/store/useToastStore";
import type { Task } from "@/types/task";

// Long enough to notice and react to, short enough not to make deleting
// feel like it takes forever.
const UNDO_WINDOW_MS = 6000;

/**
 * Delete is the one genuinely irreversible action in this app, so instead
 * of calling the API the instant the user confirms, this removes the
 * task(s) from view immediately (so it still *feels* instant) and holds
 * the real API call behind a several-second "Undo" window instead. Undo
 * just re-inserts the already-known task objects back at their original
 * positions -- nothing was ever sent to the API in that case, so there's
 * nothing to reverse. If the window passes without Undo, the real delete
 * calls fire; if one of *those* fails, the task comes back with an error
 * toast, the same rollback-on-failure pattern used for every other
 * mutation here, just triggered later than usual.
 *
 * Shared by the single-task delete (TaskDetailPanel, via page.tsx) and
 * bulk delete (TaskTable's selection toolbar) rather than duplicated --
 * both are "delete N tasks," N is just 1 in one of the two cases.
 */
export function useDeleteWithUndo() {
  const removeTask = useTaskStore((s) => s.removeTask);
  const restoreTask = useTaskStore((s) => s.restoreTask);
  const addToast = useToastStore((s) => s.addToast);

  return function deleteTasksWithUndo(ids: string[]) {
    const removals = ids
      .map((id) => removeTask(id))
      .filter((r): r is { task: Task; index: number } => r !== undefined);
    if (removals.length === 0) return;

    let undone = false;

    function commit() {
      if (undone) return;
      void Promise.allSettled(removals.map((r) => deleteTask(r.task.id))).then(
        (results) => {
          const failed = removals.filter(
            (_, i) => results[i]?.status === "rejected",
          );
          if (failed.length === 0) return;

          // This far past the original action, reconstructing exact
          // original list positions isn't worth the complexity -- appending
          // to the end (a very large index, clamped by the store itself) is
          // a fine landing spot for the rare case an already-deferred
          // delete then also fails.
          failed.forEach((r) => restoreTask(r.task, Number.MAX_SAFE_INTEGER));

          const firstRejection = results.find(
            (r): r is PromiseRejectedResult => r.status === "rejected",
          );
          const message =
            firstRejection?.reason instanceof ApiError
              ? firstRejection.reason.message
              : `Failed to delete ${failed.length} task${failed.length === 1 ? "" : "s"}.`;
          addToast({ message, variant: "error" });
        },
      );
    }

    const timeoutId = setTimeout(commit, UNDO_WINDOW_MS);
    const count = removals.length;

    addToast({
      message: `${count} task${count === 1 ? "" : "s"} deleted.`,
      variant: "success",
      autoDismissMs: UNDO_WINDOW_MS,
      action: {
        label: "Undo",
        onClick: () => {
          undone = true;
          clearTimeout(timeoutId);
          // Reverse of removal order: each recorded `index` was relative
          // to the list state *after* every removal that came before it,
          // so restoring has to undo them last-removed-first (like a
          // stack) for everything to land back exactly where it was.
          [...removals].reverse().forEach((r) => restoreTask(r.task, r.index));
        },
      },
    });
  };
}
