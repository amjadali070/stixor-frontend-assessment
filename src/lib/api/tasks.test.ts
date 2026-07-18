import { beforeEach, describe, expect, it, vi } from "vitest";

// The mock API's "database" is a module-level singleton, lazily seeded on
// first access (see the module's own docstring) -- resetting the module
// registry and re-importing fresh in every test is what makes each test
// see its own clean seed data, matching a real fresh page load, instead
// of leaking mutations (a create/update/delete in one test) into the next.
describe("lib/api/tasks", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.resetModules();
  });

  it("getTasks resolves with the seeded tasks", async () => {
    const { getTasks } = await import("./tasks");
    const tasks = await getTasks();
    expect(tasks.length).toBeGreaterThan(0);
  });

  it("createTask adds a task retrievable via getTasks", async () => {
    const { getTasks, createTask } = await import("./tasks");
    const before = await getTasks();

    const created = await createTask({
      title: "Follow up with Acme Corp",
      description: "Check in after the renewal call.",
      customer: { id: "cust-test", name: "Acme Corp" },
      priority: "Medium",
      dueDate: new Date().toISOString(),
      assignee: null,
    });

    const after = await getTasks();
    expect(after.length).toBe(before.length + 1);
    expect(after.find((t) => t.id === created.id)?.title).toBe(
      "Follow up with Acme Corp",
    );
    // Defaults applied by createTask itself, not passed by the caller.
    expect(created.status).toBe("Open");
    expect(created.createdAt).toBe(created.updatedAt);
  });

  it("updateTask patches an existing task and bumps updatedAt", async () => {
    const { getTasks, updateTask } = await import("./tasks");
    const [first] = await getTasks();

    const updated = await updateTask(first.id, { title: "Updated title" });

    expect(updated.id).toBe(first.id);
    expect(updated.title).toBe("Updated title");
    expect(new Date(updated.updatedAt).getTime()).toBeGreaterThanOrEqual(
      new Date(first.updatedAt).getTime(),
    );
  });

  it("updateTask rejects with ApiError NOT_FOUND for an unknown id", async () => {
    const { updateTask, ApiError } = await import("./tasks");
    await expect(
      updateTask("no-such-task", { title: "x" }),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it("deleteTask removes the task from subsequent getTasks calls", async () => {
    const { getTasks, deleteTask } = await import("./tasks");
    const [first] = await getTasks();

    await deleteTask(first.id);

    const after = await getTasks();
    expect(after.some((t) => t.id === first.id)).toBe(false);
  });

  it("deleteTask rejects with ApiError NOT_FOUND for an unknown id", async () => {
    const { deleteTask, ApiError } = await import("./tasks");
    await expect(deleteTask("no-such-task")).rejects.toBeInstanceOf(ApiError);
  });

  it("simulated failure mode rejects requests when enabled", async () => {
    const { getTasks, setSimulateFailures, ApiError } = await import("./tasks");
    setSimulateFailures(true);
    // Math.random() is used for both the latency range and the failure
    // roll -- forcing it to 0 keeps the delay at its minimum *and*
    // guarantees the `< FAILURE_RATE` check trips, so this doesn't rely
    // on the 15% chance actually landing within a reasonable test time.
    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0);
    await expect(getTasks()).rejects.toBeInstanceOf(ApiError);
    randomSpy.mockRestore();
  });

  it("createTask persists across a fresh module import (localStorage)", async () => {
    const { createTask } = await import("./tasks");
    const created = await createTask({
      title: "Persisted task",
      description: "Should survive a reload.",
      customer: { id: "cust-persist", name: "Persist Inc" },
      priority: "Low",
      dueDate: new Date().toISOString(),
      assignee: null,
    });

    // Simulates a page reload: fresh module instance, no in-memory state,
    // must rehydrate from localStorage instead of re-seeding from scratch.
    vi.resetModules();
    const { getTasks } = await import("./tasks");
    const tasks = await getTasks();
    expect(tasks.some((t) => t.id === created.id)).toBe(true);
  });
});
