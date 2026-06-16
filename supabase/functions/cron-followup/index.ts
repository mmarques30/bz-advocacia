// Edge Function: cron-followup
// pg_cron periodico (configurado no Supabase, hoje a cada 6h — pode ser
// ajustado pra 1h-2h pra pegar o estagio 4h mais cedo). Reengaja leads
// em atendimento sem resposta:
//   4h   → silencio curto, retoma onde parou
//   24h  → segunda tentativa, ja propondo marcar atendimento
//   72h+ → ultima mensagem, lead marcado como perdido (nao_respondeu_72h)
//
// Idempotencia: cada estagio gera um evento em eventos_sdr
// (followup_4h_enviado / followup_24h_enviado / followup_72h_enviado).
// Antes de mandar, checamos se ja temos esse evento pro lead — assim
// mesmo se o cron rodar 4x dentro da janela, o lead so recebe a msg uma vez.

import {
  getSupabaseAdmin,
  nomePrimeiro,
  registrarEvento,
  registrarMensagem,
  telefoneDoLead,
} from "../_shared/db.ts";
import { zapiSendText } from "../_shared/zapi.ts";

const WEBHOOK_SECRET = Deno.env.get("SDR_WEBHOOK_SECRET") ?? "";

Deno.serve(async (req) => {
  const sec = req.headers.get("x-webhook-secret") ?? "";
  if (WEBHOOK_SECRET && sec !== WEBHOOK_SECRET) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
  }

  const supabase = getSupabaseAdmin();

  const agora = new Date();
  const limite4 = new Date(agora.getTime() - 4 * 60 * 60 * 1000).toISOString();
  const limite24 = new Date(agora.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const limite72 = new Date(agora.getTime() - 72 * 60 * 60 * 1000).toISOString();
  const limite168 = new Date(agora.getTime() - 168 * 60 * 60 * 1000).toISOString();

  const cols = "id, full_name, phone_number, contato_whatsapp, ultima_mensagem_em, etapa_qualificacao";

  // ============================================================
  // 4 HORAS — silencio curto
  // Janela: 4h <= sem_resposta < 24h, e ainda nao foi enviado followup_4h
  // ============================================================
  const { data: leads4 } = await supabase
    .from("leads_geral")
    .select(cols)
    .eq("status_sdr", "em_atendimento_bot")
    .eq("bot_pausado", false)
    .lt("ultima_mensagem_em", limite4)
    .gt("ultima_mensagem_em", limite24);

  let fu4Enviados = 0;
  for (const lead of leads4 ?? []) {
    if (await jaEnviou(supabase, lead.id, "followup_4h_enviado")) continue;
    const tel = telefoneDoLead(lead as any);
    if (!tel) continue;
    const nome = nomePrimeiro(lead as any);
    const msg = `Oi ${nome}, ficamos parados aqui. Consegue me contar o resto pra eu te encaminhar pra advogada certa 😊?`;
    const r = await zapiSendText(tel, msg);
    await registrarMensagem(supabase, lead.id, "bot", msg, { tipo: "followup_4h", zapi: r });
    await registrarEvento(supabase, lead.id, "followup_4h_enviado", { ok: r.ok });
    fu4Enviados++;
  }

  // ============================================================
  // 24 HORAS — segunda tentativa, proposta de atendimento
  // Janela: 24h <= sem_resposta < 72h, e ainda nao foi enviado followup_24h
  // ============================================================
  const { data: leads24 } = await supabase
    .from("leads_geral")
    .select(cols)
    .eq("status_sdr", "em_atendimento_bot")
    .eq("bot_pausado", false)
    .lt("ultima_mensagem_em", limite24)
    .gt("ultima_mensagem_em", limite72);

  let fu24Enviados = 0;
  for (const lead of leads24 ?? []) {
    if (await jaEnviou(supabase, lead.id, "followup_24h_enviado")) continue;
    const tel = telefoneDoLead(lead as any);
    if (!tel) continue;
    const nome = nomePrimeiro(lead as any);
    const msg = `Passando aqui ${nome} pra gente marcar seu atendimento. Podemos seguir e realizar seu atendimento?`;
    const r = await zapiSendText(tel, msg);
    await registrarMensagem(supabase, lead.id, "bot", msg, { tipo: "followup_24h", zapi: r });
    await registrarEvento(supabase, lead.id, "followup_24h_enviado", { ok: r.ok });
    fu24Enviados++;
  }

  // ============================================================
  // 72 HORAS — ultima mensagem, marca lead como perdido
  // Janela: 72h <= sem_resposta < 168h
  // ============================================================
  const { data: leads72 } = await supabase
    .from("leads_geral")
    .select(cols)
    .eq("status_sdr", "em_atendimento_bot")
    .eq("bot_pausado", false)
    .lt("ultima_mensagem_em", limite72)
    .gt("ultima_mensagem_em", limite168);

  let fu72Enviados = 0;
  for (const lead of leads72 ?? []) {
    if (await jaEnviou(supabase, lead.id, "followup_72h_enviado")) continue;
    const tel = telefoneDoLead(lead as any);
    if (!tel) continue;
    const msg = `Vou deixar seu contato registrado aqui. Quando quiser retomar, é só mandar mensagem que a gente continua de onde parou 💙`;
    const r = await zapiSendText(tel, msg);
    await registrarMensagem(supabase, lead.id, "bot", msg, { tipo: "followup_72h", zapi: r });
    await registrarEvento(supabase, lead.id, "followup_72h_enviado", { ok: r.ok });
    await supabase
      .from("leads_geral")
      .update({
        status_sdr: "perdido",
        etapa_qualificacao: "finalizado",
        perdido_motivo: "nao_respondeu_72h",
      })
      .eq("id", lead.id);
    fu72Enviados++;
  }

  return new Response(
    JSON.stringify({
      ok: true,
      followup_4h: fu4Enviados,
      followup_24h: fu24Enviados,
      followup_72h: fu72Enviados,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
});

// Idempotencia: ja temos esse evento de followup pro lead?
async function jaEnviou(supabase: any, leadId: string, tipoEvento: string): Promise<boolean> {
  const { count } = await supabase
    .from("eventos_sdr")
    .select("id", { count: "exact", head: true })
    .eq("lead_id", leadId)
    .eq("tipo", tipoEvento);
  return (count ?? 0) > 0;
}
