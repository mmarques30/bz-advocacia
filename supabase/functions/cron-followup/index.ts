// Edge Function: cron-followup
// Disparada pelo pg_cron a cada 6h.
// Verifica leads em atendimento que não respondem há 24h+ e dispara mensagem de reengajamento.

import { getSupabaseAdmin, registrarEvento, registrarMensagem } from "../_shared/db.ts";
import { zapiSendText } from "../_shared/zapi.ts";

Deno.serve(async (_req) => {
  const supabase = getSupabaseAdmin();

  // Leads que estão em atendimento, com última mensagem entre 24h-72h atrás
  const agora = new Date();
  const limite24 = new Date(agora.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const limite72 = new Date(agora.getTime() - 72 * 60 * 60 * 1000).toISOString();

  const { data: leads24 } = await supabase
    .from("leads")
    .select("id, nome, telefone, ultima_mensagem_em, etapa_qualificacao")
    .eq("status_sdr", "em_atendimento_bot")
    .eq("bot_pausado", false)
    .lt("ultima_mensagem_em", limite24)
    .gt("ultima_mensagem_em", limite72);

  const fu1Total = (leads24 ?? []).length;
  for (const lead of leads24 ?? []) {
    const msg =
`Oi ${lead.nome}, passando aqui rapidinho 🤓

Vi que começamos uma conversa ontem mas não conseguimos terminar. Se quiser, é só continuar de onde parou — estou aqui.

Caso tenha resolvido por outro caminho, sem problema, é só me avisar.`;
    const r = await zapiSendText(lead.telefone, msg);
    await registrarMensagem(supabase, lead.id, "bot", msg, { tipo: "followup_24h", zapi: r });
    await registrarEvento(supabase, lead.id, "followup_24h_enviado", { ok: r.ok });
  }

  // Leads com última mensagem entre 72h e 168h (1 semana) — último contato
  const limite168 = new Date(agora.getTime() - 168 * 60 * 60 * 1000).toISOString();
  const { data: leads72 } = await supabase
    .from("leads")
    .select("id, nome, telefone, ultima_mensagem_em")
    .eq("status_sdr", "em_atendimento_bot")
    .eq("bot_pausado", false)
    .lt("ultima_mensagem_em", limite72)
    .gt("ultima_mensagem_em", limite168);

  const fu2Total = (leads72 ?? []).length;
  for (const lead of leads72 ?? []) {
    const msg =
`${lead.nome}, último contato pra não te incomodar mais.

Se ainda quiser conversar com um advogado, basta responder qualquer coisa aqui que eu retomo. Se preferir buscar outra solução, fica tudo certo entre a gente.

Boa semana ✱`;
    const r = await zapiSendText(lead.telefone, msg);
    await registrarMensagem(supabase, lead.id, "bot", msg, { tipo: "followup_72h", zapi: r });
    await registrarEvento(supabase, lead.id, "followup_72h_enviado", { ok: r.ok });
    // Marca como perdido depois desse último follow-up
    await supabase
      .from("leads")
      .update({ status_sdr: "perdido", etapa_qualificacao: "finalizado" })
      .eq("id", lead.id);
  }

  return new Response(
    JSON.stringify({ ok: true, followup_24h: fu1Total, followup_72h: fu2Total }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
});
