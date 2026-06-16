import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PeriodoFiltro } from "@/types/meta-ads";
import { subDays, format } from "date-fns";

export interface MetaAdSetRow {
  id: string;
  nome: string;
  status: string | null;
  campanha_nome: string | null;
  campanha_id: string | null;
  gasto: number;
  impressoes: number;
  cliques: number;
  ctr: number;
  leads: number;
  custo_lead: number;
}

/**
 * Agrega meta_ad_sets + meta_insights_daily por ad_set_id. Leads vem do
 * meta_insights_daily.leads (action 'lead'/'onsite_conversion.lead_grouped').
 * Para leads reais (do bot) por ad_set, seria preciso adicionar adset_id
 * na view v_meta_lead_funnel — fica pra futuro se precisar.
 */
export function useMetaAdSets(periodo: PeriodoFiltro = "90d") {
  const dias = periodo === "7d" ? 7 : periodo === "90d" ? 90 : 30;
  const hoje = new Date();
  const dataInicio = subDays(hoje, dias);
  const dataInicioStr = format(dataInicio, "yyyy-MM-dd");
  const dataFimStr = format(hoje, "yyyy-MM-dd");

  const query = useQuery({
    queryKey: ["meta-adsets-aggregated", periodo],
    queryFn: async () => {
      const { data: adSets, error: errS } = await supabase
        .from("meta_ad_sets")
        .select("id, name, status, campaign_id");
      if (errS) throw errS;

      const { data: campaigns, error: errC } = await supabase
        .from("meta_campaigns")
        .select("id, name");
      if (errC) throw errC;
      const campMap = new Map<string, string>((campaigns ?? []).map((c: any) => [c.id, c.name ?? c.id]));

      const { data: ads, error: errA } = await supabase
        .from("meta_ads")
        .select("id, ad_set_id");
      if (errA) throw errA;
      const adToAdSet = new Map<string, string | null>(
        (ads ?? []).map((a: any) => [a.id, a.ad_set_id ?? null]),
      );

      const { data: insights, error: errI } = await supabase
        .from("meta_insights_daily")
        .select("object_id, spend, impressions, clicks, leads")
        .eq("level", "ad")
        .gte("date", dataInicioStr)
        .lte("date", dataFimStr);
      if (errI) throw errI;

      type Agg = { gasto: number; impressoes: number; cliques: number; leads: number };
      const agg = new Map<string, Agg>();
      for (const i of (insights ?? []) as any[]) {
        const setId = adToAdSet.get(i.object_id);
        if (!setId) continue;
        const cur = agg.get(setId) ?? { gasto: 0, impressoes: 0, cliques: 0, leads: 0 };
        cur.gasto += Number(i.spend ?? 0);
        cur.impressoes += Number(i.impressions ?? 0);
        cur.cliques += Number(i.clicks ?? 0);
        cur.leads += Number(i.leads ?? 0);
        agg.set(setId, cur);
      }

      const rows: MetaAdSetRow[] = (adSets ?? []).map((s: any) => {
        const a = agg.get(s.id) ?? { gasto: 0, impressoes: 0, cliques: 0, leads: 0 };
        return {
          id: s.id,
          nome: s.name ?? s.id,
          status: s.status ?? null,
          campanha_nome: s.campaign_id ? (campMap.get(s.campaign_id) ?? null) : null,
          campanha_id: s.campaign_id ?? null,
          gasto: a.gasto,
          impressoes: a.impressoes,
          cliques: a.cliques,
          ctr: a.impressoes > 0 ? (a.cliques / a.impressoes) * 100 : 0,
          leads: a.leads,
          custo_lead: a.leads > 0 ? a.gasto / a.leads : 0,
        };
      });
      rows.sort((a, b) => b.gasto - a.gasto);
      return rows;
    },
  });

  return { adSets: query.data ?? [], isLoading: query.isLoading };
}
