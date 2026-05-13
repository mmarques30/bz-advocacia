// Edge Function: assumir-conversa
// Painel chama quando o advogado clica "Assumir conversa".

import {
  getSupabaseAdmin,
  nomePrimeiro,
  registrarEvento,
  registrarMensagem,
  telefoneDoLead,
} from "../_shared/db.ts";
import { zapiSendText } from "../_shared/zapi.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface AssumirPayload {
  lead_id: string;
  advogado_id: string;
  enviar_transicao?: boolean;
  mensagem_transicao?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  const auth = req.headers.get("Authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return new Response("Unauthorized", { status: 401, headers: corsHeaders });

  let payload: AssumirPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response("Bad JSON", { status: 400, headers: corsHeaders });
  }

  const { lead_id, advogado_id } = payload;
  if (!lead_id || !advogado_id) {
    return new Response("lead_id e advogado_id obrigatórios", { status: 400, headers: corsHeaders });
  }

  const supabase = getSupabaseAdmin();

  const { data: lead } = await supabase
    .from("leads_geral")
    .select("id, full_name, phone_number, contato_whatsapp, status_sdr")
    .eq("id", lead_id)
    .maybeSingle();
  if (!lead) return new Response("Lead não encontrado", { status: 404, headers: corsHeaders });

  const { data: adv } = await supabase
    .from("advogados_sdr")
    .select("id, nome")
    .eq("id", advogado_id)
    .maybeSingle();
  if (!adv) return new Response("Advogado não encontrado", { status: 404, headers: corsHeaders });

  await supabase
    .from("leads_geral")
    .update({
      humano_responsavel: advogado_id,
      assumido_em: new Date().toISOString(),
      bot_pausado: true,
      status_sdr: "assumido_humano",
    })
    .eq("id", lead_id);

  if (payload.enviar_transicao !== false) {
    const tel = telefoneDoLead(lead as any);
    const texto = payload.mensagem_transicao ??
      `Oi ${nomePrimeiro(lead as any)}, aqui é ${adv.nome}. Acabei de assumir a sua conversa pelo nosso time. Vou olhar seu caso com atenção e já te respondo aqui. ✱`;
    const resultado = tel ? await zapiSendText(tel, texto) : { ok: false, status: 0 };
    await registrarMensagem(supabase, lead_id, "humano", texto, {
      advogado_id,
      zapi: resultado,
      tipo: "transicao",
    });
  }

  await registrarEvento(supabase, lead_id, "advogado_assumiu", { advogado_id });

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
