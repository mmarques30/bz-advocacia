import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { 
  AcordoFinanceiro, 
  KPIsFinanceiros, 
  ReceitaMensal,
  FluxoCaixa,
  DistribuicaoTipo,
  ParcelaVencendo,
  ClienteInadimplente,
  MaiorPagador,
  AcordosFilters
} from "@/types/financeiro";
import { format, subMonths, differenceInDays } from "date-fns";

export function useKPIsFinanceiros() {
  return useQuery({
    queryKey: ["kpis-financeiros"],
    queryFn: async (): Promise<KPIsFinanceiros> => {
      const hoje = new Date();
      const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      const ultimoDiaMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

      const { data: parcelas, error } = await supabase
        .from("parcelas_financeiras")
        .select("*");

      if (error) throw error;

      const receitaMes = parcelas
        ?.filter(p => p.status === 'pago' && p.data_pagamento && 
          new Date(p.data_pagamento) >= primeiroDiaMes && 
          new Date(p.data_pagamento) <= ultimoDiaMes)
        .reduce((sum, p) => sum + (p.valor_pago || 0), 0) || 0;

      const aReceberMes = parcelas
        ?.filter(p => p.status === 'pendente' && 
          new Date(p.data_vencimento) >= primeiroDiaMes && 
          new Date(p.data_vencimento) <= ultimoDiaMes)
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

      const { data: acordos } = await supabase
        .from("acordos_financeiros")
        .select("*");

      const ticketMedio = acordos && acordos.length > 0
        ? acordos.reduce((sum, a) => sum + a.valor_total, 0) / acordos.length
        : 0;

      return {
        receita_mes: receitaMes,
        recebido_mes: receitaMes,
        a_receber_mes: aReceberMes,
        valor_atrasado: valorAtrasado,
        taxa_inadimplencia: taxaInadimplencia,
        ticket_medio: ticketMedio,
      };
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

export function useFluxoCaixa(dias: number = 30) {
  return useQuery({
    queryKey: ["fluxo-caixa", dias],
    queryFn: async (): Promise<FluxoCaixa[]> => {
      const { data: parcelas } = await supabase
        .from("parcelas_financeiras")
        .select("*")
        .eq("status", "pago")
        .order("data_pagamento", { ascending: true });

      const fluxo: Record<string, number> = {};

      parcelas?.forEach(p => {
        if (p.data_pagamento) {
          const data = format(new Date(p.data_pagamento), "yyyy-MM-dd");
          fluxo[data] = (fluxo[data] || 0) + (p.valor_pago || 0);
        }
      });

      return Object.entries(fluxo).map(([data, entradas]) => ({
        data,
        entradas,
      }));
    },
  });
}

export function useDistribuicaoTipo() {
  return useQuery({
    queryKey: ["distribuicao-tipo"],
    queryFn: async (): Promise<DistribuicaoTipo[]> => {
      const { data: acordos } = await supabase
        .from("acordos_financeiros")
        .select("tipo_servico, valor_total");

      const distribuicao: Record<string, { valor: number; quantidade: number }> = {};
      let totalValor = 0;

      acordos?.forEach(a => {
        if (!distribuicao[a.tipo_servico]) {
          distribuicao[a.tipo_servico] = { valor: 0, quantidade: 0 };
        }
        distribuicao[a.tipo_servico].valor += a.valor_total;
        distribuicao[a.tipo_servico].quantidade += 1;
        totalValor += a.valor_total;
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

      const { data: parcelas } = await supabase
        .from("parcelas_financeiras")
        .select(`
          *,
          acordo:acordos_financeiros!acordo_id(
            cliente:contact_submissions!cliente_id(nome_completo)
          )
        `)
        .eq("status", "pendente")
        .gte("data_vencimento", format(hoje, "yyyy-MM-dd"))
        .lte("data_vencimento", format(dataLimite, "yyyy-MM-dd"))
        .order("data_vencimento", { ascending: true });

      return parcelas?.map((p: any) => ({
        id: p.id,
        acordo_id: p.acordo_id,
        cliente_nome: p.acordo?.cliente?.[0]?.nome_completo || "Cliente",
        numero_parcela: p.numero_parcela,
        valor: p.valor,
        data_vencimento: p.data_vencimento,
        dias_restantes: differenceInDays(new Date(p.data_vencimento), hoje),
      })) || [];
    },
  });
}

export function useClientesInadimplentes() {
  return useQuery({
    queryKey: ["clientes-inadimplentes"],
    queryFn: async (): Promise<ClienteInadimplente[]> => {
      const hoje = new Date();

      const { data: parcelas } = await supabase
        .from("parcelas_financeiras")
        .select(`
          *,
          acordo:acordos_financeiros!acordo_id(
            cliente_id,
            cliente:contact_submissions!cliente_id(id, nome_completo)
          )
        `)
        .neq("status", "pago")
        .lt("data_vencimento", format(hoje, "yyyy-MM-dd"));

      const clientesMap: Record<string, ClienteInadimplente> = {};

      parcelas?.forEach((p: any) => {
        const clienteId = p.acordo?.cliente_id;
        const clienteNome = p.acordo?.cliente?.[0]?.nome_completo || "Cliente";
        const diasAtraso = differenceInDays(hoje, new Date(p.data_vencimento));

        if (!clientesMap[clienteId]) {
          clientesMap[clienteId] = {
            cliente_id: clienteId,
            cliente_nome: clienteNome,
            total_atrasado: 0,
            parcelas_atrasadas: 0,
            maior_atraso_dias: 0,
          };
        }

        clientesMap[clienteId].total_atrasado += p.valor;
        clientesMap[clienteId].parcelas_atrasadas += 1;
        clientesMap[clienteId].maior_atraso_dias = Math.max(
          clientesMap[clienteId].maior_atraso_dias,
          diasAtraso
        );
      });

      return Object.values(clientesMap);
    },
  });
}

export function useMaioresPagadores(limite: number = 5) {
  return useQuery({
    queryKey: ["maiores-pagadores", limite],
    queryFn: async (): Promise<MaiorPagador[]> => {
      const hoje = new Date();
      const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

      const { data: parcelas } = await supabase
        .from("parcelas_financeiras")
        .select(`
          *,
          acordo:acordos_financeiros!acordo_id(
            cliente_id,
            cliente:contact_submissions!cliente_id(id, nome_completo)
          )
        `)
        .eq("status", "pago")
        .gte("data_pagamento", format(primeiroDiaMes, "yyyy-MM-dd"));

      const pagadoresMap: Record<string, MaiorPagador> = {};

      parcelas?.forEach((p: any) => {
        const clienteId = p.acordo?.cliente_id;
        const clienteNome = p.acordo?.cliente?.[0]?.nome_completo || "Cliente";

        if (!pagadoresMap[clienteId]) {
          pagadoresMap[clienteId] = {
            cliente_id: clienteId,
            cliente_nome: clienteNome,
            total_pago: 0,
            quantidade_pagamentos: 0,
          };
        }

        pagadoresMap[clienteId].total_pago += p.valor_pago || 0;
        pagadoresMap[clienteId].quantidade_pagamentos += 1;
      });

      return Object.values(pagadoresMap)
        .sort((a, b) => b.total_pago - a.total_pago)
        .slice(0, limite);
    },
  });
}
