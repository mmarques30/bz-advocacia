import { MetaCampanha, PeriodoFiltro } from "@/types/meta-ads";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subDays, format } from "date-fns";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  Award, AlertTriangle, TrendingUp, Zap, Target, Compass, GitBranch, Activity, ImageIcon,
  Lightbulb, Eye, MousePointerClick, DollarSign,
} from "lucide-react";
import { LucideIcon } from "lucide-react";

interface Props {
  campanhas: MetaCampanha[];
  periodo: PeriodoFiltro;
}

function brl(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });
}
function num(v: number) {
  return v.toLocaleString("pt-BR");
}

interface Insight {
  Icon: LucideIcon;
  tone: "good" | "warn" | "info" | "muted";
  area: "campanha" | "anuncio" | "pipeline" | "funil" | "geral";
  title: string;
  desc: string;
}

const TONE_CLS: Record<Insight["tone"], string> = {
  good: "bg-emerald-50 border-emerald-200 text-emerald-900",
  warn: "bg-amber-50 border-amber-200 text-amber-900",
  info: "bg-blue-50 border-blue-200 text-blue-900",
  muted: "bg-gray-50 border-gray-200 text-gray-800",
};

const AREA_LABEL: Record<Insight["area"], string> = {
  campanha: "Campanha",
  anuncio: "Anúncio",
  pipeline: "Pipeline",
  funil: "Funil",
  geral: "Geral",
};

