import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PeriodoFiltro } from "@/types/meta-ads";
import { subDays, format } from "date-fns";
import { useMemo } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from "recharts";
import { Eye, MousePointerClick, Users, Repeat, Activity, Target } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface Props { periodo: PeriodoFiltro; }

interface InsightRow {
  date: string;
  spend: number | null;
  impressions: number | null;
  reach: number | null;
  frequency: number | null;
  clicks: number | null;
  link_clicks: number | null;
  ctr: number | null;
  cpc: number | null;
  leads: number | null;
}

function fmtNum(v: number) { return v.toLocaleString("pt-BR"); }
function fmtBRL(v: number) { return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }

function Kpi({ label, value, sub, Icon }: { label: string; value: string; sub?: string; Icon: LucideIcon }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <div className="rounded-lg bg-muted p-2"><Icon className="h-4 w-4 text-muted-foreground" /></div>
      </div>
      <p className="text-2xl font-bold mt-2">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </Card>
  );
}

export function MetaAdsPerformanceTab({ periodo }: Props) {
  const dias = periodo === "7d" ? 7 : periodo === "90d" ? 90 : 30;
  const hoje = new Date();
  const dataInicioStr = format(subDays(hoje, dias), "yyyy-MM-dd");
  const dataFimStr = format(hoje, "yyyy-MM-dd");

  const { data, isLoading } = useQuery({
    queryKey: ["meta-performance-tab", periodo],
    queryFn: async (): Promise<InsightRow[]> => {
      const { data, error } = await supabase
        .from("meta_insights_daily")
        .select("date, spend, impressions, reach, frequency, clicks, link_clicks, ctr, cpc, leads")
        .eq("level", "ad")
        .gte("date", dataInicioStr)
        .lte("date", dataFimStr)
        .order("date", { ascending: true });
      if (error) throw error;
      return (data ?? []) as InsightRow[];
    },
  });

  const insights = data ?? [];

  const agg = useMemo(() => {
    let spend = 0, impressions = 0, clicks = 0, link_clicks = 0, leads = 0;
    let reachSum = 0, freqSum = 0, freqN = 0;
    for (const r of insights) {
      spend += Number(r.spend ?? 0);
      impressions += Number(r.impressions ?? 0);
      clicks += Number(r.clicks ?? 0);
      link_clicks += Number(r.link_clicks ?? 0);
      leads += Number(r.leads ?? 0);
      reachSum += Number(r.reach ?? 0);
      if (r.frequency != null) { freqSum += Number(r.frequency); freqN++; }
    }
    return {
      spend, impressions, clicks, link_clicks, leads,
      reach: reachSum,
      freqMedia: freqN > 0 ? freqSum / freqN : 0,
      ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
      cpc: clicks > 0 ? spend / clicks : 0,
    };
  }, [insights]);

  // Agrupa por dia pros graficos (object_id=ad gera multiplas linhas/dia)
  const byDay = useMemo(() => {
    const m = new Map<string, { date: string; impressions: number; clicks: number; ctr: number; reach: number; freqSum: number; freqN: number }>();
    for (const r of insights) {
      const d = r.date;
      const cur = m.get(d) ?? { date: d, impressions: 0, clicks: 0, ctr: 0, reach: 0, freqSum: 0, freqN: 0 };
      cur.impressions += Number(r.impressions ?? 0);
      cur.clicks += Number(r.clicks ?? 0);
      cur.reach += Number(r.reach ?? 0);
      if (r.frequency != null) { cur.freqSum += Number(r.frequency); cur.freqN++; }
      m.set(d, cur);
    }
    return Array.from(m.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((d) => ({
        data: format(new Date(d.date), "dd/MM"),
        impressoes: d.impressions,
        cliques: d.clicks,
        alcance: d.reach,
        ctr: d.impressions > 0 ? (d.clicks / d.impressions) * 100 : 0,
        frequencia: d.freqN > 0 ? d.freqSum / d.freqN : 0,
      }));
  }, [insights]);

  if (isLoading) {
    return <Card className="p-8 text-center text-sm text-muted-foreground">Carregando…</Card>;
  }
  if (insights.length === 0) {
    return (
      <Card className="p-8 text-center text-sm text-muted-foreground">
        Sem dados de insights ainda — o sync vai popular essa aba no próximo ciclo do cron.
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 6 KPIs do periodo */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Kpi label="Alcance" value={fmtNum(agg.reach)} Icon={Users} />
        <Kpi label="Impressões" value={fmtNum(agg.impressions)} Icon={Eye} />
        <Kpi label="Cliques" value={fmtNum(agg.clicks)} sub={`${fmtNum(agg.link_clicks)} em link`} Icon={MousePointerClick} />
        <Kpi label="CTR médio" value={`${agg.ctr.toFixed(2)}%`} Icon={Target} />
        <Kpi label="CPC médio" value={agg.cpc > 0 ? fmtBRL(agg.cpc) : "-"} Icon={Activity} />
        <Kpi label="Frequência" value={agg.freqMedia.toFixed(2)} sub="média do período" Icon={Repeat} />
      </div>

      {/* Impressoes + cliques no tempo */}
      <Card>
        <CardHeader><CardTitle className="text-base">Impressões e cliques por dia</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={byDay} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="data" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="left" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => fmtNum(v)} />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="impressoes" name="Impressões" stroke="#8b5cf6" strokeWidth={2} dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="cliques" name="Cliques" stroke="#f59e0b" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Alcance + Frequencia (lado a lado) */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Alcance por dia</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byDay} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="data" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => fmtNum(v)} />
                <Bar dataKey="alcance" name="Alcance" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">CTR e Frequência por dia</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={byDay} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="data" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} tickFormatter={(v) => `${v.toFixed(1)}%`} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="ctr" name="CTR (%)" stroke="#3b82f6" strokeWidth={2} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="frequencia" name="Frequência" stroke="#ec4899" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
