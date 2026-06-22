/**
 * Historico Financeiro Unificado
 *
 * Antes a aba Historico do Financeiro lia so de transacoes_financeiras,
 * que esta vazia (apenas importacoes legadas). Como as despesas atuais
 * sao gravadas em `despesas` e os recebiveis pagos em
 * `parcelas_financeiras`, a aba mostrava "nada" mesmo com lancamentos
 * recentes.
 *
 * Este hook mescla as 3 fontes em um shape TransacaoFinanceira-compativel
 * pra reaproveitar o componente HistoricoTable sem mudar a UI.
 *  - `despesas`           → tipo_codigo='despesa'
 *  - `parcelas_financeiras` (status='pago') → tipo_codigo='receita'
 *  - `transacoes_financeiras` (legacy)      → mantem como esta
 */
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import type { TransacaoFinanceira, TransacoesFilters } from "@/types/transacoes";

const MESES_PT = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

function isoToParts(iso: string | null | undefined) {
  if (!iso) return { mes: 0, ano: 0, mes_nome: null as string | null };
  const d = new Date(iso);
  return {
    mes: d.getMonth() + 1,
    ano: d.getFullYear(),
    mes_nome: MESES_PT[d.getMonth()],
  };
}

export function useHistoricoUnificado(filters: TransacoesFilters = {}) {
  return useQuery({
    queryKey: ["historico-unificado", filters],
    queryFn: async (): Promise<TransacaoFinanceira[]> => {
      const dataInicioIso = filters.dataInicio ? format(filters.dataInicio, "yyyy-MM-dd") : null;
      const dataFimIso = filters.dataFim ? format(filters.dataFim, "yyyy-MM-dd") : null;

      // --- 1) transacoes_financeiras (legacy / importacoes)
      let qTr = supabase
        .from("transacoes_financeiras")
        .select("*")
        .order("data_transacao", { ascending: false });
      if (dataInicioIso) qTr = qTr.gte("data_transacao", dataInicioIso);
      if (dataFimIso) qTr = qTr.lte("data_transacao", dataFimIso);
      if (filters.anos?.length && !dataInicioIso && !dataFimIso) qTr = qTr.in("ano", filters.anos);
      if (filters.tipo_codigo) qTr = qTr.eq("tipo_codigo", filters.tipo_codigo);
      if (filters.categoria_codigo) qTr = qTr.eq("categoria_codigo", filters.categoria_codigo);
      if (filters.conta) qTr = qTr.eq("conta", filters.conta);
      const trPromise = qTr.limit(10000);

      // --- 2) despesas
      let qDesp = supabase
        .from("despesas")
        .select("id, descricao, valor, data, categoria, conta, created_at");
      if (dataInicioIso) qDesp = qDesp.gte("data", dataInicioIso);
      if (dataFimIso) qDesp = qDesp.lte("data", dataFimIso);
      if (filters.categoria_codigo) qDesp = qDesp.eq("categoria", filters.categoria_codigo as any);
      if (filters.conta) qDesp = qDesp.eq("conta", filters.conta);
      const despPromise = qDesp.limit(10000);

      // --- 3) parcelas_financeiras pagas (recebiveis)
      let qParc = supabase
        .from("parcelas_financeiras")
        .select(`
          id,
          valor,
          valor_pago,
          data_pagamento,
          forma_pagamento,
          acordo:acordos_financeiros!inner(id, tipo_servico, conta, cliente:contact_submissions!cliente_id(nome_completo))
        `)
        .eq("status", "pago")
        .not("data_pagamento", "is", null);
      if (dataInicioIso) qParc = qParc.gte("data_pagamento", dataInicioIso);
      if (dataFimIso) qParc = qParc.lte("data_pagamento", dataFimIso);
      const parcPromise = qParc.limit(10000);

      const [trRes, despRes, parcRes] = await Promise.all([trPromise, despPromise, parcPromise]);

      if (trRes.error) throw trRes.error;
      if (despRes.error) throw despRes.error;
      if (parcRes.error) throw parcRes.error;

      const trList = (trRes.data ?? []) as TransacaoFinanceira[];

      const despList: TransacaoFinanceira[] = (despRes.data ?? []).map((d: any) => {
        const parts = isoToParts(d.data);
        return {
          id: d.id,
          mes: parts.mes,
          ano: parts.ano,
          mes_nome: parts.mes_nome,
          tipo_codigo: "despesa",
          categoria_codigo: d.categoria ?? "",
          subcategoria_codigo: "",
          descricao: d.descricao ?? null,
          data_transacao: d.data ?? null,
          valor: Number(d.valor) || 0,
          created_at: d.created_at,
          conta: d.conta ?? null,
        } as TransacaoFinanceira;
      });

      const parcList: TransacaoFinanceira[] = (parcRes.data ?? []).map((p: any) => {
        const parts = isoToParts(p.data_pagamento);
        const acordo = Array.isArray(p.acordo) ? p.acordo[0] : p.acordo;
        const cliente = acordo?.cliente
          ? (Array.isArray(acordo.cliente) ? acordo.cliente[0] : acordo.cliente)
          : null;
        return {
          id: p.id,
          mes: parts.mes,
          ano: parts.ano,
          mes_nome: parts.mes_nome,
          tipo_codigo: "receita",
          categoria_codigo: acordo?.tipo_servico ?? "honorarios",
          subcategoria_codigo: "",
          descricao: cliente?.nome_completo
            ? `Recebido de ${cliente.nome_completo}`
            : "Pagamento de parcela",
          data_transacao: p.data_pagamento ?? null,
          valor: Number(p.valor_pago ?? p.valor) || 0,
          created_at: p.data_pagamento ?? null,
          conta: acordo?.conta ?? null,
        } as TransacaoFinanceira;
      });

      let merged = [...trList, ...despList, ...parcList];

      // Filtros pos-merge que so faz sentido aplicar uniforme
      if (filters.tipo_codigo) {
        merged = merged.filter((t) => t.tipo_codigo === filters.tipo_codigo);
      }
      if (filters.anos?.length && !dataInicioIso && !dataFimIso) {
        merged = merged.filter((t) => filters.anos!.includes(t.ano));
      }

      merged.sort((a, b) => {
        const da = a.data_transacao ? new Date(a.data_transacao).getTime() : 0;
        const db = b.data_transacao ? new Date(b.data_transacao).getTime() : 0;
        return db - da;
      });

      return merged;
    },
  });
}
