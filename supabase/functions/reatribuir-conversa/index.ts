// Edge Function: reatribuir-conversa
// Permite que o responsável atual (ou um admin) reatribua o lead para
// outro advogado ou devolva ao pool (humano_responsavel = null).

import { createClient } from "jsr:@supabase/supabase-js@2";
import { getSupabaseAdmin, registrarEvento } from "../_shared/db.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface Payload {
  lead_id: string;
  novo_responsavel_id: string | null;
  motivo?: string;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return json({ error: "unauthorized" }, 401);

  // Valida JWT
  const userClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const token = authHeader.replace("Bearer ", "");
  const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(token);
  if (claimsErr || !claimsData?.claims?.sub) return json({ error: "unauthorized" }, 401);
  const solicitanteUserId = claimsData.claims.sub as string;

  let body: Payload;
  try { body = await req.json(); } catch { return json({ error: "bad_json" }, 400); }

  const { lead_id, novo_responsavel_id, motivo } = body;
  if (!lead_id) return json({ error: "lead_id_obrigatorio" }, 400);
  if (novo_responsavel_id !== null && typeof novo_responsavel_id !== "string") {
    return json({ error: "novo_responsavel_id_invalido" }, 400);
  }

  const admin = getSupabaseAdmin();

  // Estado atual do lead
  const { data: lead, error: errLead } = await admin
    .from("leads_geral")
    .select("id, humano_responsavel")
    .eq("id", lead_id)
    .maybeSingle();
  if (errLead || !lead) return json({ error: "lead_nao_encontrado" }, 404);

  // É admin?
  const { data: roles } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", solicitanteUserId);
  const isAdmin = (roles ?? []).some((r: any) => r.role === "admin");

  // advogado_id do solicitante (para checar se é o responsável atual)
  const { data: advSolic } = await admin
    .from("advogados_sdr")
    .select("id")
    .eq("user_id", solicitanteUserId)
    .eq("ativo", true)
    .maybeSingle();

  const ehResponsavelAtual = !!(advSolic?.id && lead.humano_responsavel && advSolic.id === lead.humano_responsavel);

  if (!isAdmin && !ehResponsavelAtual) {
    return json({ error: "sem_permissao_reatribuir" }, 403);
  }

  // Valida novo responsável (se informado)
  if (novo_responsavel_id) {
    const { data: advNovo } = await admin
      .from("advogados_sdr")
      .select("id, ativo")
      .eq("id", novo_responsavel_id)
      .maybeSingle();
    if (!advNovo || !advNovo.ativo) return json({ error: "novo_responsavel_invalido" }, 400);
  }

  const responsavelAnterior = lead.humano_responsavel as string | null;

  const novoStatus = novo_responsavel_id ? "assumido_humano" : "aguardando_triagem";
  const patch: Record<string, unknown> = {
    humano_responsavel: novo_responsavel_id,
    status_sdr: novoStatus,
  };
  // Se devolveu pro pool, despausa o bot pra ele poder voltar a interagir
  if (!novo_responsavel_id) patch.bot_pausado = false;

  const { error: errUpd } = await admin
    .from("leads_geral")
    .update(patch)
    .eq("id", lead_id);
  if (errUpd) return json({ error: "erro_update", detail: errUpd.message }, 500);

  await registrarEvento(admin, lead_id, "lead_reatribuido", {
    de: responsavelAnterior,
    para: novo_responsavel_id,
    solicitante: solicitanteUserId,
    motivo: (motivo ?? "").trim() || null,
  });

  return json({
    ok: true,
    responsavel_anterior: responsavelAnterior,
    responsavel_novo: novo_responsavel_id,
    status_sdr: novoStatus,
  });
});
