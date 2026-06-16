import { Badge } from "@/components/ui/badge";
import { MetaCampanha, PeriodoFiltro } from "@/types/meta-ads";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subDays, format } from "date-fns";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Award, AlertTriangle, TrendingUp, Zap, Activity, Minus, Lightbulb } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface Props {
  campanhas: MetaCampanha[];
  periodo: PeriodoFiltro;
}

function brl(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-800 border-emerald-300",
  PAUSED: "bg-yellow-100 text-yellow-800 border-yellow-300",
  DELETED: "bg-gray-100 text-gray-600 border-gray-200",
  ARCHIVED: "bg-gray-100 text-gray-600 border-gray-200",
};

interface Verdict {
  Icon: LucideIcon;
  label: string;
  tone: "good" | "warn" | "info" | "muted";
}

const TONE_BADGE: Record<Verdict["tone"], string> = {
  good: "bg-emerald-100 text-emerald-800 border-emerald-300",
  warn: "bg-amber-100 text-amber-900 border-amber-300",
  info: "bg-blue-100 text-blue-800 border-blue-300",
  muted: "bg-gray-100 text-gray-600 border-gray-200",
};

const TONE_CARD: Record<Verdict["tone"], string> = {
  good: "border-l-emerald-400",
  warn: "border-l-amber-400",
  info: "border-l-blue-400",
  muted: "border-l-gray-300",
};

/**
 * Para cada campanha, exibe analise narrativa + recomendacao baseada em
 * heuristicas (CPL vs mediano, taxa de conversao, aderencia Meta x Pipe,
 * CTR). Nao e uma tabela — e uma sequencia de cards explicativos pra
 * direcionar acoes.
 */
