"use client";

import { useRef } from "react";

import { useDialogBehavior } from "@/hooks/useDialogBehavior";

import { WarningTriangleIcon } from "./icons";

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  isConfirming?: boolean;
}

/**
 * Generic confirmation dialog — built for Task 8.4's delete confirmation,
 * but kept reusable since "confirm before a destructive action" is a
 * pattern the codebase already anticipates needing more than once. Never
 * stacked with another dialog: whatever opens this closes its own dialog
 * first (see DECISIONS.md) — two simultaneously-mounted useDialogBehavior
 * instances would each attach their own global Escape listener, and a
 * single Escape press would close both at once instead of just the top one.
 */
export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
  isConfirming = false,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const { trapTab } = useDialogBehavior(dialogRef, onCancel);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40"
        aria-hidden="true"
        onClick={onCancel}
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-heading"
        aria-describedby="confirm-dialog-message"
        onKeyDown={trapTab}
        className="bg-surface relative flex w-full max-w-sm flex-col gap-4 rounded-lg p-6 shadow-xl"
      >
        <div className="flex items-start gap-3">
          <span className="text-destructive mt-0.5 shrink-0">
            <WarningTriangleIcon />
          </span>
          <div>
            <h2 id="confirm-dialog-heading" className="text-base font-semibold">
              {title}
            </h2>
            <p
              id="confirm-dialog-message"
              className="text-muted-foreground mt-1 text-sm"
            >
              {message}
            </p>
          </div>
        </div>

        <div className="mt-1 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isConfirming}
            className="border-border bg-surface hover:bg-muted focus-visible:ring-ring cursor-pointer rounded-md border px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isConfirming}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-ring cursor-pointer rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isConfirming ? "Deleting…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
