/**
 * Utilities to recover from corrupted/stale Supabase auth tokens
 * and from a deadlocked GoTrueClient (navigator.locks held by an old tab).
 *
 * These are the leading cause of "stuck on login" issues that only resolve
 * in incognito mode.
 */

import { supabase } from "@/integrations/supabase/client";

export function clearSupabaseAuthStorage() {
  try {
    const wipe = (store: Storage) => {
      const keys: string[] = [];
      for (let i = 0; i < store.length; i++) {
        const k = store.key(i);
        if (!k) continue;
        if (k.startsWith("sb-") || k.includes("supabase.auth")) {
          keys.push(k);
        }
      }
      keys.forEach((k) => store.removeItem(k));
    };
    wipe(localStorage);
    try { wipe(sessionStorage); } catch { /* ignore */ }
  } catch {
    /* ignore */
  }
}

/**
 * Try to forcibly release any pending Web Locks held by the Supabase
 * GoTrueClient. When an old tab dies mid-refresh, the lock can stay
 * "owned" and any new signIn call hangs forever waiting on it.
 *
 * `steal: true` rips the lock away from the previous holder. Safe to
 * call even when no lock exists. No-op on browsers without Web Locks.
 */
export async function releaseAuthLocks(): Promise<void> {
  try {
    const anyNav = navigator as unknown as {
      locks?: {
        query?: () => Promise<{ held?: Array<{ name?: string }>; pending?: Array<{ name?: string }> }>;
        request: (
          name: string,
          options: { steal?: boolean; ifAvailable?: boolean },
          cb: () => Promise<void> | void
        ) => Promise<unknown>;
      };
    };
    if (!anyNav.locks) return;

    const candidates = new Set<string>();
    try {
      const snap = await anyNav.locks.query?.();
      [...(snap?.held ?? []), ...(snap?.pending ?? [])].forEach((l) => {
        if (l.name && (l.name.startsWith("lock:sb-") || l.name.includes("auth-token"))) {
          candidates.add(l.name);
        }
      });
    } catch { /* ignore */ }

    // Always try the well-known GoTrue lock name pattern as well.
    try {
      const url = new URL(import.meta.env.VITE_SUPABASE_URL as string);
      const ref = url.hostname.split(".")[0];
      candidates.add(`lock:sb-${ref}-auth-token`);
    } catch { /* ignore */ }

    await Promise.all(
      [...candidates].map((name) =>
        anyNav.locks!
          .request(name, { steal: true }, async () => { /* released immediately */ })
          .catch(() => undefined)
      )
    );
  } catch {
    /* ignore */
  }
}

/**
 * Full client-side reset of the auth state without leaving the page.
 * Call this before retrying a login when the user is "stuck".
 */
export async function resetAuthClientState(): Promise<void> {
  try {
    await supabase.auth.signOut({ scope: "local" });
  } catch { /* ignore */ }
  await releaseAuthLocks();
  clearSupabaseAuthStorage();
}

/**
 * Nuclear option: signs out, releases locks, wipes all storage,
 * deletes Cache Storage, unregisters service workers, clears cookies
 * and reloads bypassing HTTP cache. Use when the user is fully stuck.
 */
export async function nukeAndReload(): Promise<void> {
  try { await supabase.auth.signOut({ scope: "local" }); } catch { /* ignore */ }
  try { await releaseAuthLocks(); } catch { /* ignore */ }
  try { localStorage.clear(); } catch { /* ignore */ }
  try { sessionStorage.clear(); } catch { /* ignore */ }
  try {
    if ("caches" in window) {
      const names = await caches.keys();
      await Promise.all(names.map((n) => caches.delete(n)));
    }
  } catch { /* ignore */ }
  try {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister().catch(() => undefined)));
    }
  } catch { /* ignore */ }
  try {
    document.cookie.split(";").forEach((c) => {
      const name = c.split("=")[0]?.trim();
      if (!name) return;
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}`;
    });
  } catch { /* ignore */ }
  window.location.replace(`/auth?_r=${Date.now()}`);
}

export async function hardReloadApp() {
  try {
    await releaseAuthLocks();
  } catch { /* ignore */ }
  try {
    localStorage.clear();
    sessionStorage.clear();
  } catch {
    /* ignore */
  }
  try {
    if ("caches" in window) {
      const names = await caches.keys();
      await Promise.all(names.map((n) => caches.delete(n)));
    }
  } catch {
    /* ignore */
  }
  // Bust HTTP cache by appending a query param then reloading
  const url = new URL(window.location.href);
  url.searchParams.set("_r", Date.now().toString());
  window.location.replace(url.toString());
}
