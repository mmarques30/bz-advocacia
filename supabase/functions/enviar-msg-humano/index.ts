// Edge Function: enviar-msg-humano
// Chamada pelo painel Lovable quando o advogado digita uma mensagem
// na tela de conversa e clica "Enviar". Despacha via Z-API e registra.

import { getSupabaseAdmin, registrarEvento, registrarMensagem } from "../_shared/db.ts";
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
    .from("leads")
    .select("id, telefone, humano_responsavel, bot_pausado")
    .eq("id", lead_id)
    .single();
  if (!lead) return new Response("Lead não encontrado", { status: 404 });

  // Garante que o bot está pausado pra esse lead
  if (!lead.bot_pausado) {
    await supabase.from("leads").update({ bot_pausado: true }).eq("id", lead_id);
  }

  const resultado = await zapiSendText(lead.telefone, mensagem);

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
