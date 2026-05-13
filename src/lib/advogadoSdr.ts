import { supabase } from "@/integrations/supabase/client";

/**
 * Resolve qual advogado_id (advogados_sdr) representa o usuário logado.
 * Estratégia em cascata:
 *   a) email do auth.users == advogados_sdr.email (ativo=true)
 *   b) primeiro advogado com 'geral' nas areas
 *   c) qualquer advogado ativo
 */
export async function resolverAdvogadoId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();

  if (user?.email) {
    const { data: meu } = await supabase
      .from("advogados_sdr" as any)
      .select("id")
      .eq("email", user.email)
      .eq("ativo", true)
      .maybeSingle();
    if (meu && (meu as any).id) return (meu as any).id;
  }

  const { data: geral } = await supabase
    .from("advogados_sdr" as any)
    .select("id, areas")
    .contains("areas", ["geral"] as any)
    .eq("ativo", true)
    .limit(1)
    .maybeSingle();
  if (geral && (geral as any).id) return (geral as any).id;

  const { data: qualquer } = await supabase
    .from("advogados_sdr" as any)
    .select("id")
    .eq("ativo", true)
    .limit(1)
    .maybeSingle();
  return (qualquer as any)?.id ?? null;
}
