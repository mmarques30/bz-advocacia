// Edge Function: assumir-conversa
// Chamada pelo painel Lovable quando o advogado clica em "Assumir conversa".
// Marca o lead como assumido, pausa o bot e (opcional) envia uma transição pro lead.

import { getSupabaseAdmin, registrarEvento, registrarMensagem } from "../_shared/db.ts";
import { zapiSendText } from "../_shared/zapi.ts";

interface AssumirPayload {
  lead_id: string;
  advogado_id: string;
  enviar_transicao?: boolean;
  mensagem_transicao?: string;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  // Validação simples por header — o painel Lovable passa anon key + jwt do user.
  const auth = req.headers.get("Authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return new Response("Unauthorized", { status: 401 });

  let payload: AssumirPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response("Bad JSON", { status: 400 });
  }

  const { lead_id, advogado_id } = payload;
  if (!lead_id || !advogado_id) return new Response("lead_id e advogado_id obrigatórios", { status: 400 });

  const supabase = getSupabaseAdmin();

  const { data: lead } = await supabase
    .from("leads")
    .select("id, nome, telefone, status_sdr")
    .eq("id", lead_id)
    .single();
  if (!lead) return new Response("Lead não encontrado", { status: 404 });

  const { data: adv } = await supabase
    .from("advogados")
    .select("id, nome")
    .eq("id", advogado_id)
    .single();
  if (!adv) return new Response("Advogado não encontrado", { status: 404 });

  await supabase
    .from("leads")
    .update({
      humano_responsavel: advogado_id,
      assumido_em: new Date().toISOString(),
      bot_pausado: true,
      status_sdr: "assumido_humano",
    })
    .eq("id", lead_id);

  // Envia mensagem de transição opcional (recomendado)
  if (payload.enviar_transicao !== false) {
    const texto = payload.mensagem_transicao ??
      `Oi ${lead.nome}, aqui é ${adv.nome}. Acabei de assumir a sua conversa pelo nosso time. Vou olhar seu caso com atenção e já te respondo aqui. ✱`;
    const resultado = await zapiSendText(lead.telefone, texto);
    await registrarMensagem(supabase, lead_id, "humano", texto, {
      advogado_id,
      zapi: resultado,
      tipo: "transicao",
    });
  }

  await registrarEvento(supabase, lead_id, "advogado_assumiu", {
    advogado_id,
  });

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
