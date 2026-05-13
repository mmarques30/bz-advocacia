// Edge Function: whatsapp-inbound
// Recebe webhook da Z-API quando o lead manda mensagem.
// Schema real V4: leads_geral + *_sdr. verify_jwt = false (Z-API não passa JWT).

import {
  buscarLeadPorTelefone,
  criarLeadWhatsApp,
  getSupabaseAdmin,
  historicoMensagens,
  nomePrimeiro,
  registrarEvento,
  registrarMensagem,
  telefoneDoLead,
  buscarAdvogadoPorArea,
  fluxoFromArea,
  Lead,
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
  phone?: string;
  fromMe?: boolean;
  isStatusReply?: boolean;
  isGroup?: boolean;
  text?: { message?: string };
  message?: string;
  [k: string]: unknown;
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

  const supabase = getSupabaseAdmin();

  // Idempotência por messageId — evita reprocessar retries da Z-API
  const messageId = (payload as any).messageId as string | undefined;
  if (messageId) {
    const { error: lockErr } = await supabase
      .from("mensagens_inbound_lock")
      .insert({ message_id: messageId });
    if (lockErr && (lockErr.code === "23505" || lockErr.message?.includes("duplicate"))) {
      await registrarEvento(supabase, null, "webhook_duplicado_ignorado", { messageId });
      return new Response(JSON.stringify({ ignored: "duplicate_messageId" }), { status: 200 });
    }
  }

  // Log bruto do payload para debug temporario
  await registrarEvento(supabase, null, "raw_payload_debug", payload);

  // SEMPRE loga o que chegou no endpoint, antes de qualquer filtro.
  await registrarEvento(supabase, null, "webhook_recebido", {
    phone: payload.phone,
    fromMe: payload.fromMe,
    isStatusReply: payload.isStatusReply,
    isGroup: payload.isGroup,
    has_text: !!(payload.text?.message ?? payload.message),
    raw_keys: Object.keys(payload ?? {}),
  });

  // Status reply / grupo: sempre ignora
  if (payload.isStatusReply) {
    return new Response(JSON.stringify({ ignored: "status_reply" }), { status: 200 });
  }
  if (payload.isGroup) {
    return new Response(JSON.stringify({ ignored: "grupo" }), { status: 200 });
  }

  const texto = (payload.text?.message ?? payload.message ?? "").toString();
  if (!payload.phone) {
    return new Response(JSON.stringify({ ignored: "sem_phone" }), { status: 200 });
  }
  const telefone = normalizarTelefone(payload.phone);

  // ============================================================
  // fromMe=true → humano da B&Z respondeu pelo celular.
  // payload.phone = telefone do LEAD (a outra parte da conversa).
  // Pausa o bot e marca a conversa como assumida por humano.
  // ============================================================
  if (payload.fromMe) {
    if (!texto.trim()) {
      return new Response(JSON.stringify({ ignored: "fromMe_sem_texto" }), { status: 200 });
    }

    // Resolve Time B&Z (advogado humano fallback)
    let timeBzId: string | null = null;
    {
      const { data: tbz } = await supabase
        .from("advogados_sdr")
        .select("id")
        .eq("ativo", true)
        .ilike("nome", "%Time B&Z%")
        .limit(1)
        .maybeSingle();
      if (tbz) {
        timeBzId = (tbz as any).id;
      } else {
        const { data: any1 } = await supabase
          .from("advogados_sdr")
          .select("id")
          .eq("ativo", true)
          .limit(1)
          .maybeSingle();
        timeBzId = (any1 as any)?.id ?? null;
      }
    }

    let leadFromMe = await buscarLeadPorTelefone(supabase, telefone);
    if (!leadFromMe) {
      const p = payload as any;
      const senderName: string | undefined = p.chatName ?? p.notifyName ?? p.senderName;
      leadFromMe = await criarLeadWhatsApp(supabase, {
        nome: senderName ?? "Lead WhatsApp",
        telefone,
        platform: "whatsapp_organico",
        origem: "humano_iniciou",
      });
      if (!leadFromMe) {
        await registrarEvento(supabase, null, "fromMe_criar_lead_falhou", { telefone });
        return new Response(JSON.stringify({ erro: "criar_lead_falhou" }), { status: 500 });
      }
    }

    await supabase
      .from("leads_geral")
      .update({
        bot_pausado: true,
        status_sdr: "assumido_humano",
        humano_responsavel: timeBzId,
        assumido_em: new Date().toISOString(),
      })
      .eq("id", leadFromMe.id);

    await registrarMensagem(supabase, leadFromMe.id, "humano", texto, {
      telefone,
      via: "celular_fromMe",
    });
    await registrarEvento(supabase, leadFromMe.id, "humano_assumiu_via_celular", {
      telefone,
      time_bz_id: timeBzId,
    });

    return new Response(
      JSON.stringify({ ok: true, acao: "humano_assumiu_via_celular", lead_id: leadFromMe.id }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }

  // fromMe=false a partir daqui
  if (!texto.trim()) {
    return new Response(JSON.stringify({ ignored: "sem_texto" }), { status: 200 });
  }

  // Localiza lead — se não existir, cria automaticamente
  let lead = await buscarLeadPorTelefone(supabase, telefone);

  // Proteção: lead já existente sendo atendido no CRM atual → bot fica fora
  if (lead) {
    const { data: leadCrm } = await supabase
      .from("leads_geral")
      .select("lead_status, updated_at")
      .eq("id", lead.id)
      .maybeSingle();
    const ls = (leadCrm as any)?.lead_status as string | null | undefined;
    const upd = (leadCrm as any)?.updated_at as string | null | undefined;
    if (ls && ls !== "Pendente" && upd) {
      const diasMs = Date.now() - new Date(upd).getTime();
      if (diasMs <= 7 * 24 * 60 * 60 * 1000) {
        await registrarMensagem(supabase, lead.id, "lead", texto, { telefone });
        await registrarEvento(supabase, lead.id, "lead_em_atendimento_crm_atual_ignorado", {
          lead_status: ls,
          updated_at: upd,
        });
        return new Response(
          JSON.stringify({ ignored: "lead_em_atendimento_crm_atual" }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
    }
  }

  if (!lead) {
    const p = payload as any;
    const senderName: string | undefined = p.senderName ?? p.chatName ?? p.notifyName;
    const rawKeys = Object.keys(p ?? {});
    const blob = JSON.stringify(p ?? {}).toLowerCase();

    // Heurística click-to-WhatsApp / Meta Ads
    const hasReferralFields = rawKeys.some((k) =>
      /referral|ctwa|sourceid|source_id|adid|ad_id|momentmetadata/i.test(k)
    );
    let platform = "whatsapp_organico";
    if (hasReferralFields) {
      platform = blob.includes("instagram") ? "instagram_ads" : "facebook_ads";
    }

    await registrarEvento(supabase, null, "lead_auto_criado_payload_debug", {
      telefone, raw_keys: rawKeys, senderName, platform,
    });

    lead = await criarLeadWhatsApp(supabase, {
      nome: senderName ?? "Lead WhatsApp",
      telefone,
      platform,
      origem: platform,
    });
    if (!lead) {
      await registrarEvento(supabase, null, "lead_auto_criar_falhou", { telefone });
      return new Response(JSON.stringify({ erro: "criar_lead_falhou" }), { status: 500 });
    }

    // Registra a mensagem do lead e devolve 200 — o trigger on-new-lead
    // dispara M0 + LGPD. Evita corrida com o classificador.
    await registrarMensagem(supabase, lead.id, "lead", texto, { telefone, primeira_msg: true });
    return new Response(
      JSON.stringify({ ok: true, acao: "lead_auto_criado", lead_id: lead.id }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }

  // Salva a mensagem recebida
  await registrarMensagem(supabase, lead.id, "lead", texto, { telefone });

  // Comando "parar"
  if (/^\s*parar\s*$/i.test(texto)) {
    await supabase
      .from("leads_geral")
      .update({ status_sdr: "perdido", bot_pausado: true })
      .eq("id", lead.id);
    const msg = `Tudo certo, ${nomePrimeiro(lead)}. Removendo seu contato do nosso atendimento ativo. Se mudar de ideia, é só mandar mensagem aqui. ✱`;
    await zapiSendText(telefone, msg);
    await registrarMensagem(supabase, lead.id, "bot", msg);
    return new Response(JSON.stringify({ acao: "opt_out" }), { status: 200 });
  }

  // Bot pausado → humano vai responder
  if (lead.bot_pausado) {
    await registrarEvento(supabase, lead.id, "msg_recebida_bot_pausado", { texto });
    return new Response(JSON.stringify({ acao: "bot_pausado_humano_assume" }), { status: 200 });
  }

  // Status que não devem disparar bot (cliente, perdido, etc.)
  const statusOk = ["novo", "em_atendimento_bot", null];
  if (!statusOk.includes(lead.status_sdr)) {
    await registrarEvento(supabase, lead.id, "msg_recebida_status_bloqueia", { status: lead.status_sdr });
    return new Response(JSON.stringify({ acao: "status_bloqueia" }), { status: 200 });
  }

  // Monta contexto pra Claude
  const historico = await historicoMensagens(supabase, lead.id, 12);
  const contexto = {
    nome: nomePrimeiro(lead),
    tipo_servico_form: lead.tipo_servico,
    origem: lead.origem_sdr,
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

  // Atualiza área normalizada, fluxo e score
  await supabase
    .from("leads_geral")
    .update({
      area_normalizada: r.area,
      fluxo_sdr: fluxoFromArea(r.area),
      score: r.score,
      motivo_qualificacao: r.motivo,
    })
    .eq("id", lead.id);

  // Salva qualificação da etapa atual (se for M1/M2/M3)
  const etapaCodigo = lead.etapa_qualificacao ?? "M0";
  if (["M1", "M2", "M3"].includes(etapaCodigo)) {
    const { error: qErr } = await supabase.from("qualificacoes_sdr").insert({
      lead_id: lead.id,
      pergunta_codigo: etapaCodigo,
      pergunta_texto: PERGUNTAS_FALLBACK[r.area]?.[etapaCodigo as "M1" | "M2" | "M3"] ?? "(dinâmica)",
      resposta_texto: texto,
      resposta_estruturada: r.resposta_estruturada,
    });
    if (qErr) console.error("[qualificacoes_sdr] erro:", qErr);
  }

  // Decide próxima mensagem e estado
  let mensagemFinal = r.mensagem_para_enviar?.trim() || "";
  let novaEtapa = lead.etapa_qualificacao ?? "M0";
  let novoStatus = lead.status_sdr ?? "em_atendimento_bot";
  let novoFluxo: string | null = fluxoFromArea(r.area);
  let pausarBot = false;
  let advogadoIdNotificar: string | null = null;
  let encerramento = false;

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
      encerramento = true;
      const advogado = await buscarAdvogadoPorArea(supabase, r.area);
      advogadoIdNotificar = advogado?.id ?? null;
      if (advogado) {
        await supabase
          .from("leads_geral")
          .update({ humano_responsavel: advogado.id })
          .eq("id", lead.id);
      }
      if (!mensagemFinal) mensagemFinal = mensagemSQL(nomePrimeiro(lead), advogado?.nome ?? "um advogado do nosso time");
      break;
    }
    case "encerrar_mql_frio":
      novaEtapa = "finalizado";
      novoStatus = "mql_frio";
      novoFluxo = "qualificacao_geral";
      encerramento = true;
      if (!mensagemFinal) mensagemFinal = mensagemMQLFrio(nomePrimeiro(lead));
      break;
    case "fora_escopo":
      novaEtapa = "finalizado";
      novoStatus = "perdido";
      novoFluxo = "fora_escopo";
      encerramento = true;
      if (!mensagemFinal) mensagemFinal = mensagemForaEscopo(nomePrimeiro(lead), r.area);
      break;
    case "aguardar":
      if (!mensagemFinal) mensagemFinal = "Desculpa, não consegui te entender direito. Pode reformular em poucas palavras? 🤓";
      break;
  }

  const envio = await zapiSendText(telefone, mensagemFinal);
  await registrarMensagem(supabase, lead.id, "bot", mensagemFinal, { zapi: envio, acao: r.proxima_acao });

  await supabase
    .from("leads_geral")
    .update({
      etapa_qualificacao: novaEtapa,
      status_sdr: novoStatus,
      fluxo_sdr: novoFluxo,
      bot_pausado: pausarBot ? true : (lead.bot_pausado ?? false),
    })
    .eq("id", lead.id);

  // SEMPRE notifica em encerramento (SQL, MQL frio, fora_escopo) — mesmo sem advogado da área
  if (encerramento) {
    await notificarAdvogado(supabase, lead.id, advogadoIdNotificar, r.proxima_acao);
  }

  await registrarEvento(supabase, lead.id, "msg_processada", {
    acao: r.proxima_acao,
    area: r.area,
    fluxo: novoFluxo,
    score: r.score,
  });

  return new Response(JSON.stringify({ ok: true, acao: r.proxima_acao }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});

async function notificarAdvogado(
  supabase: any,
  leadId: string,
  advogadoId: string | null,
  acao: string,
) {
  const { data: lead } = await supabase
    .from("leads_geral")
    .select("full_name, phone_number, contato_whatsapp, area_normalizada, tipo_servico, score")
    .eq("id", leadId)
    .maybeSingle();
  if (!lead) return;

  // Resolve advogado: específico → fallback "geral" → qualquer ativo
  let adv: { nome: string; email: string | null; telefone: string | null } | null = null;
  if (advogadoId) {
    const { data } = await supabase
      .from("advogados_sdr")
      .select("nome, email, telefone")
      .eq("id", advogadoId)
      .maybeSingle();
    adv = (data as any) ?? null;
  }
  if (!adv) {
    const fallback = await buscarAdvogadoPorArea(supabase, lead.area_normalizada ?? "geral");
    if (fallback) adv = { nome: fallback.nome, email: fallback.email, telefone: fallback.telefone };
  }

  const urlPainel = Deno.env.get("URL_PAINEL") ?? "https://painel.example.com";
  const tel = lead.contato_whatsapp ?? lead.phone_number ?? "";
  const titulo = acao === "encerrar_sql"
    ? "Novo SQL na sua fila 🤓"
    : acao === "encerrar_mql_frio"
    ? "MQL frio encerrado pelo bot 🤓"
    : "Lead fora de escopo encerrado 🤓";

  const texto =
`${titulo}

• Nome: ${lead.full_name ?? "(sem nome)"}
• WhatsApp: ${tel}
• Área: ${lead.area_normalizada ?? lead.tipo_servico ?? "n/d"}
• Score: ${lead.score ?? 0}
• Ação: ${acao}

Abrir conversa: ${urlPainel}/leads/${leadId}`;

  if (adv?.telefone) {
    await zapiSendText(adv.telefone, texto);
  }

  await registrarEvento(supabase, leadId, "advogado_notificado", {
    advogado_id: advogadoId,
    advogado_resolvido: adv?.nome ?? null,
    canal: adv?.telefone ? "whatsapp" : "sem_canal",
    acao,
  });
}
