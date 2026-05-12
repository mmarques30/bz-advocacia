// Edge Function: whatsapp-inbound
// Recebe webhook da Z-API quando o lead manda mensagem.
// Classifica via Claude, salva tudo, decide próxima ação.

import {
  buscarLeadPorTelefone,
  getSupabaseAdmin,
  historicoMensagens,
  registrarEvento,
  registrarMensagem,
  buscarAdvogadoPorArea,
} from "../_shared/db.ts";
import { normalizarTelefone, zapiSendText } from "../_shared/zapi.ts";
import { claudeJson } from "../_shared/claude.ts";
import {
  mensagemForaEscopo,
  mensagemMQLFrio,
  mensagemSQL,
  PERGUNTAS_FALLBACK,
  SYSTEM_PROMPT_CLASSIFICADOR,
} from "../_shared/prompts.ts";

interface ZapiInboundPayload {
  // Estrutura simplificada — Z-API envia mais campos, mas só usamos esses.
  phone: string;
  fromMe?: boolean;
  isStatusReply?: boolean;
  text?: { message: string };
  // Alguns formatos legados vêm sem o wrapper text.message
  message?: string;
}

interface ClaudeResponse {
  area: string;
  proxima_acao:
    | "enviar_M1"
    | "enviar_M2"
    | "enviar_M3"
    | "encerrar_sql"
    | "encerrar_mql_frio"
    | "fora_escopo"
    | "aguardar";
  resposta_estruturada: Record<string, unknown>;
  score: number;
  motivo: string;
  mensagem_para_enviar: string;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  let payload: ZapiInboundPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response("Bad JSON", { status: 400 });
  }

  // Ignora mensagens enviadas POR NÓS (fromMe) e status updates
  if (payload.fromMe || payload.isStatusReply) {
    return new Response(JSON.stringify({ ignored: true }), { status: 200 });
  }

  const texto = payload.text?.message ?? payload.message ?? "";
  if (!texto.trim()) {
    return new Response(JSON.stringify({ ignored: "sem_texto" }), { status: 200 });
  }

  const supabase = getSupabaseAdmin();
  const telefone = normalizarTelefone(payload.phone);

  // Localiza lead
  const lead = await buscarLeadPorTelefone(supabase, telefone);
  if (!lead) {
    await registrarEvento(supabase, null, "msg_de_telefone_desconhecido", { telefone, texto });
    return new Response(JSON.stringify({ ignored: "lead_nao_encontrado" }), { status: 200 });
  }

  // Salva a mensagem recebida
  await registrarMensagem(supabase, lead.id, "lead", texto, { telefone });

  // Comando "parar"
  if (/^\s*parar\s*$/i.test(texto)) {
    await supabase
      .from("leads")
      .update({ status_sdr: "perdido", bot_pausado: true })
      .eq("id", lead.id);
    const msg = `Tudo certo, ${lead.nome}. Removendo seu contato do nosso atendimento ativo. Se mudar de ideia, é só mandar mensagem aqui. ✱`;
    await zapiSendText(telefone, msg);
    await registrarMensagem(supabase, lead.id, "bot", msg);
    return new Response(JSON.stringify({ acao: "opt_out" }), { status: 200 });
  }

  // Se bot está pausado, só grava e devolve (humano vai responder pelo painel)
  if (lead.bot_pausado) {
    return new Response(JSON.stringify({ acao: "bot_pausado_humano_assume" }), { status: 200 });
  }

  // Monta contexto pra Claude
  const historico = await historicoMensagens(supabase, lead.id, 12);
  const contexto = {
    nome: lead.nome,
    tipo_de_processo_form: lead.tipo_de_processo,
    origem: lead.origem,
    etapa_atual: lead.etapa_qualificacao,
    area_atual: lead.area_normalizada,
    score_atual: lead.score,
  };

  const userPrompt = `Contexto do lead:
${JSON.stringify(contexto, null, 2)}

Histórico (mais antigo → mais recente):
${historico.map((m) => `[${m.origem}] ${m.conteudo}`).join("\n")}

Última mensagem do lead (a que você precisa interpretar):
"${texto}"

Decida a próxima ação seguindo as regras do system prompt e retorne o JSON.`;

  const classificacao = await claudeJson<ClaudeResponse>(
    SYSTEM_PROMPT_CLASSIFICADOR,
    [{ role: "user", content: userPrompt }],
    { maxTokens: 1024, temperature: 0.3 },
  );

  if (!classificacao.ok || !classificacao.data) {
    await registrarEvento(supabase, lead.id, "claude_falhou", {
      erro: classificacao.error,
      raw: classificacao.rawText,
    });
    return new Response(JSON.stringify({ erro: classificacao.error }), { status: 500 });
  }

  const r = classificacao.data;

  // Atualiza área normalizada e score
  await supabase
    .from("leads")
    .update({
      area_normalizada: r.area,
      score: r.score,
      motivo_qualificacao: r.motivo,
    })
    .eq("id", lead.id);

  // Salva a qualificação da etapa atual (se for M1/M2/M3)
  const etapaCodigo = lead.etapa_qualificacao;
  if (["M1", "M2", "M3"].includes(etapaCodigo)) {
    await supabase.from("qualificacoes").upsert(
      {
        lead_id: lead.id,
        pergunta_codigo: etapaCodigo,
        pergunta_texto: PERGUNTAS_FALLBACK[r.area]?.[etapaCodigo as "M1" | "M2" | "M3"] ?? "(dinâmica)",
        resposta_texto: texto,
        resposta_estruturada: r.resposta_estruturada,
      },
      { onConflict: "lead_id,pergunta_codigo" },
    );
  }

  // Decide o que mandar e o próximo estado
  let mensagemFinal = r.mensagem_para_enviar?.trim() || "";
  let novaEtapa = lead.etapa_qualificacao;
  let novoStatus = lead.status_sdr;
  let pausarBot = false;
  let advogadoIdNotificar: string | null = null;

  switch (r.proxima_acao) {
    case "enviar_M1":
      novaEtapa = "M2";
      if (!mensagemFinal) mensagemFinal = PERGUNTAS_FALLBACK[r.area]?.M1 ?? "Pode me contar um pouco mais sobre a sua situação?";
      break;
    case "enviar_M2":
      novaEtapa = "M3";
      if (!mensagemFinal) mensagemFinal = PERGUNTAS_FALLBACK[r.area]?.M2 ?? "Pode me contar um pouco mais?";
      break;
    case "enviar_M3":
      novaEtapa = "finalizado";
      if (!mensagemFinal) mensagemFinal = PERGUNTAS_FALLBACK[r.area]?.M3 ?? "Última pergunta: tem mais algum detalhe importante?";
      break;
    case "encerrar_sql": {
      novaEtapa = "finalizado";
      novoStatus = "sql_aguardando_humano";
      pausarBot = true;
      const advogado = await buscarAdvogadoPorArea(supabase, r.area);
      advogadoIdNotificar = advogado?.id ?? null;
      if (advogado) {
        await supabase
          .from("leads")
          .update({ humano_responsavel: advogado.id })
          .eq("id", lead.id);
      }
      if (!mensagemFinal) mensagemFinal = mensagemSQL(lead.nome, advogado?.nome ?? "um advogado do nosso time");
      break;
    }
    case "encerrar_mql_frio":
      novaEtapa = "finalizado";
      novoStatus = "mql_frio";
      if (!mensagemFinal) mensagemFinal = mensagemMQLFrio(lead.nome);
      break;
    case "fora_escopo":
      novaEtapa = "finalizado";
      novoStatus = "perdido";
      if (!mensagemFinal) mensagemFinal = mensagemForaEscopo(lead.nome, r.area);
      break;
    case "aguardar":
      // não muda etapa, manda repergunta leve
      if (!mensagemFinal) mensagemFinal = "Desculpa, não consegui te entender direito. Pode reformular em poucas palavras? 🤓";
      break;
  }

  // Envia
  const envio = await zapiSendText(telefone, mensagemFinal);
  await registrarMensagem(supabase, lead.id, "bot", mensagemFinal, { zapi: envio, acao: r.proxima_acao });

  // Atualiza lead
  await supabase
    .from("leads")
    .update({
      etapa_qualificacao: novaEtapa,
      status_sdr: novoStatus,
      bot_pausado: pausarBot ? true : lead.bot_pausado,
    })
    .eq("id", lead.id);

  // Notifica advogado se SQL
  if (advogadoIdNotificar) {
    await notificarAdvogado(supabase, lead.id, advogadoIdNotificar);
  }

  await registrarEvento(supabase, lead.id, "msg_processada", {
    acao: r.proxima_acao,
    area: r.area,
    score: r.score,
  });

  return new Response(JSON.stringify({ ok: true, acao: r.proxima_acao }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});

// Notifica o advogado por WhatsApp interno (e por e-mail se houver SMTP configurado).
async function notificarAdvogado(supabase: any, leadId: string, advogadoId: string) {
  const { data: adv } = await supabase
    .from("advogados")
    .select("nome, email, telefone")
    .eq("id", advogadoId)
    .single();
  if (!adv) return;

  const { data: lead } = await supabase
    .from("leads")
    .select("nome, telefone, area_normalizada, tipo_de_processo, score")
    .eq("id", leadId)
    .single();

  const urlPainel = Deno.env.get("URL_PAINEL") ?? "https://painel.example.com";
  const texto =
`Novo SQL na sua fila 🤓

• Nome: ${lead.nome}
• WhatsApp: ${lead.telefone}
• Área: ${lead.area_normalizada ?? lead.tipo_de_processo ?? "n/d"}
• Score: ${lead.score}

Abrir conversa: ${urlPainel}/leads/${leadId}`;

  if (adv.telefone) {
    await zapiSendText(adv.telefone, texto);
  }

  await registrarEvento(supabase, leadId, "advogado_notificado", {
    advogado_id: advogadoId,
    canal: adv.telefone ? "whatsapp" : "email",
  });
}
