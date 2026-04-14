/**
 * Unified toast API for the BZ Advocacia codebase.
 *
 * The app currently uses two toast systems side-by-side:
 *   - `sonner` (imported from "sonner"), used in most hooks and pages;
 *   - the shadcn `use-toast` hook (imported from "@/hooks/use-toast"),
 *     used in some older files (useFinanceiro.ts, etc.).
 *
 * This module exposes a single, opinionated `toast` object backed by
 * `sonner`. New code should import from here; existing code can migrate
 * opportunistically. Both toasters continue to work until migration is
 * complete — the visual difference is minimal.
 *
 * Usage:
 *   import { toast } from "@/lib/toast";
 *   toast.success("Salvo!");
 *   toast.error("Falha ao salvar", { description: err.message });
 */

import { toast as sonnerToast } from "sonner";

export const toast = {
  success: sonnerToast.success,
  error: sonnerToast.error,
  info: sonnerToast.info,
  warning: sonnerToast.warning,
  message: sonnerToast,
  /** Show a promise-driven toast (loading → success/error). */
  promise: sonnerToast.promise,
  /** Dismiss one or all toasts. */
  dismiss: sonnerToast.dismiss,
};

export type ToastFn = typeof toast;
