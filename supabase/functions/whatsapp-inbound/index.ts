// Edge Function: whatsapp-inbound (V3 full intake)
//
// Coração do SDR. Recebe webhook da Z-API.
// - Ignora grupos.
// - Ignora clientes existentes (telefone com processo ativo).
// - Ignora leads com bot pausado ou em status que não é "novo"/"em_atendimento_bot".
// - Cria lead se não existir e inicia M0.
// - Roteia entre os 4 fluxos (saúde, inventário, qualificação geral, fora-escopo).

import {
  buscarAdvogadoPorArea,
  buscarLeadPorTelefone,
  buscarServicosPorArea,
  criarLead,
  ehClienteExistente,
  getSupabaseAdmin,
  historicoMensagens,
  registrarEvento,
  registrarMensagem,
  type Lead,
} from "../_shared/db.ts";
import { ehGrupo, normalizarTelefone, zapiSendText } from "../_shared/zapi.ts";
import { claudeJson } from "../_shared/claude.ts";
import {
  AVISO_LGPD,
  mensagemBoasVindas,
  mensagemForaEscopoEducada,
  mensagemHandoffGeral,
  mensagemHandoffInventario,
  mensagemHandoffSaude,
  mensagemOptOut,
  SYSTEM_PROMPT,
  URL_PAGAMENTO_GENERICO,
} from "../_shared/prompts.ts";

interface ZapiInbound {
  phone: string;
  fromMe?: boolean;
  isGroup?: boolean;
  isStatusReply?: boolean;
  senderName?: string;
  chatName?: string;
  text?: { message: string };
  message?: string;
}

interface ClaudeOut {
  area_codigo: string;
  fluxo: "saude" | "inventario" | "qualificacao_geral" | "fora_escopo";
  proxima_acao:
    | "enviar_M1" | "enviar_M2" | "enviar_M3"
    | "encerrar_saude" | "encerrar_inventario"
    | "encerrar_qualificacao_geral" | "encerrar_fora_escopo"
    | "aguardar";
  resposta_estruturada?: Record<string, unknown>;
  score?: number;
  motivo?: string;
  mensagem_para_enviar?: string;
}

