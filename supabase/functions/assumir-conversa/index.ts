// Edge Function: assumir-conversa
// Chamada pelo painel quando o advogado clica em "Assumir conversa".

import { getSupabaseAdmin, registrarEvento, registrarMensagem } from "../_shared/db.ts";
import { zapiSendText } from "../_shared/zapi.ts";

interface Body { lead_id: string; advogado_id: string; enviar_transicao?: boolean; mensagem_transicao?: string; }

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  if (!(req.headers.get("Authorization") ?? "").startsWith("Bearer ")) {
    return new Response("Unauthorized", { status: 401 });
  }

  let body: Body;
  try { body = await req.json(); } catch { return new Response("Bad JSON", { status: 400 }); }
  const { lead_id, advogado_id } = body;
  if (!lead_id || !advogado_id) return new Response("lead_id e advogado_id obrigatórios", { status: 400 });

  const supabase = getSupabaseAdmin();

  const { data: lead } = await supabase
    .from("leads_geral")
    .select("id, nome:full_name, telefone:phone_number, contato_whatsapp, status_sdr")
    .eq("id", lead_id).single();
  if (!lead) return new Response("Lead não encontrado", { status: 404 });

  const { data: adv } = await supabase
    .from("advogados_sdr").select("id, nome").eq("id", advogado_id).single();
  if (!adv) return new Response("Advogado não encontrado", { status: 404 });

  await supabase.from("leads_geral").update({
    humano_responsavel: advogado_id,
    assumido_em: new Date().toISOString(),
    bot_pausado: true,
    status_sdr: "assumido_humano",
  }).eq("id", lead_id);

  const tel = (lead as any).telefone ?? (lead as any).contato_whatsapp;
  if (body.enviar_transicao !== false && tel) {
    const txt = body.mensagem_transicao ??
      `Oi ${(lead as any).nome ?? ""}, aqui é ${adv.nome}. Acabei de assumir a sua conversa pelo nosso time. Vou olhar seu caso com atenção e já te respondo aqui. ✱`;
    const r = await zapiSendText(tel, txt);
    await registrarMensagem(supabase, lead_id, "humano", txt, { advogado_id, zapi: r, tipo: "transicao" });
  }

  await registrarEvento(supabase, lead_id, "advogado_assumiu", { advogado_id });
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } });
});
