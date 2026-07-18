import { describe, expect, it } from "vitest";

import type { TaskFilters } from "@/lib/store/useTaskStore";
import type { Task } from "@/types/task";

import {
  applyFilters,
  getActiveFilterCount,
  UNASSIGNED_FILTER_KEY,
} from "./applyFilters";

const EMPTY_FILTERS: TaskFilters = { priority: [], status: [], assignee: [] };

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: "task-1",
    title: "Renewal call with Acme Corp",
    description: "Discuss renewal terms.",
    customer: { id: "cust-1", name: "Jane Doe", company: "Acme Corp" },
    priority: "Medium",
    status: "Open",
    dueDate: "2026-08-01T00:00:00.000Z",
    assignee: { id: "assignee-1", name: "Sara Thompson" },
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("applyFilters", () => {
  it("returns every task when no search or filters are active", () => {
    const tasks = [makeTask({ id: "a" }), makeTask({ id: "b" })];
    expect(applyFilters(tasks, EMPTY_FILTERS, "")).toHaveLength(2);
  });

  it("matches search against the task title (case-insensitive)", () => {
    const tasks = [
      makeTask({ id: "a", title: "Renewal call with Acme Corp" }),
      makeTask({ id: "b", title: "Onboarding kickoff for Globex" }),
    ];
    const result = applyFilters(tasks, EMPTY_FILTERS, "RENEWAL");
    expect(result.map((t) => t.id)).toEqual(["a"]);
  });

  it("matches search against the customer name as well as the title", () => {
    const tasks = [
      makeTask({ id: "a", customer: { id: "c1", name: "Priya Sharma" } }),
      makeTask({ id: "b", customer: { id: "c2", name: "Omar Farouk" } }),
    ];
    const result = applyFilters(tasks, EMPTY_FILTERS, "priya");
    expect(result.map((t) => t.id)).toEqual(["a"]);
  });

  it("filters by priority", () => {
    const tasks = [
      makeTask({ id: "a", priority: "High" }),
      makeTask({ id: "b", priority: "Low" }),
    ];
    const result = applyFilters(
      tasks,
      { ...EMPTY_FILTERS, priority: ["High"] },
      "",
    );
    expect(result.map((t) => t.id)).toEqual(["a"]);
  });

  it("filters by status", () => {
    const tasks = [
      makeTask({ id: "a", status: "Completed" }),
      makeTask({ id: "b", status: "Open" }),
    ];
    const result = applyFilters(
      tasks,
      { ...EMPTY_FILTERS, status: ["Completed"] },
      "",
    );
    expect(result.map((t) => t.id)).toEqual(["a"]);
  });

  it("filters by assignee, including the Unassigned sentinel", () => {
    const tasks = [
      makeTask({ id: "a", assignee: { id: "assignee-1", name: "Sara" } }),
      makeTask({ id: "b", assignee: null }),
    ];
    const result = applyFilters(
      tasks,
      { ...EMPTY_FILTERS, assignee: [UNASSIGNED_FILTER_KEY] },
      "",
    );
    expect(result.map((t) => t.id)).toEqual(["b"]);
  });

  it("combines search and filters with AND, options within a facet with OR", () => {
    const tasks = [
      makeTask({ id: "a", priority: "High", title: "Renewal call" }),
      makeTask({ id: "b", priority: "Low", title: "Renewal call" }),
      makeTask({ id: "c", priority: "High", title: "Onboarding kickoff" }),
    ];
    const result = applyFilters(
      tasks,
      { ...EMPTY_FILTERS, priority: ["High", "Low"] },
      "renewal",
    );
    // "renewal" (search) AND priority in {High, Low} (OR within the facet)
    expect(result.map((t) => t.id).sort()).toEqual(["a", "b"]);
  });
});

describe("getActiveFilterCount", () => {
  it("is zero when no filters are active", () => {
    expect(getActiveFilterCount(EMPTY_FILTERS)).toBe(0);
  });

  it("sums selections across every facet", () => {
    expect(
      getActiveFilterCount({
        priority: ["High", "Low"],
        status: ["Open"],
        assignee: [],
      }),
    ).toBe(3);
  });
});
