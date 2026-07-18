"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";

import { SpinnerIcon, XIcon } from "@/components/ui/icons";
import { useDialogBehavior } from "@/hooks/useDialogBehavior";
import { useRosters } from "@/hooks/useRosters";
import { ApiError, updateTask } from "@/lib/api/tasks";
import { useTaskStore } from "@/lib/store/useTaskStore";
import { useToastStore } from "@/lib/store/useToastStore";
import type { Assignee, Task } from "@/types/task";

import {
  AssigneeField,
  CustomerField,
  DescriptionField,
  DueDateField,
  PriorityField,
  TitleField,
} from "./TaskFormFields";
import {
  createTaskFormSchema,
  localDateString,
  type TaskFormValues,
} from "./taskFormSchema";

interface EditTaskModalProps {
  task: Task;
  onClose: () => void;
}

/**
 * Edit Task form (Task 8.1) — reuses CreateTaskModal's exact field
 * components and schema, pre-populated from `task`, rather than a second
 * parallel form. Optimistic update + rollback (Task 8.3) uses the same
 * store primitives (patchTask/replaceTask) Phase 2 already built. Also
 * hosts Task 8.5's concurrency demo (see the dev-only section below).
 */
export function EditTaskModal({ task, onClose }: EditTaskModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const { trapTab } = useDialogBehavior(dialogRef, onClose);

  // Captured once, at first render, regardless of later store changes --
  // this is "the version I opened the form against," used to detect a
  // concurrent edit (Task 8.5) at submit time. useState (its initial value
  // is also only used on first render), not useRef -- passing a function
  // that reads a ref into handleSubmit() triggered
  // react-hooks/refs ("may read its value during render").
  const [openedUpdatedAt] = useState(task.updatedAt);

  const {
    assignees,
    customers,
    isLoading: isLoadingRosters,
    error: rosterError,
    retry: retryRosters,
  } = useRosters();

  const tasks = useTaskStore((s) => s.tasks);
  const patchTaskInStore = useTaskStore((s) => s.patchTask);
  const replaceTaskInStore = useTaskStore((s) => s.replaceTask);
  const addToast = useToastStore((s) => s.addToast);

  // localDateString, not a naive ISO slice -- the same UTC-vs-local
  // mismatch fixed in Task 7.2 would otherwise show the wrong day.
  const originalDueDate = localDateString(new Date(task.dueDate));

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormValues>({
    // Grandfathers in the task's own due date (if already overdue) and an
    // empty assignee (if already Unassigned) -- see taskFormSchema.ts.
    // Without this, editing any already-overdue or Unassigned seed task
    // without touching that specific field would fail validation on a
    // field the user never even looked at.
    resolver: zodResolver(
      createTaskFormSchema({
        existingDueDate: originalDueDate,
        allowEmptyAssignee: !task.assignee,
      }),
    ),
    defaultValues: {
      title: task.title,
      description: task.description,
      priority: task.priority,
      dueDate: originalDueDate,
      assigneeId: task.assignee?.id ?? "",
      customerId: task.customer.id,
    },
    mode: "onBlur",
  });

  // True while the simulated concurrent edit's own request is in flight.
  // The mock API's network delay is randomized per call (see
  // simulateNetwork in lib/api/tasks.ts), so if the user's own Save fired
  // while this was still pending, the two requests would race and
  // whichever response happened to land second would win -- not
  // necessarily the user's, even though their click came later. Blocking
  // Save until the simulated write fully resolves makes the user's save
  // always the last request in flight, so "last write wins" reliably
  // means "the user's last action wins," not "whichever random latency
  // was shorter."
  const [isSimulatingConcurrentEdit, setIsSimulatingConcurrentEdit] =
    useState(false);

  /**
   * Task 8.5: simulates "another tab" changing this task while the form
   * is still open, by writing directly to the store/API outside this
   * form's own state entirely. Always visible (not env-gated) so a
   * reviewer can exercise the concurrency behavior directly, same
   * reasoning as the permanent malformed demo task from Task 3.8.
   */
  function handleSimulateConcurrentEdit() {
    const current = tasks.find((t) => t.id === task.id);
    if (!current) return;
    const patch = { title: `${current.title} (edited elsewhere)` };
    patchTaskInStore(task.id, patch);
    setIsSimulatingConcurrentEdit(true);
    updateTask(task.id, patch)
      .then((updated) => replaceTaskInStore(task.id, updated))
      .catch(() => {
        // Demo-only call; if the simulated network fails, just leave the
        // optimistic patch in place rather than complicating the demo.
      })
      .finally(() => setIsSimulatingConcurrentEdit(false));
  }

  async function attemptUpdate(values: TaskFormValues) {
    // "" is a legitimate submission here (allowEmptyAssignee, for a task
    // that was already Unassigned) -- only bail if a *non-empty* id
    // doesn't resolve to a real assignee, which would mean stale roster
    // data rather than an intentional Unassigned choice.
    let assignee: Assignee | null = null;
    if (values.assigneeId) {
      const found = assignees.find((a) => a.id === values.assigneeId);
      if (!found) return;
      assignee = found;
    }
    const customer = customers.find((c) => c.id === values.customerId);
    if (!customer) return;

    const dueDateIso = new Date(`${values.dueDate}T23:59:59`).toISOString();
    const patch: Partial<Task> = {
      title: values.title,
      description: values.description,
      priority: values.priority,
      dueDate: dueDateIso,
      assignee,
      customer,
    };

    // Read the live store value non-reactively (a plain getState() call,
    // not the useTaskStore() hook) -- we only need this snapshot at the
    // moment of submit, not a subscription that re-renders on every
    // unrelated task change elsewhere in the app.
    const liveTask = useTaskStore
      .getState()
      .tasks.find((t) => t.id === task.id);
    const hadConcurrentEdit =
      !!liveTask && liveTask.updatedAt !== openedUpdatedAt;

    const previous = patchTaskInStore(task.id, patch);
    if (!previous) return;

    try {
      const updated = await updateTask(task.id, patch);
      replaceTaskInStore(task.id, updated);
      addToast({
        message: hadConcurrentEdit
          ? `"${updated.title}" was updated. Note: this task was also changed elsewhere while you were editing — your changes were saved on top of it.`
          : `"${updated.title}" was updated.`,
        variant: "success",
      });
      onClose();
    } catch (err) {
      replaceTaskInStore(task.id, previous);
      const message =
        err instanceof ApiError ? err.message : "Failed to update task.";
      addToast({
        message,
        variant: "error",
        action: { label: "Retry", onClick: () => void attemptUpdate(values) },
      });
    }
  }

  const onSubmit = handleSubmit(attemptUpdate);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40"
        aria-hidden="true"
        onClick={onClose}
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-task-heading"
        onKeyDown={trapTab}
        className="bg-surface relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-y-auto rounded-lg shadow-xl"
      >
        <div className="border-border flex items-center justify-between gap-4 border-b px-6 py-4">
          <h2 id="edit-task-heading" className="text-lg font-semibold">
            Edit Task
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-muted-foreground hover:text-foreground hover:bg-muted focus-visible:ring-ring shrink-0 cursor-pointer rounded-full p-1.5 transition-colors focus-visible:ring-2 focus-visible:outline-none"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        {rosterError && (
          <div
            role="alert"
            className="m-6 mb-0 flex items-center justify-between gap-3 rounded-md border border-red-200 bg-red-100 px-3 py-2 text-xs text-red-800 dark:border-red-500/30 dark:bg-red-500/15 dark:text-red-300"
          >
            <span>{rosterError}</span>
            <button
              type="button"
              onClick={() => void retryRosters()}
              className="cursor-pointer font-semibold whitespace-nowrap underline"
            >
              Retry
            </button>
          </div>
        )}

        <form
          onSubmit={(event) => void onSubmit(event)}
          noValidate
          className="flex flex-1 flex-col gap-4 px-6 py-5"
        >
          <TitleField register={register} error={errors.title?.message} />
          <DescriptionField
            register={register}
            error={errors.description?.message}
          />

          <div className="grid grid-cols-2 gap-4">
            <PriorityField
              register={register}
              error={errors.priority?.message}
            />
            <DueDateField register={register} error={errors.dueDate?.message} />
          </div>

          <AssigneeField
            register={register}
            error={errors.assigneeId?.message}
            assignees={assignees}
            isLoading={isLoadingRosters}
          />
          <CustomerField
            register={register}
            error={errors.customerId?.message}
            customers={customers}
            isLoading={isLoadingRosters}
          />

          <div className="border-border rounded-md border border-dashed p-3">
            <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              Dev: Concurrency Demo (Task 8.5)
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              Simulates another tab changing this task while you still have it
              open for editing. Submit afterward to see the last-write- wins
              notice.
            </p>
            <button
              type="button"
              onClick={handleSimulateConcurrentEdit}
              disabled={isSimulatingConcurrentEdit}
              className="border-border bg-surface hover:bg-muted focus-visible:ring-ring mt-2 inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSimulatingConcurrentEdit && <SpinnerIcon />}
              {isSimulatingConcurrentEdit
                ? "Applying simulated edit…"
                : "Simulate concurrent edit"}
            </button>
          </div>

          <div className="border-border mt-2 flex justify-end gap-3 border-t pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="border-border bg-surface hover:bg-muted focus-visible:ring-ring cursor-pointer rounded-md border px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                isSubmitting || isLoadingRosters || isSimulatingConcurrentEdit
              }
              className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring inline-flex cursor-pointer items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting && <SpinnerIcon />}
              {isSubmitting ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
