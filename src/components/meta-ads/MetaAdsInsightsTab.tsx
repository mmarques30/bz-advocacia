import { MetaCampanha, PeriodoFiltro } from "@/types/meta-ads";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subDays, format } from "date-fns";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  Award, AlertTriangle, TrendingUp, Zap, Target, Compass, GitBranch, Activity, ImageIcon, Lightbulb,
} from "lucide-react";
import { LucideIcon } from "lucide-react";

interface Props {
  campanhas: MetaCampanha[];
  periodo: PeriodoFiltro;
}

function brl(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });
}

interface Insight {
  Icon: LucideIcon;
  tone: "good" | "warn" | "info" | "muted";
  area: "campanha" | "anuncio" | "pipeline" | "funil";
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
        .select("campaign_id, status_sdr, converted")
        .gte("lead_at", dataInicioISO);
      if (error) throw error;
      return (data ?? []) as Array<{ campaign_id: string | null; status_sdr: string | null; converted: boolean }>;
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

  // Top/bottom ads por gasto/CTR — pega anuncio individual
  const adsAggQuery = useQuery({
    queryKey: ["meta-insights-ads-top", periodo],
    queryFn: async () => {
      const { data: ads } = await supabase.from("meta_ads").select("id, name");
      const adNames = new Map<string, string>(
        (ads ?? []).map((a: any) => [a.id, a.name ?? a.id]),
      );
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

    // ============== CAMPANHA ==============
    if (ativas.length > 0) {
      // Top CPL real (pipe)
      const pipeByCamp = new Map<string, { total: number; conv: number }>();
      for (const f of fLeads) {
        if (!f.campaign_id) continue;
        const cur = pipeByCamp.get(f.campaign_id) ?? { total: 0, conv: 0 };
        cur.total++;
        if (f.converted) cur.conv++;
        pipeByCamp.set(f.campaign_id, cur);
      }
      const comCPL = ativas
        .map((c) => {
          const p = pipeByCamp.get(c.id) ?? { total: 0, conv: 0 };
          return { c, cplPipe: p.total > 0 ? c.gasto / p.total : 0, leadsPipe: p.total, conv: p.conv };
        })
        .filter((x) => x.cplPipe > 0);
      const topCpl = [...comCPL].sort((a, b) => a.cplPipe - b.cplPipe)[0];
      if (topCpl) {
        out.push({
          Icon: Award, tone: "good", area: "campanha",
          title: `Melhor CPL real: ${topCpl.c.nome}`,
          desc: `${brl(topCpl.cplPipe)} por lead no bot (${topCpl.leadsPipe} leads, ${brl(topCpl.c.gasto)} gastos).`,
        });
      }
      // Gastando sem converter
      const torrando = ativas.filter((c) => c.gasto > 100 && c.leads === 0)
        .sort((a, b) => b.gasto - a.gasto)[0];
      if (torrando) {
        out.push({
          Icon: AlertTriangle, tone: "warn", area: "campanha",
          title: `Sem retorno: ${torrando.nome}`,
          desc: `${brl(torrando.gasto)} gastos, zero lead. Pausar ou revisar criativo.`,
        });
      }
      // Top conversao
      const topConv = [...comCPL].filter((x) => x.leadsPipe >= 3)
        .map((x) => ({ ...x, taxa: (x.conv / x.leadsPipe) * 100 }))
        .sort((a, b) => b.taxa - a.taxa)[0];
      if (topConv && topConv.taxa > 0) {
        out.push({
          Icon: TrendingUp, tone: "good", area: "campanha",
          title: `Maior conversão: ${topConv.c.nome}`,
          desc: `${topConv.taxa.toFixed(0)}% dos ${topConv.leadsPipe} leads viraram cliente/agendado/qualificado.`,
        });
      }
    }

    // ============== ANUNCIO ==============
    if (ads.length > 0) {
      const adsComCTR = ads.filter((a) => a.impressoes > 1000);
      const melhorCtr = [...adsComCTR].sort((a, b) => b.ctr - a.ctr)[0];
      if (melhorCtr && melhorCtr.ctr > 0) {
        out.push({
          Icon: Zap, tone: "info", area: "anuncio",
          title: `Anúncio que mais engaja: ${melhorCtr.nome}`,
          desc: `CTR ${melhorCtr.ctr.toFixed(2)}% em ${melhorCtr.impressoes.toLocaleString("pt-BR")} impressões. Replicar o estilo nas outras campanhas.`,
        });
      }
      // Maior gasto sem lead
      const adRuim = ads.filter((a) => a.gasto > 50 && a.leads === 0)
        .sort((a, b) => b.gasto - a.gasto)[0];
      if (adRuim) {
        out.push({
          Icon: AlertTriangle, tone: "warn", area: "anuncio",
          title: `Anúncio sem leads: ${adRuim.nome}`,
          desc: `${brl(adRuim.gasto)} gastos sem lead. Verificar segmentação e copy.`,
        });
      }
      // Top CPL ad
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

    // ============== PIPELINE (Meta x Bot) ==============
    const totalMetaLeads = Array.from(mLeads.values()).reduce((s, v) => s + v, 0);
    const totalPipe = fLeads.length;
    if (totalMetaLeads > 0) {
      const aderencia = (totalPipe / totalMetaLeads) * 100;
      if (aderencia < 60) {
        out.push({
          Icon: Compass, tone: "warn", area: "pipeline",
          title: `Aderência baixa: ${aderencia.toFixed(0)}%`,
          desc: `Meta atribuiu ${totalMetaLeads} leads mas só ${totalPipe} chegaram ao bot. Verificar tracking ou fluxo de entrada do WhatsApp.`,
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

    // ============== FUNIL ==============
    if (totalPipe > 0) {
      const convertidos = fLeads.filter((f) => f.converted).length;
      const taxaConv = (convertidos / totalPipe) * 100;
      if (taxaConv >= 30) {
        out.push({
          Icon: GitBranch, tone: "good", area: "funil",
          title: `Conversão saudável: ${taxaConv.toFixed(0)}%`,
          desc: `${convertidos} dos ${totalPipe} leads de anúncio viraram cliente / agendado / em atendimento.`,
        });
      } else if (taxaConv < 10) {
        out.push({
          Icon: GitBranch, tone: "warn", area: "funil",
          title: `Conversão baixa: ${taxaConv.toFixed(0)}%`,
          desc: `Só ${convertidos} dos ${totalPipe} leads avançam no funil. Pode ser problema de qualificação do bot ou tempo de resposta humana.`,
        });
      } else {
        out.push({
          Icon: GitBranch, tone: "info", area: "funil",
          title: `Taxa de conversão: ${taxaConv.toFixed(1)}%`,
          desc: `${convertidos} de ${totalPipe} leads avançaram pra cliente/agendado.`,
        });
      }

      // Onde os leads estao travados
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

    // ============== ROI GERAL ==============
    if (campanhas.length > 0 && totalPipe > 0) {
      const totGasto = campanhas.reduce((s, c) => s + c.gasto, 0);
      if (totGasto > 0) {
        const cplReal = totGasto / totalPipe;
        out.push({
          Icon: Target, tone: "info", area: "pipeline",
          title: `CPL real geral: ${brl(cplReal)}`,
          desc: `${brl(totGasto)} dividido por ${totalPipe} leads que chegaram ao bot. Bate com seu Custo/Lead do header.`,
        });
      }
    }

    if (out.length === 0) {
      out.push({
        Icon: Lightbulb, tone: "muted", area: "campanha",
        title: "Sem dados suficientes",
        desc: "Aguardando sincronização dos primeiros insights do Meta. Tente novamente após o próximo cron (minuto 5 de cada hora).",
      });
    }

    // Ordena por prioridade: warn → good → info → muted
    const priori: Record<Insight["tone"], number> = { warn: 0, good: 1, info: 2, muted: 3 };
    out.sort((a, b) => priori[a.tone] - priori[b.tone]);
    return out;
  }, [campanhas, funnel.data, metaLeads.data, adsAggQuery.data]);

  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {insights.map((i, idx) => {
        const Icon = i.Icon;
        return (
          <div
            key={idx}
            className={cn("rounded-lg border p-4 flex flex-col gap-2", TONE_CLS[i.tone])}
          >
            <div className="flex items-center justify-between gap-2">
              <Icon className="h-4 w-4 shrink-0" />
              <span className="text-[10px] font-medium uppercase tracking-wide opacity-70">
                {AREA_LABEL[i.area]}
              </span>
            </div>
            <p className="font-semibold text-sm leading-tight">{i.title}</p>
            <p className="text-xs leading-snug opacity-90">{i.desc}</p>
          </div>
        );
      })}
    </div>
  );
}
