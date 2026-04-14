/**
 * Helpers para resolver o label de exibicao de uma despesa, normalizando
 * entre os codigos que viram do banco (subcategoria_codigo,
 * categoria_codigo) e o enum CategoriaDespesa usado pelo frontend.
 *
 * Este modulo existe porque o bug "Despesas por Categoria mostrando so
 * Outros" veio de dois layers: o grafico agrupava por codigo bruto e
 * depois colapsava tudo em 'outros' no mapa. Agora centralizamos a
 * resolucao do label num lugar so, pure function e testavel.
 */

import { CATEGORIA_DESPESA_LABELS, type CategoriaDespesa } from "@/types/financeiro";

const CODIGO_PARA_ENUM: Record<string, CategoriaDespesa> = {
  aluguel: "aluguel_condominio",
  salarios: "salarios_encargos",
  honorarios: "honorarios_terceiros",
  marketing: "marketing_publicidade",
  materiais: "materiais_expediente",
  telefonia: "telefonia_internet",
  software: "software_licencas",
  energia: "energia_agua",
  impostos: "impostos_taxas",
};

/**
 * Mapeia um codigo bruto (vindo do DB) para o enum CategoriaDespesa.
 * Retorna 'outros' quando nao ha mapeamento conhecido.
 */
export function mapCategoriaCodigo(codigo: string | null): CategoriaDespesa {
  return CODIGO_PARA_ENUM[(codigo || "").toLowerCase().trim()] || "outros";
}

function toTitleCase(raw: string): string {
  return raw
    .replace(/_/g, " ")
    .split(" ")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ""))
    .join(" ")
    .trim();
}

/**
 * Resolve um codigo bruto (subcategoria ou categoria) para um label
 * legivel, preservando o significado quando possivel.
 *
 * Ordem de resolucao:
 *   1. Se o codigo mapeia para uma CategoriaDespesa conhecida (aluguel,
 *      salarios, etc.), retorna o label oficial ("Aluguel e Condomínio").
 *   2. Se o codigo e "outros" explicitamente, retorna "Outros".
 *   3. Para qualquer outro codigo (subcategoria custom como "juliana",
 *      "operacional", "cartao_credito"), retorna o proprio codigo em
 *      Title Case.
 *
 * Isso garante que o grafico "Despesas por Categoria" mostre rotulos
 * distintos por subcategoria real do DB, em vez de colapsar todas em
 * fatias genericas "Outros".
 */
export function resolveCategoriaLabel(codigo: string | null): string {
  const raw = (codigo || "").trim().toLowerCase();
  if (!raw) return "Outros";

  const enumKey = mapCategoriaCodigo(raw);
  if (enumKey !== "outros") {
    return CATEGORIA_DESPESA_LABELS[enumKey];
  }
  if (raw === "outros") {
    return CATEGORIA_DESPESA_LABELS.outros;
  }

  const title = toTitleCase(raw);
  return title || "Outros";
}
