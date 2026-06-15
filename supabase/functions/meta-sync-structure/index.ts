// meta-sync-structure
//
// Puxa do Graph API a estrutura atual das campanhas Meta Ads da B&Z:
// - campaigns (act/{id}/campaigns)
// - ad_sets   (act/{id}/adsets)
// - ads       (act/{id}/ads)
// - creatives (act/{id}/adcreatives)
// - leadgen_forms ({page_id}/leadgen_forms)  — B&Z usa CTWA, mas a tabela
//   esta no schema e a sincronizacao fica disponivel.
//
// Upsert em cada tabela meta_*. Logado em meta_execution_log.
// Disparado pelo cron (header X-Webhook-Secret) ou admin manual.

import {
  adminClient,
  verifyWebhookSecret,
  requirePost,
  getCredential,
  pagedFetch,
  graphUrl,
  upsertBatch,
  startRun,
  finishRun,
} from "../_shared/meta.ts";

const FN_NAME = "meta-sync-structure";

Deno.serve(async (req) => {
  const m = requirePost(req); if (m) return m;
  const w = verifyWebhookSecret(req); if (w) return w;

  const sb = adminClient();
  const ctx = await startRun(sb, FN_NAME);

  try {
    const cred = await getCredential(sb);
    const adAccount = cred.ad_account_id;

    // ------------------------------------------------------------------
    // 1) Campaigns
    // ------------------------------------------------------------------
    const campaignsRaw = await pagedFetch<any>(
      graphUrl(`${adAccount}/campaigns`, {
        fields:
          "id,name,status,objective,daily_budget,lifetime_budget,start_time,stop_time,created_time",
        limit: "100",
      }),
    );
    const campaigns = campaignsRaw.map((c) => ({
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
      synced_at: new Date().toISOString(),
    }));

    // ------------------------------------------------------------------
    // 2) Ad Sets
    // ------------------------------------------------------------------
    const adSetsRaw = await pagedFetch<any>(
      graphUrl(`${adAccount}/adsets`, {
        fields:
          "id,name,status,campaign_id,daily_budget,targeting,start_time,end_time",
        limit: "100",
      }),
    );
    const adSets = adSetsRaw.map((a) => ({
      id: a.id,
      campaign_id: a.campaign_id ?? null,
      name: a.name ?? null,
      status: a.status ?? null,
      daily_budget: a.daily_budget != null ? Number(a.daily_budget) : null,
      targeting: a.targeting ?? null,
      start_time: a.start_time ?? null,
      end_time: a.end_time ?? null,
      raw: a,
      synced_at: new Date().toISOString(),
    }));

    // ------------------------------------------------------------------
    // 3) Creatives
    // ------------------------------------------------------------------
    const creativesRaw = await pagedFetch<any>(
      graphUrl(`${adAccount}/adcreatives`, {
        fields: "id,name,title,body,thumbnail_url,image_url",
        limit: "100",
      }),
    );
    const creatives = creativesRaw.map((c) => ({
      id: c.id,
      name: c.name ?? null,
      title: c.title ?? null,
      body: c.body ?? null,
      thumbnail_url: c.thumbnail_url ?? null,
      image_url: c.image_url ?? null,
      raw: c,
      synced_at: new Date().toISOString(),
    }));

    // ------------------------------------------------------------------
    // 4) Ads
    // ------------------------------------------------------------------
    const adsRaw = await pagedFetch<any>(
      graphUrl(`${adAccount}/ads`, {
        fields: "id,name,status,adset_id,campaign_id,creative",
        limit: "100",
      }),
    );
    const ads = adsRaw.map((a) => ({
      id: a.id,
      campaign_id: a.campaign_id ?? null,
      ad_set_id: a.adset_id ?? null,
      creative_id: a.creative?.id ?? null,
      name: a.name ?? null,
      status: a.status ?? null,
      raw: a,
      synced_at: new Date().toISOString(),
    }));

    // ------------------------------------------------------------------
    // 5) Leadgen forms (B&Z usa CTWA, mas sincroniza pra futuro)
    // ------------------------------------------------------------------
    const formsRaw = await pagedFetch<any>(
      graphUrl(`${cred.page_id}/leadgen_forms`, {
        fields: "id,name,status,leads_count,questions,created_time",
        limit: "100",
      }),
    );
    const forms = formsRaw.map((f) => ({
      id: f.id,
      page_id: cred.page_id,
      name: f.name ?? null,
      status: f.status ?? null,
      leads_count: f.leads_count ?? null,
      questions: f.questions ?? null,
      created_time: f.created_time ?? null,
      raw: f,
      synced_at: new Date().toISOString(),
    }));

    // ------------------------------------------------------------------
    // Upsert (ordem: campaigns -> ad_sets -> creatives -> ads -> forms)
    // FKs sao com ON DELETE SET NULL, entao a ordem matter pra coerencia.
    // ------------------------------------------------------------------
    const total =
      (await upsertBatch(sb, "meta_campaigns", campaigns, "id")) +
      (await upsertBatch(sb, "meta_ad_sets", adSets, "id")) +
      (await upsertBatch(sb, "meta_creatives", creatives, "id")) +
      (await upsertBatch(sb, "meta_ads", ads, "id")) +
      (await upsertBatch(sb, "meta_leadgen_forms", forms, "id"));

    await finishRun(sb, ctx, true, total);

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
    await finishRun(sb, ctx, false, 0, msg);
    return new Response(
      JSON.stringify({ ok: false, error: msg }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
