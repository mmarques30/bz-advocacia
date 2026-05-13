// Edge Function: cron-followup
// pg_cron a cada 6h. Reengaja leads em atendimento sem resposta há 24h+.

import {
  getSupabaseAdmin,
  nomePrimeiro,
  registrarEvento,
  registrarMensagem,
  telefoneDoLead,
} from "../_shared/db.ts";
import { zapiSendText } from "../_shared/zapi.ts";

Deno.serve(async (_req) => {
  const supabase = getSupabaseAdmin();

  const agora = new Date();
  const limite24 = new Date(agora.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const limite72 = new Date(agora.getTime() - 72 * 60 * 60 * 1000).toISOString();
  const limite168 = new Date(agora.getTime() - 168 * 60 * 60 * 1000).toISOString();

  const cols = "id, full_name, phone_number, contato_whatsapp, ultima_mensagem_em, etapa_qualificacao";

  const { data: leads24 } = await supabase
    .from("leads_geral")
    .select(cols)
    .eq("status_sdr", "em_atendimento_bot")
    .eq("bot_pausado", false)
    .lt("ultima_mensagem_em", limite24)
    .gt("ultima_mensagem_em", limite72);

  const fu1Total = (leads24 ?? []).length;
  for (const lead of leads24 ?? []) {
    const tel = telefoneDoLead(lead as any);
    if (!tel) continue;
    const msg =
`Oi ${nomePrimeiro(lead as any)}, passando aqui rapidinho 🤓

Vi que começamos uma conversa ontem mas não conseguimos terminar. Se quiser, é só continuar de onde parou — estou aqui.

Caso tenha resolvido por outro caminho, sem problema, é só me avisar.`;
    const r = await zapiSendText(tel, msg);
    await registrarMensagem(supabase, lead.id, "bot", msg, { tipo: "followup_24h", zapi: r });
    await registrarEvento(supabase, lead.id, "followup_24h_enviado", { ok: r.ok });
  }

  const { data: leads72 } = await supabase
    .from("leads_geral")
    .select(cols)
    .eq("status_sdr", "em_atendimento_bot")
    .eq("bot_pausado", false)
    .lt("ultima_mensagem_em", limite72)
    .gt("ultima_mensagem_em", limite168);

  const fu2Total = (leads72 ?? []).length;
  for (const lead of leads72 ?? []) {
    const tel = telefoneDoLead(lead as any);
    if (!tel) continue;
    const msg =
`${nomePrimeiro(lead as any)}, último contato pra não te incomodar mais.

Se ainda quiser conversar com um advogado, basta responder qualquer coisa aqui que eu retomo. Se preferir buscar outra solução, fica tudo certo entre a gente.

Boa semana ✱`;
    const r = await zapiSendText(tel, msg);
    await registrarMensagem(supabase, lead.id, "bot", msg, { tipo: "followup_72h", zapi: r });
    await registrarEvento(supabase, lead.id, "followup_72h_enviado", { ok: r.ok });
    await supabase
      .from("leads_geral")
      .update({ status_sdr: "perdido", etapa_qualificacao: "finalizado" })
      .eq("id", lead.id);
  }

  return new Response(
    JSON.stringify({ ok: true, followup_24h: fu1Total, followup_72h: fu2Total }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
});
