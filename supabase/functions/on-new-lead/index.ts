// Edge Function: on-new-lead
// Disparada pelo Database Webhook do Supabase quando um lead é inserido na tabela `leads`.
// Envia a M0 (boas-vindas) pela Z-API.

import { getSupabaseAdmin, registrarEvento, registrarMensagem } from "../_shared/db.ts";
import { zapiSendSequence } from "../_shared/zapi.ts";
import { AVISO_LGPD, mensagemM0 } from "../_shared/prompts.ts";

interface SupabaseWebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  record: {
    id: string;
    nome: string;
    telefone: string;
    tipo_de_processo: string | null;
    origem: string | null;
    status_sdr?: string;
  };
  schema: string;
  old_record?: unknown;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  let payload: SupabaseWebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response("Bad JSON", { status: 400 });
  }

  if (payload.type !== "INSERT" || payload.table !== "leads") {
    return new Response("Ignored", { status: 200 });
  }

  const lead = payload.record;
  const supabase = getSupabaseAdmin();

  // Idempotência simples: se já tem mensagem do bot pra esse lead, não reenvia.
  const { count } = await supabase
    .from("mensagens")
    .select("id", { count: "exact", head: true })
    .eq("lead_id", lead.id)
    .eq("origem", "bot");
  if ((count ?? 0) > 0) {
    return new Response(JSON.stringify({ skipped: "ja_tem_mensagem_bot" }), { status: 200 });
  }

  const texto = mensagemM0(lead.nome, lead.tipo_de_processo);
  const mensagens = [texto, AVISO_LGPD];

  const resultados = await zapiSendSequence(lead.telefone, mensagens, 1200);
  const ok = resultados.every((r) => r.ok);

  // Loga as mensagens enviadas (mesmo se falhou — pra debugar)
  for (let i = 0; i < mensagens.length; i++) {
    await registrarMensagem(
      supabase,
      lead.id,
      "bot",
      mensagens[i],
      { zapi: resultados[i] },
    );
  }

  // Atualiza status do SDR
  const proximaEtapa = lead.tipo_de_processo && lead.tipo_de_processo.trim().length > 0
    ? "M1"  // já temos a área, próxima mensagem do lead vai pra M1
    : "M0"; // ainda precisa identificar a área

  await supabase
    .from("leads")
    .update({
      status_sdr: "em_atendimento_bot",
      etapa_qualificacao: proximaEtapa,
    })
    .eq("id", lead.id);

  await registrarEvento(supabase, lead.id, "m0_enviada", {
    tipo_de_processo: lead.tipo_de_processo,
    ok,
  });

  return new Response(JSON.stringify({ ok, lead_id: lead.id }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
