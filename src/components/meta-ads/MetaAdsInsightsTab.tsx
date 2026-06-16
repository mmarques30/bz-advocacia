import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MetaCampanha, PeriodoFiltro } from "@/types/meta-ads";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subDays, format } from "date-fns";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Award, AlertTriangle, TrendingUp, Zap, Activity, Minus } from "lucide-react";
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

/**
 * Tabela detalhada de analise por campanha. Une dados Meta + pipe B&Z.
 * Atualiza a cada minuto (refetchInterval) — sincronizada com o cron de
 * insights que roda no minuto 5 de cada hora.
 */
export function MetaAdsInsightsTab({ campanhas, periodo }: Props) {
  const dias = periodo === "7d" ? 7 : periodo === "90d" ? 90 : 30;
  const dataInicioISO = subDays(new Date(), dias).toISOString();
  const dataInicioStr = format(subDays(new Date(), dias), "yyyy-MM-dd");

  // Leads do bot por campaign_id + converted
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

  // Leads atribuidos pelo Meta (sum dos insights.leads por campaign via ads)
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

  const linhas = useMemo(() => {
    const pipeBy = new Map<string, { total: number; conv: number }>();
    for (const f of funnel.data ?? []) {
      if (!f.campaign_id) continue;
      const cur = pipeBy.get(f.campaign_id) ?? { total: 0, conv: 0 };
      cur.total++;
      if (f.converted) cur.conv++;
      pipeBy.set(f.campaign_id, cur);
    }
    const meta = metaLeads.data ?? new Map();

    // Calculo dos benchmarks pro veredito automatico
    const ativas = campanhas.filter((c) => c.gasto > 0 || c.leads > 0);
    const cplValidos = ativas.filter((c) => c.custo_lead > 0).map((c) => c.custo_lead);
    const cplMediano = cplValidos.length > 0
      ? [...cplValidos].sort((a, b) => a - b)[Math.floor(cplValidos.length / 2)]
      : 0;

    const rows = campanhas.map((c) => {
      const pipe = pipeBy.get(c.id) ?? { total: 0, conv: 0 };
      const lMeta = meta.get(c.id) ?? 0;
      const cplPipe = pipe.total > 0 ? c.gasto / pipe.total : 0;
      const aderencia = lMeta > 0 ? (pipe.total / lMeta) * 100 : null;
      const taxaConv = pipe.total > 0 ? (pipe.conv / pipe.total) * 100 : 0;

      let v: Verdict;
      if (c.gasto > 100 && pipe.total === 0 && c.leads === 0) {
        v = { Icon: AlertTriangle, label: "Sem conversão", tone: "warn" };
      } else if (cplMediano > 0 && c.custo_lead > 0 && c.custo_lead <= cplMediano * 0.7) {
        v = { Icon: Award, label: "CPL ótimo", tone: "good" };
      } else if (cplMediano > 0 && c.custo_lead > cplMediano * 1.5) {
        v = { Icon: AlertTriangle, label: "CPL alto", tone: "warn" };
      } else if (c.ctr > 3) {
        v = { Icon: Zap, label: "Alto engajamento", tone: "info" };
      } else if (c.gasto === 0 && c.leads === 0) {
        v = { Icon: Minus, label: "Sem dados", tone: "muted" };
      } else if (taxaConv > 50) {
        v = { Icon: TrendingUp, label: "Conversão forte", tone: "good" };
      } else {
        v = { Icon: Activity, label: "Em curso", tone: "info" };
      }

      return {
        id: c.id,
        nome: c.nome,
        status: c.status,
        objetivo: c.objetivo,
        gasto: c.gasto,
        impressoes: c.impressoes,
        cliques: c.cliques,
        ctr: c.ctr,
        leads_meta: lMeta,
        leads_pipe: pipe.total,
        cpl_meta: c.custo_lead,
        cpl_pipe: cplPipe,
        aderencia,
        convertidos: pipe.conv,
        taxa_conv: taxaConv,
        verdict: v,
      };
    });
    rows.sort((a, b) => b.gasto - a.gasto);
    return rows;
  }, [campanhas, funnel.data, metaLeads.data]);

  return (
    <Card>
      <div className="border-b px-4 py-3 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm">Análise por campanha</h3>
          <p className="text-xs text-muted-foreground">
            Cruza Meta (gasto, CPL, CTR) com pipe (leads no bot, convertidos). Atualiza a cada minuto.
          </p>
        </div>
        <Badge variant="outline" className="text-[10px]">{linhas.length} campanhas</Badge>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campanha</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Análise</TableHead>
              <TableHead className="text-right">Gasto</TableHead>
              <TableHead className="text-right">Impr.</TableHead>
              <TableHead className="text-right">CTR</TableHead>
              <TableHead className="text-right">Leads Meta</TableHead>
              <TableHead className="text-right">Leads Pipe</TableHead>
              <TableHead className="text-right">Aderência</TableHead>
              <TableHead className="text-right">CPL Meta</TableHead>
              <TableHead className="text-right">CPL Pipe</TableHead>
              <TableHead className="text-right">Conv.</TableHead>
              <TableHead className="text-right">Tx Conv.</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {linhas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={13} className="text-center text-sm text-muted-foreground py-8">
                  Sem campanhas no período — sincronize ou ajuste o filtro de status.
                </TableCell>
              </TableRow>
            ) : (
              linhas.map((l) => {
                const VIcon = l.verdict.Icon;
                return (
                  <TableRow key={l.id}>
                    <TableCell className="max-w-[260px]">
                      <p className="font-medium truncate text-sm" title={l.nome}>{l.nome}</p>
                      <p className="text-[10px] text-muted-foreground">{l.objetivo ?? "—"}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("text-[10px]", STATUS_COLORS[l.status ?? ""] ?? "")}>
                        {l.status ?? "—"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("text-[10px] gap-1", TONE_BADGE[l.verdict.tone])}>
                        <VIcon className="h-3 w-3" />
                        {l.verdict.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{l.gasto > 0 ? brl(l.gasto) : "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">{l.impressoes.toLocaleString("pt-BR")}</TableCell>
                    <TableCell className="text-right tabular-nums">{l.ctr > 0 ? `${l.ctr.toFixed(2)}%` : "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">{l.leads_meta}</TableCell>
                    <TableCell className="text-right tabular-nums font-semibold">{l.leads_pipe}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {l.aderencia != null ? `${l.aderencia.toFixed(0)}%` : "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{l.cpl_meta > 0 ? brl(l.cpl_meta) : "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">{l.cpl_pipe > 0 ? brl(l.cpl_pipe) : "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">{l.convertidos}</TableCell>
                    <TableCell className="text-right tabular-nums">{l.taxa_conv > 0 ? `${l.taxa_conv.toFixed(1)}%` : "—"}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
