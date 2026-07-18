import { describe, expect, it } from "vitest";

import type { Task } from "@/types/task";

import { sortTasks } from "./sortTasks";

const NOW = new Date("2026-07-15T12:00:00.000Z");

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: "task-1",
    title: "Task",
    description: "",
    customer: { id: "cust-1", name: "Customer" },
    priority: "Medium",
    status: "Open",
    dueDate: "2026-08-01T00:00:00.000Z",
    assignee: null,
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("sortTasks", () => {
  it("sorts urgent tasks (overdue, or High priority due soon) before non-urgent ones", () => {
    const overdue = makeTask({
      id: "overdue",
      dueDate: "2026-07-01T00:00:00.000Z",
    });
    const future = makeTask({
      id: "future",
      dueDate: "2026-09-01T00:00:00.000Z",
    });

    const result = sortTasks([future, overdue], NOW);
    expect(result.map((t) => t.id)).toEqual(["overdue", "future"]);
  });

  it("orders by due date ascending within the same urgency group", () => {
    const later = makeTask({
      id: "later",
      dueDate: "2026-10-01T00:00:00.000Z",
    });
    const sooner = makeTask({
      id: "sooner",
      dueDate: "2026-09-01T00:00:00.000Z",
    });

    const result = sortTasks([later, sooner], NOW);
    expect(result.map((t) => t.id)).toEqual(["sooner", "later"]);
  });

  it("sorts a task with an unparseable due date last", () => {
    const valid = makeTask({
      id: "valid",
      dueDate: "2026-09-01T00:00:00.000Z",
    });
    const malformed = makeTask({ id: "malformed", dueDate: "not-a-real-date" });

    const result = sortTasks([malformed, valid], NOW);
    expect(result.map((t) => t.id)).toEqual(["valid", "malformed"]);
  });

  it("does not mutate the input array", () => {
    const tasks = [
      makeTask({ id: "a", dueDate: "2026-09-01T00:00:00.000Z" }),
      makeTask({ id: "b", dueDate: "2026-08-01T00:00:00.000Z" }),
    ];
    const original = [...tasks];
    sortTasks(tasks, NOW);
    expect(tasks).toEqual(original);
  });
});
