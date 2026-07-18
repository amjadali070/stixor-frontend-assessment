"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRef } from "react";
import { useForm } from "react-hook-form";

import { SpinnerIcon, XIcon } from "@/components/ui/icons";
import { useDialogBehavior } from "@/hooks/useDialogBehavior";
import { useRosters } from "@/hooks/useRosters";
import { ApiError, createTask } from "@/lib/api/tasks";
import { useTaskStore } from "@/lib/store/useTaskStore";
import { useToastStore } from "@/lib/store/useToastStore";
import type { Task } from "@/types/task";

import {
  AssigneeField,
  CustomerField,
  DescriptionField,
  DueDateField,
  PriorityField,
  TitleField,
} from "./TaskFormFields";
import {
  TASK_FORM_DEFAULT_VALUES,
  taskFormSchema,
  type TaskFormValues,
} from "./taskFormSchema";

interface CreateTaskModalProps {
  onClose: () => void;
}

function newTempId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `temp-${crypto.randomUUID()}`;
  }
  return `temp-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Create Task form (Tasks 7.1-7.6). Centered dialog, not a full-screen
 * mobile treatment yet -- that's explicitly Task 9.5's job, which names
 * this component. Customer is included as a required field even though
 * the spec's minimum-fields list for Create Task omits it: every seed
 * task has one, it's central to what a CS task even is, and the Task
 * type requires it non-optionally -- see DECISIONS.md.
 */
export function CreateTaskModal({ onClose }: CreateTaskModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const { trapTab } = useDialogBehavior(dialogRef, onClose);

  const {
    assignees,
    customers,
    isLoading: isLoadingRosters,
    error: rosterError,
    retry: retryRosters,
  } = useRosters();

  const addTask = useTaskStore((s) => s.addTask);
  const replaceTask = useTaskStore((s) => s.replaceTask);
  const removeTask = useTaskStore((s) => s.removeTask);
  const setRecentlyCreatedTaskId = useTaskStore(
    (s) => s.setRecentlyCreatedTaskId,
  );
  const addToast = useToastStore((s) => s.addToast);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: TASK_FORM_DEFAULT_VALUES,
    mode: "onBlur",
  });

  async function attemptCreate(values: TaskFormValues) {
    const assignee = assignees.find((a) => a.id === values.assigneeId);
    const customer = customers.find((c) => c.id === values.customerId);
    // Shouldn't happen -- the selects only ever offer loaded roster ids --
    // but guards the lookup rather than trusting it silently.
    if (!assignee || !customer) return;

    const tempId = newTempId();
    const now = new Date().toISOString();
    const dueDateIso = new Date(`${values.dueDate}T23:59:59`).toISOString();

    const optimisticTask: Task = {
      id: tempId,
      title: values.title,
      description: values.description,
      customer,
      priority: values.priority,
      status: "Open",
      dueDate: dueDateIso,
      assignee,
      createdAt: now,
      updatedAt: now,
    };

    addTask(optimisticTask);

    try {
      const created = await createTask({
        title: values.title,
        description: values.description,
        customer,
        priority: values.priority,
        dueDate: dueDateIso,
        assignee,
      });
      replaceTask(tempId, created);
      setRecentlyCreatedTaskId(created.id);
      addToast({
        message: `"${created.title}" was created.`,
        variant: "success",
      });
      onClose();
    } catch (err) {
      removeTask(tempId);
      const message =
        err instanceof ApiError ? err.message : "Failed to create task.";
      addToast({
        message,
        variant: "error",
        action: { label: "Retry", onClick: () => void attemptCreate(values) },
      });
      // Modal stays open, form values untouched -- handleSubmit doesn't
      // reset the form just because the submit handler ran.
    }
  }

  const onSubmit = handleSubmit(attemptCreate);

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
        aria-labelledby="create-task-heading"
        onKeyDown={trapTab}
        className="bg-surface relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-y-auto rounded-lg shadow-xl"
      >
        <div className="border-border flex items-center justify-between gap-4 border-b px-6 py-4">
          <h2 id="create-task-heading" className="text-lg font-semibold">
            Create Task
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
              disabled={isSubmitting || isLoadingRosters}
              className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring inline-flex cursor-pointer items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting && <SpinnerIcon />}
              {isSubmitting ? "Creating…" : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
