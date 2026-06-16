// meta-sync-structure (self-contained — sem imports de _shared)
//
// Puxa do Graph API a estrutura atual das campanhas Meta Ads da B&Z:
// campaigns, ad_sets, ads, creatives, leadgen_forms. Upsert em cada
// tabela meta_* e auditoria em meta_execution_log.
//
// Disparada pelo cron pg_cron com header X-Webhook-Secret.

import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2";

const META_TOKEN = Deno.env.get("META_USER_TOKEN_TEMPORARY") ?? "";
const META_GRAPH_VERSION = Deno.env.get("META_GRAPH_VERSION") ?? "v25.0";
const META_GRAPH = `https://graph.facebook.com/${META_GRAPH_VERSION}`;
const WEBHOOK_SECRET_FALLBACK = Deno.env.get("SDR_WEBHOOK_SECRET") ?? "";

const FN_NAME = "meta-sync-structure";

async function getWebhookSecret(sb: SupabaseClient): Promise<string> {
  const { data, error } = await sb.rpc("get_sdr_webhook_secret");
  if (error) throw new Error(`get_sdr_webhook_secret: ${error.message}`);
  return typeof data === "string" ? data : "";
}

async function verifyWebhookSecret(req: Request, sb: SupabaseClient): Promise<Response | null> {
  const expected = (await getWebhookSecret(sb)) || WEBHOOK_SECRET_FALLBACK;
  if (!expected) return null;
  const sec = req.headers.get("x-webhook-secret") ?? "";
  if (sec !== expected) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return null;
}

async function getCredential(sb: SupabaseClient): Promise<{ ad_account_id: string; page_id: string }> {
  const { data, error } = await sb
    .from("meta_credentials")
    .select("ad_account_id, page_id")
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

  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const w = await verifyWebhookSecret(req, sb);
  if (w) return w;

  const runId = await startRun(sb);

  try {
    const cred = await getCredential(sb);
    const adAccount = cred.ad_account_id;
    const now = new Date().toISOString();

    // Campaigns
    const campaignsRaw = await pagedFetch(graphUrl(`${adAccount}/campaigns`, {
      fields: "id,name,status,objective,daily_budget,lifetime_budget,start_time,stop_time,created_time",
      limit: "100",
    }));
    const campaigns = campaignsRaw.map((c: any) => ({
      id: c.id,
      ad_account_id: adAccount,
      name: c.name ?? null,
      status: c.status ?? null,
      objective: c.objective ?? null,
      daily_budget: c.daily_budget != null ? Number(c.daily_budget) : null,
      lifetime_budget: c.lifetime_budget != null ? Number(c.lifetime_budget) : null,
      start_time: c.start_time ?? null,
      stop_time: c.stop_time ?? null,
      created_time: c.created_time ?? null,
      raw: c,
      synced_at: now,
    }));

    // Ad Sets
    const adSetsRaw = await pagedFetch(graphUrl(`${adAccount}/adsets`, {
      fields: "id,name,status,campaign_id,daily_budget,targeting,start_time,end_time",
      limit: "100",
    }));
    const adSets = adSetsRaw.map((a: any) => ({
      id: a.id,
      campaign_id: a.campaign_id ?? null,
      name: a.name ?? null,
      status: a.status ?? null,
      daily_budget: a.daily_budget != null ? Number(a.daily_budget) : null,
      targeting: a.targeting ?? null,
      start_time: a.start_time ?? null,
      end_time: a.end_time ?? null,
      raw: a,
      synced_at: now,
    }));

    // Creatives
    const creativesRaw = await pagedFetch(graphUrl(`${adAccount}/adcreatives`, {
      fields: "id,name,title,body,thumbnail_url,image_url",
      limit: "100",
    }));
    const creatives = creativesRaw.map((c: any) => ({
      id: c.id,
      name: c.name ?? null,
      title: c.title ?? null,
      body: c.body ?? null,
      thumbnail_url: c.thumbnail_url ?? null,
      image_url: c.image_url ?? null,
      raw: c,
      synced_at: now,
    }));

    // Ads
    const adsRaw = await pagedFetch(graphUrl(`${adAccount}/ads`, {
      fields: "id,name,status,adset_id,campaign_id,creative",
      limit: "100",
    }));
    const ads = adsRaw.map((a: any) => ({
      id: a.id,
      campaign_id: a.campaign_id ?? null,
      ad_set_id: a.adset_id ?? null,
      creative_id: a.creative?.id ?? null,
      name: a.name ?? null,
      status: a.status ?? null,
      raw: a,
      synced_at: now,
    }));

    // Leadgen forms (B&Z usa CTWA, mas sincroniza pra futuro)
    const formsRaw = await pagedFetch(graphUrl(`${cred.page_id}/leadgen_forms`, {
      fields: "id,name,status,leads_count,questions,created_time",
      limit: "100",
    }));
    const forms = formsRaw.map((f: any) => ({
      id: f.id,
      page_id: cred.page_id,
      name: f.name ?? null,
      status: f.status ?? null,
      leads_count: f.leads_count ?? null,
      questions: f.questions ?? null,
      created_time: f.created_time ?? null,
      raw: f,
      synced_at: now,
    }));

    const total =
      (await upsertBatch(sb, "meta_campaigns", campaigns, "id")) +
      (await upsertBatch(sb, "meta_ad_sets", adSets, "id")) +
      (await upsertBatch(sb, "meta_creatives", creatives, "id")) +
      (await upsertBatch(sb, "meta_ads", ads, "id")) +
      (await upsertBatch(sb, "meta_leadgen_forms", forms, "id"));

    await finishRun(sb, runId, true, total);

    return new Response(
      JSON.stringify({
        ok: true,
        totals: {
          campaigns: campaigns.length,
          ad_sets: adSets.length,
          creatives: creatives.length,
          ads: ads.length,
          forms: forms.length,
        },
      }),
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
