import { create } from "zustand";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface Toast {
  id: string;
  message: string;
  variant: "success" | "error";
  action?: ToastAction;
  /** Auto-dismiss even though `action` is set -- for a genuinely
   * time-boxed choice like "Undo" (see useDeleteWithUndo), where the
   * window closing *is* the point, unlike "Retry" on a real unresolved
   * error, which should stay until the user acts or dismisses it. */
  autoDismissMs?: number;
}

interface ToastStoreState {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => string;
  removeToast: (id: string) => void;
}

function newToastId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Global toast state — separate from useTaskStore since toasts are a
 * cross-cutting app concern (Create/Edit/status-update flows all need
 * one), not task-list-specific state.
 */
export const useToastStore = create<ToastStoreState>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = newToastId();
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
    return id;
  },
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));
