import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PeriodoFiltro } from "@/types/meta-ads";
import { subDays, format } from "date-fns";

export interface MetaAdRow {
  id: string;
  nome: string;
  status: string | null;
  campanha_nome: string | null;
  campanha_id: string | null;
  ad_set_nome: string | null;
  ad_set_id: string | null;
  criativo_titulo: string | null;
  criativo_body: string | null;
  thumbnail_url: string | null;
  image_url: string | null;
  gasto: number;
  impressoes: number;
  cliques: number;
  ctr: number;
  leads: number;
  custo_lead: number;
}

/**
 * Lista anuncios com criativo + agregados de gasto/cliques/leads no
 * periodo. Une meta_ads + meta_creatives + meta_insights_daily.
 */
export function useMetaAds(periodo: PeriodoFiltro = "90d", statusFilter: string = "todos") {
  const dias = periodo === "7d" ? 7 : periodo === "90d" ? 90 : 30;
  const hoje = new Date();
  const dataInicio = subDays(hoje, dias);
  const dataInicioStr = format(dataInicio, "yyyy-MM-dd");
  const dataFimStr = format(hoje, "yyyy-MM-dd");

  const query = useQuery({
    queryKey: ["meta-ads-aggregated", periodo, statusFilter],
    queryFn: async () => {
      let qA = supabase
        .from("meta_ads")
        .select("id, name, status, campaign_id, ad_set_id, creative_id");
      if (statusFilter && statusFilter !== "todos") {
        qA = qA.eq("status", statusFilter);
      }
      const { data: ads, error: errA } = await qA;
      if (errA) throw errA;

      // Lookup parents
      const { data: campaigns } = await supabase
        .from("meta_campaigns")
        .select("id, name");
      const campMap = new Map<string, string>((campaigns ?? []).map((c: any) => [c.id, c.name ?? c.id]));

      const { data: adSets } = await supabase
        .from("meta_ad_sets")
        .select("id, name");
      const setMap = new Map<string, string>((adSets ?? []).map((s: any) => [s.id, s.name ?? s.id]));

      const { data: creatives } = await supabase
        .from("meta_creatives")
        .select("id, title, body, thumbnail_url, image_url");
      const creativeMap = new Map<string, any>((creatives ?? []).map((c: any) => [c.id, c]));

      // Insights
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
        const cur = agg.get(i.object_id) ?? { gasto: 0, impressoes: 0, cliques: 0, leads: 0 };
        cur.gasto += Number(i.spend ?? 0);
        cur.impressoes += Number(i.impressions ?? 0);
        cur.cliques += Number(i.clicks ?? 0);
        cur.leads += Number(i.leads ?? 0);
        agg.set(i.object_id, cur);
      }

      const rows: MetaAdRow[] = (ads ?? []).map((a: any) => {
        const cre = a.creative_id ? creativeMap.get(a.creative_id) : null;
        const m = agg.get(a.id) ?? { gasto: 0, impressoes: 0, cliques: 0, leads: 0 };
        return {
          id: a.id,
          nome: a.name ?? a.id,
          status: a.status ?? null,
          campanha_nome: a.campaign_id ? (campMap.get(a.campaign_id) ?? null) : null,
          campanha_id: a.campaign_id ?? null,
          ad_set_nome: a.ad_set_id ? (setMap.get(a.ad_set_id) ?? null) : null,
          ad_set_id: a.ad_set_id ?? null,
          criativo_titulo: cre?.title ?? null,
          criativo_body: cre?.body ?? null,
          thumbnail_url: cre?.thumbnail_url ?? null,
          image_url: cre?.image_url ?? null,
          gasto: m.gasto,
          impressoes: m.impressoes,
          cliques: m.cliques,
          ctr: m.impressoes > 0 ? (m.cliques / m.impressoes) * 100 : 0,
          leads: m.leads,
          custo_lead: m.leads > 0 ? m.gasto / m.leads : 0,
        };
      });
      rows.sort((a, b) => b.gasto - a.gasto);
      return rows;
    },
  });

  return { ads: query.data ?? [], isLoading: query.isLoading };
}
