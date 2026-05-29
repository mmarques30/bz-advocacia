import { useMemo } from "react";
import { useOpcoesSistema } from "@/hooks/useOpcoesSistema";
import { CATEGORIA_DESPESA_LABELS } from "@/types/financeiro";
import { resolveCategoriaLabel } from "@/lib/categoriaDespesa";

/**
 * Fonte UNICA de categorias de despesa para selects, filtros e exibicao.
 *
 * - `options`: lista vinda da tabela `opcoes_sistema` (grupo
 *   `categoria_despesa`), ja em ordem alfabetica pt-BR.
 * - `getLabel(valor)`: resolve qualquer codigo de categoria para um label
 *   amigavel. Prioriza o cadastro do banco, cai pro enum legado
 *   (`CATEGORIA_DESPESA_LABELS`) e por fim para o helper generico.
 *
 * NUNCA usar `CATEGORIA_DESPESA_LABELS` diretamente em selects/filtros —
 * isso causa divergencia entre Novo e Editar (lista de categorias diferente).
 */
export function useCategoriasDespesa() {
  const { data, isLoading } = useOpcoesSistema("categoria_despesa", true);

  return useMemo(() => {
    const fromDb = (data ?? []).map((o) => ({ value: o.valor, label: o.label }));
    const sorted = [...fromDb].sort((a, b) =>
      a.label.localeCompare(b.label, "pt-BR")
    );

    const dbMap = new Map(sorted.map((o) => [o.value, o.label] as const));

    const getLabel = (valor: string | null | undefined): string => {
      if (!valor) return "—";
      const fromBank = dbMap.get(valor);
      if (fromBank) return fromBank;
      const fromEnum = (CATEGORIA_DESPESA_LABELS as Record<string, string>)[valor];
      if (fromEnum) return fromEnum;
      return resolveCategoriaLabel(valor);
    };

    return {
      options: sorted,
      getLabel,
      isLoading,
    };
  }, [data, isLoading]);
}
