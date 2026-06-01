// Edge Function: campanha-recuperacao-form
// Campanha de recuperação de 182 leads de form Meta que não foram contatados.
// Modos: 'smoke' (5 leads variados) | 'rollout' (1 lead por chamada, p/ cron).
//
// Lógica:
// 1. Seleciona contact_submissions não trabalhadas (origem meta, estagio novo, sem lead_geral_id).
// 2. Filtra contra numeros_bloqueados_bot e leads já cliente/agendado.
// 3. Respeita janela 10-12h e 13-18h (SP), dias úteis.
// 4. Espaçamento 5-6 min entre envios + max 10/h.
// 5. Kill switch: 3+ erros na última hora pausa tudo.

import { createClient } from "npm:@supabase/supabase-js@2";
import { normalizarTelefone, zapiSendText } from "../_shared/zapi.ts";
import {
  classificarAreaCampanha,
  escolherTexto,
  primeiroNome,
  type AreaCampanha,
} from "../_shared/textos-campanha.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
};

const CAMPANHA = "recuperacao_form_meta_2026_06";
const ESPACAMENTO_MIN_S = 300;
const ESPACAMENTO_MAX_S = 360;
const MAX_POR_HORA = 10;

function getAdmin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
}

// Horário São Paulo (UTC-3, sem DST atualmente). Retorna {hour, dow} em SP.
function spNow(): { hour: number; minute: number; dow: number; date: Date } {
  const now = new Date();
  // SP = UTC-3
  const sp = new Date(now.getTime() - 3 * 3600 * 1000);
  return {
    hour: sp.getUTCHours(),
    minute: sp.getUTCMinutes(),
    dow: sp.getUTCDay(), // 0=dom, 6=sab
    date: sp,
  };
}

function dentroDaJanela(): boolean {
  const { hour, dow } = spNow();
  if (dow === 0 || dow === 6) return false;
  if (hour >= 10 && hour < 12) return true;
  if (hour >= 13 && hour < 18) return true;
  return false;
}

async function registrarEvento(sb: any, tipo: string, payload: any) {
  try {
    await sb.from("eventos_sdr").insert({ tipo, payload });
  } catch (_e) { /* ignore */ }
}

async function selecionarLeads(sb: any, limite: number | null) {
  // Lista de IDs já trabalhados (enviada ou respondida)
  const { data: jaTrabalhados } = await sb
    .from("campanhas_envio")
    .select("contact_submission_id")
    .in("status", ["enviada", "respondida", "pendente"])
    .eq("campanha", CAMPANHA);
  const excluirIds = (jaTrabalhados ?? [])
    .map((r: any) => r.contact_submission_id)
    .filter(Boolean);

  let q = sb
    .from("contact_submissions")
    .select("id, nome_completo, telefone, telefone_digits, tipo_processo, origem, mensagem")
    .in("origem", ["facebook", "instagram", "meta"])
    .eq("estagio", "novo")
    .is("lead_geral_id", null)
    .not("telefone", "is", null)
    .neq("telefone", "")
    .not("telefone_digits", "is", null);

  if (excluirIds.length > 0) {
    q = q.not("id", "in", `(${excluirIds.join(",")})`);
  }

  const { data: candidatos, error } = await q.limit(500);
  if (error) throw error;

  const lista = (candidatos ?? []).filter(
    (c: any) => (c.telefone_digits ?? "").length >= 10,
  );

  // Filtro contra numeros_bloqueados_bot (últimos 8 dígitos)
  const { data: bloq } = await sb.from("numeros_bloqueados_bot").select("telefone");
  const bloqUlt8 = new Set(
    (bloq ?? []).map((b: any) => (b.telefone ?? "").replace(/\D/g, "").slice(-8)),
  );

  // Filtro contra leads que já são cliente/agendado
  const { data: leadsAtivos } = await sb
    .from("leads_geral")
    .select("telefone_digits, status_sdr")
    .in("status_sdr", ["cliente", "agendado"]);
  const ativosUlt8 = new Set(
    (leadsAtivos ?? [])
      .map((l: any) => (l.telefone_digits ?? "").slice(-8))
      .filter(Boolean),
  );

  const filtrados = lista.filter((c: any) => {
    const ult8 = (c.telefone_digits ?? "").slice(-8);
    if (bloqUlt8.has(ult8)) return false;
    if (ativosUlt8.has(ult8)) return false;
    return true;
  });

  // Shuffle
  filtrados.sort(() => Math.random() - 0.5);

  // Smoke: mistura 2 inv + 1 saude + 1 outro + 1 com mensagem
  if (limite === 5) {
    const inv = filtrados.filter((c: any) => classificarAreaCampanha(c.tipo_processo) === "inventario");
    const sau = filtrados.filter((c: any) => classificarAreaCampanha(c.tipo_processo) === "saude");
    const out = filtrados.filter((c: any) => classificarAreaCampanha(c.tipo_processo) === "outro");
    const comMsg = filtrados.filter(
      (c: any) => (c.mensagem ?? "").trim().length > 20,
    );

    const pick: any[] = [];
    const usados = new Set<string>();
    const add = (arr: any[], n: number) => {
      for (const x of arr) {
        if (pick.length >= n + usados.size) break;
        if (!usados.has(x.id)) { pick.push(x); usados.add(x.id); }
      }
    };
    add(inv, 2);
    add(sau, 1);
    add(out, 1);
    add(comMsg, 1);
    // Completa até 5 com qualquer um
    for (const x of filtrados) {
      if (pick.length >= 5) break;
      if (!usados.has(x.id)) { pick.push(x); usados.add(x.id); }
    }
    return pick.slice(0, 5);
  }

  return limite ? filtrados.slice(0, limite) : filtrados;
}

