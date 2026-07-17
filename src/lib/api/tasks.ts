import { seedTasks } from "@/lib/mock/seed";
import type { CreateTaskInput, Task } from "@/types/task";

/**
 * Mock API layer simulating a real backend boundary: async, delayed
 * (300–800ms), optionally failing, persisted to localStorage.
 *
 * Nothing outside this module may touch the seed data or the storage key —
 * all reads/writes go through these functions, as they would through fetch.
 */

const STORAGE_KEY = "stixor-cs-tasks-v1";
const MIN_LATENCY_MS = 300;
const MAX_LATENCY_MS = 800;
const FAILURE_RATE = 0.15;

export type ApiErrorCode = "NETWORK" | "NOT_FOUND";

export class ApiError extends Error {
  readonly code: ApiErrorCode;

  constructor(code: ApiErrorCode, message: string) {
    super(message);
    this.name = "ApiError";
    this.code = code;
  }
}

/**
 * Failure simulation is on when NEXT_PUBLIC_SIMULATE_FAILURES=true, and can
 * also be flipped at runtime (for a dev-only UI toggle) without code changes.
 */
let simulateFailures = process.env.NEXT_PUBLIC_SIMULATE_FAILURES === "true";

export function getSimulateFailures(): boolean {
  return simulateFailures;
}

export function setSimulateFailures(enabled: boolean): void {
  simulateFailures = enabled;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function simulateNetwork(): Promise<void> {
  await delay(
    MIN_LATENCY_MS + Math.random() * (MAX_LATENCY_MS - MIN_LATENCY_MS),
  );
  if (simulateFailures && Math.random() < FAILURE_RATE) {
    throw new ApiError(
      "NETWORK",
      "The request failed. Check your connection and try again.",
    );
  }
}

/** localStorage can be unavailable (SSR, private browsing, quota) — never throw. */
function readStorage(): Task[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Task[]) : null;
  } catch {
    return null;
  }
}

function writeStorage(tasks: Task[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch {
    // Persistence unavailable — keep working in-memory only.
  }
}

/** In-memory "database", lazily hydrated from localStorage or seed data. */
let db: Task[] | null = null;

function getDb(): Task[] {
  if (db === null) {
    db = readStorage() ?? seedTasks.map((task) => ({ ...task }));
  }
  return db;
}

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `task-${crypto.randomUUID()}`;
  }
  return `task-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function getTasks(): Promise<Task[]> {
  await simulateNetwork();
  return getDb().map((task) => ({ ...task }));
}

export async function getTaskById(id: string): Promise<Task | null> {
  await simulateNetwork();
  const task = getDb().find((t) => t.id === id);
  return task ? { ...task } : null;
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  await simulateNetwork();
  const now = new Date().toISOString();
  const task: Task = {
    ...input,
    id: newId(),
    status: input.status ?? "Open",
    createdAt: now,
    updatedAt: now,
  };
  const tasks = getDb();
  tasks.push(task);
  writeStorage(tasks);
  return { ...task };
}

export async function updateTask(
  id: string,
  patch: Partial<Task>,
): Promise<Task> {
  await simulateNetwork();
  const tasks = getDb();
  const index = tasks.findIndex((t) => t.id === id);
  if (index === -1) {
    throw new ApiError("NOT_FOUND", `Task "${id}" no longer exists.`);
  }
  const updated: Task = {
    ...tasks[index],
    ...patch,
    id: tasks[index].id,
    updatedAt: new Date().toISOString(),
  };
  tasks[index] = updated;
  writeStorage(tasks);
  return { ...updated };
}

export async function deleteTask(id: string): Promise<void> {
  await simulateNetwork();
  const tasks = getDb();
  const index = tasks.findIndex((t) => t.id === id);
  if (index === -1) {
    throw new ApiError("NOT_FOUND", `Task "${id}" no longer exists.`);
  }
  tasks.splice(index, 1);
  writeStorage(tasks);
}
