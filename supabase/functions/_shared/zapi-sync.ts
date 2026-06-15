// Helper: sincroniza histórico Z-API → mensagens_sdr para um lead.
// Usado por whatsapp-sync-chat (on-demand) e whatsapp-sync-chat-batch (cron).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const ZAPI_INSTANCE = Deno.env.get("ZAPI_INSTANCE_ID")!;
const ZAPI_TOKEN = Deno.env.get("ZAPI_TOKEN")!;
const ZAPI_CLIENT_TOKEN = Deno.env.get("ZAPI_CLIENT_TOKEN")!;

interface ZapiMessage {
  messageId?: string;
  fromMe?: boolean;
  moment?: number;
  text?: { message?: string } | string;
  body?: string;
  message?: string;
  type?: string;
  image?: { caption?: string };
  audio?: unknown;
  video?: unknown;
  document?: unknown;
}

async function fetchHistorico(phone: string, amount = 40): Promise<ZapiMessage[]> {
  const url = `https://api.z-api.io/instances/${ZAPI_INSTANCE}/token/${ZAPI_TOKEN}/chat-messages/${phone}?amount=${amount}`;
  const resp = await fetch(url, { headers: { "Client-Token": ZAPI_CLIENT_TOKEN } });
  if (!resp.ok) {
    const t = await resp.text().catch(() => "");
    throw new Error(`Z-API chat-messages ${resp.status}: ${t.slice(0, 200)}`);
  }
  const data = await resp.json().catch(() => null);
  if (Array.isArray(data)) return data;
  if (Array.isArray((data as any)?.messages)) return (data as any).messages;
  return [];
}

function extrairConteudo(m: ZapiMessage): { texto: string | null; tipoMidia: string | null } {
  const tipo = m.type?.toLowerCase();
  const textoDireto =
    (typeof m.text === "string" ? m.text : m.text?.message) ||
    m.body ||
    m.message ||
    null;
  if (textoDireto && textoDireto.trim()) return { texto: textoDireto.trim(), tipoMidia: null };
  if (m.image) return { texto: `[imagem]${m.image.caption ? `: ${m.image.caption}` : ""}`, tipoMidia: "image" };
  if (m.audio) return { texto: "[áudio]", tipoMidia: "audio" };
  if (m.video) return { texto: "[vídeo]", tipoMidia: "video" };
  if (m.document) return { texto: "[documento]", tipoMidia: "document" };
  if (tipo) return { texto: `[${tipo}]`, tipoMidia: tipo };
  return { texto: null, tipoMidia: null };
}

export async function syncLeadZapi(
  sb: ReturnType<typeof createClient>,
  leadId: string,
  amount = 40,
): Promise<{ inserted_humano: number; inserted_lead: number; total_fetched: number; skipped: number }> {
  const { data: lead, error: leadErr } = await sb
    .from("leads_geral")
    .select("id, telefone_digits, bot_pausado, status_sdr")
    .eq("id", leadId)
    .maybeSingle();
  if (leadErr) throw leadErr;
  if (!lead) throw new Error("lead_nao_encontrado");
  const phone = (lead as any).telefone_digits as string | null;
  if (!phone) return { inserted_humano: 0, inserted_lead: 0, total_fetched: 0, skipped: 0 };

  const historico = await fetchHistorico(phone, amount);

  const desde = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString();
  const { data: existentes } = await sb
    .from("mensagens_sdr")
    .select("metadata, conteudo, enviada_em, origem")
    .eq("lead_id", leadId)
    .gte("enviada_em", desde)
    .limit(2000);

  const idsExistentes = new Set<string>();
  const fingerprints = new Set<string>();
  for (const r of (existentes ?? []) as any[]) {
    const mid = r.metadata?.messageId;
    if (mid) idsExistentes.add(mid);
    const ts = r.enviada_em ? Math.floor(new Date(r.enviada_em).getTime() / 1000) : 0;
    fingerprints.add(`${r.origem}|${(r.conteudo || "").slice(0, 80)}|${Math.floor(ts / 3)}`);
  }

  let insHumano = 0;
  let insLead = 0;
  let skipped = 0;
  const inserts: any[] = [];

  for (const m of historico) {
    const { texto, tipoMidia } = extrairConteudo(m);
    if (!texto) { skipped++; continue; }
    const mid = m.messageId;
    if (mid && idsExistentes.has(mid)) { skipped++; continue; }

    const enviadaEm = m.moment ? new Date(m.moment).toISOString() : new Date().toISOString();
    const ts = Math.floor((m.moment ?? Date.now()) / 1000);
    const origem = m.fromMe ? "humano" : "lead";
    const fp = `${origem}|${texto.slice(0, 80)}|${Math.floor(ts / 3)}`;
    if (fingerprints.has(fp)) { skipped++; continue; }
    fingerprints.add(fp);
    if (mid) idsExistentes.add(mid);

    inserts.push({
      lead_id: leadId,
      origem,
      conteudo: texto,
      enviada_em: enviadaEm,
      metadata: {
        messageId: mid ?? null,
        via: m.fromMe ? "celular_sync" : "zapi_sync",
        canal: m.fromMe ? "whatsapp_celular" : "whatsapp",
        tipo_midia: tipoMidia,
        sync_origem: "whatsapp-sync-chat",
      },
    });
    if (origem === "humano") insHumano++;
    else insLead++;
  }

  if (inserts.length > 0) {
    const { error: insErr } = await sb.from("mensagens_sdr").insert(inserts);
    if (insErr) throw insErr;
  }

  if (insHumano > 0 && !(lead as any).bot_pausado) {
    await sb
      .from("leads_geral")
      .update({
        bot_pausado: true,
        status_sdr: "assumido_humano",
        assumido_em: new Date().toISOString(),
      })
      .eq("id", leadId);
    await sb.from("eventos_sdr").insert({
      tipo: "humano_assumiu_via_sync",
      payload: { lead_id: leadId, telefone: phone, inseridas: insHumano },
    });
  }

  return {
    inserted_humano: insHumano,
    inserted_lead: insLead,
    total_fetched: historico.length,
    skipped,
  };
}
