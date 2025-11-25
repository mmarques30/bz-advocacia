import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MetaMetrica, MetaKPIs, MetaChartData, PeriodoFiltro } from "@/types/meta-ads";
import { subDays, format } from "date-fns";

export function useMetaMetrics(periodo: PeriodoFiltro = "30d") {
  const getDates = () => {
    const hoje = new Date();
    let dias = 30;
    
    if (periodo === "7d") dias = 7;
    else if (periodo === "90d") dias = 90;
    
    return {
      dataInicio: format(subDays(hoje, dias), "yyyy-MM-dd"),
      dataFim: format(hoje, "yyyy-MM-dd"),
      diasAnteriores: dias,
    };
  };

  const { data: metricas, isLoading } = useQuery({
    queryKey: ["meta-metrics", periodo],
    queryFn: async () => {
      const { dataInicio, dataFim } = getDates();
      
      const { data, error } = await supabase
        .from("meta_metricas")
        .select("*")
        .gte("data_referencia", dataInicio)
        .lte("data_referencia", dataFim)
        .order("data_referencia", { ascending: true });

      if (error) throw error;
      return data as MetaMetrica[];
    },
  });

  const calcularKPIs = (): MetaKPIs => {
    if (!metricas || metricas.length === 0) {
      // Dados de demonstração
      return {
        gasto: 3450.00,
        gastoVariacao: 8,
        leads: 127,
        leadsVariacao: 15,
        custoLead: 27.17,
        custoLeadVariacao: -6,
        cliques: 3847,
        cliquesVariacao: 10,
        ctr: 2.65,
        ctrVariacao: -0.2,
        impressoes: 145320,
        cpc: 0.89,
      };
    }

    const totalGasto = metricas.reduce((acc, m) => acc + (m.gasto || 0), 0);
    const totalLeads = metricas.reduce((acc, m) => acc + (m.leads || 0), 0);
    const totalCliques = metricas.reduce((acc, m) => acc + (m.cliques || 0), 0);
    const totalImpressoes = metricas.reduce((acc, m) => acc + (m.impressoes || 0), 0);

    const custoLead = totalLeads > 0 ? totalGasto / totalLeads : 0;
    const ctr = totalImpressoes > 0 ? (totalCliques / totalImpressoes) * 100 : 0;
    const cpc = totalCliques > 0 ? totalGasto / totalCliques : 0;

    return {
      gasto: totalGasto,
      gastoVariacao: 8,
      leads: totalLeads,
      leadsVariacao: 15,
      custoLead,
      custoLeadVariacao: -6,
      cliques: totalCliques,
      cliquesVariacao: 10,
      ctr,
      ctrVariacao: -0.2,
      impressoes: totalImpressoes,
      cpc,
    };
  };

  const getChartData = (): MetaChartData[] => {
    if (!metricas || metricas.length === 0) {
      // Dados de demonstração para últimos 7 dias
      const dados: MetaChartData[] = [];
      for (let i = 6; i >= 0; i--) {
        const data = format(subDays(new Date(), i), "dd/MM");
        dados.push({
          data,
          gasto: Math.random() * 200 + 300,
          leads: Math.floor(Math.random() * 10 + 15),
        });
      }
      return dados;
    }

    return metricas.map((m) => ({
      data: format(new Date(m.data_referencia), "dd/MM"),
      gasto: m.gasto || 0,
      leads: m.leads || 0,
    }));
  };

  return {
    metricas,
    kpis: calcularKPIs(),
    chartData: getChartData(),
    isLoading,
  };
}
