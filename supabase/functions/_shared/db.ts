// Cliente Supabase (service role) usado dentro das Edge Functions.
// Helpers alinhados ao schema real V4: leads_geral + *_sdr.

import { createClient, SupabaseClient } from "jsr:@supabase/supabase-js@2";

export function getSupabaseAdmin(): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

export interface Lead {
  id: string;                        // text (sdr_*, fb_*, etc.)
  full_name: string | null;
  phone_number: string | null;
  contato_whatsapp: string | null;
  tipo_servico: string | null;
  origem_sdr: string | null;
  status_sdr: string | null;
  area_normalizada: string | null;
  score: number | null;
  bot_pausado: boolean | null;
  etapa_qualificacao: string | null;
  humano_responsavel: string | null;
  ultima_mensagem_em: string | null;
}

const LEAD_COLS =
  "id, full_name, phone_number, contato_whatsapp, tipo_servico, origem_sdr, status_sdr, area_normalizada, score, bot_pausado, etapa_qualificacao, humano_responsavel, ultima_mensagem_em";

export function nomePrimeiro(lead: Pick<Lead, "full_name">): string {
  return (lead.full_name ?? "").split(" ")[0] || "tudo bem";
}

export function telefoneDoLead(lead: Pick<Lead, "contato_whatsapp" | "phone_number">): string {
  return (lead.contato_whatsapp ?? lead.phone_number ?? "").trim();
}

export async function buscarLeadPorId(
  supabase: SupabaseClient,
  leadId: string,
): Promise<Lead | null> {
  const { data } = await supabase
    .from("leads_geral")
    .select(LEAD_COLS)
    .eq("id", leadId)
    .maybeSingle();
  return (data as Lead) ?? null;
}

