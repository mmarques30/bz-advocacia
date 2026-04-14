/**
 * Unified toast API for the BZ Advocacia codebase.
 *
 * Backed by sonner, but accepts BOTH calling conventions:
 *
 *   // Sonner-native (preferred for new code):
 *   toast.success("Salvo!");
 *   toast.error("Falha", { description: err.message });
 *
 *   // Shadcn-compat (for files migrated from @/hooks/use-toast):
 *   toast({ title: "Salvo!" });
 *   toast({ title: "Falha", description: err.message, variant: "destructive" });
 *
 * Also exposes useToast() as a drop-in for the shadcn hook, so existing
 * files can change their import path without rewriting call sites.
 *
 * Usage:
 *   import { toast } from "@/lib/toast";
 *   // or, for shadcn migration:
 *   import { useToast } from "@/lib/toast";
 *   const { toast } = useToast();
 */

import { toast as sonnerToast } from "sonner";

/** Shadcn-style argument shape. */
export interface ShadcnToastOptions {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
  action?: React.ReactNode;
  duration?: number;
}

function dispatchShadcn(opts: ShadcnToastOptions) {
  const title = opts.title ?? "";
  const rest: { description?: string; duration?: number; action?: unknown } = {};
  if (opts.description !== undefined) rest.description = opts.description;
  if (opts.duration !== undefined) rest.duration = opts.duration;

  if (opts.variant === "destructive") {
    return sonnerToast.error(title, rest as never);
  }
  return sonnerToast(title, rest as never);
}

type SonnerToast = typeof sonnerToast;

/**
 * Callable + method-ful toast. Both `toast("msg")` and
 * `toast({ title, description })` work; `toast.success/error/info/warning`
 * also exposed.
 */
export interface UnifiedToast extends SonnerToast {
  (messageOrOpts: string | ShadcnToastOptions, data?: never): ReturnType<SonnerToast>;
}

const callable = ((messageOrOpts: string | ShadcnToastOptions) => {
  if (typeof messageOrOpts === "string") {
    return sonnerToast(messageOrOpts);
  }
  return dispatchShadcn(messageOrOpts);
}) as unknown as UnifiedToast;

// Preserve all sonner methods (success, error, info, warning, promise, dismiss,
// loading, custom, etc.) on the callable.
Object.setPrototypeOf(callable, sonnerToast as unknown as object);
for (const key of Object.keys(sonnerToast) as Array<keyof SonnerToast>) {
  (callable as unknown as Record<string, unknown>)[key as string] = (
    sonnerToast as unknown as Record<string, unknown>
  )[key as string];
}

export const toast = callable;

/**
 * Drop-in shim for the shadcn `useToast` hook. Returns a `toast` function
 * with the same shape so migrated files keep working without changes to
 * their call sites.
 */
export function useToast() {
  return { toast };
}

export type ToastFn = typeof toast;
