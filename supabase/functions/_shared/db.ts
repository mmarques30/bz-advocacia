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

  // Fallback: like nos últimos 8 dígitos em qualquer dos campos
  const ultimos = telefone.replace(/\D/g, "").slice(-8);
  for (const campo of ["contato_whatsapp", "phone_number"] as const) {
    const { data } = await supabase
      .from("leads_geral")
      .select(LEAD_COLS)
      .like(campo, `%${ultimos}`)
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
      created_time: new Date().toISOString(),
    })
    .select(LEAD_COLS)
    .maybeSingle();
  if (error) {
    console.error("[criarLeadWhatsApp] erro:", error);
    return null;
  }
  return (data as Lead) ?? null;
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
