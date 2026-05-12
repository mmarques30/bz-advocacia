// Edge Function: on-new-lead
// Disparada pelo Database Webhook ao inserir em `leads_geral`.
// Envia M0 SE a origem do lead NÃO for "whatsapp_direto" (esse caso
// já é tratado pela whatsapp-inbound). Útil pra leads vindos do Meta
// Lead Ads, form do site ou inserção manual no CRM.

import { getSupabaseAdmin, registrarEvento, registrarMensagem } from "../_shared/db.ts";
import { zapiSendSequence } from "../_shared/zapi.ts";
import { AVISO_LGPD, mensagemBoasVindas } from "../_shared/prompts.ts";

interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  record: any;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  let payload: WebhookPayload;
  try { payload = await req.json(); } catch { return new Response("Bad JSON", { status: 400 }); }

  if (payload.type !== "INSERT" || payload.table !== "leads_geral") {
    return new Response("Ignored", { status: 200 });
  }

  const lead = payload.record;
  const supabase = getSupabaseAdmin();

  // Pula se origem for whatsapp_direto (whatsapp-inbound já manda boas-vindas)
  if (lead.origem_sdr === "whatsapp_direto" || lead.origem === "whatsapp_direto") {
    return new Response(JSON.stringify({ skipped: "origem_whatsapp_direto" }), { status: 200 });
  }

  // Idempotência: se já existe mensagem do bot, não reenvia
  const { count } = await supabase
    .from("mensagens_sdr")
    .select("id", { count: "exact", head: true })
    .eq("lead_id", lead.id)
    .eq("origem", "bot");
  if ((count ?? 0) > 0) {
    return new Response(JSON.stringify({ skipped: "ja_tem_msg_bot" }), { status: 200 });
  }

  if (!lead.telefone) {
    await registrarEvento(supabase, lead.id, "lead_sem_telefone", { record: lead });
    return new Response(JSON.stringify({ skipped: "sem_telefone" }), { status: 200 });
  }

  const boas = mensagemBoasVindas(lead.nome);
  const resultados = await zapiSendSequence(lead.telefone, [boas, AVISO_LGPD], 1200);

  await registrarMensagem(supabase, lead.id, "bot", boas, { tipo: "boas_vindas", zapi: resultados[0] });
  await registrarMensagem(supabase, lead.id, "bot", AVISO_LGPD, { tipo: "lgpd", zapi: resultados[1] });

  await supabase.from("leads_geral").update({
    status_sdr: "em_atendimento_bot",
    etapa_qualificacao: "M1",
  }).eq("id", lead.id);

  await registrarEvento(supabase, lead.id, "m0_enviada", {
    origem: lead.origem,
    origem_sdr: lead.origem_sdr,
  });

  return new Response(JSON.stringify({ ok: true }), {
    status: 200, headers: { "Content-Type": "application/json" },
  });
});