const STATUS_BOT_ATIVO = ["novo", "em_atendimento_bot"];

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  let payload: ZapiInbound;
  try {
    payload = await req.json();
  } catch {
    return new Response("Bad JSON", { status: 400 });
  }

  // Ignora mensagens enviadas POR NÓS e status updates
  if (payload.fromMe || payload.isStatusReply) {
    return new Response(JSON.stringify({ ignored: "fromMe_ou_status" }), { status: 200 });
  }

  // Ignora grupos
  if (ehGrupo(payload)) {
    return new Response(JSON.stringify({ ignored: "grupo" }), { status: 200 });
  }

  const texto = (payload.text?.message ?? payload.message ?? "").trim();
  if (!texto) return new Response(JSON.stringify({ ignored: "sem_texto" }), { status: 200 });

  const supabase = getSupabaseAdmin();
  const telefone = normalizarTelefone(payload.phone);

  // Busca lead
  let lead = await buscarLeadPorTelefone(supabase, telefone);

  // Lead novo → cria
  if (!lead) {
    const nomePerfil = payload.senderName?.trim() || payload.chatName?.trim() || "Lead WhatsApp";
    lead = await criarLead(supabase, {
      telefone,
      nome: nomePerfil,
      origem: "whatsapp_direto",
      origem_sdr: "whatsapp_direto",
    });
    if (!lead) {
      await registrarEvento(supabase, null, "criarLead_falhou", { telefone });
      return new Response("Erro ao criar lead", { status: 500 });
    }
    await registrarEvento(supabase, lead.id, "lead_criado_via_whatsapp", { telefone, nomePerfil });
  } else {
    // Filtros de quem NÃO recebe atendimento do bot
    const cliente = await ehClienteExistente(supabase, lead.id);
    if (cliente) {
      await registrarMensagem(supabase, lead.id, "lead", texto, { ignorado: "cliente_existente" });
      await registrarEvento(supabase, lead.id, "msg_cliente_ignorada", { telefone });
      return new Response(JSON.stringify({ ignored: "cliente_existente" }), { status: 200 });
    }
    if (lead.bot_pausado) {
      await registrarMensagem(supabase, lead.id, "lead", texto, { bot_pausado: true });
      return new Response(JSON.stringify({ ignored: "bot_pausado" }), { status: 200 });
    }
    if (!STATUS_BOT_ATIVO.includes(lead.status_sdr)) {
      await registrarMensagem(supabase, lead.id, "lead", texto, { status_sdr: lead.status_sdr });
      return new Response(JSON.stringify({ ignored: `status:${lead.status_sdr}` }), { status: 200 });
    }
  }

  // Salva a mensagem recebida
  await registrarMensagem(supabase, lead.id, "lead", texto, { telefone });

  // Opt-out
  if (/^\s*parar\s*$/i.test(texto)) {
    await supabase.from("leads_geral")
      .update({ status_sdr: "perdido", bot_pausado: true })
      .eq("id", lead.id);
    const msg = mensagemOptOut(lead.nome);
    await zapiSendText(telefone, msg);
    await registrarMensagem(supabase, lead.id, "bot", msg, { acao: "opt_out" });
    return new Response(JSON.stringify({ acao: "opt_out" }), { status: 200 });
  }

  // Se é a primeira interação com esse lead (etapa M0 e sem histórico do bot),
  // primeiro mandamos as boas-vindas + LGPD e marcamos etapa = M1.
  // Se o lead já está em M1+, deixamos o Claude decidir.
  const historico = await historicoMensagens(supabase, lead.id, 20);
  const temHistoricoBot = historico.some((h) => h.origem === "bot");

  if (!temHistoricoBot && lead.etapa_qualificacao === "M0") {
    const boas = mensagemBoasVindas(lead.nome);
    await zapiSendText(telefone, boas);
    await registrarMensagem(supabase, lead.id, "bot", boas, { tipo: "boas_vindas" });
    // pequena pausa antes do LGPD
    await new Promise((r) => setTimeout(r, 1200));
    await zapiSendText(telefone, AVISO_LGPD);
    await registrarMensagem(supabase, lead.id, "bot", AVISO_LGPD, { tipo: "lgpd" });

    // Avança etapa pra M1 (próxima resposta do lead já vai pro classificador)
    await supabase.from("leads_geral")
      .update({ etapa_qualificacao: "M1" })
      .eq("id", lead.id);

    return new Response(JSON.stringify({ acao: "boas_vindas_enviadas" }), { status: 200 });
  }

  // Roteamento via Claude
  const contexto = {
    nome: lead.nome,
    fluxo_atual: lead.fluxo_sdr,
    etapa_atual: lead.etapa_qualificacao,
    area_atual: lead.area_normalizada,
    score_atual: lead.score,
    tipo_de_processo_form: lead.tipo_de_processo,
  };

  const userPrompt = `Contexto:
${JSON.stringify(contexto, null, 2)}

Histórico (antigo → recente):
${historico.map((m) => `[${m.origem}] ${m.conteudo}`).join("\n")}

Última mensagem do lead:
"${texto}"

Decida a próxima ação e retorne o JSON.`;

  const r = await claudeJson<ClaudeOut>(
    SYSTEM_PROMPT,
    [{ role: "user", content: userPrompt }],
    { maxTokens: 1024, temperature: 0.3 },
  );

  if (!r.ok || !r.data) {
    await registrarEvento(supabase, lead.id, "claude_falhou", { erro: r.error, raw: r.rawText });
    return new Response(JSON.stringify({ erro: r.error }), { status: 500 });
  }

  const out = r.data;

  // Atualiza área + score + fluxo
  await supabase.from("leads_geral").update({
    area_normalizada: out.area_codigo,
    fluxo_sdr: out.fluxo,
    score: out.score ?? lead.score,
    motivo_qualificacao: out.motivo ?? null,
  }).eq("id", lead.id);

  // Salva qualificação se for resposta de M1/M2/M3
  const etapaAtual = lead.etapa_qualificacao;
  if (["M1", "M2", "M3"].includes(etapaAtual)) {
    await supabase.from("qualificacoes_sdr").upsert({
      lead_id: lead.id,
      pergunta_codigo: etapaAtual,
      pergunta_texto: `(${out.fluxo}) ${etapaAtual}`,
      resposta_texto: texto,
      resposta_estruturada: out.resposta_estruturada ?? {},
    }, { onConflict: "lead_id,pergunta_codigo" });
  }

  // Decide próxima mensagem e estado
  let mensagemFinal = (out.mensagem_para_enviar ?? "").trim();
  let novaEtapa = etapaAtual;
  let novoStatus = lead.status_sdr;
  let pausarBot = false;
  let notificarAdvogadoArea: string | null = null;

  switch (out.proxima_acao) {
    case "enviar_M1":
      novaEtapa = "M2";
      break;
    case "enviar_M2":
      novaEtapa = "M3";
      break;
    case "enviar_M3":
      novaEtapa = "finalizado";
      break;

    case "encerrar_saude": {
      novaEtapa = "finalizado";
      novoStatus = "sql_aguardando_humano";
      pausarBot = true;
      notificarAdvogadoArea = "saude";
      const servicos = await buscarServicosPorArea(supabase, "saude");
      const link = servicos[0]?.link_pagamento ?? URL_PAGAMENTO_GENERICO;
      mensagemFinal = mensagemFinal || mensagemHandoffSaude(lead.nome, link);
      break;
    }

    case "encerrar_inventario": {
      novaEtapa = "finalizado";
      novoStatus = "sql_aguardando_humano";
      pausarBot = true;
      notificarAdvogadoArea = "inventario";
      mensagemFinal = mensagemFinal || mensagemHandoffInventario(lead.nome);
      break;
    }

    case "encerrar_qualificacao_geral": {
      novaEtapa = "finalizado";
      novoStatus = "sql_aguardando_humano";
      pausarBot = true;
      notificarAdvogadoArea = out.area_codigo;
      const servicos = await buscarServicosPorArea(supabase, out.area_codigo);
      const areaNome = servicos[0]?.area_nome ?? out.area_codigo;
      mensagemFinal = mensagemFinal || mensagemHandoffGeral(lead.nome, areaNome);
      break;
    }

    case "encerrar_fora_escopo": {
      novaEtapa = "finalizado";
      novoStatus = "aguardando_triagem";
      pausarBot = true;
      notificarAdvogadoArea = "geral";
      mensagemFinal = mensagemFinal || mensagemForaEscopoEducada(lead.nome);
      break;
    }

    case "aguardar":
      mensagemFinal = mensagemFinal ||
        "Desculpa, não consegui te entender direito. Pode reformular em poucas palavras? 🤓";
      break;
  }

  // Envia + loga
  const env = await zapiSendText(telefone, mensagemFinal);
  await registrarMensagem(supabase, lead.id, "bot", mensagemFinal, {
    acao: out.proxima_acao,
    fluxo: out.fluxo,
    zapi: env,
  });

  // Atualiza lead
  await supabase.from("leads_geral").update({
    etapa_qualificacao: novaEtapa,
    status_sdr: novoStatus,
    bot_pausado: pausarBot ? true : lead.bot_pausado,
  }).eq("id", lead.id);

  // Notifica advogado se virou handoff
  if (notificarAdvogadoArea) {
    await notificarAdvogado(supabase, lead.id, notificarAdvogadoArea);
  }

  await registrarEvento(supabase, lead.id, "msg_processada", {
    acao: out.proxima_acao,
    fluxo: out.fluxo,
    area: out.area_codigo,
    score: out.score,
  });

  return new Response(JSON.stringify({ ok: true, acao: out.proxima_acao }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});

