"use client";

import { useEffect } from "react";

import { useToastStore, type Toast } from "@/lib/store/useToastStore";

import { CheckCircleIcon, WarningTriangleIcon, XIcon } from "./icons";

const AUTO_DISMISS_MS = 5000;

function ToastItem({ toast }: { toast: Toast }) {
  const removeToast = useToastStore((s) => s.removeToast);
  const isError = toast.variant === "error";

  useEffect(() => {
    // A toast with a Retry action stays until the user acts or dismisses
    // it manually — auto-dismissing a still-actionable error would be
    // unkind (they might not have read it in time). `autoDismissMs` is the
    // deliberate exception: an "Undo" window is *meant* to close on its
    // own, since the window closing is what makes the action final.
    if (toast.action && toast.autoDismissMs === undefined) return;
    const timeout = setTimeout(
      () => removeToast(toast.id),
      toast.autoDismissMs ?? AUTO_DISMISS_MS,
    );
    return () => clearTimeout(timeout);
  }, [toast.id, toast.action, toast.autoDismissMs, removeToast]);

  return (
    <div
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
      className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg ${
        isError
          ? "border-red-200 bg-red-100 text-red-800 dark:border-red-500/30 dark:bg-red-500/15 dark:text-red-300"
          : "border-green-200 bg-green-100 text-green-800 dark:border-green-500/30 dark:bg-green-500/15 dark:text-green-300"
      }`}
    >
      {isError ? (
        <WarningTriangleIcon className="mt-0.5 shrink-0" />
      ) : (
        <CheckCircleIcon className="mt-0.5 shrink-0" />
      )}
      <span className="flex-1">{toast.message}</span>
      {toast.action && (
        <button
          type="button"
          onClick={() => {
            toast.action?.onClick();
            removeToast(toast.id);
          }}
          className="shrink-0 cursor-pointer rounded-md border border-current px-2.5 py-1 text-xs font-semibold whitespace-nowrap transition-colors hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-current focus-visible:outline-none dark:hover:bg-white/10"
        >
          {toast.action.label}
        </button>
      )}
      <button
        type="button"
        onClick={() => removeToast(toast.id)}
        aria-label="Dismiss notification"
        className="shrink-0 cursor-pointer rounded p-0.5 opacity-70 hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-current focus-visible:outline-none"
      >
        <XIcon />
      </button>
    </div>
  );
}

/** Rendered once at the app root (layout.tsx) — toasts are a cross-cutting
 * concern, not specific to any one page. */
export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-20 md:top-4 left-1/2 z-[100] flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
