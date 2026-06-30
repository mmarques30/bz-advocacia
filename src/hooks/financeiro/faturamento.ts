/**
 * Hooks de faturamento: maiores pagadores e detalhamento.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/lib/toast";
import { format, subMonths, differenceInDays, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import type { FaturamentoFiltersState } from "@/components/financeiro/FaturamentoFilters";
import { getDateRangeFromFilters } from "./_shared";

import type { MaiorPagador } from "@/types/financeiro";

export function useMaioresPagadores(limite: number = 5) {
  return useQuery({
    queryKey: ["maiores-pagadores", limite],
    queryFn: async (): Promise<MaiorPagador[]> => {
      const { data, error } = await supabase
        .from("parcelas_financeiras")
        .select(`
          *,
          acordo:acordos_financeiros!acordo_id(
            id,
            cliente:contact_submissions!cliente_id(id, nome_completo)
          )
        `)
        .eq("status", "pago");

      if (error) throw error;

      // Agrupar por cliente
      const clientesMap: Record<string, { nome: string; total: number; quantidade: number }> = {};

      (data || []).forEach(p => {
        const cliente = (p.acordo as any)?.cliente?.[0];
        if (!cliente) return;

        if (!clientesMap[cliente.id]) {
          clientesMap[cliente.id] = {
            nome: cliente.nome_completo,
            total: 0,
            quantidade: 0,
          };
        }

        clientesMap[cliente.id].total += p.valor_pago || 0;
        clientesMap[cliente.id].quantidade += 1;
      });

      return Object.entries(clientesMap)
        .map(([id, dados]) => ({
          cliente_id: id,
          cliente_nome: dados.nome,
          total_pago: dados.total,
          quantidade_pagamentos: dados.quantidade,
        }))
        .sort((a, b) => b.total_pago - a.total_pago)
        .slice(0, limite);
    },
  });
}

// Hook para buscar faturamento detalhado (receitas realizadas).
//
// Origem dupla, unificada aqui pra que a tabela de Lançamentos mostre a
// MESMA receita realizada que os KPIs:
//   - `transacao`: linhas de transacoes_financeiras (tipo receita) — vindas
//     de import CSV ou criadas manualmente.
//   - `contrato`: parcelas pagas (parcelas_financeiras.status = 'pago') que
//     ainda NÃO foram espelhadas em transacoes_financeiras.
//
// Por que a parte de parcelas existe: ao pagar uma parcela, um trigger no
// banco espelha a receita em transacoes_financeiras. Mas se esse espelho
// não existe (trigger não aplicado, ou a tabela de transações foi limpa
// pelo botão "Limpar transações"), a receita continua viva em
// parcelas_financeiras e os KPIs a contam — porém a tabela ficava vazia.
// Isso causava o sintoma "tem valor lançado mas não aparece na tabela".
//
// Dedup: parcelas cujo id aparece em transacoes.origem_parcela_id já estão
// representadas pela linha `transacao`, então são puladas (sem duplicar).
type FaturamentoSource = "transacao" | "contrato";

interface FaturamentoDetalhadoItem {
  id: string;
  source: FaturamentoSource;
  data: string | null;
  descricao: string | null;
  categoria: string | null;
  subcategoria: string | null;
  valor: number;
  conta: string | null;
  acordo_id?: string | null;
}

const dentroDoPeriodo = (
  dataIso: string | null | undefined,
  inicio: Date | null,
  fim: Date | null,
): boolean => {
  if (!dataIso) return false;
  if (!inicio && !fim) return true;
  const data = new Date(dataIso);
  if (inicio && data < inicio) return false;
  if (fim && data > fim) return false;
  return true;
};

export function useFaturamentoDetalhado(filters?: FaturamentoFiltersState) {
  return useQuery({
    queryKey: ["faturamento-detalhado", filters],
    queryFn: async (): Promise<FaturamentoDetalhadoItem[]> => {
      const { inicio, fim } = getDateRangeFromFilters(filters);

      // 1) Receitas em transacoes_financeiras (import/manual + espelhos).
      const { data: transacoes, error } = await supabase
        .from("transacoes_financeiras")
        .select("*")
        .order("data_transacao", { ascending: false })
        .limit(10000);

      if (error) throw error;

      const receitas = (transacoes || []).filter(t => {
        const tipoReceita = t.tipo_codigo === "receita" || t.tipo_codigo === "REC";
        if (!tipoReceita) return false;
        return dentroDoPeriodo(t.data_transacao, inicio, fim);
      });

      // Parcelas que já têm espelho em transacoes — não devem ser contadas
      // de novo a partir de parcelas_financeiras.
      const parcelasEspelhadas = new Set(
        (transacoes || [])
          .map(t => (t as any).origem_parcela_id as string | null | undefined)
          .filter((id): id is string => !!id),
      );

      const itensTransacoes: FaturamentoDetalhadoItem[] = receitas.map(t => ({
        id: t.id,
        source: "transacao" as const,
        data: t.data_transacao,
        descricao: t.descricao,
        categoria: t.categoria_codigo,
        subcategoria: t.subcategoria_codigo,
        valor: t.valor || 0,
        conta: t.conta || null,
        // Campos completos para edição (somente faz sentido p/ transações).
        mes: t.mes,
        ano: t.ano,
        mes_nome: t.mes_nome,
        tipo_codigo: t.tipo_codigo,
        categoria_codigo: t.categoria_codigo,
        subcategoria_codigo: t.subcategoria_codigo,
        data_transacao: t.data_transacao,
        created_at: t.created_at,
      }));

      // 2) Parcelas pagas (receita realizada vinda de contratos) que ainda
      //    não estão espelhadas em transacoes_financeiras.
      const { data: parcelasPagas, error: parcelasError } = await supabase
        .from("parcelas_financeiras")
        .select(`
          id,
          acordo_id,
          numero_parcela,
          valor,
          valor_pago,
          data_pagamento,
          status,
          acordo:acordos_financeiros!acordo_id(
            id,
            tipo_servico,
            conta,
            cliente:contact_submissions!cliente_id(nome_completo)
          )
        `)
        .eq("status", "pago")
        .limit(10000);

      if (parcelasError) throw parcelasError;

      const itensParcelas: FaturamentoDetalhadoItem[] = (parcelasPagas || [])
        .filter(p => !parcelasEspelhadas.has(p.id))
        .filter(p => dentroDoPeriodo(p.data_pagamento, inicio, fim))
        .map(p => {
          const acordo = Array.isArray((p as any).acordo)
            ? (p as any).acordo[0]
            : (p as any).acordo;
          const cliente = Array.isArray(acordo?.cliente)
            ? acordo?.cliente[0]
            : acordo?.cliente;
          const servico = acordo?.tipo_servico || "Contrato";
          return {
            id: `parcela:${p.id}`,
            source: "contrato" as const,
            data: p.data_pagamento,
            descricao: `${servico} — parcela ${p.numero_parcela}`,
            categoria: "Contrato",
            subcategoria: cliente?.nome_completo || null,
            valor: Number(p.valor_pago ?? p.valor ?? 0),
            conta: acordo?.conta || null,
            acordo_id: p.acordo_id,
          };
        });

      return [...itensTransacoes, ...itensParcelas].sort((a, b) => {
        const da = a.data ? new Date(a.data).getTime() : 0;
        const db = b.data ? new Date(b.data).getTime() : 0;
        return db - da;
      });
    },
  });
}

// Hook para buscar receitas recentes
