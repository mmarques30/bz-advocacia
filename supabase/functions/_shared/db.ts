// Cliente Supabase (service role) + helpers do CRM B&Z.
//
// Trabalha com a tabela `leads_geral` (CRM existente da B&Z, schema Meta
// Lead Ads: full_name, phone_number, contato_whatsapp, created_time,
// tipo_servico, platform) + colunas SDR adicionadas via migration V3.
//
// Estratégia: usar PostgREST aliasing no select para expor nomes
// "amigáveis" (nome, telefone, ...) ao restante do código do bot,
// mantendo as colunas reais nos INSERT/UPDATE.

import { createClient, SupabaseClient } from "jsr:@supabase/supabase-js@2";

export function getSupabaseAdmin(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
}

export interface Lead {
  id: string;
  nome: string | null;
  telefone: string | null;
  tipo_de_processo: string | null;
  origem: string | null;
  status_sdr: string;
  fluxo_sdr: string | null;
  area_normalizada: string | null;
  score: number;
  bot_pausado: boolean;
  etapa_qualificacao: string;
  humano_responsavel: string | null;
  ultima_mensagem_em: string | null;
  origem_sdr: string | null;
}

// Select com aliases pra normalizar o schema Meta → nomes do bot
const LEAD_SELECT = `
  id,
  nome:full_name,
  telefone:phone_number,
  contato_whatsapp,
  tipo_de_processo:tipo_servico,
  origem:platform,
  status_sdr,
  fluxo_sdr,
  area_normalizada,
  score,
  bot_pausado,
  etapa_qualificacao,
  humano_responsavel,
  ultima_mensagem_em,
  origem_sdr,
  created_time
`;

function normalizeLead(row: any): Lead {
  return {
    id: row.id,
    nome: row.nome ?? null,
    telefone: row.telefone ?? row.contato_whatsapp ?? null,
    tipo_de_processo: row.tipo_de_processo ?? null,
    origem: row.origem ?? row.origem_sdr ?? null,
    status_sdr: row.status_sdr ?? "novo",
    fluxo_sdr: row.fluxo_sdr ?? null,
    area_normalizada: row.area_normalizada ?? null,
    score: row.score ?? 0,
    bot_pausado: row.bot_pausado ?? false,
    etapa_qualificacao: row.etapa_qualificacao ?? "M0",
    humano_responsavel: row.humano_responsavel ?? null,
    ultima_mensagem_em: row.ultima_mensagem_em ?? null,
    origem_sdr: row.origem_sdr ?? null,
  };
}

export async function buscarLeadPorTelefone(
  supabase: SupabaseClient,
  telefone: string,
): Promise<Lead | null> {
  const ultimos8 = telefone.slice(-8);
  const variacoes = [telefone, telefone.replace(/^55/, ""), "+" + telefone];

  for (const t of variacoes) {
    const { data } = await supabase
      .from("leads_geral")
      .select(LEAD_SELECT)
      .or(`phone_number.eq.${t},contato_whatsapp.eq.${t}`)
      .order("created_time", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) return normalizeLead(data);
  }

  // Fallback: like nos últimos 8 dígitos
  const { data } = await supabase
    .from("leads_geral")
    .select(LEAD_SELECT)
    .or(`phone_number.like.%${ultimos8},contato_whatsapp.like.%${ultimos8}`)
    .order("created_time", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ? normalizeLead(data) : null;
}

export async function criarLead(
  supabase: SupabaseClient,
  args: {
    telefone: string;
    nome: string;
    tipo_de_processo?: string | null;
    origem?: string | null;
    origem_sdr: string;
  },
): Promise<Lead | null> {
  // leads_geral.id é TEXT (formato Meta). Bot gera próprio prefixo.
  const id = `sdr_${crypto.randomUUID()}`;
  const { data, error } = await supabase
    .from("leads_geral")
    .insert({
      id,
      full_name: args.nome,
      phone_number: args.telefone,
      contato_whatsapp: args.telefone,
      tipo_servico: args.tipo_de_processo ?? null,
      platform: args.origem ?? "whatsapp",
      origem_sdr: args.origem_sdr,
      status_sdr: "em_atendimento_bot",
      etapa_qualificacao: "M0",
      bot_pausado: false,
      created_time: new Date().toISOString(),
    })
    .select(LEAD_SELECT)
    .single();
  if (error) {
    console.error("criarLead error:", error);
    return null;
  }
  return normalizeLead(data);
}

/**
 * Cliente = telefone aparece em algum registro da tabela `processos`.
 */
export async function ehClienteExistente(
  supabase: SupabaseClient,
  leadId: string | null,
): Promise<boolean> {
  if (!leadId) return false;
  const { count } = await supabase
    .from("processos")
    .select("id", { count: "exact", head: true })
    .eq("lead_id", leadId);
  return (count ?? 0) > 0;
}

export async function registrarMensagem(
  supabase: SupabaseClient,
  leadId: string,
  origem: "lead" | "bot" | "humano",
  conteudo: string,
  metadata: Record<string, unknown> = {},
) {
  await supabase.from("mensagens_sdr").insert({
    lead_id: leadId,
    origem,
    conteudo,
    metadata,
  });
}

export async function registrarEvento(
  supabase: SupabaseClient,
  leadId: string | null,
  tipo: string,
  payload: Record<string, unknown> = {},
) {
  await supabase.from("eventos_sdr").insert({ lead_id: leadId, tipo, payload });
}

export async function historicoMensagens(
  supabase: SupabaseClient,
  leadId: string,
  limit = 12,
): Promise<{ origem: string; conteudo: string }[]> {
  const { data } = await supabase
    .from("mensagens_sdr")
    .select("origem, conteudo")
    .eq("lead_id", leadId)
    .order("enviada_em", { ascending: false })
    .limit(limit);
  return ((data ?? []) as { origem: string; conteudo: string }[]).reverse();
}

export async function buscarServicosPorArea(
  supabase: SupabaseClient,
  areaCodigo: string,
): Promise<any[]> {
  const { data } = await supabase
    .from("servicos_sdr")
    .select("*")
    .eq("area_codigo", areaCodigo)
    .eq("ativo", true);
  return data ?? [];
}

export async function buscarAdvogadoPorArea(
  supabase: SupabaseClient,
  areaCodigo: string,
): Promise<any> {
  const { data } = await supabase
    .from("advogados_sdr")
    .select("id, nome, email, telefone, areas")
    .eq("ativo", true)
    .contains("areas", [areaCodigo])
    .limit(1)
    .maybeSingle();
  return data;
}