export function MetaAdsInsightsTab({ campanhas, periodo }: Props) {
  const dias = periodo === "7d" ? 7 : periodo === "90d" ? 90 : 30;
  const dataInicioISO = subDays(new Date(), dias).toISOString();
  const dataInicioStr = format(subDays(new Date(), dias), "yyyy-MM-dd");

  const funnel = useQuery({
    queryKey: ["meta-insights-funnel", periodo],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("v_meta_lead_funnel")
        .select("campaign_id, status_sdr, converted, em_pipeline")
        .gte("lead_at", dataInicioISO);
      if (error) throw error;
      return (data ?? []) as Array<{
        campaign_id: string | null;
        status_sdr: string | null;
        converted: boolean;
        em_pipeline: boolean;
      }>;
    },
    refetchInterval: 60_000,
  });

  const metaLeads = useQuery({
    queryKey: ["meta-insights-meta-leads", periodo],
    queryFn: async () => {
      const { data: ads } = await supabase.from("meta_ads").select("id, campaign_id");
      const adMap = new Map<string, string>(
        (ads ?? []).filter((a: any) => a.campaign_id).map((a: any) => [a.id, a.campaign_id]),
      );
      const { data: ins } = await supabase
        .from("meta_insights_daily")
        .select("object_id, leads")
        .eq("level", "ad")
        .gte("date", dataInicioStr)
        .not("leads", "is", null);
      const m = new Map<string, number>();
      for (const r of (ins ?? []) as any[]) {
        const cid = adMap.get(r.object_id);
        if (!cid) continue;
        m.set(cid, (m.get(cid) ?? 0) + Number(r.leads ?? 0));
      }
      return m;
    },
    refetchInterval: 60_000,
  });

  const adsAggQuery = useQuery({
    queryKey: ["meta-insights-ads-top", periodo],
    queryFn: async () => {
      const { data: ads } = await supabase.from("meta_ads").select("id, name");
      const adNames = new Map<string, string>((ads ?? []).map((a: any) => [a.id, a.name ?? a.id]));
      const { data: ins } = await supabase
        .from("meta_insights_daily")
        .select("object_id, spend, impressions, clicks, leads")
        .eq("level", "ad")
        .gte("date", dataInicioStr);
      const agg = new Map<string, { gasto: number; imp: number; clk: number; leads: number }>();
      for (const r of (ins ?? []) as any[]) {
        const cur = agg.get(r.object_id) ?? { gasto: 0, imp: 0, clk: 0, leads: 0 };
        cur.gasto += Number(r.spend ?? 0);
        cur.imp += Number(r.impressions ?? 0);
        cur.clk += Number(r.clicks ?? 0);
        cur.leads += Number(r.leads ?? 0);
        agg.set(r.object_id, cur);
      }
      return Array.from(agg.entries()).map(([id, v]) => ({
        id,
        nome: adNames.get(id) ?? id,
        gasto: v.gasto,
        impressoes: v.imp,
        cliques: v.clk,
        ctr: v.imp > 0 ? (v.clk / v.imp) * 100 : 0,
        leads: v.leads,
      }));
    },
    refetchInterval: 60_000,
  });

  const insights = useMemo<Insight[]>(() => {
    const out: Insight[] = [];
    const ativas = campanhas.filter((c) => c.gasto > 0 || c.leads > 0);
    const ads = adsAggQuery.data ?? [];
    const fLeads = funnel.data ?? [];
    const mLeads = metaLeads.data ?? new Map<string, number>();

    // ============ CAMPANHA ============
    if (ativas.length > 0) {
      const pipeByCamp = new Map<string, { total: number; conv: number; emPipe: number }>();
      for (const f of fLeads) {
        if (!f.campaign_id) continue;
        const cur = pipeByCamp.get(f.campaign_id) ?? { total: 0, conv: 0, emPipe: 0 };
        cur.total++;
        if (f.converted) cur.conv++;
        if (f.em_pipeline) cur.emPipe++;
        pipeByCamp.set(f.campaign_id, cur);
      }
      const comCPL = ativas
        .map((c) => {
          const p = pipeByCamp.get(c.id) ?? { total: 0, conv: 0, emPipe: 0 };
          return { c, cplPipe: p.total > 0 ? c.gasto / p.total : 0, leadsPipe: p.total, conv: p.conv, emPipe: p.emPipe };
        })
        .filter((x) => x.cplPipe > 0);
      const topCpl = [...comCPL].sort((a, b) => a.cplPipe - b.cplPipe)[0];
      if (topCpl) {
        out.push({
          Icon: Award, tone: "good", area: "campanha",
          title: `Melhor CPL real: ${topCpl.c.nome}`,
          desc: `${brl(topCpl.cplPipe)} por lead no bot — ${topCpl.leadsPipe} leads, ${brl(topCpl.c.gasto)} gastos.`,
        });
      }
      const torrando = ativas.filter((c) => c.gasto > 100 && c.leads === 0)
        .sort((a, b) => b.gasto - a.gasto)[0];
      if (torrando) {
        out.push({
          Icon: AlertTriangle, tone: "warn", area: "campanha",
          title: `Sem retorno: ${torrando.nome}`,
          desc: `${brl(torrando.gasto)} gastos, zero lead. Pausar ou revisar criativo.`,
        });
      }
      // Top conversao real (=cliente fechado)
      const topConv = [...comCPL].filter((x) => x.leadsPipe >= 3)
        .map((x) => ({ ...x, taxa: (x.conv / x.leadsPipe) * 100 }))
        .sort((a, b) => b.taxa - a.taxa)[0];
      if (topConv && topConv.conv > 0) {
        out.push({
          Icon: TrendingUp, tone: "good", area: "campanha",
          title: `Maior conversão real: ${topConv.c.nome}`,
          desc: `${topConv.conv} de ${topConv.leadsPipe} leads viraram cliente (${topConv.taxa.toFixed(0)}%).`,
        });
      }
      // Top "em pipeline" (qualificados, agendados, em atendimento)
      const topPipe = [...comCPL].filter((x) => x.emPipe >= 3 && x.conv === 0)
        .sort((a, b) => (b.emPipe / b.leadsPipe) - (a.emPipe / a.leadsPipe))[0];
      if (topPipe) {
        const pctPipe = (topPipe.emPipe / topPipe.leadsPipe) * 100;
        out.push({
          Icon: Activity, tone: "info", area: "pipeline",
          title: `Pipeline forte: ${topPipe.c.nome}`,
          desc: `${topPipe.emPipe} de ${topPipe.leadsPipe} leads avançaram (${pctPipe.toFixed(0)}%) mas ainda não fecharam. Cabe acelerar o atendimento.`,
        });
      }
    }

    // ============ ANUNCIO ============
    if (ads.length > 0) {
      const adsComCTR = ads.filter((a) => a.impressoes > 1000);
      const melhorCtr = [...adsComCTR].sort((a, b) => b.ctr - a.ctr)[0];
      if (melhorCtr && melhorCtr.ctr > 0) {
        out.push({
          Icon: Zap, tone: "info", area: "anuncio",
          title: `Anúncio que mais engaja: ${melhorCtr.nome}`,
          desc: `CTR ${melhorCtr.ctr.toFixed(2)}% em ${num(melhorCtr.impressoes)} impressões. Replicar o estilo nas outras campanhas.`,
        });
      }
      const adRuim = ads.filter((a) => a.gasto > 50 && a.leads === 0)
        .sort((a, b) => b.gasto - a.gasto)[0];
      if (adRuim) {
        out.push({
          Icon: AlertTriangle, tone: "warn", area: "anuncio",
          title: `Anúncio sem leads: ${adRuim.nome}`,
          desc: `${brl(adRuim.gasto)} gastos sem lead. Verificar segmentação e copy.`,
        });
      }
      const adsComLead = ads.filter((a) => a.leads > 0)
        .map((a) => ({ ...a, cpl: a.gasto / a.leads }));
      const topAdCpl = [...adsComLead].sort((a, b) => a.cpl - b.cpl)[0];
      if (topAdCpl) {
        out.push({
          Icon: ImageIcon, tone: "good", area: "anuncio",
          title: `Anúncio mais eficiente: ${topAdCpl.nome}`,
          desc: `${brl(topAdCpl.cpl)} por lead em ${topAdCpl.leads} leads gerados.`,
        });
      }
    }

    // ============ PIPELINE (Meta x Bot) ============
    const totalMetaLeads = Array.from(mLeads.values()).reduce((s, v) => s + v, 0);
    const totalPipe = fLeads.length;
    if (totalMetaLeads > 0) {
      const aderencia = (totalPipe / totalMetaLeads) * 100;
      if (aderencia < 60) {
        out.push({
          Icon: Compass, tone: "warn", area: "pipeline",
          title: `Aderência baixa: ${aderencia.toFixed(0)}%`,
          desc: `Meta atribuiu ${totalMetaLeads} leads mas só ${totalPipe} chegaram ao bot. Verificar tracking ou fluxo do WhatsApp.`,
        });
      } else if (aderencia >= 90) {
        out.push({
          Icon: Compass, tone: "good", area: "pipeline",
          title: `Aderência excelente: ${aderencia.toFixed(0)}%`,
          desc: `Quase todos os leads que o Meta atribui chegam ao bot (${totalPipe}/${totalMetaLeads}). Tracking confiável.`,
        });
      } else {
        out.push({
          Icon: Compass, tone: "info", area: "pipeline",
          title: `Aderência média: ${aderencia.toFixed(0)}%`,
          desc: `${totalPipe} dos ${totalMetaLeads} leads atribuídos pelo Meta chegaram ao bot.`,
        });
      }
    }

    // ============ FUNIL ============
    if (totalPipe > 0) {
      const convertidos = fLeads.filter((f) => f.converted).length; // SO clientes
      const emPipe = fLeads.filter((f) => f.em_pipeline && !f.converted).length;
      const taxaConv = (convertidos / totalPipe) * 100;
      const taxaPipe = (emPipe / totalPipe) * 100;

      if (convertidos > 0) {
        out.push({
          Icon: GitBranch, tone: "good", area: "funil",
          title: `${convertidos} leads viraram cliente`,
          desc: `${taxaConv.toFixed(1)}% dos ${totalPipe} leads de anúncio fecharam. ${emPipe} ainda no pipeline (${taxaPipe.toFixed(0)}%).`,
        });
      } else if (emPipe > 0) {
        out.push({
          Icon: GitBranch, tone: "info", area: "funil",
          title: `${emPipe} leads no pipeline`,
          desc: `Ainda nenhum fechou cliente, mas ${emPipe} estão avançando (${taxaPipe.toFixed(0)}%). Acelerar o atendimento pra fechar.`,
        });
      }

      const byStage = new Map<string, number>();
      for (const f of fLeads) {
        const k = f.status_sdr ?? "sem_status";
        byStage.set(k, (byStage.get(k) ?? 0) + 1);
      }
      const aguardando = byStage.get("sql_aguardando_humano") ?? 0;
      if (aguardando >= 5) {
        out.push({
          Icon: AlertTriangle, tone: "warn", area: "funil",
          title: `${aguardando} leads aguardando atendimento`,
          desc: `Bot já qualificou e está esperando humano. Cada dia parado aqui é lead esfriando.`,
        });
      }
    }

    // ============ GERAL (preenche pra garantir min 5) ============
    if (campanhas.length > 0 && totalPipe > 0) {
      const totGasto = campanhas.reduce((s, c) => s + c.gasto, 0);
      if (totGasto > 0) {
        const cplReal = totGasto / totalPipe;
        out.push({
          Icon: Target, tone: "info", area: "geral",
          title: `CPL real geral: ${brl(cplReal)}`,
          desc: `${brl(totGasto)} dividido por ${totalPipe} leads que chegaram ao bot.`,
        });
      }
    }

    // Fillers genericos pra atingir minimo 5 insights, se faltarem.
    const totalImpressoes = ads.reduce((s, a) => s + a.impressoes, 0);
    const totalCliques = ads.reduce((s, a) => s + a.cliques, 0);
    const totalGastoAds = ads.reduce((s, a) => s + a.gasto, 0);
    const adsAtivos = ads.filter((a) => a.gasto > 0).length;
    const fillers: Insight[] = [];
    if (totalImpressoes > 0) {
      fillers.push({
        Icon: Eye, tone: "muted", area: "geral",
        title: `Alcance: ${num(totalImpressoes)} impressões`,
        desc: `${num(totalCliques)} cliques no período (CTR ${totalImpressoes > 0 ? ((totalCliques / totalImpressoes) * 100).toFixed(2) : "—"}%).`,
      });
    }
    if (totalGastoAds > 0) {
      fillers.push({
        Icon: DollarSign, tone: "muted", area: "geral",
        title: `Investimento total: ${brl(totalGastoAds)}`,
        desc: `Distribuído entre ${adsAtivos} anúncios com gasto > 0.`,
      });
    }
    if (totalCliques > 0) {
      fillers.push({
        Icon: MousePointerClick, tone: "muted", area: "geral",
        title: `${num(totalCliques)} cliques no período`,
        desc: `Custo médio por clique: ${totalGastoAds > 0 ? brl(totalGastoAds / totalCliques) : "—"}.`,
      });
    }
    // Adiciona filler so se faltar p/ atingir 5
    let i = 0;
    while (out.length < 5 && i < fillers.length) {
      const f = fillers[i++];
      if (!out.some((x) => x.title === f.title)) out.push(f);
    }
    if (out.length === 0) {
      out.push({
        Icon: Lightbulb, tone: "muted", area: "geral",
        title: "Sem dados suficientes",
        desc: "Aguardando sincronização dos primeiros insights do Meta. Tente novamente após o próximo cron.",
      });
    }

    // Ordena: warn → good → info → muted (acionaveis primeiro)
    const priori: Record<Insight["tone"], number> = { warn: 0, good: 1, info: 2, muted: 3 };
    out.sort((a, b) => priori[a.tone] - priori[b.tone]);
    return out;
  }, [campanhas, funnel.data, metaLeads.data, adsAggQuery.data]);

  return (
    <div className="space-y-2">
      {insights.map((i, idx) => {
        const Icon = i.Icon;
        return (
          <div
            key={idx}
            className={cn(
              "rounded-lg border px-4 py-3 flex items-center gap-4",
              TONE_CLS[i.tone],
            )}
          >
            <Icon className="h-5 w-5 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm leading-tight truncate" title={i.title}>{i.title}</p>
              <p className="text-xs leading-snug opacity-90 mt-0.5">{i.desc}</p>
            </div>
            <span className="text-[10px] font-medium uppercase tracking-wide opacity-70 shrink-0">
              {AREA_LABEL[i.area]}
            </span>
          </div>
        );
      })}
    </div>
  );
}
