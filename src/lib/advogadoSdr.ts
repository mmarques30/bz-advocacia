import { supabase } from "@/integrations/supabase/client";

/**
 * Resolve qual advogado_id (advogados_sdr) representa o usuário logado.
 * Prioridade:
 *   1) advogados_sdr.user_id == auth.uid()
 *   2) advogados_sdr.email == auth.users.email (e faz backfill do user_id)
 *   3) Auto-onboard: cria registro novo em advogados_sdr usando dados do auth + profile
 *   4) Fallback: primeiro advogado com 'geral' nas areas
 *   5) Fallback final: qualquer advogado ativo
 */
export async function resolverAdvogadoId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    // 1) match direto por user_id
    const { data: porUserId } = await (supabase as any)
      .from("advogados_sdr")
      .select("id")
      .eq("user_id", user.id)
      .eq("ativo", true)
      .maybeSingle();
    if (porUserId?.id) return porUserId.id as string;

    // 2) match por email (e faz backfill do user_id)
    if (user.email) {
      const { data: porEmail } = await supabase
        .from("advogados_sdr" as any)
        .select("id")
        .eq("email", user.email)
        .eq("ativo", true)
        .maybeSingle();
      if (porEmail && (porEmail as any).id) {
        // backfill best-effort
        await supabase
          .from("advogados_sdr" as any)
          .update({ user_id: user.id } as any)
          .eq("id", (porEmail as any).id);
        return (porEmail as any).id;
      }
    }

    // 3) Auto-onboard: cria registro com dados do profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("nome_completo")
      .eq("id", user.id)
      .maybeSingle();

    const nome = profile?.nome_completo || user.email?.split("@")[0] || "Atendente";
    const { data: novo, error: errInsert } = await supabase
      .from("advogados_sdr" as any)
      .insert({
        user_id: user.id,
        nome,
        email: user.email ?? null,
        areas: ["geral"],
        ativo: true,
      } as any)
      .select("id")
      .maybeSingle();
    if (!errInsert && novo && (novo as any).id) return (novo as any).id;
  }

  // 4) Fallback geral
  const { data: geral } = await supabase
    .from("advogados_sdr" as any)
    .select("id, areas")
    .contains("areas", ["geral"] as any)
    .eq("ativo", true)
    .limit(1)
    .maybeSingle();
  if (geral && (geral as any).id) return (geral as any).id;

  // 5) Fallback final: qualquer ativo
  const { data: qualquer } = await supabase
    .from("advogados_sdr" as any)
    .select("id")
    .eq("ativo", true)
    .limit(1)
    .maybeSingle();
  return (qualquer as any)?.id ?? null;
}
