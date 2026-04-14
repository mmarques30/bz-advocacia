import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Fonte unica para a lista de advogadas do escritorio.
 *
 * Le `profiles` onde `is_advogada = true AND ativo = true` (coluna
 * introduzida na Fase A do refactor — ver docs/migracao-advogadas-hardcoded.md).
 *
 * Enquanto a migracao Fase A nao esta aplicada em todos os ambientes,
 * o hook tem um fallback defensivo: se a query retorna zero linhas,
 * ele tenta novamente com o filtro legado (nome ILIKE 'Juliana%' /
 * 'Eliziane%'). Isso permite um deploy sem downtime.
 */
export interface Advogada {
  id: string;
  nome_completo: string;
  /** Primeiro nome em minusculas, usado como chave estavel para os mapas legados. */
  apelido: string;
  /** Mapeamento para as chaves legadas do tipo AdvogadaResponsavel (juliana/liziane). */
  legacy_key: "juliana" | "liziane" | null;
}

function normalizeApelido(nomeCompleto: string): string {
  return nomeCompleto
    .trim()
    .split(/\s+/)[0]
    ?.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") ?? "";
}

function deriveLegacyKey(apelido: string): Advogada["legacy_key"] {
  if (apelido.startsWith("juliana")) return "juliana";
  if (apelido.startsWith("eliziane") || apelido.startsWith("liziane")) return "liziane";
  return null;
}

function mapRow(p: { id: string; nome_completo: string }): Advogada {
  const apelido = normalizeApelido(p.nome_completo);
  return {
    id: p.id,
    nome_completo: p.nome_completo,
    apelido,
    legacy_key: deriveLegacyKey(apelido),
  };
}

export function useAdvogadas() {
  return useQuery({
    queryKey: ["advogadas"],
    queryFn: async () => {
      // Caminho novo: fonte unica via coluna is_advogada.
      const { data: novos, error: errNovos } = await supabase
        .from("profiles")
        .select("id, nome_completo")
        .eq("is_advogada", true)
        .eq("ativo", true)
        .order("nome_completo");

      if (!errNovos && novos && novos.length > 0) {
        return novos.map(mapRow);
      }

      // Fallback: se a coluna ainda nao existe ou a migracao nao rodou,
      // cai no filtro legado para preservar o comportamento atual.
      const { data: legacy, error: errLegacy } = await supabase
        .from("profiles")
        .select("id, nome_completo")
        .or("nome_completo.ilike.Juliana%,nome_completo.ilike.Eliziane%")
        .eq("ativo", true)
        .order("nome_completo");

      if (errLegacy) return [];
      return (legacy ?? []).map(mapRow);
    },
    staleTime: 1000 * 60 * 10,
  });
}
