import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { resolveCategoriaLabel } from "@/lib/categoriaDespesa";

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

/**
 * KPIs agregados da Visao Geral.
 *
 * Rodada 2: tenta chamar a RPC get_visao_geral_kpis (agrega no Postgres).
 * Se a RPC nao estiver disponivel (ambiente sem migration aplicada), cai
 * no fallback client-side via useTransacoesPorAno — que faz a agregacao
 * em JS com `.limit(10000)`.
 */
export function useVisaoGeralKPIs(ano: number | null) {
  const rpcQuery = useQuery({
    queryKey: ["visao-geral-kpis-rpc", ano],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc("get_visao_geral_kpis", {
        _ano: ano ?? null,
      });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      if (!row) return null;
      return {
        receitas: Number(row.receitas) || 0,
        despesasPJ: Number(row.despesas_pj) || 0,
        resultado: Number(row.resultado) || 0,
        ticketMedio: Number(row.ticket_medio) || 0,
        receitasCount: Number(row.receitas_count) || 0,
      };
    },
    retry: false,
  });

  // Se a RPC respondeu (sucesso ou null), usa ela. Se deu erro, cai
  // no caminho legado para preservar o dashboard.
  const usaRpc = !rpcQuery.isError;

  const { data: transacoes, isLoading: legacyLoading } = useTransacoesPorAno(
    usaRpc ? null : ano,
  );

  if (usaRpc) {
    return { data: rpcQuery.data, isLoading: rpcQuery.isLoading };
  }

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

  return { data: kpis, isLoading: legacyLoading };
}

/**
 * Serie mensal de receitas x despesas do ano.
 *
 * Rodada 2: RPC get_receitas_despesas_mensal agrega no banco (retorna
 * 12 linhas sempre, preenchendo zeros para meses sem dados). Fallback
 * client-side preserva comportamento legado.
 */
export function useReceitasDespesasMensal(ano: number | null) {
  const rpcQuery = useQuery({
    queryKey: ["receitas-despesas-mensal-rpc", ano],
    queryFn: async () => {
      if (ano === null) return null;
      const { data, error } = await (supabase as any).rpc(
        "get_receitas_despesas_mensal",
        { _ano: ano },
      );
      if (error) throw error;
      return (data || []).map((row: any) => ({
        mes: row.mes_nome,
        receitas: Number(row.receitas) || 0,
        despesas: Number(row.despesas) || 0,
        resultado: Number(row.resultado) || 0,
      }));
    },
    enabled: ano !== null,
    retry: false,
  });

  const usaRpc = ano !== null && !rpcQuery.isError;
  const { data: transacoes, isLoading: legacyLoading } = useTransacoesPorAno(
    usaRpc ? null : ano,
  );

  if (usaRpc) {
    return {
      data: rpcQuery.data ?? [],
      isLoading: rpcQuery.isLoading,
    };
  }

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

  return { data: chartData, isLoading: legacyLoading };
}

/**
 * Mapa parcial de categorias vindas do padrao legado
 * "... (Categoria)" no final da descricao. As entradas mapeadas para
 * "Outros" sao agrupamentos intencionais do produto — nao sao bugs.
 */
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

/**
 * Heuristica best-effort: dispositivos que conhecemos por substring
 * para nao precisarem do padrao "(...)". Primeira variante contem-se
 * na descricao → reinverte.
 */
const DESCRICAO_KEYWORDS: Array<{ match: RegExp; label: string }> = [
  { match: /cart[ãa]o/i, label: "Cartão de Crédito" },
  { match: /aluguel|condom[íi]nio|auxiliadora/i, label: "Aluguel" },
  { match: /google|gpt|openai|anthropic|apify|meta ads/i, label: "Tecnologia/IA" },
  { match: /meta$|facebook|instagram/i, label: "Marketing" },
  { match: /\bdarf\b|\bdas\b|simples|imposto|irpf|irpj|pis|cofins/i, label: "Impostos" },
  { match: /sal[áa]rio|folha|est[áa]gio|di[áa]rista|elaine/i, label: "Folha de Pagamento" },
  { match: /estapar|estacion/i, label: "Outros" },
  { match: /claro|vivo|tim|oi s\.a\./i, label: "Outros" },
  { match: /ceee|rge|energia/i, label: "Outros" },
  { match: /contabilidade|nexus/i, label: "Outros" },
];

/**
 * Extrai uma categoria legivel da descricao de uma despesa.
 *
 * Ordem de tentativa:
 *   1. Padrao legado "... (Categoria)" no fim → usa CATEGORIA_MAP.
 *   2. Busca keywords na descricao inteira → mapeia para label conhecido.
 *   3. Fallback: retorna a propria descricao (trim + Title Case da
 *      primeira palavra), evitando que todas as despesas sem padrao
 *      colapsem em uma unica fatia "Outros" no grafico.
 */
