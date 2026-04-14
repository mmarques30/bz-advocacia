/**
 * Hooks relacionados a parcelas: vencendo, inadimplencia.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/lib/toast";
import { format, subMonths, differenceInDays, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import type { FaturamentoFiltersState } from "@/components/financeiro/FaturamentoFilters";
import { getDateRangeFromFilters } from "./_shared";

import type { ParcelaVencendo, ClienteInadimplente } from "@/types/financeiro";

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

