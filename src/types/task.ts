export const PRIORITIES = ["High", "Medium", "Low"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const STATUSES = ["Open", "In Progress", "Completed"] as const;
export type Status = (typeof STATUSES)[number];

export interface Customer {
  id: string;
  name: string;
  company?: string;
}

export interface Assignee {
  id: string;
  name: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  customer: Customer;
  priority: Priority;
  status: Status;
  /** ISO 8601 date string */
  dueDate: string;
  /** null = unassigned (a real CS queue always has unowned tasks) */
  assignee: Assignee | null;
  /** ISO 8601 date string */
  createdAt: string;
  /** ISO 8601 date string */
  updatedAt: string;
}

export interface CreateTaskInput {
  title: string;
  description: string;
  customer: Customer;
  priority: Priority;
  status?: Status;
  dueDate: string;
  assignee: Assignee | null;
}
