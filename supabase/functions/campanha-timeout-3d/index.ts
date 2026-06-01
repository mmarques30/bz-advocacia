// Edge Function: campanha-timeout-3d
// Marca campanhas_envio sem resposta em 3 dias como nao_respondida_3d
// e move o lead pra status 'perdido_recuperacao'.
// Chamada pelo pg_cron diariamente.

import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const WEBHOOK_SECRET = Deno.env.get("SDR_WEBHOOK_SECRET") ?? "";
const CAMPANHA = "recuperacao_form_meta_2026_06";

Deno.serve(async (req) => {
  // Aceita chamada do cron (X-Webhook-Secret) ou admin manual
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  const sec = req.headers.get("x-webhook-secret") ?? "";
  if (WEBHOOK_SECRET && sec !== WEBHOOK_SECRET) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
  }

  const sb = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Busca campanhas vencidas (>3 dias sem resposta)
  const cutoff = new Date(Date.now() - 3 * 86_400_000).toISOString();
  const { data: vencidos, error: errSel } = await sb
    .from("campanhas_envio")
    .select("id, lead_geral_id")
    .eq("campanha", CAMPANHA)
    .eq("status", "enviada")
    .is("respondida_em", null)
    .lt("enviada_em", cutoff)
    .limit(200);

  if (errSel) {
    return new Response(JSON.stringify({ error: errSel.message }), { status: 500 });
  }
  if (!vencidos || vencidos.length === 0) {
    return new Response(JSON.stringify({ vencidos: 0 }), { status: 200 });
  }

  const ids = vencidos.map((v: any) => v.id);
  const leadIds = vencidos.map((v: any) => v.lead_geral_id).filter(Boolean) as string[];

  // 1) Marca campanhas como nao_respondida_3d
  const { error: errUpdCamp } = await sb
    .from("campanhas_envio")
    .update({ status: "nao_respondida_3d" })
    .in("id", ids);
  if (errUpdCamp) {
    return new Response(JSON.stringify({ error: `update campanha: ${errUpdCamp.message}` }), { status: 500 });
  }

  // 2) Marca leads como perdido_recuperacao
  const nowIso = new Date().toISOString();
  if (leadIds.length > 0) {
    const { error: errUpdLead } = await sb
      .from("leads_geral")
      .update({
        status_sdr: "perdido_recuperacao",
        bot_pausado: true,
        perdido_motivo: "nao_respondeu_3d_campanha",
        perdido_em: nowIso,
      })
      .in("id", leadIds);
    if (errUpdLead) {
      return new Response(
        JSON.stringify({ error: `update lead: ${errUpdLead.message}`, vencidos: ids.length }),
        { status: 500 },
      );
    }
  }

  // 3) Eventos
  const eventos = vencidos.map((v: any) => ({
    lead_id: v.lead_geral_id,
    tipo: "lead_perdido_timeout_3d",
    payload: { campanhas_envio_id: v.id, campanha: CAMPANHA },
  }));
  if (eventos.length > 0) {
    await sb.from("eventos_sdr").insert(eventos);
  }

  return new Response(
    JSON.stringify({ vencidos: vencidos.length, leads_atualizados: leadIds.length }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
});
