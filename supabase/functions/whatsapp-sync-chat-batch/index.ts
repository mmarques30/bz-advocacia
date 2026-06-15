// Edge Function: whatsapp-sync-chat-batch
// Roda via pg_cron a cada 5 min. Sincroniza histórico Z-API
// dos leads com atividade recente (rede de segurança caso o webhook
// fromMe da Z-API caia).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { syncLead } from "../whatsapp-sync-chat/index.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = new URL(req.url);
  const token = url.searchParams.get("t");
  const expected = Deno.env.get("SDR_INBOUND_SECRET");
  if (!expected || token !== expected) {
    return new Response(JSON.stringify({ error: "forbidden" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const horas = Number(url.searchParams.get("horas") ?? 48);
  const limite = Number(url.searchParams.get("limite") ?? 50);
  const desde = new Date(Date.now() - horas * 60 * 60 * 1000).toISOString();

  const { data: leads, error } = await sb
    .from("leads_geral")
    .select("id")
    .gte("ultima_mensagem_em", desde)
    .order("ultima_mensagem_em", { ascending: false })
    .limit(limite);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const resultados: Array<{ lead_id: string; ok: boolean; res?: any; erro?: string }> = [];
  let totalHumano = 0;
  let totalLead = 0;

  for (const l of (leads ?? []) as any[]) {
    try {
      const r = await syncLead(sb, l.id, 30);
      totalHumano += r.inserted_humano;
      totalLead += r.inserted_lead;
      resultados.push({ lead_id: l.id, ok: true, res: r });
    } catch (e) {
      resultados.push({ lead_id: l.id, ok: false, erro: String((e as Error).message ?? e) });
    }
  }

  await sb.from("eventos_sdr").insert({
    tipo: "whatsapp_sync_batch_executado",
    payload: {
      leads_processados: resultados.length,
      total_humano_inseridas: totalHumano,
      total_lead_inseridas: totalLead,
      erros: resultados.filter((r) => !r.ok).length,
    },
  });

  return new Response(
    JSON.stringify({
      ok: true,
      leads_processados: resultados.length,
      total_humano: totalHumano,
      total_lead: totalLead,
      resultados,
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