export function extrairCategoriaDaDescricao(descricao: string): string {
  const desc = (descricao || "").trim();
  if (!desc) return "Outros";

  // 1) Padrao legado
  const match = desc.match(/\(([^)]+)\)$/);
  if (match) {
    const cat = match[1].trim();
    return CATEGORIA_MAP[cat] || "Outros";
  }

  // 2) Keywords
  for (const { match: re, label } of DESCRICAO_KEYWORDS) {
    if (re.test(desc)) return label;
  }

  // 3) Fallback: usa a descricao em si com primeira letra maiuscula.
  //    Limita a ~30 chars para nao poluir o eixo do grafico.
  const normalized = desc.replace(/\s+/g, " ");
  const short = normalized.length > 30 ? `${normalized.slice(0, 28).trim()}…` : normalized;
  return short.charAt(0).toUpperCase() + short.slice(1);
}

/**
 * Especifico da aba Visao Geral: agrupa so despesas PJ pelo ano dado.
 *
 * NOTA de nome: existe um outro hook `useDespesasPorCategoria` em
 * src/hooks/useDespesas.ts que aceita `filters` (periodo + categoria)
 * e alimenta o pie chart da tela principal. Renomeamos este aqui para
 * `useDespesasPJPorCategoria` porque os dois shapes eram incompativeis
 * (numero | null vs. DespesasGlobalFiltersState) e convidavam a um
 * auto-import trocado.
 */
export function useDespesasPJPorCategoria(ano: number | null) {
  const { data: transacoes, isLoading } = useTransacoesPorAno(ano);

  const chartData = (() => {
    if (!transacoes) return [];

    // Inclui tudo que NAO e despesa pessoal (pf). Apos a migration de
    // categorias, o categoria_codigo passou a guardar codigos contabeis
    // especificos (aluguel, marketing, software...) alem do "pj" legado.
    const despesasPJ = transacoes.filter(
      (t: any) => t.tipo_codigo === "despesa" && t.categoria_codigo !== "pf"
    );

    const categorias = new Map<string, number>();

    for (const d of despesasPJ) {
      const codigo = (d.categoria_codigo || "").toLowerCase();
      const cat =
        codigo && codigo !== "pj"
          ? resolveCategoriaLabel(codigo)
          : extrairCategoriaDaDescricao(d.descricao || "");
      categorias.set(cat, (categorias.get(cat) || 0) + Number(d.valor));
    }

    return Array.from(categorias.entries())
      .map(([categoria, valor]) => ({ categoria, valor }))
      .sort((a, b) => b.valor - a.valor);
  })();

  return { data: chartData, isLoading };
}

/**
 * Distribuicao por socia (conta financeira) no ano.
 *
 * Rodada 2: totalizadores (receitas/despesasPF/liquido) vem da RPC
 * get_distribuicao_socia. Os arrays `receitasList` e `despesasList`
 * ainda saem do caminho client-side porque a RPC agrega apenas, nao
 * retorna detalhe linha-a-linha. Se a RPC falhar, cai 100% no
 * fallback legado.
 */
export function useDistribuicaoSocia(ano: number | null, conta: string) {
  const rpcQuery = useQuery({
    queryKey: ["distribuicao-socia-rpc", ano, conta],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc("get_distribuicao_socia", {
        _ano: ano ?? null,
        _conta: conta,
      });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      if (!row) return null;
      return {
        receitas: Number(row.receitas) || 0,
        despesasPF: Number(row.despesas_pf) || 0,
        liquido: Number(row.liquido) || 0,
      };
    },
    retry: false,
  });

  const { data: transacoes, isLoading: legacyLoading } = useTransacoesPorAno(ano);
  const isLoading = rpcQuery.isLoading || legacyLoading;

  const result = (() => {
    if (!transacoes) return null;

    // Legacy: o frontend usa "eliziane" mas o banco tem "liziane".
    const contaFilter = conta === "eliziane" ? "liziane" : conta;

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

    // Totalizadores preferenciais: RPC quando disponivel; fallback de
    // reduce client-side quando RPC falhou.
    const totalizadores = !rpcQuery.isError && rpcQuery.data
      ? rpcQuery.data
      : (() => {
          const receitas = receitasList.reduce((s, r) => s + r.valor, 0);
          const despesasPF = despesasList.reduce((s, d) => s + d.valor, 0);
          return { receitas, despesasPF, liquido: receitas - despesasPF };
        })();

    return {
      ...totalizadores,
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

    const totalReceitas = chartData.reduce(
      (s: number, d: { receitas: number }) => s + d.receitas,
      0,
    );
    const totalDespesas = chartData.reduce(
      (s: number, d: { despesas: number }) => s + d.despesas,
      0,
    );
    const lucro = totalReceitas - totalDespesas;

    const melhorMes = chartData.reduce(
      (best: { mes: string; valor: number }, d: { mes: string; resultado: number }) =>
        d.resultado > best.valor ? { mes: d.mes, valor: d.resultado } : best,
      { mes: "", valor: -Infinity },
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
