import { toast } from '@/lib/toast';

/**
 * Periodically checks if the deployed index.html has changed since this tab
 * was loaded. If so, prompts the user to refresh. Avoids stale bundles.
 */
let initialFingerprint: string | null = null;
let started = false;

async function fetchFingerprint(): Promise<string | null> {
  try {
    const res = await fetch(`/index.html?_v=${Date.now()}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const html = await res.text();
    // Match all hashed asset references (Vite chunks)
    const matches = html.match(/\/assets\/[^"'\s]+/g) ?? [];
    return matches.sort().join('|');
  } catch {
    return null;
  }
}

export function startVersionCheck(intervalMs = 5 * 60 * 1000) {
  if (started) return;
  started = true;

  fetchFingerprint().then((fp) => {
    initialFingerprint = fp;
  });

  const check = async () => {
    if (document.hidden) return;
    const current = await fetchFingerprint();
    if (!current || !initialFingerprint) return;
    if (current !== initialFingerprint) {
      toast.info('Nova versão disponível', {
        description: 'Clique em Atualizar para carregar a nova versão.',
        duration: Infinity,
        action: {
          label: 'Atualizar',
          onClick: () => window.location.reload(),
        },
      });
      // stop further prompts
      started = true;
      clearInterval(handle);
    }
  };

  const handle = setInterval(check, intervalMs);
  window.addEventListener('focus', check);
}
