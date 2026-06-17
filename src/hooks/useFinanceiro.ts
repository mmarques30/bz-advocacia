/**
 * Financial hooks barrel — RE-EXPORT ONLY.
 *
 * Historico: este arquivo tinha 963+ linhas e 16 hooks misturados.
 * Na Rodada 4 do refactor (2026-04) foi dividido em sub-modulos por
 * dominio em src/hooks/financeiro/. Este barrel continua existindo
 * para que os imports legados (`from "@/hooks/useFinanceiro"`) nao
 * quebrem — nenhum call site precisou ser alterado.
 *
 * Quando escrever codigo NOVO, prefira importar do sub-modulo direto:
 *
 *   import { useKPIsFinanceiros } from "@/hooks/financeiro/kpis";
 *   import { useCreateAcordo } from "@/hooks/financeiro/acordos";
 *
 * Layout:
 *   financeiro/_shared.ts   — helpers compartilhados (getDateRangeFromFilters)
 *   financeiro/kpis.ts      — useKPIsFinanceiros, useProjetadoVsRealizado, useReceitasMesAtual
 *   financeiro/acordos.ts   — useAcordos, useAcordoDetalhes, useCreateAcordo
 *   financeiro/receitas.ts  — useReceitaMensal, useFluxoCaixa, useReceitasRecentes
 *   financeiro/distribuicao.ts — useDistribuicaoTipo, useDistribuicaoTipoAgregado, useTopSubcategorias
 *   financeiro/parcelas.ts  — useParcelasVencendo, useClientesInadimplentes
 *   financeiro/faturamento.ts — useFaturamentoDetalhado, useMaioresPagadores
 */

export {
  useKPIsFinanceiros,
  useProjetadoVsRealizado,
  useReceitasMesAtual,
} from "./financeiro/kpis";

export {
  useAcordos,
  useAcordoDetalhes,
  useCreateAcordo,
  useUpdateAcordo,
} from "./financeiro/acordos";

export {
  useReceitaMensal,
  useFluxoCaixa,
  useReceitasRecentes,
} from "./financeiro/receitas";

export {
  useDistribuicaoTipo,
  useDistribuicaoTipoAgregado,
  useTopSubcategorias,
} from "./financeiro/distribuicao";

export {
  useParcelasVencendo,
  useClientesInadimplentes,
} from "./financeiro/parcelas";

export {
  useFaturamentoDetalhado,
  useMaioresPagadores,
} from "./financeiro/faturamento";
