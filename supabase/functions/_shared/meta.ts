// Helpers compartilhados pelas funcoes de sync do Meta Ads.
// Centraliza: token + version, autenticacao webhook, fetch paginado e
// log de execucao.

import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2";

export const META_TOKEN = Deno.env.get("META_USER_TOKEN_TEMPORARY") ?? "";
export const META_GRAPH_VERSION = Deno.env.get("META_GRAPH_VERSION") ?? "v25.0";
export const META_GRAPH = `https://graph.facebook.com/${META_GRAPH_VERSION}`;
export const WEBHOOK_SECRET = Deno.env.get("SDR_WEBHOOK_SECRET") ?? "";

export interface MetaCredential {
  ad_account_id: string;
  page_id: string;
  business_id: string | null;
}

export function adminClient(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

// Mesmo padrao de cron-followup / campanha-timeout-3d: valida o header
// `x-webhook-secret`. Se SDR_WEBHOOK_SECRET nao estiver setado, libera
// (modo desenvolvimento) — em producao o secret deve estar definido.
export function verifyWebhookSecret(req: Request): Response | null {
  if (!WEBHOOK_SECRET) return null;
  const sec = req.headers.get("x-webhook-secret") ?? "";
  if (sec !== WEBHOOK_SECRET) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return null;
}

export function requirePost(req: Request): Response | null {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  return null;
}

// Le a credencial unica ativa (so existe uma ad_account na conta da B&Z).
export async function getCredential(sb: SupabaseClient): Promise<MetaCredential> {
  const { data, error } = await sb
    .from("meta_credentials")
    .select("ad_account_id, page_id, business_id")
    .eq("active", true)
    .order("id", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`meta_credentials: ${error.message}`);
  if (!data) throw new Error("Nenhuma meta_credentials ativa encontrada.");
  return data as MetaCredential;
}

// Fetch paginado seguindo `paging.next` do Graph. Concatena todos os
// `data[]` em um array unico. Aborta com erro se a API retornar
// `error.message` no JSON.
export async function pagedFetch<T = any>(url: string): Promise<T[]> {
  const all: T[] = [];
  let next: string | null = url;
  let safety = 50; // limite de paginas pra evitar loop infinito
  while (next && safety-- > 0) {
    const resp = await fetch(next);
    const json = await resp.json();
    if (json?.error) {
      throw new Error(
        `Graph API error: ${json.error.message ?? JSON.stringify(json.error)}`,
      );
    }
    if (Array.isArray(json?.data)) {
      all.push(...json.data);
    }
    next = json?.paging?.next ?? null;
  }
  return all;
}

// Constroi URL do Graph com auth.
export function graphUrl(path: string, params: Record<string, string> = {}): string {
  const u = new URL(`${META_GRAPH}/${path.replace(/^\//, "")}`);
  u.searchParams.set("access_token", META_TOKEN);
  for (const [k, v] of Object.entries(params)) {
    u.searchParams.set(k, v);
  }
  return u.toString();
}

// Wrapper que loga execucao da function em meta_execution_log.
// Retorna {id} pra atualizar com `finished_at`/`ok`/`error_text` depois.
export interface RunCtx {
  startedId: number | null;
  rows: number;
}

export async function startRun(sb: SupabaseClient, functionName: string, context?: Record<string, unknown>): Promise<RunCtx> {
  const { data, error } = await sb
    .from("meta_execution_log")
    .insert({ function_name: functionName, context: context ?? null })
    .select("id")
    .maybeSingle();
  if (error) {
    console.error("[meta] startRun erro:", error);
    return { startedId: null, rows: 0 };
  }
  return { startedId: (data as any)?.id ?? null, rows: 0 };
}

export async function finishRun(
  sb: SupabaseClient,
  ctx: RunCtx,
  ok: boolean,
  rowsAffected: number,
  errorText?: string,
): Promise<void> {
  if (!ctx.startedId) return;
  await sb
    .from("meta_execution_log")
    .update({
      finished_at: new Date().toISOString(),
      ok,
      rows_affected: rowsAffected,
      error_text: errorText ?? null,
    })
    .eq("id", ctx.startedId);
}

// Upsert em lote — usa onConflict pra atualizar quando a PK ja existe.
export async function upsertBatch<T extends Record<string, unknown>>(
  sb: SupabaseClient,
  table: string,
  rows: T[],
  onConflict: string,
): Promise<number> {
  if (rows.length === 0) return 0;
  const { error } = await sb.from(table).upsert(rows, { onConflict });
  if (error) throw new Error(`upsert ${table}: ${error.message}`);
  return rows.length;
}
