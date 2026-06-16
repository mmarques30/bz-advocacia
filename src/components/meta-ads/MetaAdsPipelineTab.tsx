import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MetaCampanha, PeriodoFiltro } from "@/types/meta-ads";
import { subDays, format } from "date-fns";
import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from "recharts";

interface Props {
  campanhas: MetaCampanha[];
  periodo: PeriodoFiltro;
}

interface FunnelLeadRow {
  lead_id: string;
  campaign_id: string | null;
  converted: boolean;
}

function fmtBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/**
 * Cruza Meta (gasto + leads "lead action") com pipe B&Z
 * (v_meta_lead_funnel — lead real que entrou pelo bot via anuncio).
 * Mostra a diferenca de atribuicao Meta vs realidade do escritorio.
 */
export function MetaAdsPipelineTab({ campanhas, periodo }: Props) {
  const dias = periodo === "7d" ? 7 : periodo === "90d" ? 90 : 30;
  const dataInicioISO = subDays(new Date(), dias).toISOString();
  const dataInicioStr = format(subDays(new Date(), dias), "yyyy-MM-dd");

  // Leads + conversoes do pipe agrupados por campaign_id
  const funnelQuery = useQuery({
    queryKey: ["meta-pipeline-by-campaign", periodo],
    queryFn: async (): Promise<FunnelLeadRow[]> => {
      const { data, error } = await (supabase as any)
        .from("v_meta_lead_funnel")
        .select("lead_id, campaign_id, converted")
        .gte("lead_at", dataInicioISO);
      if (error) throw error;
      return (data ?? []) as FunnelLeadRow[];
    },
  });

  // Leads "Meta" (do actions[].lead) somados por campanha — vem ja
  // agregado em campanhas (sum dos meta_insights_daily.leads por
  // campaign_id). Mas pra puxar separado, fazemos uma query rapida.
  const metaLeadsQuery = useQuery({
    queryKey: ["meta-leads-by-campaign", periodo],
    queryFn: async () => {
      const { data: ads } = await supabase.from("meta_ads").select("id, campaign_id");
      const adToCampaign = new Map<string, string>(
        (ads ?? [])
          .filter((a: any) => a.campaign_id)
          .map((a: any) => [a.id, a.campaign_id as string]),
      );
      const { data: ins } = await supabase
        .from("meta_insights_daily")
        .select("object_id, leads")
        .eq("level", "ad")
        .gte("date", dataInicioStr)
        .not("leads", "is", null);
      const m = new Map<string, number>();
      for (const r of (ins ?? []) as any[]) {
        const cid = adToCampaign.get(r.object_id);
        if (!cid) continue;
        m.set(cid, (m.get(cid) ?? 0) + Number(r.leads ?? 0));
      }
      return m;
    },
  });

  const funnel = funnelQuery.data ?? [];
  const metaLeadsByCampaign = metaLeadsQuery.data ?? new Map<string, number>();

  // Por campanha: gasto Meta x leads do bot x convertidos
  const linhas = useMemo(() => {
    const pipeByCampaign = new Map<string | "_null", { total: number; conv: number }>();
    for (const f of funnel) {
      const k = f.campaign_id ?? "_null";
      const cur = pipeByCampaign.get(k) ?? { total: 0, conv: 0 };
      cur.total++;
      if (f.converted) cur.conv++;
      pipeByCampaign.set(k, cur);
    }
    const rows = campanhas.map((c) => {
      const pipe = pipeByCampaign.get(c.id) ?? { total: 0, conv: 0 };
      const metaLeads = metaLeadsByCampaign.get(c.id) ?? 0;
      const cplMeta = metaLeads > 0 ? c.gasto / metaLeads : 0;
      const cplPipe = pipe.total > 0 ? c.gasto / pipe.total : 0;
      const taxaConvPipe = pipe.total > 0 ? (pipe.conv / pipe.total) * 100 : 0;
      return {
        nome: c.nome,
        gasto: c.gasto,
        meta_leads: metaLeads,
        pipe_leads: pipe.total,
        convertidos: pipe.conv,
        cpl_meta: cplMeta,
        cpl_pipe: cplPipe,
        taxa_conv_pipe: taxaConvPipe,
      };
    });
    return rows
      .filter((r) => r.gasto > 0 || r.pipe_leads > 0 || r.meta_leads > 0)
      .sort((a, b) => b.gasto - a.gasto);
  }, [campanhas, funnel, metaLeadsByCampaign]);

  // Totais
  const totGasto = campanhas.reduce((s, c) => s + c.gasto, 0);
  const totLeadsMeta = Array.from(metaLeadsByCampaign.values()).reduce((s, v) => s + v, 0);
  const totLeadsPipe = funnel.length;
  const totConv = funnel.filter((f) => f.converted).length;

  // Lacuna entre Meta e Pipe — quantos % do que o Meta atribui chega no bot
  const aderencia = totLeadsMeta > 0 ? (totLeadsPipe / totLeadsMeta) * 100 : 0;

  const isLoading = funnelQuery.isLoading || metaLeadsQuery.isLoading;
  if (isLoading) {
    return <Card className="p-8 text-center text-sm text-muted-foreground">Carregando…</Card>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-5">
          <p className="text-sm font-medium text-muted-foreground">Investimento total</p>
          <p className="text-2xl font-bold mt-2">{totGasto > 0 ? fmtBRL(totGasto) : "-"}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm font-medium text-muted-foreground">Leads atribuídos pelo Meta</p>
          <p className="text-2xl font-bold mt-2">{totLeadsMeta}</p>
          <p className="text-xs text-muted-foreground mt-1">action 'lead' do Graph API</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm font-medium text-muted-foreground">Leads no pipe (bot)</p>
          <p className="text-2xl font-bold mt-2">{totLeadsPipe}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {totLeadsMeta > 0 ? `${aderencia.toFixed(0)}% dos atribuídos chegaram` : "—"}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-sm font-medium text-muted-foreground">Convertidos</p>
          <p className="text-2xl font-bold mt-2">{totConv}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {totLeadsPipe > 0 ? `${((totConv / totLeadsPipe) * 100).toFixed(1)}% do pipe` : "—"}
          </p>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Gasto × Leads do pipe — por campanha</CardTitle>
        </CardHeader>
        <CardContent>
          {linhas.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Sem dados suficientes — aguardando sync de insights.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(260, linhas.length * 30)}>
              <BarChart
                data={linhas}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="nome"
                  tick={{ fontSize: 11 }}
                  width={180}
                  interval={0}
                />
                <Tooltip
                  formatter={(v: number, n) => (n === "Gasto" ? [fmtBRL(v), n] : [v, n])}
                />
                <Legend />
                <Bar dataKey="gasto" name="Gasto" fill="#3b82f6" />
                <Bar dataKey="pipe_leads" name="Leads no pipe" fill="#10b981" />
                <Bar dataKey="convertidos" name="Convertidos" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">CPL Meta × CPL Pipe — por campanha</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            CPL Meta = gasto ÷ leads atribuídos. CPL Pipe = gasto ÷ leads que entraram no bot.
            Se as duas diferem muito, vale calibrar atribuição.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {linhas.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem dados.</p>
            ) : (
              linhas.map((l) => (
                <div key={l.nome} className="border rounded-md p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-sm truncate" title={l.nome}>{l.nome}</p>
                    <p className="text-xs text-muted-foreground tabular-nums shrink-0">
                      {fmtBRL(l.gasto)} • {l.taxa_conv_pipe.toFixed(0)}% conversão
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">CPL Meta</p>
                      <p className="font-semibold tabular-nums">
                        {l.cpl_meta > 0 ? fmtBRL(l.cpl_meta) : "—"}
                        <span className="text-muted-foreground ml-1">({l.meta_leads} leads)</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">CPL Pipe (real)</p>
                      <p className="font-semibold tabular-nums">
                        {l.cpl_pipe > 0 ? fmtBRL(l.cpl_pipe) : "—"}
                        <span className="text-muted-foreground ml-1">({l.pipe_leads} leads)</span>
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
