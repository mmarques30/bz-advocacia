import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Fetch all transacoes for a given year (or all if null)
function useTransacoesPorAno(ano: number | null) {
  return useQuery({
    queryKey: ["visao-geral-transacoes", ano],
    queryFn: async () => {
      let query = supabase
        .from("transacoes_financeiras")
        .select("*")
        .order("data_transacao", { ascending: true });

      if (ano) {
        query = query.eq("ano", ano);
      }

      const { data, error } = await query.limit(10000);
      if (error) throw error;
      return data || [];
    },
  });
}

export function useVisaoGeralKPIs(ano: number | null) {
  const { data: transacoes, isLoading } = useTransacoesPorAno(ano);

  const kpis = (() => {
    if (!transacoes) return null;

    const receitas = transacoes
      .filter((t: any) => t.tipo_codigo === "receita")
      .reduce((s: number, t: any) => s + Number(t.valor), 0);

    const despesasPJ = transacoes
      .filter((t: any) => t.tipo_codigo === "despesa" && t.categoria_codigo === "pj")
      .reduce((s: number, t: any) => s + Number(t.valor), 0);

    const resultado = receitas - despesasPJ;

    const receitasCount = transacoes.filter((t: any) => t.tipo_codigo === "receita").length;
    const ticketMedio = receitasCount > 0 ? receitas / receitasCount : 0;

    return { receitas, despesasPJ, resultado, ticketMedio, receitasCount };
  })();

  return { data: kpis, isLoading };
}

export function useReceitasDespesasMensal(ano: number | null) {
  const { data: transacoes, isLoading } = useTransacoesPorAno(ano);

  const chartData = (() => {
    if (!transacoes) return [];

    const mesesNomes = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

    return mesesNomes.map((nome, idx) => {
      const mes = idx + 1;
      const doMes = transacoes.filter((t: any) => t.mes === mes);

      const receitas = doMes
        .filter((t: any) => t.tipo_codigo === "receita")
        .reduce((s: number, t: any) => s + Number(t.valor), 0);

      const despesas = doMes
        .filter((t: any) => t.tipo_codigo === "despesa" && t.categoria_codigo === "pj")
        .reduce((s: number, t: any) => s + Number(t.valor), 0);

      return { mes: nome, receitas, despesas, resultado: receitas - despesas };
    });
  })();

  return { data: chartData, isLoading };
}

const CATEGORIA_MAP: Record<string, string> = {
  "Aluguel": "Aluguel",
  "Cartão de Crédito": "Cartão de Crédito",
  "Tecnologia/IA": "Tecnologia/IA",
  "Marketing": "Marketing",
  "Impostos": "Impostos",
  "Folha de Pagamento": "Folha de Pagamento",
  "Energia": "Outros",
  "Telefonia": "Outros",
  "Estacionamento": "Outros",
  "Serviços": "Outros",
  "Contabilidade": "Outros",
  "Custas Processuais": "Outros",
};

function extrairCategoriaDaDescricao(descricao: string): string {
  // Parse "(Categoria)" from description
  const match = descricao.match(/\(([^)]+)\)$/);
  if (!match) return "Outros";
  const cat = match[1];
  return CATEGORIA_MAP[cat] || "Outros";
}

export function useDespesasPorCategoria(ano: number | null) {
  const { data: transacoes, isLoading } = useTransacoesPorAno(ano);

  const chartData = (() => {
    if (!transacoes) return [];

    const despesasPJ = transacoes.filter(
      (t: any) => t.tipo_codigo === "despesa" && t.categoria_codigo === "pj"
    );

    const categorias = new Map<string, number>();

    for (const d of despesasPJ) {
      const cat = extrairCategoriaDaDescricao(d.descricao || "");
      categorias.set(cat, (categorias.get(cat) || 0) + Number(d.valor));
    }

    return Array.from(categorias.entries())
      .map(([categoria, valor]) => ({ categoria, valor }))
      .sort((a, b) => b.valor - a.valor);
  })();

  return { data: chartData, isLoading };
}

