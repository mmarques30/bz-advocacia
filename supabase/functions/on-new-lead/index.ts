// Edge Function: on-new-lead
// Disparada pelo trigger trg_leads_geral_on_new_lead (HMAC via X-Webhook-Secret).
// Envia M0 + LGPD pela Z-API e registra em mensagens_sdr.

import { createClient } from "jsr:@supabase/supabase-js@2";
import { zapiSendSequence } from "../_shared/zapi.ts";
import { AVISO_LGPD, mensagemM0 } from "../_shared/prompts.ts";

interface LeadGeralRecord {
  id: string;
  full_name: string | null;
  phone_number: string | null;
  contato_whatsapp: string | null;
  tipo_servico: string | null;
  platform: string | null;
  origem_sdr: string | null;
  status_sdr?: string | null;
}

interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  record: LeadGeralRecord;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  // --- HMAC validation: secret lido direto do Vault via RPC (única fonte) ---
  const got = req.headers.get("x-webhook-secret");
  let expected: string | null = null;
  try {
    const { data, error } = await supabase.rpc("get_sdr_webhook_secret");
    if (error) console.error("[on-new-lead] rpc error:", error);
    expected = (data as string | null) ?? null;
  } catch (e) {
    console.error("[on-new-lead] rpc threw:", e);
    expected = null;
  }
  if (!expected || got !== expected) {
    console.warn("[on-new-lead] HMAC reject. has_expected=", !!expected, "has_got=", !!got);
    return new Response("Unauthorized", { status: 401 });
  }

  let payload: WebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response("Bad JSON", { status: 400 });
  }

  if (payload.type !== "INSERT" || payload.table !== "leads_geral") {
    return new Response(JSON.stringify({ ignored: true, reason: "type_or_table" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const lead = payload.record;
  const telefone = lead.contato_whatsapp ?? lead.phone_number;
  if (!lead?.id || !telefone) {
    return new Response(JSON.stringify({ ignored: true, reason: "missing_phone_or_id" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Idempotência: se já tem mensagem do bot pra esse lead, não reenvia.
  const { count } = await supabase
    .from("mensagens_sdr")
    .select("id", { count: "exact", head: true })
    .eq("lead_id", lead.id)
    .eq("origem", "bot");
  if ((count ?? 0) > 0) {
    return new Response(JSON.stringify({ skipped: "ja_tem_mensagem_bot" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const nome = (lead.full_name ?? "").split(" ")[0] || "tudo bem";
  const texto = mensagemM0(nome, lead.tipo_servico);
  const mensagens = [texto, AVISO_LGPD];

  const resultados = await zapiSendSequence(telefone, mensagens, 1200);
  const ok = resultados.every((r) => r.ok);

  for (let i = 0; i < mensagens.length; i++) {
    await supabase.from("mensagens_sdr").insert({
      lead_id: lead.id,
      origem: "bot",
      conteudo: mensagens[i],
      metadata: { zapi: resultados[i] },
    });
  }

  const proximaEtapa =
    lead.tipo_servico && lead.tipo_servico.trim().length > 0 ? "M1" : "M0";

  await supabase
    .from("leads_geral")
    .update({
      status_sdr: "em_atendimento_bot",
      etapa_qualificacao: proximaEtapa,
    })
    .eq("id", lead.id);

  await supabase.from("eventos_sdr").insert({
    lead_id: lead.id,
    tipo: "m0_enviada",
    payload: { tipo_servico: lead.tipo_servico, ok },
  });

  return new Response(JSON.stringify({ ok, lead_id: lead.id }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
