// Edge Function: whatsapp-sync-chat
// On-demand: chamado pelo painel ao abrir uma conversa.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { syncLeadZapi } from "../_shared/zapi-sync.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: { lead_id?: string; limit?: number };
  try { body = await req.json(); } catch {
    return new Response(JSON.stringify({ error: "bad_json" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!body.lead_id || typeof body.lead_id !== "string") {
    return new Response(JSON.stringify({ error: "lead_id_obrigatorio" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const limit = Math.min(Math.max(body.limit ?? 40, 5), 100);
  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const res = await syncLeadZapi(sb, body.lead_id, limit);
    return new Response(JSON.stringify({ ok: true, ...res }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[whatsapp-sync-chat] erro:", e);
    return new Response(JSON.stringify({ ok: false, error: String((e as Error).message ?? e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
