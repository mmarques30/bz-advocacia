// meta-sync-insights
//
// Puxa insights diarios do nivel `ad` dos ultimos 7 dias e faz upsert em
// meta_insights_daily (UNIQUE (level, object_id, date)). Tambem extrai
// `leads` e `cost_per_lead` do array `actions[]` (Meta retorna varios
// `action_type`s; pegamos 'lead' e 'onsite_conversion.lead_grouped').
//
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

function pickCostPerLead(
  costPerActionType: MetaAction[] | null | undefined,
): number | null {
  if (!Array.isArray(costPerActionType)) return null;
  const hit = costPerActionType.find((a) =>
    LEAD_ACTION_TYPES.has(a.action_type),
  );
  return hit ? Number(hit.value ?? 0) : null;
}

Deno.serve(async (req) => {
  const m = requirePost(req); if (m) return m;
  const w = verifyWebhookSecret(req); if (w) return w;

  const sb = adminClient();
  const ctx = await startRun(sb, FN_NAME);

  try {
    const cred = await getCredential(sb);
    const adAccount = cred.ad_account_id;

    // time_increment=1 + date_preset=last_7d -> 1 linha por dia, ate 7 dias.
    // level=ad -> retorna campaign_id/adset_id/ad_id em cada linha.
    const insightsRaw = await pagedFetch<any>(
      graphUrl(`${adAccount}/insights`, {
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
      }),
    );

    const rows = insightsRaw.map((r) => {
      const leadsCount = pickLeadValue(r.actions);
      const cpl = pickCostPerLead(r.cost_per_action_type);
      return {
        level: "ad",
        object_id: r.ad_id,
        date: r.date_start, // 'YYYY-MM-DD'
        spend: r.spend != null ? Number(r.spend) : null,
        impressions: r.impressions != null ? Number(r.impressions) : null,
        reach: r.reach != null ? Number(r.reach) : null,
        frequency: r.frequency != null ? Number(r.frequency) : null,
        clicks: r.clicks != null ? Number(r.clicks) : null,
        link_clicks:
          r.inline_link_clicks != null ? Number(r.inline_link_clicks) : null,
        ctr: r.ctr != null ? Number(r.ctr) : null,
        cpc: r.cpc != null ? Number(r.cpc) : null,
        cpm: r.cpm != null ? Number(r.cpm) : null,
        leads: leadsCount > 0 ? leadsCount : null,
        cost_per_lead: cpl,
        actions: r.actions ?? null,
        cost_per_action_type: r.cost_per_action_type ?? null,
        raw: r,
        synced_at: new Date().toISOString(),
      };
    });

    const inserted = await upsertBatch(
      sb,
      "meta_insights_daily",
      rows,
      "level,object_id,date",
    );

    await finishRun(sb, ctx, true, inserted);

    return new Response(
      JSON.stringify({ ok: true, inserted, level: "ad", date_preset: "last_7d" }),
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
