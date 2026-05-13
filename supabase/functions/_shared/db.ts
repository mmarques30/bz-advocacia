// Cliente Supabase (service role) usado dentro das Edge Functions.

import { createClient, SupabaseClient } from "jsr:@supabase/supabase-js@2";

export function getSupabaseAdmin(): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

export interface Lead {
  id: string;
  nome: string;
  telefone: string;
  tipo_de_processo: string | null;
  origem: string | null;
  status_sdr: string;
  area_normalizada: string | null;
  score: number;
  bot_pausado: boolean;
  etapa_qualificacao: string;
  humano_responsavel: string | null;
  ultima_mensagem_em: string | null;
}

export async function buscarLeadPorId(
  supabase: SupabaseClient,
  leadId: string,
): Promise<Lead | null> {
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("id", leadId)
    .single();
  if (error) return null;
  return data as Lead;
}

export async function buscarLeadPorTelefone(
  supabase: SupabaseClient,
  telefone: string,
): Promise<Lead | null> {
  // Tenta primeiro com o telefone completo, depois com variações comuns
  const variacoes = [
    telefone,
    telefone.replace(/^55/, ""),
    "+" + telefone,
  ];
  for (const tel of variacoes) {
    const { data } = await supabase
      .from("leads")
      .select("*")
      .eq("telefone", tel)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) return data as Lead;
  }
  // Fallback: like nos últimos 8 dígitos
  const ultimosDigitos = telefone.slice(-8);
  const { data } = await supabase
    .from("leads")
    .select("*")
    .like("telefone", `%${ultimosDigitos}`)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as Lead) ?? null;
}

export async function registrarMensagem(
  supabase: SupabaseClient,
  leadId: string,
  origem: "lead" | "bot" | "humano",
  conteudo: string,
  metadata: Record<string, unknown> = {},
) {
  await supabase.from("mensagens").insert({
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
  await supabase.from("eventos_bot").insert({
    lead_id: leadId,
    tipo,
    payload,
  });
}

export async function historicoMensagens(
  supabase: SupabaseClient,
  leadId: string,
  limit = 10,
): Promise<{ origem: string; conteudo: string }[]> {
  const { data } = await supabase
    .from("mensagens")
    .select("origem, conteudo")
    .eq("lead_id", leadId)
    .order("enviada_em", { ascending: false })
    .limit(limit);
  return ((data ?? []) as { origem: string; conteudo: string }[]).reverse();
}

export async function buscarAdvogadoPorArea(
  supabase: SupabaseClient,
  area: string,
): Promise<{ id: string; nome: string; email: string; telefone: string | null } | null> {
  const { data } = await supabase
    .from("advogados")
    .select("id, nome, email, telefone, areas")
    .eq("ativo", true)
    .contains("areas", [area])
    .limit(1)
    .maybeSingle();
  return data as any;
}