export function MetaAdsInsightsTab({ campanhas, periodo }: Props) {
  const dias = periodo === "7d" ? 7 : periodo === "90d" ? 90 : 30;
  const dataInicioISO = subDays(new Date(), dias).toISOString();
  const dataInicioStr = format(subDays(new Date(), dias), "yyyy-MM-dd");

  const funnel = useQuery({
    queryKey: ["meta-insights-tab-funnel", periodo],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("v_meta_lead_funnel")
        .select("campaign_id, converted")
        .gte("lead_at", dataInicioISO);
      if (error) throw error;
      return (data ?? []) as Array<{ campaign_id: string | null; converted: boolean }>;
    },
    refetchInterval: 60_000,
  });

  const metaLeads = useQuery({
    queryKey: ["meta-insights-tab-meta-leads", periodo],
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

  const cards = useMemo(() => {
    const pipeBy = new Map<string, { total: number; conv: number }>();
    for (const f of funnel.data ?? []) {
      if (!f.campaign_id) continue;
      const c = pipeBy.get(f.campaign_id) ?? { total: 0, conv: 0 };
      c.total++;
      if (f.converted) c.conv++;
      pipeBy.set(f.campaign_id, c);
    }
    const meta = metaLeads.data ?? new Map<string, number>();

    const cplValidos = campanhas
      .map((c) => {
        const pipe = pipeBy.get(c.id) ?? { total: 0, conv: 0 };
        return pipe.total > 0 ? c.gasto / pipe.total : 0;
      })
      .filter((v) => v > 0);
    const cplMediano = cplValidos.length > 0
      ? [...cplValidos].sort((a, b) => a - b)[Math.floor(cplValidos.length / 2)]
      : 0;

    const rows = campanhas.map((c) => {
      const pipe = pipeBy.get(c.id) ?? { total: 0, conv: 0 };
      const lMeta = meta.get(c.id) ?? 0;
      const cplPipe = pipe.total > 0 ? c.gasto / pipe.total : 0;
      const aderencia = lMeta > 0 ? (pipe.total / lMeta) * 100 : null;
      const taxaConv = pipe.total > 0 ? (pipe.conv / pipe.total) * 100 : 0;

      // Veredict + recomendacao narrativa
      let v: Verdict;
      let recomendacao: string | null = null;

      if (c.gasto > 100 && pipe.total === 0 && lMeta === 0) {
        v = { Icon: AlertTriangle, label: "Sem conversão", tone: "warn" };
        recomendacao = "Gastou sem nenhum lead. Revise o criativo, segmentação ou pause a campanha.";
      } else if (cplMediano > 0 && cplPipe > 0 && cplPipe <= cplMediano * 0.7) {
        v = { Icon: Award, label: "CPL ótimo", tone: "good" };
        recomendacao = `CPL real ${brl(cplPipe)} está bem abaixo da média (${brl(cplMediano)}). Considere ampliar o budget.`;
      } else if (cplMediano > 0 && cplPipe > cplMediano * 1.5) {
        v = { Icon: AlertTriangle, label: "CPL alto", tone: "warn" };
        recomendacao = `CPL real ${brl(cplPipe)} está acima da média (${brl(cplMediano)}). Teste novo criativo ou ajuste segmentação.`;
      } else if (taxaConv >= 50) {
        v = { Icon: TrendingUp, label: "Conversão forte", tone: "good" };
        recomendacao = `${pipe.conv} de ${pipe.total} leads convertidos (${taxaConv.toFixed(0)}%). Mantém o ritmo.`;
      } else if (c.ctr > 3) {
        v = { Icon: Zap, label: "Alto engajamento", tone: "info" };
        recomendacao = `CTR ${c.ctr.toFixed(2)}% em ${c.impressoes.toLocaleString("pt-BR")} impressões. Considere replicar o criativo em outras campanhas.`;
      } else if (aderencia != null && aderencia < 50 && lMeta >= 10) {
        v = { Icon: AlertTriangle, label: "Aderência baixa", tone: "warn" };
        recomendacao = `Meta atribuiu ${lMeta} leads mas só ${pipe.total} chegaram ao bot (${aderencia.toFixed(0)}%). Verifique o tracking ou o fluxo de entrada.`;
      } else if (c.gasto === 0 && lMeta === 0 && pipe.total === 0) {
        v = { Icon: Minus, label: "Sem dados", tone: "muted" };
        recomendacao = null;
      } else {
        v = { Icon: Activity, label: "Em curso", tone: "info" };
        recomendacao = null;
      }

      // Analise narrativa (descreve o cenario)
      const partes: string[] = [];
      partes.push(`Investiu ${c.gasto > 0 ? brl(c.gasto) : "R$ 0,00"}`);
      partes.push(`${c.impressoes.toLocaleString("pt-BR")} impressões`);
      if (c.cliques > 0) partes.push(`${c.cliques.toLocaleString("pt-BR")} cliques (CTR ${c.ctr.toFixed(2)}%)`);
      if (lMeta > 0) partes.push(`Meta atribuiu ${lMeta} leads`);
      if (pipe.total > 0) partes.push(`${pipe.total} chegaram ao bot`);
      if (pipe.conv > 0) partes.push(`${pipe.conv} convertidos`);
      const analise = partes.join(" • ") + ".";

      return {
        id: c.id,
        nome: c.nome,
        status: c.status,
        objetivo: c.objetivo,
        verdict: v,
        analise,
        recomendacao,
        gasto: c.gasto,
        leads_pipe: pipe.total,
        cpl_pipe: cplPipe,
        aderencia,
      };
    });

    // Prioriza warnings, depois good, depois resto. Tudo ordenado por gasto desc.
    const prioridade: Record<Verdict["tone"], number> = { warn: 0, good: 1, info: 2, muted: 3 };
    rows.sort((a, b) => {
      const pa = prioridade[a.verdict.tone];
      const pb = prioridade[b.verdict.tone];
      if (pa !== pb) return pa - pb;
      return b.gasto - a.gasto;
    });
    return rows;
  }, [campanhas, funnel.data, metaLeads.data]);

  if (cards.length === 0) {
    return (
      <div className="rounded-lg border bg-muted/40 p-8 text-center text-sm text-muted-foreground">
        Sem campanhas no período.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {cards.map((c) => {
        const VIcon = c.verdict.Icon;
        return (
          <div
            key={c.id}
            className={cn(
              "rounded-lg border-l-4 border border-l-4 bg-muted/40 p-4 space-y-2",
              TONE_CARD[c.verdict.tone],
            )}
          >
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-semibold text-sm truncate" title={c.nome}>{c.nome}</h4>
                  <Badge variant="outline" className={cn("text-[10px]", STATUS_COLORS[c.status ?? ""] ?? "")}>
                    {c.status ?? "—"}
                  </Badge>
                  {c.objetivo && (
                    <span className="text-[10px] text-muted-foreground">{c.objetivo}</span>
                  )}
                </div>
              </div>
              <Badge variant="outline" className={cn("text-[10px] gap-1 shrink-0", TONE_BADGE[c.verdict.tone])}>
                <VIcon className="h-3 w-3" />
                {c.verdict.label}
              </Badge>
            </div>

            <p className="text-xs text-muted-foreground leading-snug">{c.analise}</p>

            {c.recomendacao && (
              <div className="flex items-start gap-2 rounded-md bg-background border border-border p-2.5">
                <Lightbulb className="h-3.5 w-3.5 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-xs leading-snug">{c.recomendacao}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
