import { create } from "zustand";

import type { Priority, Status, Task } from "@/types/task";

export interface TaskFilters {
  priority: Priority[];
  status: Status[];
  /** Assignee ids; the sentinel "unassigned" matches tasks with no assignee. */
  assignee: string[];
}

export const EMPTY_FILTERS: TaskFilters = {
  priority: [],
  status: [],
  assignee: [],
};

interface TaskStoreState {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  filters: TaskFilters;
  selectedTaskId: string | null;

  setTasks: (tasks: Task[]) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setSearchQuery: (query: string) => void;
  setFilters: (filters: TaskFilters) => void;
  clearFilters: () => void;
  setSelectedTaskId: (id: string | null) => void;

  /** Optimistic-update primitives. Fetch logic lives in hooks, not here. */
  addTask: (task: Task) => void;
  /** Swap a task (e.g. temp-id optimistic entry) for its server version. */
  replaceTask: (id: string, task: Task) => void;
  /** Applies a patch and returns the previous task so callers can roll back. */
  patchTask: (id: string, patch: Partial<Task>) => Task | undefined;
  /** Removes a task and returns it (with its index) so callers can roll back. */
  removeTask: (id: string) => { task: Task; index: number } | undefined;
  /** Re-inserts a previously removed task at its original position. */
  restoreTask: (task: Task, index: number) => void;
}

export const useTaskStore = create<TaskStoreState>((set, get) => ({
  tasks: [],
  isLoading: false,
  error: null,
  searchQuery: "",
  filters: EMPTY_FILTERS,
  selectedTaskId: null,

  setTasks: (tasks) => set({ tasks }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setFilters: (filters) => set({ filters }),
  clearFilters: () => set({ filters: EMPTY_FILTERS }),
  setSelectedTaskId: (selectedTaskId) => set({ selectedTaskId }),

  addTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),

  replaceTask: (id, task) =>
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? task : t)),
    })),

  patchTask: (id, patch) => {
    const previous = get().tasks.find((t) => t.id === id);
    if (!previous) return undefined;
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id ? { ...t, ...patch, id: t.id } : t,
      ),
    }));
    return previous;
  },

  removeTask: (id) => {
    const index = get().tasks.findIndex((t) => t.id === id);
    if (index === -1) return undefined;
    const task = get().tasks[index];
    set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }));
    return { task, index };
  },

  restoreTask: (task, index) =>
    set((state) => {
      const tasks = [...state.tasks];
      tasks.splice(Math.min(index, tasks.length), 0, task);
      return { tasks };
    }),
}));
