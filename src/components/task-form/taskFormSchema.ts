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

export const taskFormSchema = z.object({
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
    .refine(isTodayOrLater, "Due date must be today or later"),
  assigneeId: z.string().min(1, "Assignee is required"),
  customerId: z.string().min(1, "Customer is required"),
});

export type TaskFormValues = z.infer<typeof taskFormSchema>;

export const TASK_FORM_DEFAULT_VALUES: TaskFormValues = {
  title: "",
  description: "",
  priority: "Medium",
  dueDate: "",
  assigneeId: "",
  customerId: "",
};