async function notificarAdvogado(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  leadId: string,
  areaCodigo: string,
) {
  const adv = await buscarAdvogadoPorArea(supabase, areaCodigo);
  if (!adv) {
    await registrarEvento(supabase, leadId, "advogado_nao_encontrado", { area: areaCodigo });
    return;
  }

  await supabase.from("leads_geral").update({ humano_responsavel: adv.id }).eq("id", leadId);

  const { data: lead } = await supabase
    .from("leads_geral")
    .select("nome, telefone, area_normalizada, fluxo_sdr, score")
    .eq("id", leadId)
    .single();

  const urlPainel = Deno.env.get("URL_PAINEL") ?? "https://painel.example.com";
  const texto =
`Novo lead pra você 🤓

• Nome: ${lead?.nome ?? "Lead"}
• WhatsApp: ${lead?.telefone}
• Fluxo: ${lead?.fluxo_sdr}
• Área: ${lead?.area_normalizada}
• Score: ${lead?.score ?? 0}

Abrir conversa: ${urlPainel}/leads/${leadId}`;

  if (adv.telefone) {
    await zapiSendText(adv.telefone, texto);
  }
  await registrarEvento(supabase, leadId, "advogado_notificado", {
    advogado_id: adv.id, area: areaCodigo,
  });
}