export async function buscarLeadPorTelefone(
  supabase: SupabaseClient,
  telefone: string,
): Promise<Lead | null> {
  // Importa local pra evitar ciclo
  const { variacoesTelefone } = await import("./zapi.ts");
  const base = variacoesTelefone(telefone);
  const variacoes = new Set<string>();
  for (const t of base) {
    variacoes.add(t);
    variacoes.add(t.replace(/^55/, ""));
    variacoes.add("+" + t);
  }

  for (const campo of ["contato_whatsapp", "phone_number"] as const) {
    for (const tel of variacoes) {
      const { data } = await supabase
        .from("leads_geral")
        .select(LEAD_COLS)
        .eq(campo, tel)
        .order("created_time", { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle();
      if (data) return data as Lead;
    }
  }

  // Fallback: usa coluna gerada telefone_digits (apenas dígitos)
  const ultimos = telefone.replace(/\D/g, "").slice(-8);
  {
    const { data } = await supabase
      .from("leads_geral")
      .select(LEAD_COLS)
      .like("telefone_digits", `%${ultimos}`)
      .order("created_time", { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle();
    if (data) return data as Lead;
  }
  return null;
}

export interface CriarLeadInput {
  nome: string;
  telefone: string; // já normalizado
  platform: string;
  origem: string;
}

export async function criarLeadWhatsApp(
  supabase: SupabaseClient,
  input: CriarLeadInput,
): Promise<Lead | null> {
  const id = `sdr_wa_${Date.now()}_${input.telefone.slice(-6)}`;
  const { data, error } = await supabase
    .from("leads_geral")
    .insert({
      id,
      full_name: input.nome,
      phone_number: input.telefone,
      contato_whatsapp: input.telefone,
      platform: input.platform,
      origem_sdr: input.origem,
      status_sdr: "novo",
      etapa_qualificacao: "M0",
      is_organic: !input.platform.endsWith("_ads"),
      created_time: new Date().toISOString(),
    })
    .select(LEAD_COLS)
    .maybeSingle();
  if (error) {
    console.error("[criarLeadWhatsApp] erro:", error);
    return null;
  }
  // Espelha imediatamente em contact_submissions pra aparecer no kanban.
  if (data) {
    await espelharContactSubmission(supabase, data as Lead, {
      platform: input.platform,
      mensagem: `Lead criado via WhatsApp Bot SDR (${input.origem})`,
    });
  }
  return (data as Lead) ?? null;
}

// =====================================================================
// Espelhamento leads_geral → contact_submissions
// O kanban (/dashboard/leads) lê APENAS de contact_submissions.
// Mantemos 1 registro contact_submissions por lead_geral, ligados por
// contact_submissions.lead_geral_id (UNIQUE).
// =====================================================================

function mapAreaToTipoProcesso(area: string | null | undefined): string {
  const a = (area ?? "").toLowerCase().trim();
  if (a === "saude" || a === "saúde" || a === "medicamentos_de_alto_custo") return "Saúde";
  if (a === "inventario" || a === "inventário" || a === "sucessoes" || a === "sucessões") return "Inventário";
  if (a === "familia" || a === "família") return "Família";
  if (a === "civel" || a === "cível") return "Cível";
  if (a === "consumidor") return "Consumidor";
  if (a === "trabalhista") return "Trabalhista";
  if (a === "previdenciario" || a === "previdenciário") return "Previdenciário";
  return "Outro";
}

function mapPlatformToOrigem(platform: string | null | undefined): string {
  const p = (platform ?? "").toLowerCase();
  if (p === "instagram_ads") return "instagram";
  if (p === "facebook_ads") return "facebook";
  if (p === "meta_ads") return "meta";
  // whatsapp_organico, teste_manual, humano_iniciou etc. → cai em "Orgânicos"
  return "whatsapp_organico";
}

function mapStatusSdrToCrm(s: string | null | undefined): { status: string; estagio: string } {
  // estagio CHECK: novo | contato_inicial | em_analise | proposta_enviada | fechado | perdido
  switch (s) {
    case "perdido":
      return { status: "fechado", estagio: "perdido" };
    case "mql_frio":
      return { status: "fechado", estagio: "fechado" };
    case "sql_aguardando_humano":
      return { status: "qualificado", estagio: "em_analise" };
    case "assumido_humano":
      return { status: "em_andamento", estagio: "contato_inicial" };
    case "em_atendimento_bot":
      return { status: "em_andamento", estagio: "novo" };
    default:
      return { status: "novo", estagio: "novo" };
  }
}

export async function espelharContactSubmission(
  supabase: SupabaseClient,
  lead: Pick<Lead,
    "id" | "full_name" | "phone_number" | "contato_whatsapp"
    | "area_normalizada" | "tipo_servico" | "status_sdr"
  > & { platform?: string | null },
  opts: { platform?: string; mensagem?: string } = {},
): Promise<void> {
  const telefone = (lead.contato_whatsapp ?? lead.phone_number ?? "").trim();
  if (!telefone) return;

  const platform = opts.platform ?? lead.platform ?? "whatsapp_organico";
  const tipo_processo = mapAreaToTipoProcesso(lead.area_normalizada ?? lead.tipo_servico);
  const origem = mapPlatformToOrigem(platform);
  const { status, estagio } = mapStatusSdrToCrm(lead.status_sdr);
  const agora = new Date().toISOString();

  // 1) Já vinculado? só atualiza campos relevantes ao kanban.
  const { data: ligado } = await supabase
    .from("contact_submissions")
    .select("id")
    .eq("lead_geral_id", lead.id)
    .maybeSingle();

  if (ligado) {
    await supabase
      .from("contact_submissions")
      .update({
        nome_completo: lead.full_name ?? "Lead WhatsApp",
        telefone,
        tipo_processo,
        origem,
        status,
        estagio,
        data_ultima_atividade: agora,
        ultimo_contato_em: agora,
      })
      .eq("id", (ligado as any).id);
    return;
  }

  // 2) Existe um contact_submissions com mesmo telefone sem vínculo?
  //    Linka — preserva o registro original. Se estava 'perdido', reabre.
  const { data: porTelefone } = await supabase
    .from("contact_submissions")
    .select("id, estagio")
    .eq("telefone", telefone)
    .is("lead_geral_id", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (porTelefone) {
    const updates: Record<string, unknown> = {
      lead_geral_id: lead.id,
      ultimo_contato_em: agora,
      data_ultima_atividade: agora,
    };
    if ((porTelefone as any).estagio === "perdido") {
      updates.estagio = "novo";
      updates.status = "novo";
    }
    await supabase
      .from("contact_submissions")
      .update(updates)
      .eq("id", (porTelefone as any).id);
    return;
  }

  // 3) Cria novo registro espelho.
  const { error } = await supabase.from("contact_submissions").insert({
    nome_completo: lead.full_name ?? "Lead WhatsApp",
    telefone,
    email: "",
    tipo_processo,
    como_conheceu: "bot",
    mensagem: opts.mensagem ?? "Lead criado via WhatsApp Bot SDR",
    lgpd_consent: true,
    origem,
    estagio,
    status,
    lead_geral_id: lead.id,
    whatsapp_id: telefone,
    primeiro_contato_em: agora,
    ultimo_contato_em: agora,
  });
  if (error) console.error("[espelharContactSubmission] insert erro:", error);
}

export async function registrarMensagem(
  supabase: SupabaseClient,
  leadId: string,
  origem: "lead" | "bot" | "humano",
  conteudo: string,
  metadata: Record<string, unknown> = {},
) {
  const { error } = await supabase.from("mensagens_sdr").insert({
    lead_id: leadId,
    origem,
    conteudo,
    metadata,
  });
  if (error) console.error("[registrarMensagem] erro:", error);
}

export async function registrarEvento(
  supabase: SupabaseClient,
  leadId: string | null,
  tipo: string,
  payload: Record<string, unknown> = {},
) {
  const { error } = await supabase.from("eventos_sdr").insert({
    lead_id: leadId,
    tipo,
    payload,
  });
  if (error) console.error("[registrarEvento] erro:", error);
}

export async function historicoMensagens(
  supabase: SupabaseClient,
  leadId: string,
  limit = 10,
): Promise<{ origem: string; conteudo: string }[]> {
  const { data } = await supabase
    .from("mensagens_sdr")
    .select("origem, conteudo, enviada_em")
    .eq("lead_id", leadId)
    .order("enviada_em", { ascending: false })
    .limit(limit);
  return ((data ?? []) as { origem: string; conteudo: string }[]).reverse();
}

export async function buscarAdvogadoPorArea(
  supabase: SupabaseClient,
  area: string,
): Promise<{ id: string; nome: string; email: string | null; telefone: string | null } | null> {
  // Tenta área específica primeiro
  const tentativas = [area, "geral"].filter((a, i, arr) => a && arr.indexOf(a) === i);
  for (const a of tentativas) {
    const { data } = await supabase
      .from("advogados_sdr")
      .select("id, nome, email, telefone, areas")
      .eq("ativo", true)
      .contains("areas", [a])
      .limit(1)
      .maybeSingle();
    if (data) return data as any;
  }
  // Fallback final: qualquer advogado ativo
  const { data: anyAdv } = await supabase
    .from("advogados_sdr")
    .select("id, nome, email, telefone, areas")
    .eq("ativo", true)
    .limit(1)
    .maybeSingle();
  return (anyAdv as any) ?? null;
}

export function fluxoFromArea(area: string | null | undefined): string {
  const a = (area ?? "").toLowerCase();
  if (a === "saude" || a === "saúde") return "saude";
  if (a === "inventario" || a === "inventário") return "inventario";
  if (["familia","família","civel","cível","consumidor","trabalhista","previdenciario","previdenciário"].includes(a)) {
    return "qualificacao_geral";
  }
  if (!a) return "qualificacao_geral";
  return "fora_escopo";
}