async function ultimoEnvioMs(sb: any): Promise<number | null> {
  const { data } = await sb
    .from("campanhas_envio")
    .select("enviada_em")
    .eq("campanha", CAMPANHA)
    .eq("status", "enviada")
    .order("enviada_em", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data?.enviada_em) return null;
  return new Date(data.enviada_em).getTime();
}

async function enviosUltimaHora(sb: any): Promise<number> {
  const since = new Date(Date.now() - 3600 * 1000).toISOString();
  const { count } = await sb
    .from("campanhas_envio")
    .select("*", { count: "exact", head: true })
    .eq("campanha", CAMPANHA)
    .eq("status", "enviada")
    .gte("enviada_em", since);
  return count ?? 0;
}

async function errosUltimaHora(sb: any): Promise<number> {
  const since = new Date(Date.now() - 3600 * 1000).toISOString();
  const { count } = await sb
    .from("campanhas_envio")
    .select("*", { count: "exact", head: true })
    .eq("campanha", CAMPANHA)
    .eq("status", "erro")
    .gte("created_at", since);
  return count ?? 0;
}

function platformFromOrigem(origem: string): string {
  if (origem === "instagram") return "instagram_ads";
  if (origem === "facebook") return "facebook_ads";
  return "meta_ads";
}

// Cross-check antes de enviar: bloqueia se telefone já está em fontes ativas.
// Retorna { fonte, status } se bateu, ou null se passou limpo.
async function crossCheckCampanha(
  sb: any,
  tel8: string,
  contactSubmissionId: string,
): Promise<{ fonte: "a" | "b" | "c" | "d"; status: "cliente_ja_existente" | "duplicata_em_atendimento" } | null> {
  // a) numeros_bloqueados_bot
  {
    const { data } = await sb.rpc("execute_sql" as any, {}).then(() => null).catch(() => null);
    // fallback puro JS: traz tudo e filtra (numeros_bloqueados_bot é tabela pequena)
    const { data: bloq } = await sb.from("numeros_bloqueados_bot").select("telefone");
    const hit = (bloq ?? []).some((b: any) => (b.telefone ?? "").replace(/\D/g, "").slice(-8) === tel8);
    if (hit) return { fonte: "a", status: "cliente_ja_existente" };
  }
  // b) leads_geral em atendimento
  {
    const { data } = await sb
      .from("leads_geral")
      .select("id, phone_number, status_sdr")
      .like("telefone_digits", `%${tel8}`)
      .in("status_sdr", [
        "assumido_humano",
        "agendado",
        "cliente",
        "em_atendimento",
        "em_atendimento_bot",
        "sql_aguardando_humano",
      ])
      .limit(5);
    const hit = (data ?? []).some(
      (l: any) => (l.phone_number ?? "").replace(/\D/g, "").slice(-8) === tel8,
    );
    if (hit) return { fonte: "b", status: "cliente_ja_existente" };
  }
  // c) contact_submissions duplicado (outro registro, com dono ou em estágio ativo)
  {
    const { data } = await sb
      .from("contact_submissions")
      .select("id, telefone, responsavel_id, estagio")
      .neq("id", contactSubmissionId)
      .limit(200);
    const hit = (data ?? []).some((cs: any) => {
      const t8 = (cs.telefone ?? "").replace(/\D/g, "").slice(-8);
      if (t8 !== tel8) return false;
      if (cs.responsavel_id) return true;
      return ["contato_inicial", "em_analise", "proposta_enviada", "fechado"].includes(cs.estagio);
    });
    if (hit) return { fonte: "c", status: "duplicata_em_atendimento" };
  }
  // d) processos vinculados a lead com mesmo telefone
  {
    const { data: leadsMesmoTel } = await sb
      .from("leads_geral")
      .select("id, phone_number")
      .like("telefone_digits", `%${tel8}`)
      .limit(20);
    const idsExatos = (leadsMesmoTel ?? [])
      .filter((l: any) => (l.phone_number ?? "").replace(/\D/g, "").slice(-8) === tel8)
      .map((l: any) => l.id);
    if (idsExatos.length > 0) {
      const { data: proc } = await sb
        .from("processos")
        .select("id")
        .in("lead_id", idsExatos)
        .limit(1);
      if ((proc ?? []).length > 0) return { fonte: "d", status: "cliente_ja_existente" };
    }
  }
  return null;
}

