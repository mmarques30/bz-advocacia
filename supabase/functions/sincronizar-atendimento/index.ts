// Edge Function: sincronizar-atendimento
// Roda a cada 5min via pg_cron. Busca histórico Z-API de chats com leads
// em atendimento ativo e detecta mensagens fromMe=true (respondidas pelo
// celular da B&Z) que não foram registradas em mensagens_sdr. Quando acha,
// marca o lead como assumido_humano e pausa o bot.
//
// Endpoint Z-API: GET /chat-messages/{phone}?amount=30
// Docs: https://developer.z-api.io/message/get-chat-messages

import { getSupabaseAdmin, registrarEvento, registrarMensagem, telefoneDoLead } from "../_shared/db.ts";
import { normalizarTelefone } from "../_shared/zapi.ts";

const Z_API_INSTANCE = Deno.env.get("ZAPI_INSTANCE_ID")!;
const Z_API_TOKEN = Deno.env.get("ZAPI_TOKEN")!;
const Z_API_CLIENT_TOKEN = Deno.env.get("ZAPI_CLIENT_TOKEN")!;
const BASE_URL = `https://api.z-api.io/instances/${Z_API_INSTANCE}/token/${Z_API_TOKEN}`;

interface ZapiMsg {
  messageId?: string;
  fromMe?: boolean;
  moment?: number; // epoch ms
  text?: { message?: string } | string;
  type?: string;
}

async function buscarHistoricoZapi(phone: string, amount = 30): Promise<ZapiMsg[]> {
  // Z-API: GET /chat-messages/{phone}?amount=N
  // Algumas instâncias exigem o número COM o sufixo de chat. Tentamos variações.
  const tentativas = [
    `${BASE_URL}/chat-messages/${phone}?amount=${amount}`,
    `${BASE_URL}/chat-messages/${phone}@c.us?amount=${amount}`,
  ];
  for (const url of tentativas) {
    const resp = await fetch(url, { headers: { "Client-Token": Z_API_CLIENT_TOKEN } });
    if (!resp.ok) {
      const body = await resp.text().catch(() => "");
      console.error(`[zapi] ${phone} status ${resp.status} body=${body.slice(0, 200)} url=${url}`);
      continue;
    }
    const data = await resp.json().catch(() => null);
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.messages)) return data.messages;
    return [];
  }
  return [];
}

function textoDaMsg(m: ZapiMsg): string {
  if (typeof m.text === "string") return m.text;
  if (m.text && typeof m.text === "object") return m.text.message ?? "";
  return "";
}

Deno.serve(async (req) => {
  const supabase = getSupabaseAdmin();
  const body = await req.json().catch(() => ({}));
  const onlyLeadIds: string[] | undefined = body?.lead_ids;

  let query = supabase
    .from("leads_geral")
    .select("id, full_name, phone_number, contato_whatsapp, status_sdr, bot_pausado")
    .eq("bot_pausado", false);

  if (onlyLeadIds && onlyLeadIds.length) {
    query = query.in("id", onlyLeadIds);
  } else {
    query = query.in("status_sdr", ["sql_aguardando_humano", "em_atendimento_bot"]);
  }

  const { data: leads, error } = await query.limit(200);
  if (error) {
    return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500 });
  }

  let reclassificados = 0;
  let mensagensImportadas = 0;
  const detalhes: any[] = [];

  for (const lead of leads ?? []) {
    const tel = telefoneDoLead(lead as any);
    if (!tel) continue;
    const phone = normalizarTelefone(tel);

    const msgs = await buscarHistoricoZapi(phone, 30);
    if (!msgs.length) continue;

    // IDs já registrados (via metadata.zapi.messageId OU metadata.messageId)
    const { data: jaRegistradas } = await supabase
      .from("mensagens_sdr")
      .select("metadata")
      .eq("lead_id", lead.id)
      .order("enviada_em", { ascending: false })
      .limit(200);

    const idsJa = new Set<string>();
    for (const r of jaRegistradas ?? []) {
      const md: any = r.metadata ?? {};
      const id1 = md?.zapi?.messageId ?? md?.messageId;
      if (id1) idsJa.add(String(id1));
    }

    let humanoDetectado = false;
    let novosDoHumano = 0;

    for (const m of msgs) {
      if (!m.fromMe) continue;
      const mid = m.messageId ? String(m.messageId) : "";
      if (mid && idsJa.has(mid)) continue;
      const texto = textoDaMsg(m).trim();
      if (!texto) continue;

      await registrarMensagem(supabase, lead.id, "humano", texto, {
        messageId: mid || null,
        fromMe: true,
        moment: m.moment ?? null,
        origem_sync: "zapi_chat_messages",
      });
      mensagensImportadas++;
      novosDoHumano++;
      humanoDetectado = true;
    }

    if (humanoDetectado) {
      await supabase
        .from("leads_geral")
        .update({
          bot_pausado: true,
          status_sdr: "assumido_humano",
          assumido_em: new Date().toISOString(),
        })
        .eq("id", lead.id);

      await registrarEvento(supabase, lead.id, "humano_detectado_via_sync", {
        msgs_importadas: novosDoHumano,
      });
      reclassificados++;
      detalhes.push({ lead_id: lead.id, nome: (lead as any).full_name, novas: novosDoHumano });
    }
  }

  return new Response(
    JSON.stringify({
      ok: true,
      leads_verificados: leads?.length ?? 0,
      reclassificados,
      mensagens_importadas: mensagensImportadas,
      detalhes,
    }),
    { headers: { "Content-Type": "application/json" } },
  );
});
