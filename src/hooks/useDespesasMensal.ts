import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DespesaMensal {
  mes: string;
  despesas: number;
}

export function useDespesasMensal(meses: number = 12) {
  return useQuery({
    queryKey: ['despesas-mensal', meses],
    queryFn: async () => {
      const hoje = new Date();
      const mesesAtras = subMonths(hoje, meses - 1);
      const inicio = startOfMonth(mesesAtras).toISOString().split('T')[0];
      const fim = endOfMonth(hoje).toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('despesas')
        .select('data, valor')
        .gte('data', inicio)
        .lte('data', fim);

      if (error) throw error;

      // Agrupar por mês
      const despesasPorMes: Record<string, number> = {};

      for (let i = 0; i < meses; i++) {
        const mes = subMonths(hoje, meses - 1 - i);
        const mesKey = format(mes, 'MMM/yy', { locale: ptBR });
        despesasPorMes[mesKey] = 0;
      }

      (data || []).forEach(despesa => {
        const mes = format(new Date(despesa.data), 'MMM/yy', { locale: ptBR });
        if (despesasPorMes[mes] !== undefined) {
          despesasPorMes[mes] += Number(despesa.valor);
        }
      });

      return Object.entries(despesasPorMes).map(([mes, despesas]) => ({
        mes,
        despesas,
      })) as DespesaMensal[];
    },
  });
}
