// Edge Function: cron-followup
// Disparada por pg_cron a cada 6h (ou outro intervalo).
// Reengaja leads em atendimento que não respondem há 24-72h.

import { getSupabaseAdmin, registrarEvento, registrarMensagem } from "../_shared/db.ts";
import { zapiSendText } from "../_shared/zapi.ts";

Deno.serve(async () => {
  const supabase = getSupabaseAdmin();
  const agora = new Date();
  const lim24 = new Date(agora.getTime() - 24 * 3600 * 1000).toISOString();
  const lim72 = new Date(agora.getTime() - 72 * 3600 * 1000).toISOString();
  const lim168 = new Date(agora.getTime() - 168 * 3600 * 1000).toISOString();

  // Follow-up 1: 24h-72h
  const { data: leads24 } = await supabase
    .from("leads_geral")
    .select("id, nome:full_name, telefone:phone_number, contato_whatsapp, ultima_mensagem_em, etapa_qualificacao")
    .eq("status_sdr", "em_atendimento_bot")
    .eq("bot_pausado", false)
    .lt("ultima_mensagem_em", lim24)
    .gt("ultima_mensagem_em", lim72);

  let fu1 = 0;
  for (const l of leads24 ?? []) {
    const tel = (l as any).telefone ?? (l as any).contato_whatsapp;
    if (!tel) continue;
    const msg =
`Oi ${(l as any).nome ?? ""}, passando aqui rapidinho 🤓

Vi que começamos uma conversa ontem mas não finalizamos. Se quiser, é só continuar de onde parou — estou aqui.

Caso tenha resolvido por outro caminho, sem problema, é só me avisar.`;
    const r = await zapiSendText(tel, msg);
    await registrarMensagem(supabase, l.id, "bot", msg, { tipo: "followup_24h", zapi: r });
    await registrarEvento(supabase, l.id, "followup_24h_enviado", { ok: r.ok });
    fu1++;
  }

  // Follow-up 2: 72h-168h, depois marca como perdido
  const { data: leads72 } = await supabase
    .from("leads_geral")
    .select("id, nome:full_name, telefone:phone_number, contato_whatsapp")
    .eq("status_sdr", "em_atendimento_bot")
    .eq("bot_pausado", false)
    .lt("ultima_mensagem_em", lim72)
    .gt("ultima_mensagem_em", lim168);

  let fu2 = 0;
  for (const l of leads72 ?? []) {
    const tel = (l as any).telefone ?? (l as any).contato_whatsapp;
    if (!tel) continue;
    const msg =
`${(l as any).nome ?? ""}, último contato pra não te incomodar mais.

Se ainda quiser conversar com um advogado, basta responder qualquer coisa aqui. Se preferir buscar outra solução, fica tudo certo entre a gente.

Boa semana ✱`;
    const r = await zapiSendText(tel, msg);
    await registrarMensagem(supabase, l.id, "bot", msg, { tipo: "followup_72h", zapi: r });
    await registrarEvento(supabase, l.id, "followup_72h_enviado", { ok: r.ok });
    await supabase.from("leads_geral").update({
      status_sdr: "perdido", etapa_qualificacao: "finalizado",
    }).eq("id", l.id);
    fu2++;
  }

  return new Response(JSON.stringify({ ok: true, fu1, fu2 }), {
    status: 200, headers: { "Content-Type": "application/json" },
  });
});
