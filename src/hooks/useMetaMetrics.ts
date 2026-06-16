import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MetaKPIs, MetaChartData, PeriodoFiltro } from "@/types/meta-ads";
import { subDays, format } from "date-fns";

/**
 * Pega KPIs e chart data agregados das tabelas do Meta Ads:
 * - meta_insights_daily (level=ad) → gasto, impressoes, cliques, ctr, cpc.
 * - v_meta_lead_funnel → count de leads que entraram pelo bot a partir
 *   de anuncio (lead.ad_id IS NOT NULL OR lead.campaign_id IS NOT NULL),
 *   e quantos viraram cliente/agendado/assumido/sql_aguardando.
 *
 * Custo por lead usa o `leads` REAL do funil (que entrou pelo bot) — nao
 * o `actions.lead` do Meta — porque o que importa pra B&Z e o lead que
 * deu retorno via WhatsApp.
 */
export function useMetaMetrics(periodo: PeriodoFiltro = "30d") {
  const dias = periodo === "7d" ? 7 : periodo === "90d" ? 90 : 30;
  const hoje = new Date();
  const dataInicio = subDays(hoje, dias);
  const dataInicioStr = format(dataInicio, "yyyy-MM-dd");
  const dataFimStr = format(hoje, "yyyy-MM-dd");
  const dataInicioISO = dataInicio.toISOString();

  // 1) Insights por dia (level=ad).
  const insightsQuery = useQuery({
    queryKey: ["meta-insights-daily", periodo],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meta_insights_daily")
        .select("date, spend, impressions, clicks, link_clicks, ctr, cpc, leads")
        .eq("level", "ad")
        .gte("date", dataInicioStr)
        .lte("date", dataFimStr)
        .order("date", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Array<{
        date: string;
        spend: number | null;
        impressions: number | null;
        clicks: number | null;
        link_clicks: number | null;
        ctr: number | null;
        cpc: number | null;
        leads: number | null;
      }>;
    },
  });

  // 2) Funil de leads (do bot) — usa a view v_meta_lead_funnel.
  // Cast pra any porque a view nao esta nos types gerados.
  const funnelQuery = useQuery({
    queryKey: ["meta-lead-funnel", periodo],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("v_meta_lead_funnel")
        .select("lead_id, lead_at, converted")
        .gte("lead_at", dataInicioISO);
      if (error) throw error;
      return (data ?? []) as Array<{ lead_id: string; lead_at: string; converted: boolean }>;
    },
  });

  const insights = insightsQuery.data ?? [];
  const funnel = funnelQuery.data ?? [];

  // Agregados ----------------------------------------------------------
  const totalGasto = insights.reduce((acc, m) => acc + Number(m.spend ?? 0), 0);
  const totalCliques = insights.reduce((acc, m) => acc + Number(m.clicks ?? 0), 0);
  const totalImpressoes = insights.reduce((acc, m) => acc + Number(m.impressions ?? 0), 0);

  const totalLeadsBot = funnel.length;
  const totalConvertidos = funnel.filter((f) => f.converted).length;

  const custoLead = totalLeadsBot > 0 ? totalGasto / totalLeadsBot : 0;
  const ctr = totalImpressoes > 0 ? (totalCliques / totalImpressoes) * 100 : 0;
  const cpc = totalCliques > 0 ? totalGasto / totalCliques : 0;
  const taxaConversao = totalLeadsBot > 0 ? (totalConvertidos / totalLeadsBot) * 100 : 0;

  const kpis: MetaKPIs = {
    gasto: totalGasto,
    gastoVariacao: 0,
    leads: totalLeadsBot,
    leadsVariacao: 0,
    custoLead,
    custoLeadVariacao: 0,
    cliques: totalCliques,
    cliquesVariacao: 0,
    ctr,
    ctrVariacao: 0,
    impressoes: totalImpressoes,
    cpc,
    taxaConversao,
    leadsConvertidos: totalConvertidos,
  };

  // Chart por dia ------------------------------------------------------
  // Junta gasto (do Meta) com leads (do bot via v_meta_lead_funnel) pelo
  // dia. dia format "dd/MM" pro eixo X do recharts.
  const chartByDay = new Map<string, { gasto: number; leads: number }>();
  for (const m of insights) {
    const dia = format(new Date(m.date), "dd/MM");
    const cur = chartByDay.get(dia) ?? { gasto: 0, leads: 0 };
    cur.gasto += Number(m.spend ?? 0);
    chartByDay.set(dia, cur);
  }
  for (const f of funnel) {
    const dia = format(new Date(f.lead_at), "dd/MM");
    const cur = chartByDay.get(dia) ?? { gasto: 0, leads: 0 };
    cur.leads += 1;
    chartByDay.set(dia, cur);
  }
  // Mantem a ordem cronologica usando o primeiro encontro.
  const chartData: MetaChartData[] = Array.from(chartByDay.entries())
    .map(([data, vals]) => ({ data, gasto: vals.gasto, leads: vals.leads }))
    .sort((a, b) => {
      // "dd/MM" → ordena por mes+dia. Suficiente pra periodos curtos
      // (≤90 dias dentro do mesmo intervalo do ano).
      const [dA, mA] = a.data.split("/").map(Number);
      const [dB, mB] = b.data.split("/").map(Number);
      return mA !== mB ? mA - mB : dA - dB;
    });

  return {
    kpis,
    chartData,
    isLoading: insightsQuery.isLoading || funnelQuery.isLoading,
  };
}
