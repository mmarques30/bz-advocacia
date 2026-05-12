// Edge Function: enviar-msg-humano
// Chamada pelo painel quando o advogado envia uma mensagem manual.

import { getSupabaseAdmin, registrarEvento, registrarMensagem } from "../_shared/db.ts";
import { zapiSendText } from "../_shared/zapi.ts";

interface Body { lead_id: string; advogado_id: string; mensagem: string; }

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  if (!(req.headers.get("Authorization") ?? "").startsWith("Bearer ")) {
    return new Response("Unauthorized", { status: 401 });
  }

  let body: Body;
  try { body = await req.json(); } catch { return new Response("Bad JSON", { status: 400 }); }
  const { lead_id, advogado_id, mensagem } = body;
  if (!lead_id || !advogado_id || !mensagem?.trim()) {
    return new Response("Campos obrigatórios", { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: lead } = await supabase
    .from("leads_geral").select("id, telefone, bot_pausado").eq("id", lead_id).single();
  if (!lead) return new Response("Lead não encontrado", { status: 404 });

  if (!lead.bot_pausado) {
    await supabase.from("leads_geral").update({ bot_pausado: true }).eq("id", lead_id);
  }

  const r = await zapiSendText(lead.telefone, mensagem);
  await registrarMensagem(supabase, lead_id, "humano", mensagem, { advogado_id, zapi: r });
  await registrarEvento(supabase, lead_id, "humano_enviou_msg", { advogado_id, ok: r.ok });

  return new Response(
    JSON.stringify({ ok: r.ok, status: r.status, messageId: r.messageId }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
});
