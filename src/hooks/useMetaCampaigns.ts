import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MetaCampanha, PeriodoFiltro } from "@/types/meta-ads";
import { subDays, format } from "date-fns";

/**
 * Lista campanhas com agregados de gasto/cliques/impressoes
 * (de meta_insights_daily) e contagem de leads reais (do bot, via
 * v_meta_lead_funnel).
 *
 * meta_insights_daily so guarda object_id (id do ad) com level='ad';
 * cruzamos com meta_ads pra resolver o campaign_id. Agregacao em JS pra
 * evitar criar funcao RPC.
 */
export function useMetaCampaigns(periodo: PeriodoFiltro = "90d", statusFilter: string = "todos") {
  const dias = periodo === "7d" ? 7 : periodo === "90d" ? 90 : 30;
  const hoje = new Date();
  const dataInicio = subDays(hoje, dias);
  const dataInicioStr = format(dataInicio, "yyyy-MM-dd");
  const dataFimStr = format(hoje, "yyyy-MM-dd");
  const dataInicioISO = dataInicio.toISOString();

  const query = useQuery({
    queryKey: ["meta-campaigns-aggregated", periodo, statusFilter],
    queryFn: async () => {
      // (1) Campanhas — aplica filtro de status quando != "todos"
      let qC = supabase
        .from("meta_campaigns")
        .select("id, name, status, objective");
      if (statusFilter && statusFilter !== "todos") {
        qC = qC.eq("status", statusFilter);
      }
      const { data: campaigns, error: errC } = await qC.order("name", { ascending: true });
      if (errC) throw errC;

      // (2) Ads → mapa ad_id → campaign_id
      const { data: ads, error: errA } = await supabase
        .from("meta_ads")
        .select("id, campaign_id");
      if (errA) throw errA;
      const adToCampaign = new Map<string, string | null>(
        (ads ?? []).map((a: any) => [a.id, a.campaign_id ?? null]),
      );

      // (3) Insights do periodo (level=ad)
      const { data: insights, error: errI } = await supabase
        .from("meta_insights_daily")
        .select("object_id, spend, impressions, clicks, leads")
        .eq("level", "ad")
        .gte("date", dataInicioStr)
        .lte("date", dataFimStr);
      if (errI) throw errI;

      // (4) Leads reais por campaign_id (do bot)
      const { data: funnel, error: errF } = await (supabase as any)
        .from("v_meta_lead_funnel")
        .select("campaign_id")
        .gte("lead_at", dataInicioISO);
      if (errF) throw errF;

      type Agg = {
        gasto: number;
        impressoes: number;
        cliques: number;
        leads_meta: number;
        leads_bot: number;
      };
      const agg = new Map<string, Agg>();
      const ensure = (cid: string): Agg => {
        let a = agg.get(cid);
        if (!a) {
          a = { gasto: 0, impressoes: 0, cliques: 0, leads_meta: 0, leads_bot: 0 };
          agg.set(cid, a);
        }
        return a;
      };

      for (const i of (insights ?? []) as any[]) {
        const cid = adToCampaign.get(i.object_id);
        if (!cid) continue;
        const a = ensure(cid);
        a.gasto += Number(i.spend ?? 0);
        a.impressoes += Number(i.impressions ?? 0);
        a.cliques += Number(i.clicks ?? 0);
        a.leads_meta += Number(i.leads ?? 0);
      }

      for (const f of (funnel ?? []) as Array<{ campaign_id: string | null }>) {
        if (!f.campaign_id) continue;
        const a = ensure(f.campaign_id);
        a.leads_bot += 1;
      }

      const rows: MetaCampanha[] = (campaigns ?? []).map((c: any) => {
        const a = agg.get(c.id) ?? {
          gasto: 0, impressoes: 0, cliques: 0, leads_meta: 0, leads_bot: 0,
        };
        const leads = a.leads_bot; // prefere lead real (do bot)
        const custoLead = leads > 0 ? a.gasto / leads : 0;
        const ctr = a.impressoes > 0 ? (a.cliques / a.impressoes) * 100 : 0;
        return {
          id: c.id,
          connection_id: "",
          campaign_id: c.id,
          nome: c.name ?? c.id,
          status: c.status ?? null,
          objetivo: c.objective ?? null,
          gasto: a.gasto,
          impressoes: a.impressoes,
          cliques: a.cliques,
          leads,
          custo_lead: custoLead,
          ctr,
          atualizado_em: new Date().toISOString(),
        };
      });

      rows.sort((a, b) => b.gasto - a.gasto);
      return rows;
    },
  });

  return {
    campanhas: query.data ?? [],
    isLoading: query.isLoading,
  };
}
