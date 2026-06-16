// meta-sync-insights (self-contained — sem imports de _shared)
//
// Puxa insights diarios do nivel 'ad' dos ultimos 7 dias e faz upsert em
// meta_insights_daily (UNIQUE (level, object_id, date)). Extrai leads e
// cost_per_lead do array actions[] (action_types 'lead' e
// 'onsite_conversion.lead_grouped').

import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2";

const META_TOKEN = Deno.env.get("META_USER_TOKEN_TEMPORARY") ?? "";
const META_GRAPH_VERSION = Deno.env.get("META_GRAPH_VERSION") ?? "v25.0";
const META_GRAPH = `https://graph.facebook.com/${META_GRAPH_VERSION}`;
const WEBHOOK_SECRET = Deno.env.get("SDR_WEBHOOK_SECRET") ?? "";

const FN_NAME = "meta-sync-insights";
const LEAD_ACTION_TYPES = new Set(["lead", "onsite_conversion.lead_grouped"]);

interface MetaAction {
  action_type: string;
  value: string;
}

function pickLeadValue(actions: MetaAction[] | null | undefined): number {
  if (!Array.isArray(actions)) return 0;
  return actions
    .filter((a) => LEAD_ACTION_TYPES.has(a.action_type))
    .reduce((sum, a) => sum + Number(a.value ?? 0), 0);
}

function pickCostPerLead(costPerActionType: MetaAction[] | null | undefined): number | null {
  if (!Array.isArray(costPerActionType)) return null;
  const hit = costPerActionType.find((a) => LEAD_ACTION_TYPES.has(a.action_type));
  return hit ? Number(hit.value ?? 0) : null;
}

function verifyWebhookSecret(req: Request): Response | null {
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

async function getCredential(sb: SupabaseClient): Promise<{ ad_account_id: string }> {
  const { data, error } = await sb
    .from("meta_credentials")
    .select("ad_account_id")
    .eq("active", true)
    .order("id", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`meta_credentials: ${error.message}`);
  if (!data) throw new Error("Nenhuma meta_credentials ativa encontrada.");
  return data as any;
}

async function pagedFetch<T = any>(url: string): Promise<T[]> {
  const all: T[] = [];
  let next: string | null = url;
  let safety = 50;
  while (next && safety-- > 0) {
    const resp = await fetch(next);
    const json = await resp.json();
    if (json?.error) {
      throw new Error(`Graph API error: ${json.error.message ?? JSON.stringify(json.error)}`);
    }
    if (Array.isArray(json?.data)) all.push(...json.data);
    next = json?.paging?.next ?? null;
  }
  return all;
}

function graphUrl(path: string, params: Record<string, string> = {}): string {
  const u = new URL(`${META_GRAPH}/${path.replace(/^\//, "")}`);
  u.searchParams.set("access_token", META_TOKEN);
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  return u.toString();
}

async function startRun(sb: SupabaseClient): Promise<number | null> {
  const { data } = await sb
    .from("meta_execution_log")
    .insert({ function_name: FN_NAME })
    .select("id")
    .maybeSingle();
  return (data as any)?.id ?? null;
}

async function finishRun(sb: SupabaseClient, id: number | null, ok: boolean, rows: number, errorText?: string) {
  if (!id) return;
  await sb
    .from("meta_execution_log")
    .update({
      finished_at: new Date().toISOString(),
      ok,
      rows_affected: rows,
      error_text: errorText ?? null,
    })
    .eq("id", id);
}

async function upsertBatch(sb: SupabaseClient, table: string, rows: any[], onConflict: string): Promise<number> {
  if (rows.length === 0) return 0;
  const { error } = await sb.from(table).upsert(rows, { onConflict });
  if (error) throw new Error(`upsert ${table}: ${error.message}`);
  return rows.length;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const w = verifyWebhookSecret(req);
  if (w) return w;

  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const runId = await startRun(sb);

  try {
    const cred = await getCredential(sb);
    const adAccount = cred.ad_account_id;
    const now = new Date().toISOString();

    const insightsRaw = await pagedFetch(graphUrl(`${adAccount}/insights`, {
      level: "ad",
      time_increment: "1",
      date_preset: "last_7d",
      fields: [
        "campaign_id",
        "adset_id",
        "ad_id",
        "date_start",
        "spend",
        "impressions",
        "reach",
        "frequency",
        "clicks",
        "inline_link_clicks",
        "ctr",
        "cpc",
        "cpm",
        "actions",
        "cost_per_action_type",
      ].join(","),
      limit: "500",
    }));

    const rows = insightsRaw.map((r: any) => {
      const leadsCount = pickLeadValue(r.actions);
      const cpl = pickCostPerLead(r.cost_per_action_type);
      return {
        level: "ad",
        object_id: r.ad_id,
        date: r.date_start,
        spend: r.spend != null ? Number(r.spend) : null,
        impressions: r.impressions != null ? Number(r.impressions) : null,
        reach: r.reach != null ? Number(r.reach) : null,
        frequency: r.frequency != null ? Number(r.frequency) : null,
        clicks: r.clicks != null ? Number(r.clicks) : null,
        link_clicks: r.inline_link_clicks != null ? Number(r.inline_link_clicks) : null,
        ctr: r.ctr != null ? Number(r.ctr) : null,
        cpc: r.cpc != null ? Number(r.cpc) : null,
        cpm: r.cpm != null ? Number(r.cpm) : null,
        leads: leadsCount > 0 ? leadsCount : null,
        cost_per_lead: cpl,
        actions: r.actions ?? null,
        cost_per_action_type: r.cost_per_action_type ?? null,
        raw: r,
        synced_at: now,
      };
    });

    const inserted = await upsertBatch(sb, "meta_insights_daily", rows, "level,object_id,date");

    await finishRun(sb, runId, true, inserted);

    return new Response(
      JSON.stringify({ ok: true, inserted, level: "ad", date_preset: "last_7d" }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    const msg = err?.message ?? String(err);
    console.error(`[${FN_NAME}]`, msg);
    await finishRun(sb, runId, false, 0, msg);
    return new Response(
      JSON.stringify({ ok: false, error: msg }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
