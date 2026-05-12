// Edge Function: meta-lead-webhook
// Recebe webhooks de Lead Ads do Meta (Facebook/Instagram).
//
// - GET: handshake de verificação do webhook (Meta envia hub.challenge).
// - POST: notificação de leadgen → puxa dados via Graph API → insere em `leads`.
//
// O insert dispara o Database Webhook on-new-lead, que envia a M0 automaticamente.

import { getSupabaseAdmin, registrarEvento } from "../_shared/db.ts";
import {
  buscarLeadDoMeta,
  normalizarLeadDoMeta,
  validarAssinaturaMeta,
} from "../_shared/meta.ts";

const VERIFY_TOKEN = Deno.env.get("META_VERIFY_TOKEN")!;
const PAGE_ACCESS_TOKEN = Deno.env.get("META_PAGE_ACCESS_TOKEN")!;
const APP_SECRET = Deno.env.get("META_APP_SECRET")!;

Deno.serve(async (req) => {
  const url = new URL(req.url);

  // ----- Handshake (GET) -----
  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    if (mode === "subscribe" && token === VERIFY_TOKEN && challenge) {
      return new Response(challenge, { status: 200 });
    }
    return new Response("Forbidden", { status: 403 });
  }

  // ----- Notificação (POST) -----
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get("x-hub-signature-256");

  // Valida assinatura do Meta (descomente em produção)
  if (APP_SECRET) {
    const ok = await validarAssinaturaMeta(rawBody, signature, APP_SECRET);
    if (!ok) {
      console.warn("Assinatura inválida do Meta");
      return new Response("Invalid signature", { status: 401 });
    }
  }

  let body: any;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return new Response("Bad JSON", { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // Estrutura: { entry: [{ id, time, changes: [{ field: "leadgen", value: { leadgen_id, page_id, form_id, created_time } }] }] }
  const entries = body.entry ?? [];
  let processados = 0;
  let ignorados = 0;
  let erros = 0;

  for (const entry of entries) {
    for (const change of entry.changes ?? []) {
      if (change.field !== "leadgen") {
        ignorados++;
        continue;
      }

      const value = change.value;
      const leadgenId = value?.leadgen_id;
      if (!leadgenId) {
        ignorados++;
        continue;
      }

      try {
        // Busca os dados do lead via Graph API
        const metaLead = await buscarLeadDoMeta(leadgenId, PAGE_ACCESS_TOKEN);
        if (!metaLead) {
          erros++;
          await registrarEvento(supabase, null, "meta_lead_falha_graph", {
            leadgen_id: leadgenId,
          });
          continue;
        }

        const norm = normalizarLeadDoMeta(metaLead);
        if (!norm) {
          erros++;
          await registrarEvento(supabase, null, "meta_lead_normalize_falhou", {
            leadgen_id: leadgenId,
            field_data: metaLead.field_data,
          });
          continue;
        }

        // Deduplica por leadgen_id (campo armazenado em raw_meta no insert)
        // (simples — se quiser, adicione coluna leadgen_id em leads e use UNIQUE)
        const { data: existente } = await supabase
          .from("leads")
          .select("id")
          .eq("telefone", norm.telefone)
          .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .maybeSingle();

        if (existente) {
          ignorados++;
          await registrarEvento(supabase, existente.id, "meta_lead_duplicado", {
            leadgen_id: leadgenId,
          });
          continue;
        }

        // Insere — isso dispara on-new-lead via Database Webhook
        const { error } = await supabase.from("leads").insert({
          nome: norm.nome,
          telefone: norm.telefone,
          tipo_de_processo: norm.tipo_de_processo,
          origem: `meta_lead_ads:${value.form_id ?? "?"}`,
        });

        if (error) {
          erros++;
          await registrarEvento(supabase, null, "meta_lead_insert_falhou", {
            leadgen_id: leadgenId,
            erro: error.message,
          });
        } else {
          processados++;
          await registrarEvento(supabase, null, "meta_lead_recebido", {
            leadgen_id: leadgenId,
            form_id: value.form_id,
            page_id: value.page_id,
            raw_meta: norm.raw_meta,
          });
        }
      } catch (err) {
        erros++;
        console.error("Erro processando lead Meta:", err);
      }
    }
  }

  return new Response(
    JSON.stringify({ ok: true, processados, ignorados, erros }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
});