export function useDistribuicaoSocia(ano: number | null, conta: string) {
  const { data: transacoes, isLoading } = useTransacoesPorAno(ano);

  const result = (() => {
    if (!transacoes) return null;

    const contaFilter = conta === "eliziane" ? "liziane" : conta;

    const receitas = transacoes
      .filter((t: any) => t.tipo_codigo === "receita" && t.conta === contaFilter)
      .reduce((s: number, t: any) => s + Number(t.valor), 0);

    const despesasPF = transacoes
      .filter((t: any) => t.tipo_codigo === "despesa" && t.conta === contaFilter)
      .reduce((s: number, t: any) => s + Number(t.valor), 0);

    const receitasList = transacoes
      .filter((t: any) => t.tipo_codigo === "receita" && t.conta === contaFilter)
      .map((t: any) => ({
        id: t.id,
        descricao: t.descricao,
        valor: Number(t.valor),
        data: t.data_transacao,
      }));

    const despesasList = transacoes
      .filter((t: any) => t.tipo_codigo === "despesa" && t.conta === contaFilter)
      .map((t: any) => ({
        id: t.id,
        descricao: t.descricao,
        valor: Number(t.valor),
        data: t.data_transacao,
      }));

    return {
      receitas,
      despesasPF,
      liquido: receitas - despesasPF,
      receitasList,
      despesasList,
    };
  })();

  return { data: result, isLoading };
}

export function useResultadoMensal(ano: number | null) {
  const { data: chartData, isLoading } = useReceitasDespesasMensal(ano);

  const result = (() => {
    if (!chartData || chartData.length === 0) return null;

    const totalReceitas = chartData.reduce((s, d) => s + d.receitas, 0);
    const totalDespesas = chartData.reduce((s, d) => s + d.despesas, 0);
    const lucro = totalReceitas - totalDespesas;

    const melhorMes = chartData.reduce(
      (best, d) => (d.resultado > best.valor ? { mes: d.mes, valor: d.resultado } : best),
      { mes: "", valor: -Infinity }
    );

    return { totalReceitas, totalDespesas, lucro, melhorMes, dados: chartData };
  })();

  return { data: result, isLoading };
}

export function useParcelasProximas(contaFilter?: string) {
  return useQuery({
    queryKey: ["parcelas-proximas", contaFilter],
    queryFn: async () => {
      let query = supabase
        .from("parcelas_financeiras")
        .select(`
          id, acordo_id, numero_parcela, valor, data_vencimento, status, data_pagamento,
          acordos_financeiros!inner(cliente_id, conta, contact_submissions!inner(nome_completo))
        `)
        .in("status", ["pendente", "atrasado"])
        .order("data_vencimento", { ascending: true })
        .limit(20);

      if (contaFilter && contaFilter !== "todas") {
        const contaValue = contaFilter === "eliziane" ? "liziane" : contaFilter;
        query = query.eq("acordos_financeiros.conta", contaValue);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map((p: any) => ({
        id: p.id,
        acordo_id: p.acordo_id,
        numero_parcela: p.numero_parcela,
        valor: Number(p.valor),
        data_vencimento: p.data_vencimento,
        status: p.status,
        cliente_nome: p.acordos_financeiros?.contact_submissions?.nome_completo || "—",
        conta: p.acordos_financeiros?.conta || "escritorio",
      }));
    },
  });
}

export function useInadimplencia() {
  return useQuery({
    queryKey: ["inadimplencia-count"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("parcelas_financeiras")
        .select("id, valor")
        .eq("status", "atrasado");

      if (error) throw error;
      const count = data?.length || 0;
      const total = (data || []).reduce((s: number, p: any) => s + Number(p.valor), 0);
      return { count, total };
    },
  });
}
