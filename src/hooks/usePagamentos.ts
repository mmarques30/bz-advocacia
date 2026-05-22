import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays, startOfMonth } from "date-fns";

export interface DespesaAtrasada {
  id: string;
  descricao: string;
  valor: number;
  data: string;
  categoria: string;
  origem: "despesas" | "transacoes";
}

export interface ReceitaPendente {
  id: string;
  valor: number;
  data_vencimento: string;
  numero_parcela: number;
  cliente_nome?: string;
  descricao?: string;
  origem: "parcelas" | "transacoes";
}

export interface ItemVencimento {
  id: string;
  tipo: "receita" | "despesa";
  descricao: string;
  valor: number;
  data_vencimento: string;
  origem: "despesas" | "transacoes" | "parcelas";
}

export function useDespesasAtrasadas() {
  return useQuery({
    queryKey: ["despesas-atrasadas"],
    queryFn: async (): Promise<DespesaAtrasada[]> => {
      const hoje = new Date();
      const hojeStr = format(hoje, "yyyy-MM-dd");
      const primeiroDiaMes = format(startOfMonth(hoje), "yyyy-MM-dd");

      const resultado: DespesaAtrasada[] = [];

      // 1. Buscar despesas da tabela despesas (operacionais)
      const { data: despesasOperacionais, error: errDespesas } = await supabase
        .from("despesas")
        .select("id, descricao, valor, data, categoria")
        .in("status", ["pendente", "agendado"])
        .lt("data", hojeStr)
        .order("data", { ascending: true });

      if (!errDespesas && despesasOperacionais) {
        despesasOperacionais.forEach((d) => {
          resultado.push({
            id: d.id,
            descricao: d.descricao,
            valor: Number(d.valor),
            data: d.data,
            categoria: d.categoria,
            origem: "despesas",
          });
        });
      }

      // 2. Buscar despesas do mês atual de transacoes_financeiras
      const { data: transacoesDespesas, error: errTransacoes } = await supabase
        .from("transacoes_financeiras")
        .select("id, descricao, valor, data_transacao, categoria_codigo")
        .eq("tipo_codigo", "despesa")
        .gte("data_transacao", primeiroDiaMes)
        .lte("data_transacao", hojeStr)
        .order("data_transacao", { ascending: true });

      if (!errTransacoes && transacoesDespesas) {
        transacoesDespesas.forEach((t) => {
          resultado.push({
            id: t.id,
            descricao: t.descricao || "Despesa importada",
            valor: Number(t.valor),
            data: t.data_transacao || hojeStr,
            categoria: t.categoria_codigo || "outros",
            origem: "transacoes",
          });
        });
      }

      return resultado;
    },
  });
}

export function useReceitasPendentes() {
  return useQuery({
    queryKey: ["receitas-pendentes"],
    queryFn: async (): Promise<ReceitaPendente[]> => {
      const hoje = new Date();
      const hojeStr = format(hoje, "yyyy-MM-dd");
      const primeiroDiaMes = format(startOfMonth(hoje), "yyyy-MM-dd");

      const resultado: ReceitaPendente[] = [];

      // 1. Buscar parcelas pendentes da tabela parcelas_financeiras
      const { data: parcelas, error: errParcelas } = await supabase
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

      if (!errParcelas && parcelas) {
        (parcelas as any[]).forEach((p) => {
          resultado.push({
            id: p.id,
            valor: Number(p.valor),
            data_vencimento: p.data_vencimento,
            numero_parcela: p.numero_parcela,
            cliente_nome: p.acordo?.cliente?.nome_completo || undefined,
            origem: "parcelas",
          });
        });
      }

      // 2. Buscar receitas do mês atual de transacoes_financeiras
      const { data: transacoesReceitas, error: errTransacoes } = await supabase
        .from("transacoes_financeiras")
        .select("id, descricao, valor, data_transacao, subcategoria_codigo")
        .eq("tipo_codigo", "receita")
        .gte("data_transacao", primeiroDiaMes)
        .order("data_transacao", { ascending: true });

      if (!errTransacoes && transacoesReceitas) {
        transacoesReceitas.forEach((t) => {
          resultado.push({
            id: t.id,
            valor: Number(t.valor),
            data_vencimento: t.data_transacao || hojeStr,
            numero_parcela: 0,
            descricao: t.descricao || t.subcategoria_codigo || "Receita importada",
            origem: "transacoes",
          });
        });
      }

      return resultado;
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

      const itens: ItemVencimento[] = [];

      // 1. Buscar despesas vencendo (tabela despesas)
      const { data: despesas } = await supabase
        .from("despesas")
        .select("id, descricao, valor, data")
        .in("status", ["pendente", "agendado"])
        .gte("data", hojeStr)
        .lte("data", limiteStr)
        .order("data", { ascending: true });

      despesas?.forEach((d) => {
        itens.push({
          id: d.id,
          tipo: "despesa",
          descricao: d.descricao,
          valor: Number(d.valor),
          data_vencimento: d.data,
          origem: "despesas",
        });
      });

      // 2. Buscar parcelas vencendo (tabela parcelas_financeiras)
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

      (parcelas as any[] || []).forEach((p) => {
        const clienteNome = p.acordo?.cliente?.nome_completo;
        itens.push({
          id: p.id,
          tipo: "receita",
          descricao: clienteNome
            ? `${clienteNome} - Parcela ${p.numero_parcela}`
            : `Parcela ${p.numero_parcela}`,
          valor: Number(p.valor),
          data_vencimento: p.data_vencimento,
          origem: "parcelas",
        });
      });

      // 3. Buscar transações do período (despesas futuras)
      const { data: transacoesDespesas } = await supabase
        .from("transacoes_financeiras")
        .select("id, descricao, valor, data_transacao")
        .eq("tipo_codigo", "despesa")
        .gte("data_transacao", hojeStr)
        .lte("data_transacao", limiteStr)
        .order("data_transacao", { ascending: true });

      transacoesDespesas?.forEach((t) => {
        itens.push({
          id: t.id,
          tipo: "despesa",
          descricao: t.descricao || "Despesa",
          valor: Number(t.valor),
          data_vencimento: t.data_transacao || hojeStr,
          origem: "transacoes",
        });
      });

      // 4. Buscar transações do período (receitas futuras)
      const { data: transacoesReceitas } = await supabase
        .from("transacoes_financeiras")
        .select("id, descricao, valor, data_transacao, subcategoria_codigo")
        .eq("tipo_codigo", "receita")
        .gte("data_transacao", hojeStr)
        .lte("data_transacao", limiteStr)
        .order("data_transacao", { ascending: true });

      transacoesReceitas?.forEach((t) => {
        itens.push({
          id: t.id,
          tipo: "receita",
          descricao: t.descricao || t.subcategoria_codigo || "Receita",
          valor: Number(t.valor),
          data_vencimento: t.data_transacao || hojeStr,
          origem: "transacoes",
        });
      });

      // Ordenar por data
      return itens.sort((a, b) => 
        new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime()
      );
    },
  });
}