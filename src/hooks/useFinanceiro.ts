/**
 * Financial hooks for the BZ Advocacia dashboard.
 *
 * NOTE (2026-04): this file is large (900+ lines, 16 hooks) and is a
 * known refactor target. When splitting, keep this file as a barrel that
 * re-exports from the sub-modules so that existing import paths
 * (`from "@/hooks/useFinanceiro"`) keep working. Suggested layout:
 *   src/hooks/financeiro/
 *     kpis.ts       — useKPIsFinanceiros, useProjetadoVsRealizado, useReceitasMesAtual
 *     acordos.ts    — useAcordos, useAcordoDetalhes, useCreateAcordo
 *     receitas.ts   — useReceitaMensal, useFluxoCaixa, useReceitasRecentes
 *     distribuicao.ts — useDistribuicaoTipo, useDistribuicaoTipoAgregado, useTopSubcategorias
 *     parcelas.ts   — useParcelasVencendo, useClientesInadimplentes
 *     faturamento.ts — useFaturamentoDetalhado, useMaioresPagadores
 *
 * Phase 2.2 also added a server-side aggregation RPC
 * (`get_financeiro_kpis(data_inicio, data_fim)`) that should replace
 * the client-side summing done in useKPIsFinanceiros once we're ready.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/lib/toast";
import type { 
  AcordoFinanceiro, 
  KPIsFinanceiros, 
  ReceitaMensal,
  FluxoCaixa,
  DistribuicaoTipo,
  DistribuicaoTipoAgregado,
  ParcelaVencendo,
  ClienteInadimplente,
  MaiorPagador,
  AcordosFilters,
  ProjetadoVsRealizado,
} from "@/types/financeiro";
import type { FaturamentoFiltersState } from "@/components/financeiro/FaturamentoFilters";
import { format, subMonths, differenceInDays, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";

// Helper para calcular datas baseado nos filtros
// Retorna null para inicio/fim quando não há filtro específico (busca todos os dados)
function getDateRangeFromFilters(filters?: FaturamentoFiltersState): { inicio: Date | null; fim: Date | null } {
  // Se não houver filtros ou dateRange, retornar null para buscar todos os dados
  if (!filters || (!filters.dateRange?.from && !filters.dateRange?.to)) {
    return { inicio: null, fim: null };
  }

  // Se tiver período específico definido via dateRange
  if (filters.dateRange?.from && filters.dateRange?.to) {
    return { 
      inicio: filters.dateRange.from, 
      fim: filters.dateRange.to 
    };
  }
  
  if (filters.dateRange?.from) {
    return { 
      inicio: filters.dateRange.from, 
      fim: null 
    };
  }
  
  if (filters.dateRange?.to) {
    return { 
      inicio: null, 
      fim: filters.dateRange.to 
    };
  }

  return { inicio: null, fim: null };
}

export function useKPIsFinanceiros(filters?: FaturamentoFiltersState) {
  return useQuery({
    queryKey: ["kpis-financeiros", filters],
    queryFn: async (): Promise<KPIsFinanceiros> => {
      const hoje = new Date();
      const { inicio: primeiroDiaMes, fim: ultimoDiaMes } = getDateRangeFromFilters(filters);

      const { data: parcelas, error } = await supabase
        .from("parcelas_financeiras")
        .select("*")
        .limit(10000);

      if (error) throw error;

      // Filtrar parcelas por período se definido
      const receitaParcelas = parcelas
        ?.filter(p => {
          if (p.status !== 'pago' || !p.data_pagamento) return false;
          const dataPagamento = new Date(p.data_pagamento);
          if (primeiroDiaMes && dataPagamento < primeiroDiaMes) return false;
          if (ultimoDiaMes && dataPagamento > ultimoDiaMes) return false;
          return true;
        })
        .reduce((sum, p) => sum + (p.valor_pago || 0), 0) || 0;

      // Buscar transações importadas (tipo receita)
      const { data: transacoes } = await supabase
        .from("transacoes_financeiras")
        .select("*")
        .limit(10000);

      const receitaImportada = transacoes
        ?.filter(t => {
          if (!t.data_transacao) return false;
          const dataTransacao = new Date(t.data_transacao);
          const tipoReceita = t.tipo_codigo === 'receita' || t.tipo_codigo === 'REC';
          if (!tipoReceita) return false;
          if (primeiroDiaMes && dataTransacao < primeiroDiaMes) return false;
          if (ultimoDiaMes && dataTransacao > ultimoDiaMes) return false;
          return true;
        })
        .reduce((sum, t) => sum + (t.valor || 0), 0) || 0;

      const receitaMes = receitaParcelas + receitaImportada;

      const aReceberMes = parcelas
        ?.filter(p => {
          if (p.status !== 'pendente') return false;
          const dataVencimento = new Date(p.data_vencimento);
          if (primeiroDiaMes && dataVencimento < primeiroDiaMes) return false;
          if (ultimoDiaMes && dataVencimento > ultimoDiaMes) return false;
          return true;
        })
        .reduce((sum, p) => sum + p.valor, 0) || 0;

      const valorAtrasado = parcelas
        ?.filter(p => p.status !== 'pago' && new Date(p.data_vencimento) < hoje)
        .reduce((sum, p) => sum + p.valor, 0) || 0;

      const totalParcelas = parcelas?.length || 0;
      const parcelasAtrasadas = parcelas?.filter(p => 
        p.status !== 'pago' && new Date(p.data_vencimento) < hoje
      ).length || 0;

      const taxaInadimplencia = totalParcelas > 0 
        ? (parcelasAtrasadas / totalParcelas) * 100 
        : 0;

      let acordosQuery = supabase.from("acordos_financeiros").select("*");
      
      // Aplicar filtros de status e tipo se existirem
      if (filters?.status && filters.status !== "todos") {
        acordosQuery = acordosQuery.eq("status", filters.status);
      }
      if (filters?.tipoServico && filters.tipoServico !== "todos") {
        acordosQuery = acordosQuery.eq("tipo_servico", filters.tipoServico);
      }
      if (filters?.conta && filters.conta !== "todos") {
        acordosQuery = acordosQuery.eq("conta", filters.conta);
      }

      const { data: acordos } = await acordosQuery;

      const ticketMedio = acordos && acordos.length > 0
        ? acordos.reduce((sum, a) => sum + a.valor_total, 0) / acordos.length
        : 0;

      // Projeção: soma das parcelas pendentes de acordos ativos
      const projecao = parcelas
        ?.filter(p => p.status === 'pendente')
        .reduce((sum, p) => sum + p.valor, 0) || 0;

      return {
        receita_mes: receitaMes,
        recebido_mes: receitaMes,
        a_receber_mes: aReceberMes,
        valor_atrasado: valorAtrasado,
        taxa_inadimplencia: taxaInadimplencia,
        ticket_medio: ticketMedio,
        projecao,
      };
    },
  });
}

export function useProjetadoVsRealizado(meses: number = 12) {
  return useQuery({
    queryKey: ["projetado-vs-realizado", meses],
    queryFn: async (): Promise<ProjetadoVsRealizado[]> => {
      // Buscar receitas reais de transacoes_financeiras
      const { data: transacoes } = await supabase
        .from("transacoes_financeiras")
        .select("*")
        .limit(10000);

      // Buscar parcelas pagas
      const { data: parcelas } = await supabase
        .from("parcelas_financeiras")
        .select("*")
        .eq("status", "pago")
        .limit(10000);

      // Buscar metas mensais
      const { data: metas } = await supabase
        .from("metas_mensais")
        .select("*");

      const hoje = new Date();
      const resultado: ProjetadoVsRealizado[] = [];

      for (let i = meses - 1; i >= 0; i--) {
        const data = subMonths(hoje, i);
        const inicio = startOfMonth(data);
        const fim = endOfMonth(data);
        const mesNum = data.getMonth() + 1;
        const anoNum = data.getFullYear();

        // Realizado: transações de receita + parcelas pagas
        const receitaTransacoes = (transacoes || [])
          .filter(t => {
            if (!t.data_transacao) return false;
            const tipoReceita = t.tipo_codigo === 'receita' || t.tipo_codigo === 'REC';
            if (!tipoReceita) return false;
            const dt = new Date(t.data_transacao);
            return dt >= inicio && dt <= fim;
          })
          .reduce((sum, t) => sum + (t.valor || 0), 0);

        const receitaParcelas = (parcelas || [])
          .filter(p => {
            if (!p.data_pagamento) return false;
            const dp = new Date(p.data_pagamento);
            return dp >= inicio && dp <= fim;
          })
          .reduce((sum, p) => sum + (p.valor_pago || 0), 0);

        const realizado = receitaTransacoes + receitaParcelas;

        // Projetado: buscar da tabela metas_mensais
        const meta = (metas || []).find(m => m.mes === mesNum && m.ano === anoNum);
        const projetado = meta ? Number(meta.valor) : 0;

        resultado.push({
          mes: format(data, "MMM/yy"),
          realizado,
          projetado,
        });
      }

      return resultado;
    },
  });
}

export function useAcordos(filters?: AcordosFilters) {
  return useQuery({
    queryKey: ["acordos-financeiros", filters],
    queryFn: async (): Promise<AcordoFinanceiro[]> => {
      let query = supabase
        .from("acordos_financeiros")
        .select(`
          *,
          cliente:contact_submissions!cliente_id(id, nome_completo, email, telefone),
          processo:processos!processo_id(id, numero_processo, tipo),
          parcelas:parcelas_financeiras(*)
        `)
        .order("created_at", { ascending: false });

      if (filters?.status && filters.status.length > 0) {
        query = query.in("status", filters.status);
      }

      if (filters?.cliente_id) {
        query = query.eq("cliente_id", filters.cliente_id);
      }

      if (filters?.search) {
        // Busca será feita no cliente depois
      }

      const { data, error } = await query;
      if (error) throw error;

      let acordos = data as any[];

      if (filters?.possui_atraso) {
        acordos = acordos.filter(acordo => 
          acordo.parcelas?.some((p: any) => 
            p.status !== 'pago' && new Date(p.data_vencimento) < new Date()
          )
        );
      }

      return acordos.map(acordo => ({
        ...acordo,
        cliente: acordo.cliente ? acordo.cliente[0] : undefined,
        processo: acordo.processo ? acordo.processo[0] : undefined,
      }));
    },
  });
}

export function useAcordoDetalhes(acordoId: string | null) {
  return useQuery({
    queryKey: ["acordo-detalhes", acordoId],
    enabled: !!acordoId,
    queryFn: async (): Promise<AcordoFinanceiro | null> => {
      if (!acordoId) return null;

      const { data, error } = await supabase
        .from("acordos_financeiros")
        .select(`
          *,
          cliente:contact_submissions!cliente_id(id, nome_completo, email, telefone),
          processo:processos!processo_id(id, numero_processo, tipo),
          parcelas:parcelas_financeiras(*)
        `)
        .eq("id", acordoId)
        .single();

      if (error) throw error;

      return {
        ...data,
        cliente: data.cliente?.[0],
        processo: data.processo?.[0],
      } as AcordoFinanceiro;
    },
  });
}

export function useCreateAcordo() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (acordo: any) => {
      const { parcelas, ...acordoData } = acordo;

      // Rodada 1: preferimos a RPC atomica (acordo + parcelas numa unica
      // transacao Postgres). Se estiver indisponivel, cai no fluxo de
      // 2 inserts separados mantendo o comportamento antigo.
      try {
        const { data: rpcData, error: rpcError } = await (supabase as any).rpc(
          "create_acordo_atomico",
          {
            p_acordo: acordoData,
            p_parcelas: parcelas && parcelas.length > 0 ? parcelas : [],
          },
        );

        if (rpcError) throw rpcError;

        // A RPC retorna apenas o uuid; o hook que consome espera o row
        // completo. Buscamos o row recem-criado para manter contrato.
        const acordoId = rpcData as string;
        const { data: novo, error: fetchError } = await supabase
          .from("acordos_financeiros")
          .select("*")
          .eq("id", acordoId)
          .single();
        if (fetchError) throw fetchError;
        return novo;
      } catch (rpcErr) {
        console.warn(
          "RPC create_acordo_atomico indisponivel, usando fallback 2-step:",
          rpcErr,
        );
      }

      // Fallback legado (pre-Rodada 1). Mantido para ambientes sem a
      // RPC aplicada. Atomicidade nao garantida — se insert das parcelas
      // falhar, o acordo ja foi persistido.
      const { data: novoAcordo, error: acordoError } = await supabase
        .from("acordos_financeiros")
        .insert([acordoData])
        .select()
        .single();

      if (acordoError) throw acordoError;

      if (parcelas && parcelas.length > 0) {
        const parcelasComAcordo = parcelas.map(p => ({
          ...p,
          acordo_id: novoAcordo.id,
        }));

        const { error: parcelasError } = await supabase
          .from("parcelas_financeiras")
          .insert(parcelasComAcordo);

        if (parcelasError) throw parcelasError;
      }

      return novoAcordo;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["acordos-financeiros"] });
      queryClient.invalidateQueries({ queryKey: ["kpis-financeiros"] });
      queryClient.invalidateQueries({ queryKey: ["fluxo-caixa"] });
      queryClient.invalidateQueries({ queryKey: ["receita-mensal"] });
      queryClient.invalidateQueries({ queryKey: ["projetado-vs-realizado"] });
      toast({
        title: "Acordo criado",
        description: "O acordo financeiro foi criado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar acordo",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useReceitaMensal(meses: number = 12) {
  return useQuery({
    queryKey: ["receita-mensal", meses],
    queryFn: async (): Promise<ReceitaMensal[]> => {
      const resultado: ReceitaMensal[] = [];
      const hoje = new Date();

      for (let i = meses - 1; i >= 0; i--) {
        const data = subMonths(hoje, i);
        const primeiroDia = new Date(data.getFullYear(), data.getMonth(), 1);
        const ultimoDia = new Date(data.getFullYear(), data.getMonth() + 1, 0);

        // Buscar receitas (parcelas pagas)
        const { data: parcelas } = await supabase
          .from("parcelas_financeiras")
          .select("*")
          .eq("status", "pago")
          .gte("data_pagamento", format(primeiroDia, "yyyy-MM-dd"))
          .lte("data_pagamento", format(ultimoDia, "yyyy-MM-dd"));

        // Buscar despesas do mês
        const { data: despesas } = await supabase
          .from("despesas")
          .select("valor")
          .gte("data", format(primeiroDia, "yyyy-MM-dd"))
          .lte("data", format(ultimoDia, "yyyy-MM-dd"));

        resultado.push({
          mes: format(data, "MMM/yy"),
          receita: parcelas?.reduce((sum, p) => sum + (p.valor_pago || 0), 0) || 0,
          despesas: despesas?.reduce((sum, d) => sum + Number(d.valor), 0) || 0,
          quantidade: parcelas?.length || 0,
        });
      }

      return resultado;
    },
  });
}

export function useFluxoCaixa(filters?: FaturamentoFiltersState) {
  return useQuery({
    queryKey: ["fluxo-caixa", filters],
    queryFn: async (): Promise<FluxoCaixa[]> => {
      const { inicio, fim } = getDateRangeFromFilters(filters);
      
      // Determinar granularidade baseado no período (se não houver filtro, usar mês)
      const diasPeriodo = inicio && fim ? differenceInDays(fim, inicio) : 365;
      const granularidade: 'dia' | 'mes' = diasPeriodo > 62 ? 'mes' : 'dia';
      
      let parcelasQuery = supabase
        .from("parcelas_financeiras")
        .select("*")
        .eq("status", "pago")
        .order("data_pagamento", { ascending: true });

      // Aplicar filtros de data apenas se definidos
      if (inicio) {
        parcelasQuery = parcelasQuery.gte("data_pagamento", format(inicio, "yyyy-MM-dd"));
      }
      if (fim) {
        parcelasQuery = parcelasQuery.lte("data_pagamento", format(fim, "yyyy-MM-dd"));
      }

      const { data: parcelas } = await parcelasQuery.limit(10000);

      // Buscar transações importadas (receitas)
      let transacoesQuery = supabase
        .from("transacoes_financeiras")
        .select("*");

      if (inicio) {
        transacoesQuery = transacoesQuery.gte("data_transacao", format(inicio, "yyyy-MM-dd"));
      }
      if (fim) {
        transacoesQuery = transacoesQuery.lte("data_transacao", format(fim, "yyyy-MM-dd"));
      }

      const { data: transacoes } = await transacoesQuery.limit(10000);

      const fluxo: Record<string, number> = {};

      // Função para gerar chave baseada na granularidade
      const getChave = (dataStr: string) => {
        const date = new Date(dataStr);
        if (granularidade === 'mes') {
          return format(date, "yyyy-MM");
        }
        return format(date, "yyyy-MM-dd");
      };

      // Adicionar parcelas pagas
      parcelas?.forEach(p => {
        if (p.data_pagamento) {
          const chave = getChave(p.data_pagamento);
          fluxo[chave] = (fluxo[chave] || 0) + (p.valor_pago || 0);
        }
      });

      // Adicionar transações importadas (receitas)
      transacoes?.forEach(t => {
        if (t.data_transacao) {
          const tipoReceita = t.tipo_codigo === 'receita' || t.tipo_codigo === 'REC';
          if (tipoReceita) {
            const chave = getChave(t.data_transacao);
            fluxo[chave] = (fluxo[chave] || 0) + (t.valor || 0);
          }
        }
      });

      return Object.entries(fluxo)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([data, entradas]) => ({
          data,
          entradas,
          granularidade,
        }));
    },
  });
}

export function useDistribuicaoTipo(filters?: FaturamentoFiltersState) {
  return useQuery({
    queryKey: ["distribuicao-tipo", filters],
    queryFn: async (): Promise<DistribuicaoTipo[]> => {
      let query = supabase
        .from("acordos_financeiros")
        .select("tipo_servico, valor_total, created_at");

      // Filtrar por status se especificado
      if (filters?.status && filters.status !== "todos") {
        query = query.eq("status", filters.status);
      }

      const { data: acordos } = await query.limit(10000);

      // Buscar transações importadas
      const { data: transacoes } = await supabase
        .from("transacoes_financeiras")
        .select("*")
        .limit(10000);

      // Filtrar por período se especificado
      const { inicio, fim } = getDateRangeFromFilters(filters);
      const acordosFiltrados = acordos?.filter(a => {
        const dataAcordo = new Date(a.created_at);
        if (inicio && dataAcordo < inicio) return false;
        if (fim && dataAcordo > fim) return false;
        return true;
      }) || [];

      const transacoesFiltradas = transacoes?.filter(t => {
        if (!t.data_transacao) return false;
        const dataTransacao = new Date(t.data_transacao);
        const tipoReceita = t.tipo_codigo === 'receita' || t.tipo_codigo === 'REC';
        if (!tipoReceita) return false;
        if (inicio && dataTransacao < inicio) return false;
        if (fim && dataTransacao > fim) return false;
        return true;
      }) || [];

      // Agrupar por mês e tipo para série temporal
      const serieTemporal: Record<string, Record<string, number>> = {};
      const todosTipos = new Set<string>();

      // Processar acordos
      acordosFiltrados.forEach(a => {
        const mes = format(new Date(a.created_at), "yyyy-MM");
        if (!serieTemporal[mes]) {
          serieTemporal[mes] = {};
        }
        const tipo = a.tipo_servico;
        todosTipos.add(tipo);
        serieTemporal[mes][tipo] = (serieTemporal[mes][tipo] || 0) + a.valor_total;
      });

      // Processar transações importadas
      transacoesFiltradas.forEach(t => {
        const mes = format(new Date(t.data_transacao!), "yyyy-MM");
        if (!serieTemporal[mes]) {
          serieTemporal[mes] = {};
        }
        const categoria = t.subcategoria_codigo || t.categoria_codigo || 'Importado';
        todosTipos.add(categoria);
        serieTemporal[mes][categoria] = (serieTemporal[mes][categoria] || 0) + (t.valor || 0);
      });

      // Converter para array ordenado por mês
      const resultado = Object.entries(serieTemporal)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([mes, valores]) => ({
          mes,
          ...valores,
        }));

      // Retornar os tipos disponíveis como metadado
      return resultado.length > 0 ? resultado.map(r => ({
        ...r,
        _tipos: Array.from(todosTipos),
      })) : [];
    },
  });
}

// Hook para distribuição agregada (usado em relatórios)
export function useDistribuicaoTipoAgregado(filters?: FaturamentoFiltersState) {
  return useQuery({
    queryKey: ["distribuicao-tipo-agregado", filters],
    queryFn: async (): Promise<DistribuicaoTipoAgregado[]> => {
      let query = supabase
        .from("acordos_financeiros")
        .select("tipo_servico, valor_total, created_at");

      if (filters?.status && filters.status !== "todos") {
        query = query.eq("status", filters.status);
      }

      const { data: acordos } = await query.limit(10000);

      const { data: transacoes } = await supabase
        .from("transacoes_financeiras")
        .select("*")
        .limit(10000);

      const { inicio, fim } = getDateRangeFromFilters(filters);
      const acordosFiltrados = acordos?.filter(a => {
        const dataAcordo = new Date(a.created_at);
        if (inicio && dataAcordo < inicio) return false;
        if (fim && dataAcordo > fim) return false;
        return true;
      }) || [];

      const transacoesFiltradas = transacoes?.filter(t => {
        if (!t.data_transacao) return false;
        const dataTransacao = new Date(t.data_transacao);
        const tipoReceita = t.tipo_codigo === 'receita' || t.tipo_codigo === 'REC';
        if (!tipoReceita) return false;
        if (inicio && dataTransacao < inicio) return false;
        if (fim && dataTransacao > fim) return false;
        return true;
      }) || [];

      const distribuicao: Record<string, { valor: number; quantidade: number }> = {};
      let totalValor = 0;

      acordosFiltrados.forEach(a => {
        if (!distribuicao[a.tipo_servico]) {
          distribuicao[a.tipo_servico] = { valor: 0, quantidade: 0 };
        }
        distribuicao[a.tipo_servico].valor += a.valor_total;
        distribuicao[a.tipo_servico].quantidade += 1;
        totalValor += a.valor_total;
      });

      transacoesFiltradas.forEach(t => {
        const categoria = t.subcategoria_codigo || t.categoria_codigo || 'Importado';
        if (!distribuicao[categoria]) {
          distribuicao[categoria] = { valor: 0, quantidade: 0 };
        }
        distribuicao[categoria].valor += t.valor || 0;
        distribuicao[categoria].quantidade += 1;
        totalValor += t.valor || 0;
      });

      return Object.entries(distribuicao).map(([tipo, dados]) => ({
        tipo,
        valor: dados.valor,
        quantidade: dados.quantidade,
        percentual: totalValor > 0 ? (dados.valor / totalValor) * 100 : 0,
      }));
    },
  });
}

export function useParcelasVencendo(dias: number = 7) {
  return useQuery({
    queryKey: ["parcelas-vencendo", dias],
    queryFn: async (): Promise<ParcelaVencendo[]> => {
      const hoje = new Date();
      const dataLimite = new Date(hoje);
      dataLimite.setDate(dataLimite.getDate() + dias);

      const { data, error } = await supabase
        .from("parcelas_financeiras")
        .select(`
          *,
          acordo:acordos_financeiros!acordo_id(
            id,
            tipo_servico,
            cliente:contact_submissions!cliente_id(id, nome_completo, telefone)
          )
        `)
        .eq("status", "pendente")
        .gte("data_vencimento", format(hoje, "yyyy-MM-dd"))
        .lte("data_vencimento", format(dataLimite, "yyyy-MM-dd"))
        .order("data_vencimento", { ascending: true });

      if (error) throw error;

      return (data || []).map(p => {
        const vencimento = new Date(p.data_vencimento);
        const diasRestantes = Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
        return {
          id: p.id,
          numero_parcela: p.numero_parcela,
          valor: p.valor,
          data_vencimento: p.data_vencimento,
          dias_restantes: diasRestantes,
          cliente_nome: (p.acordo as any)?.cliente?.[0]?.nome_completo || "Cliente não encontrado",
          acordo_id: p.acordo_id,
        };
      });
    },
  });
}

export function useClientesInadimplentes() {
  return useQuery({
    queryKey: ["clientes-inadimplentes"],
    queryFn: async (): Promise<ClienteInadimplente[]> => {
      const hoje = new Date();

      const { data, error } = await supabase
        .from("parcelas_financeiras")
        .select(`
          *,
          acordo:acordos_financeiros!acordo_id(
            id,
            cliente:contact_submissions!cliente_id(id, nome_completo, email, telefone)
          )
        `)
        .neq("status", "pago")
        .lt("data_vencimento", format(hoje, "yyyy-MM-dd"));

      if (error) throw error;

      // Agrupar por cliente
      const clientesMap: Record<string, ClienteInadimplente> = {};

      (data || []).forEach(p => {
        const cliente = (p.acordo as any)?.cliente?.[0];
        if (!cliente) return;

        if (!clientesMap[cliente.id]) {
          clientesMap[cliente.id] = {
            cliente_id: cliente.id,
            cliente_nome: cliente.nome_completo,
            total_atrasado: 0,
            parcelas_atrasadas: 0,
            maior_atraso_dias: 0,
          };
        }

        clientesMap[cliente.id].total_atrasado += p.valor;
        clientesMap[cliente.id].parcelas_atrasadas += 1;

        const diasAtraso = Math.floor(
          (hoje.getTime() - new Date(p.data_vencimento).getTime()) / (1000 * 60 * 60 * 24)
        );
        if (diasAtraso > clientesMap[cliente.id].maior_atraso_dias) {
          clientesMap[cliente.id].maior_atraso_dias = diasAtraso;
        }
      });

      return Object.values(clientesMap).sort(
        (a, b) => b.total_atrasado - a.total_atrasado
      );
    },
  });
}

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

// Hook para buscar faturamento detalhado (receitas de transacoes_financeiras)
interface FaturamentoDetalhadoItem {
  id: string;
  data: string | null;
  descricao: string | null;
  categoria: string | null;
  subcategoria: string | null;
  valor: number;
  conta: string | null;
}

export function useFaturamentoDetalhado(filters?: FaturamentoFiltersState) {
  return useQuery({
    queryKey: ["faturamento-detalhado", filters],
    queryFn: async (): Promise<FaturamentoDetalhadoItem[]> => {
      const { inicio, fim } = getDateRangeFromFilters(filters);

      // Buscar transações de receita
      const { data: transacoes, error } = await supabase
        .from("transacoes_financeiras")
        .select("*")
        .order("data_transacao", { ascending: false })
        .limit(10000);

      if (error) throw error;

      // Filtrar por tipo receita e período (se houver filtros)
      const transacoesFiltradas = (transacoes || []).filter(t => {
        if (!t.data_transacao) return false;
        const dataTransacao = new Date(t.data_transacao);
        const tipoReceita = t.tipo_codigo === 'receita' || t.tipo_codigo === 'REC';
        
        if (!tipoReceita) return false;
        
        // Se não houver filtros de data, incluir todas as receitas
        if (!inicio && !fim) return true;
        if (inicio && dataTransacao < inicio) return false;
        if (fim && dataTransacao > fim) return false;
        return true;
      });

      return transacoesFiltradas.map(t => ({
        id: t.id,
        data: t.data_transacao,
        descricao: t.descricao,
        categoria: t.categoria_codigo,
        subcategoria: t.subcategoria_codigo,
        valor: t.valor || 0,
        conta: t.conta || null,
        // Campos completos para edição
        mes: t.mes,
        ano: t.ano,
        mes_nome: t.mes_nome,
        tipo_codigo: t.tipo_codigo,
        categoria_codigo: t.categoria_codigo,
        subcategoria_codigo: t.subcategoria_codigo,
        data_transacao: t.data_transacao,
        created_at: t.created_at,
      }));
    },
  });
}

// Hook para buscar receitas recentes
export function useReceitasRecentes(limite: number = 5) {
  return useQuery({
    queryKey: ["receitas-recentes", limite],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transacoes_financeiras")
        .select("*")
        .or("tipo_codigo.eq.receita,tipo_codigo.eq.REC")
        .order("data_transacao", { ascending: false })
        .limit(limite);

      if (error) throw error;

      return data?.map(t => ({
        id: t.id,
        data: t.data_transacao,
        descricao: t.descricao || t.subcategoria_codigo || "Receita",
        subcategoria: t.subcategoria_codigo,
        valor: t.valor || 0,
      })) || [];
    },
  });
}

// Hook para top subcategorias por receita
export function useTopSubcategorias(limite: number = 5) {
  return useQuery({
    queryKey: ["top-subcategorias", limite],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transacoes_financeiras")
        .select("subcategoria_codigo, valor")
        .or("tipo_codigo.eq.receita,tipo_codigo.eq.REC")
        .limit(10000);

      if (error) throw error;

      // Agrupar por subcategoria
      const agrupado: Record<string, { total: number; quantidade: number }> = {};
      
      (data || []).forEach(t => {
        const key = t.subcategoria_codigo || "Outros";
        if (!agrupado[key]) {
          agrupado[key] = { total: 0, quantidade: 0 };
        }
        agrupado[key].total += t.valor || 0;
        agrupado[key].quantidade += 1;
      });

      return Object.entries(agrupado)
        .map(([subcategoria, dados]) => ({
          subcategoria,
          total: dados.total,
          quantidade: dados.quantidade,
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, limite);
    },
  });
}

// Hook para receitas do mês atual por responsável
export function useReceitasMesAtual() {
  return useQuery({
    queryKey: ["receitas-mes-atual"],
    queryFn: async () => {
      const inicio = startOfMonth(new Date());
      const fim = endOfMonth(new Date());

      const { data, error } = await supabase
        .from("transacoes_financeiras")
        .select("subcategoria_codigo, valor, data_transacao")
        .or("tipo_codigo.eq.receita,tipo_codigo.eq.REC")
        .gte("data_transacao", format(inicio, "yyyy-MM-dd"))
        .lte("data_transacao", format(fim, "yyyy-MM-dd"));

      if (error) throw error;

      // Agrupar por subcategoria (que representa o responsável)
      const agrupado: Record<string, { total: number; quantidade: number }> = {};
      let totalGeral = 0;
      
      (data || []).forEach(t => {
        const key = t.subcategoria_codigo || "Outros";
        if (!agrupado[key]) {
          agrupado[key] = { total: 0, quantidade: 0 };
        }
        agrupado[key].total += t.valor || 0;
        agrupado[key].quantidade += 1;
        totalGeral += t.valor || 0;
      });

      return {
        totalGeral,
        quantidadeTotal: data?.length || 0,
        porResponsavel: Object.entries(agrupado)
          .map(([responsavel, dados]) => ({
            responsavel,
            total: dados.total,
            quantidade: dados.quantidade,
          }))
          .sort((a, b) => b.total - a.total),
      };
    },
  });
}