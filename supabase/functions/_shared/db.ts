// Cliente Supabase (service role) + helpers do CRM B&Z.
//
// Trabalha com a tabela `leads_geral` (CRM existente da B&Z) e as
// tabelas novas do SDR: mensagens_sdr, qualificacoes_sdr, advogados_sdr,
// eventos_sdr, servicos_sdr.

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
  telefone: string;
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

export async function buscarLeadPorTelefone(
  supabase: SupabaseClient,
  telefone: string,
): Promise<Lead | null> {
  const ultimos8 = telefone.slice(-8);
  const variacoes = [telefone, telefone.replace(/^55/, ""), "+" + telefone];

  for (const t of variacoes) {
    const { data } = await supabase
      .from("leads_geral")
      .select("*")
      .eq("telefone", t)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) return data as Lead;
  }
  // Fallback: like nos últimos 8 dígitos
  const { data } = await supabase
    .from("leads_geral")
    .select("*")
    .like("telefone", `%${ultimos8}`)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as Lead) ?? null;
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
  const { data, error } = await supabase
    .from("leads_geral")
    .insert({
      telefone: args.telefone,
      nome: args.nome,
      tipo_de_processo: args.tipo_de_processo ?? null,
      origem: args.origem ?? args.origem_sdr,
      origem_sdr: args.origem_sdr,
      status_sdr: "em_atendimento_bot",
      etapa_qualificacao: "M0",
      bot_pausado: false,
    })
    .select("*")
    .single();
  if (error) {
    console.error("criarLead error:", error);
    return null;
  }
  return data as Lead;
}

/**
 * Cliente = telefone aparece em algum registro da tabela `processos`.
 * Se o relacionamento processos→leads_geral não for via lead_id, ajuste a query.
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
