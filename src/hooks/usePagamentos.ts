import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays, isBefore, isAfter } from "date-fns";

export interface KPIsPagamentos {
  despesas_atrasadas: number;
  quantidade_despesas_atrasadas: number;
  receitas_pendentes: number;
  quantidade_receitas_pendentes: number;
  vencendo_7_dias: number;
  quantidade_vencendo_7_dias: number;
  saldo: number;
}

export interface DespesaAtrasada {
  id: string;
  descricao: string;
  valor: number;
  data: string;
  categoria: string;
}

export interface ReceitaPendente {
  id: string;
  valor: number;
  data_vencimento: string;
  numero_parcela: number;
  cliente_nome?: string;
}

export interface ItemVencimento {
  id: string;
  tipo: "receita" | "despesa";
  descricao: string;
  valor: number;
  data_vencimento: string;
}

export function useKPIsPagamentos() {
  return useQuery({
    queryKey: ["kpis-pagamentos"],
    queryFn: async (): Promise<KPIsPagamentos> => {
      const hoje = new Date();
      const hojeStr = format(hoje, "yyyy-MM-dd");
      const seteDiasStr = format(addDays(hoje, 7), "yyyy-MM-dd");

      // Buscar despesas pendentes/atrasadas
      const { data: despesas } = await supabase
        .from("despesas")
        .select("*")
        .in("status", ["pendente", "agendado"])
        .lt("data", hojeStr);

      const despesasAtrasadas = despesas?.reduce((sum, d) => sum + Number(d.valor), 0) || 0;
      const qtdDespesasAtrasadas = despesas?.length || 0;

      // Buscar parcelas pendentes
      const { data: parcelas } = await supabase
        .from("parcelas_financeiras")
        .select("*")
        .eq("status", "pendente");

      const receitasPendentes = parcelas?.reduce((sum, p) => sum + p.valor, 0) || 0;
      const qtdReceitasPendentes = parcelas?.length || 0;

      // Buscar itens vencendo nos próximos 7 dias
      const { data: despesasVencendo } = await supabase
        .from("despesas")
        .select("valor")
        .in("status", ["pendente", "agendado"])
        .gte("data", hojeStr)
        .lte("data", seteDiasStr);

      const { data: parcelasVencendo } = await supabase
        .from("parcelas_financeiras")
        .select("valor")
        .eq("status", "pendente")
        .gte("data_vencimento", hojeStr)
        .lte("data_vencimento", seteDiasStr);

      const totalVencendo7Dias = 
        (despesasVencendo?.reduce((sum, d) => sum + Number(d.valor), 0) || 0) +
        (parcelasVencendo?.reduce((sum, p) => sum + p.valor, 0) || 0);
      const qtdVencendo7Dias = (despesasVencendo?.length || 0) + (parcelasVencendo?.length || 0);

      // Saldo = Receitas pendentes - Despesas atrasadas
      const saldo = receitasPendentes - despesasAtrasadas;

      return {
        despesas_atrasadas: despesasAtrasadas,
        quantidade_despesas_atrasadas: qtdDespesasAtrasadas,
        receitas_pendentes: receitasPendentes,
        quantidade_receitas_pendentes: qtdReceitasPendentes,
        vencendo_7_dias: totalVencendo7Dias,
        quantidade_vencendo_7_dias: qtdVencendo7Dias,
        saldo,
      };
    },
  });
}

export function useDespesasAtrasadas() {
  return useQuery({
    queryKey: ["despesas-atrasadas"],
    queryFn: async (): Promise<DespesaAtrasada[]> => {
      const hoje = format(new Date(), "yyyy-MM-dd");

      const { data, error } = await supabase
        .from("despesas")
        .select("id, descricao, valor, data, categoria")
        .in("status", ["pendente", "agendado"])
        .lt("data", hoje)
        .order("data", { ascending: true });

      if (error) throw error;

      return (data || []).map(d => ({
        ...d,
        valor: Number(d.valor),
      }));
    },
  });
}

export function useReceitasPendentes() {
  return useQuery({
    queryKey: ["receitas-pendentes"],
    queryFn: async (): Promise<ReceitaPendente[]> => {
      const { data, error } = await supabase
        .from("parcelas_financeiras")
        .select(`
          id,
          valor,
          data_vencimento,
          numero_parcela,
          acordo:acordos_financeiros!acordo_id(
            cliente:contact_submissions!cliente_id(nome_completo)
          )
        `)
        .eq("status", "pendente")
        .order("data_vencimento", { ascending: true });

      if (error) throw error;

      return (data || []).map((p: any) => ({
        id: p.id,
        valor: p.valor,
        data_vencimento: p.data_vencimento,
        numero_parcela: p.numero_parcela,
        cliente_nome: p.acordo?.cliente?.[0]?.nome_completo || undefined,
      }));
    },
  });
}

export function useProximosVencimentos(dias: number = 7) {
  return useQuery({
    queryKey: ["proximos-vencimentos", dias],
    queryFn: async (): Promise<ItemVencimento[]> => {
      const hoje = new Date();
      const hojeStr = format(hoje, "yyyy-MM-dd");
      const limiteStr = format(addDays(hoje, dias), "yyyy-MM-dd");

      // Buscar despesas vencendo
      const { data: despesas } = await supabase
        .from("despesas")
        .select("id, descricao, valor, data")
        .in("status", ["pendente", "agendado"])
        .gte("data", hojeStr)
        .lte("data", limiteStr)
        .order("data", { ascending: true });

      // Buscar parcelas vencendo
      const { data: parcelas } = await supabase
        .from("parcelas_financeiras")
        .select(`
          id,
          valor,
          data_vencimento,
          numero_parcela,
          acordo:acordos_financeiros!acordo_id(
            cliente:contact_submissions!cliente_id(nome_completo)
          )
        `)
        .eq("status", "pendente")
        .gte("data_vencimento", hojeStr)
        .lte("data_vencimento", limiteStr)
        .order("data_vencimento", { ascending: true });

      const itens: ItemVencimento[] = [];

      // Adicionar despesas
      despesas?.forEach((d) => {
        itens.push({
          id: d.id,
          tipo: "despesa",
          descricao: d.descricao,
          valor: Number(d.valor),
          data_vencimento: d.data,
        });
      });

      // Adicionar parcelas
      parcelas?.forEach((p: any) => {
        const clienteNome = p.acordo?.cliente?.[0]?.nome_completo;
        itens.push({
          id: p.id,
          tipo: "receita",
          descricao: clienteNome 
            ? `${clienteNome} - Parcela ${p.numero_parcela}`
            : `Parcela ${p.numero_parcela}`,
          valor: p.valor,
          data_vencimento: p.data_vencimento,
        });
      });

      // Ordenar por data
      return itens.sort((a, b) => 
        new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime()
      );
    },
  });
}
