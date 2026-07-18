import { z } from "zod";

import { PRIORITIES } from "@/types/task";

/**
 * Shared between CreateTaskModal (now) and EditTaskModal (Task 8.1, which
 * reuses these same fields pre-populated) — one schema/type so both forms
 * stay identical rather than drifting into two parallel shapes.
 */

/**
 * Compares calendar dates as plain "YYYY-MM-DD" strings rather than via
 * Date-object arithmetic — `new Date("2026-07-17")` parses as UTC
 * midnight, but zeroing hours with `setHours(0,0,0,0)` operates in local
 * time. In any timezone behind UTC, that mismatch makes today's own date
 * register a day early and get wrongly rejected. `<input type="date">`
 * values are always "YYYY-MM-DD", so string comparison is both simpler
 * and immune to the timezone bug entirely (caught via a failing unit
 * test on "today should pass" before this was wired into the UI).
 */
export function localDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isTodayOrLater(dateString: string): boolean {
  return dateString >= localDateString(new Date());
}

interface TaskFormSchemaOptions {
  /**
   * The task's own due date at the moment the form opened, kept as a
   * valid value even if it's already in the past (an already-overdue
   * task must stay editable for its other fields without being forced to
   * also push its due date into the future). Changing the due date to a
   * *different* value still enforces today-or-later — this only
   * grandfathers in the value the form actually opened with. Found via
   * live verification: editing any seed task with a past due date (there
   * are plenty, by design — that's how "overdue" demonstrates itself)
   * silently failed validation despite no field being invalid from the
   * user's perspective.
   */
  existingDueDate?: string;
  /**
   * Lets assigneeId submit empty, for editing a task that was already
   * Unassigned when the form opened (a legitimate, common state
   * elsewhere in the app — TaskTable/TaskDetailPanel both render it as
   * normal, not an error). New tasks (CreateTaskModal, which never sets
   * this) still always require picking a real assignee. Found the same
   * way as the due-date exception above: editing an Unassigned seed task
   * without touching that field failed validation on a field the user
   * never looked at.
   */
  allowEmptyAssignee?: boolean;
}

/**
 * A factory, not a static schema, so Edit and Create can each relax
 * exactly the rules that don't apply to editing pre-existing data.
 * CreateTaskModal calls this with no arguments, so new tasks always
 * require today-or-later due dates and a real assignee with no exception.
 */
export function createTaskFormSchema({
  existingDueDate,
  allowEmptyAssignee = false,
}: TaskFormSchemaOptions = {}) {
  return z.object({
    title: z
      .string()
      .trim()
      .min(1, "Title is required")
      .max(120, "Title must be 120 characters or fewer"),
    description: z
      .string()
      .trim()
      .min(1, "Description is required")
      .max(2000, "Description must be 2000 characters or fewer"),
    priority: z.enum(PRIORITIES, { message: "Select a priority" }),
    dueDate: z
      .string()
      .min(1, "Due date is required")
      .refine(
        (value) => !Number.isNaN(new Date(value).getTime()),
        "Enter a valid date",
      )
      .refine(
        (value) => value === existingDueDate || isTodayOrLater(value),
        "Due date must be today or later",
      ),
    assigneeId: allowEmptyAssignee
      ? z.string()
      : z.string().min(1, "Assignee is required"),
    customerId: z.string().min(1, "Customer is required"),
  });
}

export const taskFormSchema = createTaskFormSchema();

export type TaskFormValues = z.infer<typeof taskFormSchema>;

export const TASK_FORM_DEFAULT_VALUES: TaskFormValues = {
  title: "",
  description: "",
  priority: "Medium",
  dueDate: "",
  assigneeId: "",
  customerId: "",
};