async function processarUm(sb: any, cs: any, dryRun: boolean): Promise<{ ok: boolean; status: string; error?: string; skipped?: boolean }> {
  const area: AreaCampanha = classificarAreaCampanha(cs.tipo_processo);
  const { texto, variacao } = escolherTexto(area);
  const telefoneNormalizado = normalizarTelefone(cs.telefone);
  const tel8 = telefoneNormalizado.slice(-8);
  const nome = primeiroNome(cs.nome_completo);
  const mensagem = texto.replaceAll("{primeiro_nome}", nome);

  // ============= CROSS-CHECK ANTES DE QUALQUER WRITE =============
  const hit = await crossCheckCampanha(sb, tel8, cs.id);
  if (hit) {
    await sb.from("campanhas_envio").insert({
      campanha: CAMPANHA,
      contact_submission_id: cs.id,
      telefone: telefoneNormalizado,
      area,
      mensagem_enviada: mensagem,
      variacao_texto: variacao,
      status: hit.status,
      erro_detalhe: `fonte:${hit.fonte}`,
    });
    await registrarEvento(sb, "campanha_skip_cross_check", {
      fonte: hit.fonte,
      telefone: tel8,
      contact_submission_id: cs.id,
    });
    return { ok: false, status: hit.status, skipped: true };
  }

  // Insere registro pendente
  const { data: registro, error: errIns } = await sb
    .from("campanhas_envio")
    .insert({
      campanha: CAMPANHA,
      contact_submission_id: cs.id,
      telefone: telefoneNormalizado,
      area,
      mensagem_enviada: mensagem,
      variacao_texto: variacao,
      status: "pendente",
    })
    .select("id")
    .single();
  if (errIns) return { ok: false, status: "erro", error: `insert campanhas_envio: ${errIns.message}` };

  if (dryRun) {
    await sb.from("campanhas_envio").update({
      status: "enviada",
      enviada_em: new Date().toISOString(),
      zapi_message_id: "DRY_RUN",
    }).eq("id", registro.id);
    return { ok: true, status: "enviada_dry" };
  }

  // Cria lead em leads_geral se não existir (busca por últimos 8)
  const ult8 = telefoneNormalizado.slice(-8);
  const { data: leadExistente } = await sb
    .from("leads_geral")
    .select("id")
    .like("telefone_digits", `%${ult8}`)
    .limit(1)
    .maybeSingle();

  let leadId: string;
  if (leadExistente?.id) {
    leadId = leadExistente.id;
    await sb.from("leads_geral").update({
      origem_sdr: "campanha_recuperacao_form",
      status_sdr: "em_atendimento_bot",
      etapa_qualificacao: "aguardando_resposta_campanha",
      bot_pausado: false,
      area_normalizada: area,
    }).eq("id", leadId);
  } else {
    leadId = `sdr_camp_${Date.now()}_${telefoneNormalizado.slice(-6)}`;
    const { error: errLead } = await sb.from("leads_geral").insert({
      id: leadId,
      full_name: cs.nome_completo,
      phone_number: telefoneNormalizado,
      contato_whatsapp: telefoneNormalizado,
      platform: platformFromOrigem(cs.origem),
      origem_sdr: "campanha_recuperacao_form",
      status_sdr: "em_atendimento_bot",
      etapa_qualificacao: "aguardando_resposta_campanha",
      bot_pausado: false,
      area_normalizada: area,
      is_organic: false,
      created_time: new Date().toISOString(),
    });
    if (errLead) {
      await sb.from("campanhas_envio").update({
        status: "erro", erro_detalhe: `criar lead: ${errLead.message}`,
      }).eq("id", registro.id);
      return { ok: false, status: "erro", error: errLead.message };
    }
  }

  // Vincula contact_submissions.lead_geral_id
  await sb.from("contact_submissions").update({ lead_geral_id: leadId }).eq("id", cs.id);
  await sb.from("campanhas_envio").update({ lead_geral_id: leadId }).eq("id", registro.id);

  // Envia via Z-API
  const envio = await zapiSendText(telefoneNormalizado, mensagem);
  if (!envio.ok) {
    await sb.from("campanhas_envio").update({
      status: "erro",
      erro_detalhe: `zapi ${envio.status}: ${JSON.stringify(envio.raw)?.slice(0, 500)}`,
    }).eq("id", registro.id);
    return { ok: false, status: "erro", error: `zapi ${envio.status}` };
  }

  await sb.from("campanhas_envio").update({
    status: "enviada",
    zapi_message_id: envio.messageId ?? null,
    enviada_em: new Date().toISOString(),
  }).eq("id", registro.id);

  // Registra na mensagens_sdr também (pra histórico do bot)
  await sb.from("mensagens_sdr").insert({
    lead_id: leadId,
    origem: "bot",
    conteudo: mensagem,
    metadata: { campanha: CAMPANHA, area, variacao, zapi: envio },
  });

  return { ok: true, status: "enviada" };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const mode: "smoke" | "rollout" = body.mode === "smoke" ? "smoke" : "rollout";
    const dryRun: boolean = !!body.dry_run;
    const maxPerRun: number = Number(body.max_per_run ?? (mode === "smoke" ? 5 : 1));

    const sb = getAdmin();

    // Kill switch
    const erros = await errosUltimaHora(sb);
    if (erros >= 3) {
      await registrarEvento(sb, "campanha_pausada_kill_switch", { erros });
      return new Response(JSON.stringify({ paused: true, error_count: erros }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Janela horária — em rollout, fora da janela não envia (cron volta depois)
    if (mode === "rollout" && !dentroDaJanela()) {
      return new Response(JSON.stringify({ skipped: "fora_da_janela_sp" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Espaçamento + rate por hora — só pra rollout
    if (mode === "rollout") {
      const enviosH = await enviosUltimaHora(sb);
      if (enviosH >= MAX_POR_HORA) {
        return new Response(JSON.stringify({ skipped: "max_por_hora", enviosH }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const ult = await ultimoEnvioMs(sb);
      if (ult) {
        const espMin = ESPACAMENTO_MIN_S * 1000;
        if (Date.now() - ult < espMin) {
          return new Response(JSON.stringify({ skipped: "espacamento", waitedMs: Date.now() - ult }), {
            status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    // Em rollout, busca um buffer extra pra absorver skips de cross-check
    const poolSize = mode === "smoke" ? 5 : (maxPerRun + 20);
    const leads = await selecionarLeads(sb, poolSize);
    if (leads.length === 0) {
      return new Response(JSON.stringify({ ok: true, processed: 0, message: "nenhum lead pendente" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resultados: any[] = [];
    let enviadosNoBatch = 0;
    let skipsConsecutivos = 0;
    const alvoEnvios = mode === "smoke" ? leads.length : maxPerRun;

    for (const cs of leads) {
      if (enviadosNoBatch >= alvoEnvios) break;
      if (skipsConsecutivos >= 20) break;

      const r = await processarUm(sb, cs, dryRun);
      resultados.push({ id: cs.id, telefone: cs.telefone, ...r });

      if (r.ok) {
        enviadosNoBatch++;
        skipsConsecutivos = 0;
      } else if (r.skipped) {
        skipsConsecutivos++;
        continue; // skip não conta no rate / espaçamento
      }

      // Espaçamento entre envios reais — só faz sentido em smoke (rollout faz N por chamada, geralmente 1)
      if (mode === "smoke" && enviadosNoBatch < alvoEnvios) {
        const wait = ESPACAMENTO_MIN_S + Math.floor(Math.random() * (ESPACAMENTO_MAX_S - ESPACAMENTO_MIN_S));
        await new Promise((r) => setTimeout(r, wait * 1000));

        // Re-check kill switch a cada 5 envios
        if (enviadosNoBatch % 5 === 0) {
          const e = await errosUltimaHora(sb);
          if (e >= 3) {
            await registrarEvento(sb, "campanha_pausada_kill_switch", { erros: e });
            return new Response(JSON.stringify({ paused: true, error_count: e, resultados }), {
              status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        }
      }
    }

    return new Response(JSON.stringify({ ok: true, mode, dry_run: dryRun, processed: resultados.length, resultados }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[campanha-recuperacao-form] erro:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
