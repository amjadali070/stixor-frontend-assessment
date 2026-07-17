import type { ReactNode } from "react";
import type { UseFormRegister } from "react-hook-form";

import { PRIORITIES, type Assignee, type Customer } from "@/types/task";

import { localDateString, type TaskFormValues } from "./taskFormSchema";

/**
 * Field components shared between CreateTaskModal (now) and EditTaskModal
 * (Task 8.1, pre-populated from the selected task) — one set of fields,
 * not two parallel forms, per the project's own reuse ground rules.
 */

const INPUT_CLASSNAME =
  "border-border bg-surface focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2 aria-invalid:border-destructive";

interface FieldWrapperProps {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
}

function FieldWrapper({ id, label, error, children }: FieldWrapperProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      {children}
      {/* No role="alert" here: several fields can be invalid at once on
          submit, and multiple simultaneous alert announcements would
          overlap. aria-describedby + aria-invalid is the correct pattern
          for inline per-field errors (Task 10.5). */}
      {error && (
        <p id={`${id}-error`} className="text-destructive mt-1 text-xs">
          {error}
        </p>
      )}
    </div>
  );
}

interface FieldProps {
  register: UseFormRegister<TaskFormValues>;
  error?: string;
}

export function TitleField({ register, error }: FieldProps) {
  return (
    <FieldWrapper id="task-title" label="Title" error={error}>
      <input
        id="task-title"
        type="text"
        aria-invalid={!!error}
        aria-describedby={error ? "task-title-error" : undefined}
        className={INPUT_CLASSNAME}
        {...register("title")}
      />
    </FieldWrapper>
  );
}

export function DescriptionField({ register, error }: FieldProps) {
  return (
    <FieldWrapper id="task-description" label="Description" error={error}>
      <textarea
        id="task-description"
        rows={4}
        aria-invalid={!!error}
        aria-describedby={error ? "task-description-error" : undefined}
        className={`${INPUT_CLASSNAME} resize-y`}
        {...register("description")}
      />
    </FieldWrapper>
  );
}

export function PriorityField({ register, error }: FieldProps) {
  return (
    <FieldWrapper id="task-priority" label="Priority" error={error}>
      <select
        id="task-priority"
        aria-invalid={!!error}
        aria-describedby={error ? "task-priority-error" : undefined}
        className={INPUT_CLASSNAME}
        {...register("priority")}
      >
        {PRIORITIES.map((priority) => (
          <option key={priority} value={priority}>
            {priority}
          </option>
        ))}
      </select>
    </FieldWrapper>
  );
}

export function DueDateField({ register, error }: FieldProps) {
  // Local calendar date, not toISOString().slice(0, 10) -- that gives the
  // UTC date, which is off by a day from local "today" in many timezones.
  const today = localDateString(new Date());
  return (
    <FieldWrapper id="task-due-date" label="Due Date" error={error}>
      <input
        id="task-due-date"
        type="date"
        min={today}
        aria-invalid={!!error}
        aria-describedby={error ? "task-due-date-error" : undefined}
        className={INPUT_CLASSNAME}
        {...register("dueDate")}
      />
    </FieldWrapper>
  );
}

interface AssigneeFieldProps extends FieldProps {
  assignees: Assignee[];
  isLoading: boolean;
}

export function AssigneeField({
  register,
  error,
  assignees,
  isLoading,
}: AssigneeFieldProps) {
  return (
    <FieldWrapper id="task-assignee" label="Assignee" error={error}>
      <select
        id="task-assignee"
        aria-invalid={!!error}
        aria-describedby={error ? "task-assignee-error" : undefined}
        disabled={isLoading}
        className={INPUT_CLASSNAME}
        {...register("assigneeId")}
      >
        <option value="" disabled>
          {isLoading ? "Loading…" : "Select an assignee…"}
        </option>
        {assignees.map((assignee) => (
          <option key={assignee.id} value={assignee.id}>
            {assignee.name}
          </option>
        ))}
      </select>
    </FieldWrapper>
  );
}

interface CustomerFieldProps extends FieldProps {
  customers: Customer[];
  isLoading: boolean;
}

export function CustomerField({
  register,
  error,
  customers,
  isLoading,
}: CustomerFieldProps) {
  return (
    <FieldWrapper id="task-customer" label="Customer" error={error}>
      <select
        id="task-customer"
        aria-invalid={!!error}
        aria-describedby={error ? "task-customer-error" : undefined}
        disabled={isLoading}
        className={INPUT_CLASSNAME}
        {...register("customerId")}
      >
        <option value="" disabled>
          {isLoading ? "Loading…" : "Select a customer…"}
        </option>
        {customers.map((customer) => (
          <option key={customer.id} value={customer.id}>
            {customer.company
              ? `${customer.name} (${customer.company})`
              : customer.name}
          </option>
        ))}
      </select>
    </FieldWrapper>
  );
}
