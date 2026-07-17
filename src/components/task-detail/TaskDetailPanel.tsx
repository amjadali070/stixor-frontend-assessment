"use client";

import { useRef, type ReactNode } from "react";

import { XIcon } from "@/components/ui/icons";
import { useDialogBehavior } from "@/hooks/useDialogBehavior";
import { PriorityBadge } from "@/components/task-list/PriorityBadge";
import { StatusBadge } from "@/components/task-list/StatusBadge";
import { formatDueDate } from "@/lib/utils/formatDueDate";
import type { Task } from "@/types/task";

interface TaskDetailPanelProps {
  task: Task;
  onClose: () => void;
}

interface FieldProps {
  label: string;
  children: ReactNode;
}

function Field({ label, children }: FieldProps) {
  return (
    <div>
      <dt className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
        {label}
      </dt>
      <dd className="mt-1 text-sm">{children}</dd>
    </div>
  );
}

/**
 * Full task view: a side drawer on desktop (>=1024px, Tailwind's `lg`
 * breakpoint), a full-screen overlay on mobile — one responsive layout,
 * not two separate DOM structures, driven entirely by `lg:` variants.
 *
 * Closes via "X" button, Escape, and backdrop click (Task 6.3). Focus
 * moves into the panel on open and restores to the triggering element on
 * close, with Tab trapped inside the panel while open (Task 6.4) — all
 * via the shared `useDialogBehavior` hook. `key={task.id}` in page.tsx
 * ensures a fresh mount per task, so this component never has to worry
 * about "the task changed without a real close."
 */
export function TaskDetailPanel({ task, onClose }: TaskDetailPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const { trapTab } = useDialogBehavior(panelRef, onClose, closeButtonRef);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/40"
        aria-hidden="true"
        onClick={onClose}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-detail-heading"
        onKeyDown={trapTab}
        className="bg-surface relative flex h-full w-full flex-col overflow-y-auto lg:w-[480px] lg:max-w-[90vw] lg:shadow-xl"
      >
        <div className="border-border flex items-start justify-between gap-4 border-b px-6 py-4">
          <h2
            id="task-detail-heading"
            className="text-lg font-semibold break-words"
          >
            {task.title}
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close task details"
            className="text-muted-foreground hover:text-foreground hover:bg-muted focus-visible:ring-ring shrink-0 cursor-pointer rounded-full p-1.5 transition-colors focus-visible:ring-2 focus-visible:outline-none"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        <dl className="flex flex-1 flex-col gap-5 px-6 py-5">
          <div className="flex flex-wrap gap-x-8 gap-y-5">
            <Field label="Priority">
              <PriorityBadge priority={task.priority} />
            </Field>
            <Field label="Status">
              <StatusBadge status={task.status} />
            </Field>
            <Field label="Due Date">
              <span className="font-mono tabular-nums">
                {formatDueDate(task.dueDate)}
              </span>
            </Field>
            <Field label="Assignee">
              {task.assignee?.name ?? (
                <span className="text-muted-foreground italic">Unassigned</span>
              )}
            </Field>
          </div>

          <Field label="Customer">
            <span className="block">{task.customer.name}</span>
            {task.customer.company && (
              <span className="text-muted-foreground block text-xs">
                {task.customer.company}
              </span>
            )}
          </Field>

          <Field label="Description">
            <p className="whitespace-pre-wrap">{task.description}</p>
          </Field>
        </dl>
      </div>
    </div>
  );
}
