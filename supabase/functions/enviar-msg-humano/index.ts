// Edge Function: enviar-msg-humano
// Painel chama quando o advogado envia mensagem manual.

import {
  getSupabaseAdmin,
  registrarEvento,
  registrarMensagem,
  telefoneDoLead,
} from "../_shared/db.ts";
import { zapiSendText } from "../_shared/zapi.ts";

interface EnviarPayload {
  lead_id: string;
  advogado_id: string;
  mensagem: string;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const auth = req.headers.get("Authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return new Response("Unauthorized", { status: 401 });

  let payload: EnviarPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response("Bad JSON", { status: 400 });
  }

  const { lead_id, advogado_id, mensagem } = payload;
  if (!lead_id || !advogado_id || !mensagem?.trim()) {
    return new Response("Campos obrigatórios: lead_id, advogado_id, mensagem", { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  const { data: lead } = await supabase
    .from("leads_geral")
    .select("id, phone_number, contato_whatsapp, humano_responsavel, bot_pausado")
    .eq("id", lead_id)
    .maybeSingle();
  if (!lead) return new Response("Lead não encontrado", { status: 404 });

  if (!lead.bot_pausado) {
    await supabase.from("leads_geral").update({ bot_pausado: true }).eq("id", lead_id);
  }

  const tel = telefoneDoLead(lead as any);
  if (!tel) return new Response("Lead sem telefone", { status: 400 });

  const resultado = await zapiSendText(tel, mensagem);

  await registrarMensagem(supabase, lead_id, "humano", mensagem, {
    advogado_id,
    zapi: resultado,
  });

  await registrarEvento(supabase, lead_id, "humano_enviou_msg", {
    advogado_id,
    ok: resultado.ok,
  });

  return new Response(
    JSON.stringify({ ok: resultado.ok, status: resultado.status, messageId: resultado.messageId }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
});
