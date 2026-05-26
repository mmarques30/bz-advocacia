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
  espelharContactSubmission,
  Lead,
} from "../_shared/db.ts";
import { normalizarTelefone, zapiSendText } from "../_shared/zapi.ts";
import { claudeJson } from "../_shared/claude.ts";
import {
  AREA_LABEL,
  AREA_NUM_TO_KEY,
  extrairNumero,
  mensagemFamilia,
  mensagemHandoff,
  mensagemInventario,
  mensagemM0,
  mensagemOutros,
  mensagemReabertura,
  mensagemSaudeNivel1,
  mensagemSaudeNivel2Consulta,
  mensagemSaudeNivel2Outros,
  PERGUNTA_TEXTO_POR_CODIGO,
  SAUDE_LABEL,
  SAUDE_NUM_TO_KEY,
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
  area: "familia" | "inventario" | "saude" | "outros" | "nao_identificada" | string;
  saude_subtipo?: "medicamento" | "terapias" | "outros" | null;
  proxima_acao:
    | "pedir_area"
    | "pedir_subtipo_saude"
    | "propor_consulta_saude"
    | "pedir_detalhes"
    | "pedir_inventario_info"
    | "encerrar_sql"
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

  // ============================================================
  // IDs anônimos do WhatsApp (LID / broadcast / newsletter) não são
  // telefones reais. Sem essa guarda, normalizarTelefone() gera leads
  // fantasma de 15-17 dígitos (ex.: 128007339511859@lid → 55128007339511859).
  // ============================================================
  {
    const phoneRaw = (payload.phone ?? "").toString();
    const participantPhone = ((payload as any).participantPhone ?? "").toString();
    const participantLid = ((payload as any).participantLid ?? "").toString();

    const phoneEhAnonimo =
      phoneRaw.includes("@lid") ||
      phoneRaw.includes("@broadcast") ||
      phoneRaw.includes("@newsletter");

    if (phoneEhAnonimo) {
      const ppDigits = participantPhone.replace(/\D/g, "");
      // Aperta: só aceita se for telefone BR plausível (DDI 55 + DDD + número).
      const candidato = /^55\d{10,11}$/.test(ppDigits) ? ppDigits : null;

      if (!candidato) {
        await registrarEvento(supabase, null, "webhook_anonimo_ignorado", {
          phone: phoneRaw,
          chatLid: (payload as any).chatLid ?? null,
          participantLid: participantLid || null,
          participantPhone: participantPhone || null,
          participantPhone_digits: ppDigits || null,
          senderName: (payload as any).senderName ?? null,
          fromMe: !!payload.fromMe,
        });
        return new Response(
          JSON.stringify({ ignored: "anonimo_ou_broadcast" }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      (payload as any).phone = candidato;
      await registrarEvento(supabase, null, "webhook_anonimo_recuperado_via_participant", {
        phone_original: phoneRaw,
        phone_recuperado: candidato,
      });
    }
  }


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
  // GUARD: números bloqueados (advogados, equipe, parceiros).
  // Bot fica fora — não cria lead, não responde, não classifica.
  // ============================================================
  {
    const { data: bloqueado } = await supabase
      .from("numeros_bloqueados_bot")
      .select("telefone, nome, motivo")
      .eq("telefone", telefone)
      .maybeSingle();
    if (bloqueado) {
      await registrarEvento(supabase, null, "numero_bloqueado_ignorado", {
        telefone,
        nome: (bloqueado as any).nome ?? null,
        motivo: (bloqueado as any).motivo ?? null,
        fromMe: !!payload.fromMe,
      });
      return new Response(
        JSON.stringify({ ignored: "numero_bloqueado" }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }
  }


  // ============================================================
  // GUARD INTELIGENTE: telefone já no CRM (contact_submissions) sem
  // vínculo com bot (lead_geral_id IS NULL)
  //   - Atendimento manual ATIVO  → bot fica fora
  //   - 'novo' antigo / 'perdido' → bot adota (segue o fluxo;
  //     espelhamento linka o registro existente em vez de duplicar)
  // ============================================================
  {
    const ultimos8 = telefone.slice(-8);
    const { data: csExisting } = await supabase
      .from("contact_submissions")
      .select("id, estagio, status, responsavel_id, ultimo_contato_em, created_at")
      .like("telefone_digits", `%${ultimos8}`)
      .is("lead_geral_id", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (csExisting) {
      const cs: any = csExisting;
      const ESTAGIOS_ATIVOS = ["contato_inicial", "em_analise", "proposta_enviada", "fechado"];
      const estagioAtivo = ESTAGIOS_ATIVOS.includes(cs.estagio);
      const temResponsavel = !!cs.responsavel_id;

      if (estagioAtivo || temResponsavel) {
        await registrarEvento(supabase, null, "lead_no_crm_existente_ignorado", {
          telefone,
          contact_submission_id: cs.id,
          estagio: cs.estagio,
          tem_responsavel: temResponsavel,
          fromMe: !!payload.fromMe,
        });
        return new Response(
          JSON.stringify({ ignored: "lead_no_crm" }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      // 'novo' antigo ou 'perdido' → bot adota; segue o fluxo abaixo.
      // O espelhamento linka o registro existente automaticamente.
      await registrarEvento(supabase, null, "lead_no_crm_adotado_pelo_bot", {
        telefone,
        contact_submission_id: cs.id,
        estagio_anterior: cs.estagio,
        ultimo_contato_em: cs.ultimo_contato_em,
      });
    }
  }

  // ============================================================
  // fromMe=true → humano da B&Z respondeu pelo celular.
  // payload.phone = telefone do LEAD (a outra parte da conversa).
  // Pausa o bot e marca a conversa como assumida por humano.
  // ============================================================
  if (payload.fromMe) {
    if (!texto.trim()) {
      return new Response(JSON.stringify({ ignored: "fromMe_sem_texto" }), { status: 200 });
    }

    // ============================================================
    // ECHO GUARD: Z-API ecoa as próprias mensagens enviadas via API
    // de volta como webhook com fromMe=true (e às vezes fromApi=false).
    // Sem isso, o bot pausa a si mesmo após cada M0/M1 enviada.
    // ============================================================
    {
      const fromApi = (payload as any).fromApi === true;
      let isEcho = fromApi;

      if (!isEcho) {
        // Busca lead por telefone e checa se o texto bate com mensagem
        // recente (origem bot/humano) registrada nos últimos 90s.
        const leadEcho = await buscarLeadPorTelefone(supabase, telefone);
        if (leadEcho) {
          const desde = new Date(Date.now() - 90_000).toISOString();
          const { data: matchEcho } = await supabase
            .from("mensagens_sdr")
            .select("id, origem, enviada_em")
            .eq("lead_id", leadEcho.id)
            .in("origem", ["bot", "humano"])
            .eq("conteudo", texto)
            .gte("enviada_em", desde)
            .limit(1)
            .maybeSingle();
          if (matchEcho) isEcho = true;
        }
      }

      if (isEcho) {
        await registrarEvento(supabase, null, "webhook_echo_ignorado", {
          telefone,
          fromApi,
          messageId: (payload as any).messageId ?? null,
          preview: texto.slice(0, 80),
        });
        return new Response(
          JSON.stringify({ ignored: "echo_proprio_bot" }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
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
      // Telefone desconhecido + humano da B&Z escrevendo → vai pro BACKLOG
      // (aprovação manual no painel antes de virar lead_geral).
      const p = payload as any;
      const senderName: string | undefined = p.chatName ?? p.notifyName ?? p.senderName;

      // Evita duplicar entradas pendentes pro mesmo telefone
      const { data: existente } = await supabase
        .from("leads_backlog")
        .select("id")
        .eq("telefone", telefone)
        .eq("status", "pendente")
        .limit(1)
        .maybeSingle();

      if (!existente) {
        await supabase.from("leads_backlog").insert({
          telefone,
          telefone_raw: (payload as any).phone ?? telefone,
          nome: senderName ?? null,
          primeira_mensagem: texto,
          origem: "humano_iniciou",
          payload: payload as any,
          status: "pendente",
        });
      }

      await registrarEvento(supabase, null, "humano_iniciou_para_telefone_desconhecido_backlog", {
        telefone,
        backlog_existente: !!existente,
      });

      return new Response(
        JSON.stringify({ ok: true, acao: "enviado_para_backlog" }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
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

    // Espelha estado "assumido_humano" no kanban
    await espelharContactSubmission(
      supabase,
      { ...leadFromMe, status_sdr: "assumido_humano" },
      { platform: "whatsapp_organico", mensagem: "Time B&Z assumiu via celular" },
    );

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

  // Guard antigo `lead_em_atendimento_crm_atual` removido — silenciava o bot
  // quando o CRM antigo mexia em `lead_status`. Hoje o controle é só:
  // `bot_pausado` ou `status_sdr` indicar handoff.

  if (!lead) {
    const p = payload as any;
    const senderName: string | undefined = p.senderName ?? p.chatName ?? p.notifyName;

    // ============================================================
    // Detecção determinística de Click-to-WhatsApp Ads (CTWA)
    // ============================================================
    const adReply = p.externalAdReply ?? null;
    const veioDeAnuncio = !!adReply && (
      adReply.clickToWhatsappCall === true || adReply.sourceType === "ad"
    );

    let platform = "whatsapp_organico";
    let adContext: {
      ad_id: string | null;
      ad_name: string | null;
      ad_body: string | null;
      source_url: string | null;
      ctwa_clid: string | null;
      greeting: string | null;
      source_app: string | null;
    } | null = null;

    if (veioDeAnuncio) {
      const sourceApp = (adReply.sourceApp ?? "facebook").toString().toLowerCase();
      platform = sourceApp === "instagram" ? "instagram_ads" : "facebook_ads";
      adContext = {
        ad_id: adReply.sourceId ?? null,
        ad_name: adReply.title ?? null,
        ad_body: adReply.body ?? null,
        source_url: adReply.sourceUrl ?? null,
        ctwa_clid: adReply.ctwaClid ?? null,
        greeting: adReply.greetingMessageBody ?? null,
        source_app: sourceApp,
      };
    }

    await registrarEvento(supabase, null, "lead_auto_criado_payload_debug", {
      telefone, senderName, platform, veioDeAnuncio, adContext,
    });

    lead = await criarLeadWhatsApp(supabase, {
      nome: senderName ?? "Lead WhatsApp",
      telefone,
      platform,
      origem: platform,
      adContext,
    });
    if (!lead) {
      await registrarEvento(supabase, null, "lead_auto_criar_falhou", { telefone });
      return new Response(JSON.stringify({ erro: "criar_lead_falhou" }), { status: 500 });
    }

    // Persiste contexto do anúncio pra ser usado pelo classificador depois
    if (veioDeAnuncio && adContext) {
      await registrarEvento(supabase, lead.id, "lead_criado_via_anuncio", adContext);
    }

    // Registra a mensagem do lead e devolve 200 — o trigger on-new-lead
    // dispara M0 + LGPD. Evita corrida com o classificador.
    await registrarMensagem(supabase, lead.id, "lead", texto, { telefone, primeira_msg: true });
    return new Response(
      JSON.stringify({ ok: true, acao: "lead_auto_criado", lead_id: lead.id, veioDeAnuncio }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }

  // Salva a mensagem recebida
  const minhaMsgTs = new Date().toISOString();
  await registrarMensagem(supabase, lead.id, "lead", texto, { telefone, ts: minhaMsgTs });

  // ============================================================
  // FIX 1 — DEBOUNCE DE AGRUPAMENTO (8s)
  // Lead manda mensagens fragmentadas ("Casa", "Meu primo", "Basicamente").
  // Esperamos 8s; se chegar nova msg do MESMO lead, esta invocação sai
  // (a invocação mais nova é quem processa). Depois agrupamos todas as
  // mensagens do lead desde a última msg do bot/humano em um bloco único.
  // ============================================================
  await new Promise((res) => setTimeout(res, 8000));
  {
    const { data: maisNova } = await supabase
      .from("mensagens_sdr")
      .select("id, enviada_em")
      .eq("lead_id", lead.id)
      .eq("origem", "lead")
      .gt("enviada_em", minhaMsgTs)
      .order("enviada_em", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (maisNova) {
      await registrarEvento(supabase, lead.id, "debounce_msg_descartada_invocacao_antiga", {
        minha_ts: minhaMsgTs,
        mais_nova_ts: (maisNova as any).enviada_em,
      });
      return new Response(
        JSON.stringify({ ignored: "debounce_invocacao_mais_recente_assume" }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }
  }

  // Agrupa mensagens do lead desde a última msg de bot/humano (ou 60s atrás)
  let textoAgrupado = texto;
  {
    const { data: ultimaBot } = await supabase
      .from("mensagens_sdr")
      .select("enviada_em")
      .eq("lead_id", lead.id)
      .in("origem", ["bot", "humano"])
      .order("enviada_em", { ascending: false })
      .limit(1)
      .maybeSingle();
    const desde = (ultimaBot as any)?.enviada_em
      ?? new Date(Date.now() - 60_000).toISOString();
    const { data: msgsLead } = await supabase
      .from("mensagens_sdr")
      .select("conteudo, enviada_em")
      .eq("lead_id", lead.id)
      .eq("origem", "lead")
      .gt("enviada_em", desde)
      .order("enviada_em", { ascending: true });
    const blocos = (msgsLead ?? []).map((m: any) => (m.conteudo ?? "").trim()).filter(Boolean);
    if (blocos.length > 1) {
      textoAgrupado = blocos.join("\n");
      await registrarEvento(supabase, lead.id, "msgs_lead_agrupadas_debounce", {
        total: blocos.length,
        agrupado_preview: textoAgrupado.slice(0, 200),
      });
    }
  }


  // ============================================================
  // REATIVAÇÃO DE LEAD QUE VOLTA APÓS 7+ DIAS
  // - 'cliente' nunca reabre pelo bot (notifica time)
  // - lead com processo ativo nunca reabre pelo bot
  // - status perdido/mql_frio/assumido_humano/sql_aguardando_humano +
  //   ultima_mensagem_em >= 7 dias  →  reabre, reseta etapa, envia
  //   mensagem de reativação
  // ============================================================
  {
    const STATUS_REABRIVEIS = ["perdido", "mql_frio", "assumido_humano", "sql_aguardando_humano"];
    const status = (lead.status_sdr ?? "").toString();

    // Cliente fechado → nunca reabre pelo bot
    if (status === "cliente") {
      await registrarEvento(supabase, lead.id, "cliente_voltou_a_falar", {
        telefone, nome: nomePrimeiro(lead),
      });
      return new Response(JSON.stringify({ acao: "cliente_nao_reabre" }), { status: 200 });
    }

    // Tem processo ativo? Bot fica fora.
    const { count: processosAtivos } = await supabase
      .from("processos")
      .select("id", { count: "exact", head: true })
      .eq("lead_id", lead.id)
      .neq("status", "concluido");
    if ((processosAtivos ?? 0) > 0) {
      await registrarEvento(supabase, lead.id, "cliente_com_processo_voltou_a_falar", {
        telefone, processos_ativos: processosAtivos,
      });
      return new Response(JSON.stringify({ acao: "cliente_processo_ativo" }), { status: 200 });
    }

    // Reabertura por inatividade >= 7 dias
    if (STATUS_REABRIVEIS.includes(status)) {
      const ultimaIso = (lead as any).ultima_mensagem_em as string | null | undefined;
      // Usa created_at como fallback se nunca houve mensagem registrada
      const referencia = ultimaIso ? new Date(ultimaIso).getTime() : 0;
      const diasInativo = referencia ? (Date.now() - referencia) / 86_400_000 : 999;

      if (diasInativo >= 7) {
        await supabase
          .from("leads_geral")
          .update({
            status_sdr: "em_atendimento_bot",
            bot_pausado: false,
            etapa_qualificacao: "M0",
            area_normalizada: null,
            fluxo_sdr: null,
            humano_responsavel: null,
          })
          .eq("id", lead.id);

        const nomeReab = nomePrimeiro(lead);
        const msgReab = mensagemReabertura(nomeReab);
        const envioReab = await zapiSendText(telefone, msgReab);
        await registrarMensagem(supabase, lead.id, "bot", msgReab, {
          zapi: envioReab, acao: "reabertura_7dias",
        });
        await registrarEvento(supabase, lead.id, "lead_reaberto_apos_7dias", {
          status_anterior: status,
          dias_inativo: Math.round(diasInativo),
          ultima_mensagem_em: ultimaIso ?? null,
        });

        // Atualiza estado local pra não cair nos guards abaixo
        lead = { ...lead, status_sdr: "em_atendimento_bot", bot_pausado: false,
                 etapa_qualificacao: "M0", area_normalizada: null } as Lead;

        return new Response(
          JSON.stringify({ ok: true, acao: "lead_reaberto_apos_7dias", lead_id: lead.id }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
    }
  }

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

  // Camada 3 — rede de segurança contra fromMe intermitente.
  // Se QUALQUER humano (painel ou fromMe) interagiu nas últimas 24h,
  // bot fica fora pra não atropelar o atendimento humano.
  {
    const desde = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: humanoCount } = await supabase
      .from("mensagens_sdr")
      .select("id", { count: "exact", head: true })
      .eq("lead_id", lead.id)
      .eq("origem", "humano")
      .gte("enviada_em", desde);
    if ((humanoCount ?? 0) > 0) {
      await registrarEvento(supabase, lead.id, "humano_ativo_bot_silenciado", {
        humano_msgs_24h: humanoCount,
        texto,
      });
      // Garante bot_pausado=true pra próximos webhooks pularem antes.
      if (!lead.bot_pausado) {
        await supabase.from("leads_geral")
          .update({ bot_pausado: true, status_sdr: "assumido_humano" })
          .eq("id", lead.id);
      }
      return new Response(
        JSON.stringify({ acao: "humano_ativo_bot_silenciado" }),
        { status: 200 },
      );
    }
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

  // Se o lead veio de anúncio (CTWA), busca o contexto do anúncio pra
  // injetar no prompt do classificador. Resolve o caso do lead que só
  // manda "Oi" mas o anúncio era sobre área específica.
  let adContextoStr = "";
  {
    const { data: leadAd } = await supabase
      .from("leads_geral")
      .select("platform, ad_name")
      .eq("id", lead.id)
      .maybeSingle();
    const plat = (leadAd as any)?.platform as string | undefined;
    if (plat && plat.endsWith("_ads")) {
      const { data: ev } = await supabase
        .from("eventos_sdr")
        .select("payload")
        .eq("lead_id", lead.id)
        .eq("tipo", "lead_criado_via_anuncio")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      const ad = (ev as any)?.payload ?? null;
      if (ad) {
        adContextoStr = `\n\nIMPORTANTE — Este lead chegou clicando em um anúncio (${plat}). Use o conteúdo do anúncio abaixo pra inferir a área mesmo que a primeira mensagem seja genérica:\n• Título do anúncio: ${ad.ad_name ?? "(sem título)"}\n• Texto do anúncio: ${ad.ad_body ?? "(sem texto)"}\n• Mensagem inicial automática que o lead viu: ${ad.greeting ?? "(nenhuma)"}\n`;
      }
    }
  }

  const userPrompt = `Contexto do lead:
${JSON.stringify(contexto, null, 2)}${adContextoStr}

Histórico (mais antigo → mais recente):
${historico.map((m) => `[${m.origem}] ${m.conteudo}`).join("\n")}

Última mensagem do lead (a que você precisa interpretar — pode conter várias linhas se o lead mandou mensagens fragmentadas em sequência, trate como um bloco único):
"${textoAgrupado}"

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
  const etapaAnterior = lead.etapa_qualificacao ?? "M0";

  // --- Override determinístico por NÚMERO (1-4 / 1-3) ---
  // Se o lead estava numa etapa de menu numerado e respondeu só um número,
  // ignora alucinação do classificador e usa o mapa fixo.
  let numeroLead: number | null = null;
  if (etapaAnterior === "M0" || etapaAnterior === "aguardando_area") {
    numeroLead = extrairNumero(texto, 4);
    if (numeroLead) {
      const areaFixa = AREA_NUM_TO_KEY[String(numeroLead)];
      r.area = areaFixa;
      // Avança a ação conforme a área escolhida
      if (areaFixa === "saude") r.proxima_acao = "pedir_subtipo_saude";
      else if (areaFixa === "inventario") r.proxima_acao = "pedir_inventario_info";
      else r.proxima_acao = "pedir_detalhes";
    }
  } else if (etapaAnterior === "aguardando_subtipo_saude") {
    numeroLead = extrairNumero(texto, 3);
    if (numeroLead) {
      const subFixo = SAUDE_NUM_TO_KEY[String(numeroLead)];
      r.area = "saude";
      r.saude_subtipo = subFixo;
      r.proxima_acao = subFixo === "outros" ? "pedir_detalhes" : "propor_consulta_saude";
    }
  }

  const areaValida = ["familia", "inventario", "saude", "outros"].includes((r.area ?? "").toLowerCase());
  const areaParaPersistir = areaValida ? r.area : (lead.area_normalizada ?? null);

  // Atualiza área normalizada, fluxo e score (só sobrescreve area se válida)
  await supabase
    .from("leads_geral")
    .update({
      area_normalizada: areaParaPersistir,
      fluxo_sdr: fluxoFromArea(areaParaPersistir),
      score: r.score,
      motivo_qualificacao: r.motivo,
    })
    .eq("id", lead.id);

  // ============================================================
  // Persiste a resposta do lead em qualificacoes_sdr com código
  // semântico (area / saude_tipo / consulta / detalhe / inventario_info)
  // e resposta_estruturada com { opcao_numero, key, label } quando aplicável.
  // ============================================================
  {
    let perguntaCodigo: string;
    let estruturada: Record<string, unknown> = { ...(r.resposta_estruturada ?? {}) };

    if (etapaAnterior === "M0" || etapaAnterior === "aguardando_area") {
      perguntaCodigo = "area";
      if (numeroLead) {
        estruturada = {
          ...estruturada,
          opcao_numero: numeroLead,
          area: AREA_NUM_TO_KEY[String(numeroLead)],
          label: AREA_LABEL[AREA_NUM_TO_KEY[String(numeroLead)]],
        };
      } else if (areaValida) {
        estruturada = { ...estruturada, area: r.area, label: AREA_LABEL[r.area as string] ?? r.area };
      }
    } else if (etapaAnterior === "aguardando_subtipo_saude") {
      perguntaCodigo = "saude_tipo";
      const sub = r.saude_subtipo ?? null;
      if (numeroLead) {
        const key = SAUDE_NUM_TO_KEY[String(numeroLead)];
        estruturada = {
          ...estruturada,
          opcao_numero: numeroLead,
          saude_subtipo: key,
          label: SAUDE_LABEL[key],
        };
      } else if (sub) {
        estruturada = { ...estruturada, saude_subtipo: sub, label: SAUDE_LABEL[sub] ?? sub };
      }
    } else if (etapaAnterior === "aguardando_confirmacao_consulta") {
      perguntaCodigo = "consulta";
      estruturada = { ...estruturada, aceitou: /sim|pode|vamos|ok|claro|bora|quero/i.test(texto) };
    } else if (etapaAnterior === "aguardando_detalhe") {
      perguntaCodigo = areaParaPersistir === "inventario" ? "inventario_info" : "detalhe";
    } else {
      perguntaCodigo = etapaAnterior;
    }

    const perguntaTexto = PERGUNTA_TEXTO_POR_CODIGO[perguntaCodigo]
      ?? `[${etapaAnterior}] ${r.proxima_acao}`;

    const { error: qErr } = await supabase.from("qualificacoes_sdr").insert({
      lead_id: lead.id,
      pergunta_codigo: perguntaCodigo,
      pergunta_texto: perguntaTexto,
      resposta_texto: textoAgrupado,
      resposta_estruturada: estruturada,
    });
    if (qErr) console.error("[qualificacoes_sdr] erro:", qErr);
  }

  const nome = nomePrimeiro(lead);
  // IMPORTANTE: NÃO usar r.mensagem_para_enviar do Claude — ele alucina
  // texto antigo (ex.: "Tudo bem sim 😊 Sou a Claudia, atendente do
  // escritório Borges & Zembruski..."). Sempre usar template fixo abaixo.
  let mensagemFinal = "";

  let novaEtapa = etapaAnterior;
  let novoStatus = lead.status_sdr ?? "em_atendimento_bot";
  let novoFluxo: string | null = fluxoFromArea(areaParaPersistir);
  let pausarBot = false;
  let advogadoIdNotificar: string | null = null;
  let encerramento = false;

  switch (r.proxima_acao) {
    case "pedir_area":
      novaEtapa = "aguardando_area";
      if (!mensagemFinal) mensagemFinal = mensagemM0(nome);
      break;
    case "pedir_subtipo_saude":
      novaEtapa = "aguardando_subtipo_saude";
      if (!mensagemFinal) mensagemFinal = mensagemSaudeNivel1(nome);
      break;
    case "propor_consulta_saude":
      novaEtapa = "aguardando_confirmacao_consulta";
      if (!mensagemFinal) mensagemFinal = mensagemSaudeNivel2Consulta(nome);
      break;
    case "pedir_inventario_info":
      novaEtapa = "aguardando_detalhe";
      if (!mensagemFinal) mensagemFinal = mensagemInventario(nome);
      break;
    case "pedir_detalhes":
      novaEtapa = "aguardando_detalhe";
      if (!mensagemFinal) {
        const a = (areaParaPersistir ?? "").toLowerCase();
        if (a === "familia") mensagemFinal = mensagemFamilia(nome);
        else if (a === "saude") mensagemFinal = mensagemSaudeNivel2Outros(nome);
        else mensagemFinal = mensagemOutros(nome);
      }
      break;
    case "encerrar_sql": {
      novaEtapa = "finalizado";
      novoStatus = "sql_aguardando_humano";
      pausarBot = true;
      encerramento = true;
      const advogado = await buscarAdvogadoPorArea(supabase, areaParaPersistir ?? "geral");
      advogadoIdNotificar = advogado?.id ?? null;
      if (advogado) {
        await supabase
          .from("leads_geral")
          .update({ humano_responsavel: advogado.id })
          .eq("id", lead.id);
      }
      if (!mensagemFinal) mensagemFinal = mensagemHandoff(nome);
      break;
    }
    case "aguardar":
    default:
      if (!mensagemFinal) mensagemFinal = "Desculpa, não consegui te entender direito. Pode reformular em poucas palavras?";
      break;
  }

  // ============================================================
  // FIX 3 — LIMITE DE TENTATIVAS POR ETAPA
  // Se o bot não conseguiu avançar (mesma etapa ou ação "aguardar"),
  // incrementa o contador. A partir de 2 tentativas falhas → handoff.
  // ============================================================
  const avancouEtapa = novaEtapa !== etapaAnterior && r.proxima_acao !== "aguardar";
  const tentativasAtuais = (lead as any).tentativas_etapa ?? 0;
  let tentativasNovas = avancouEtapa ? 0 : tentativasAtuais + 1;

  if (!avancouEtapa && tentativasNovas >= 2) {
    await registrarEvento(supabase, lead.id, "bot_handoff_por_tentativas_excedidas", {
      etapa: etapaAnterior,
      tentativas: tentativasNovas,
      acao_claude: r.proxima_acao,
    });
    mensagemFinal = `${nome ? nome + ", " : ""}pra eu te ajudar melhor, vou conectar você com nossa advogada 😊`;
    novaEtapa = "finalizado";
    novoStatus = "sql_aguardando_humano";
    pausarBot = true;
    encerramento = true;
    tentativasNovas = 0;
    const advogado = await buscarAdvogadoPorArea(supabase, areaParaPersistir ?? "geral");
    advogadoIdNotificar = advogado?.id ?? null;
    if (advogado) {
      await supabase.from("leads_geral")
        .update({ humano_responsavel: advogado.id })
        .eq("id", lead.id);
    }
  }

  // ============================================================
  // FIX 2 — ANTI-REPETIÇÃO
  // Se a próxima mensagem do bot for >85% similar à última que o bot
  // enviou pra este lead, NÃO envia: escala pro handoff humano.
  // ============================================================
  {
    const { data: ultimaBotMsg } = await supabase
      .from("mensagens_sdr")
      .select("conteudo")
      .eq("lead_id", lead.id)
      .eq("origem", "bot")
      .order("enviada_em", { ascending: false })
      .limit(1)
      .maybeSingle();
    const ultimoTxt = ((ultimaBotMsg as any)?.conteudo ?? "").toString();
    const sim = similaridade(ultimoTxt, mensagemFinal);
    if (ultimoTxt && sim >= 0.85 && !encerramento) {
      await registrarEvento(supabase, lead.id, "bot_evitou_repetir_handoff", {
        similaridade: Number(sim.toFixed(3)),
        preview_anterior: ultimoTxt.slice(0, 120),
        preview_nova: mensagemFinal.slice(0, 120),
        acao_original: r.proxima_acao,
      });
      mensagemFinal = `${nome ? nome + ", " : ""}vou passar pra advogada continuar contigo 😊`;
      novaEtapa = "finalizado";
      novoStatus = "sql_aguardando_humano";
      pausarBot = true;
      encerramento = true;
      tentativasNovas = 0;
      const advogado = await buscarAdvogadoPorArea(supabase, areaParaPersistir ?? "geral");
      advogadoIdNotificar = advogado?.id ?? null;
      if (advogado) {
        await supabase.from("leads_geral")
          .update({ humano_responsavel: advogado.id })
          .eq("id", lead.id);
      }
    }
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
      tentativas_etapa: tentativasNovas,
    })
    .eq("id", lead.id);

  // Espelha o estado atual no kanban (contact_submissions)
  await espelharContactSubmission(supabase, {
    ...lead,
    area_normalizada: areaParaPersistir,
    status_sdr: novoStatus,
  });

  if (encerramento) {
    await notificarAdvogado(supabase, lead.id, advogadoIdNotificar, r.proxima_acao);
  }

  await registrarEvento(supabase, lead.id, "msg_processada", {
    acao: r.proxima_acao,
    area: r.area,
    area_persistida: areaParaPersistir,
    saude_subtipo: r.saude_subtipo ?? null,
    etapa_anterior: etapaAnterior,
    etapa_nova: novaEtapa,
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

// Similaridade simples baseada em Jaccard de bigramas (caracteres).
// Retorna 0..1. Boa o suficiente pra pegar "mesma mensagem" mesmo com
// pequenas variações (nome no início, pontuação diferente).
function similaridade(a: string, b: string): number {
  const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
  const A = norm(a);
  const B = norm(b);
  if (!A || !B) return 0;
  if (A === B) return 1;
  const bigrams = (s: string) => {
    const out = new Set<string>();
    for (let i = 0; i < s.length - 1; i++) out.add(s.slice(i, i + 2));
    return out;
  };
  const sa = bigrams(A);
  const sb = bigrams(B);
  let inter = 0;
  for (const g of sa) if (sb.has(g)) inter++;
  const union = sa.size + sb.size - inter;
  return union === 0 ? 0 : inter / union;
}
