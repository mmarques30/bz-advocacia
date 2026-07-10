// Reativa o bot Claudia para um contato específico:
// remove o número de numeros_bloqueados_bot (match pelos últimos 8 dígitos)
// e grava evento de auditoria em eventos_sdr com o solicitante.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface Body {
  telefone: string;
  motivo: string;
  contato_id?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return json({ error: "unauthorized" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Client com JWT do usuário para descobrir quem é
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) return json({ error: "unauthorized" }, 401);
    const userId = userData.user.id;

    // Service client para checar role e mutar tabelas restritas
    const admin = createClient(supabaseUrl, serviceKey);
    const { data: roles } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    const isAdmin = (roles ?? []).some((r: any) => r.role === "admin");
    if (!isAdmin) return json({ error: "forbidden" }, 403);

    const body = (await req.json()) as Body;
    if (!body?.telefone || !body?.motivo) {
      return json({ error: "telefone e motivo obrigatorios" }, 400);
    }

    const digits = String(body.telefone).replace(/\D/g, "");
    if (digits.length < 8) return json({ error: "telefone invalido" }, 400);
    const tel8 = digits.slice(-8);

    // Remove todas as linhas cujo telefone termina nos mesmos 8 dígitos
    const { data: alvos, error: selErr } = await admin
      .from("numeros_bloqueados_bot")
      .select("id, telefone");
    if (selErr) throw selErr;

    const idsRemover = (alvos ?? [])
      .filter((r: any) => String(r.telefone).replace(/\D/g, "").slice(-8) === tel8)
      .map((r: any) => r.id);

    let linhasRemovidas = 0;
    if (idsRemover.length > 0) {
      const { error: delErr, count } = await admin
        .from("numeros_bloqueados_bot")
        .delete({ count: "exact" })
        .in("id", idsRemover);
      if (delErr) throw delErr;
      linhasRemovidas = count ?? idsRemover.length;
    }

    await admin.from("eventos_sdr").insert({
      tipo: "bot_reativado_manual",
      payload: {
        telefone_8: tel8,
        motivo: body.motivo,
        contato_id: body.contato_id ?? null,
        solicitante_user_id: userId,
        linhas_removidas: linhasRemovidas,
      },
    });

    return json({ ok: true, linhas_removidas: linhasRemovidas }, 200);
  } catch (err: any) {
    return json({ error: err?.message ?? "erro" }, 500);
  }
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
