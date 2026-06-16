import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MetaCampanha, PeriodoFiltro } from "@/types/meta-ads";
import { subDays, format } from "date-fns";
import { useMemo } from "react";
import { MiniCard } from "./MiniCard";

interface Props {
  campanhas: MetaCampanha[];
  periodo: PeriodoFiltro;
}

interface FunilRow {
  lead_id: string;
  status_sdr: string | null;
  converted: boolean;
  campaign_id: string | null;
}

const STATUS_LABEL: Record<string, string> = {
  novo: "Novo",
  em_atendimento_bot: "Bot conversando",
  qualificacao_iniciada: "Qualificação",
  aguardando_triagem: "Aguardando triagem",
  sql_aguardando_humano: "Qualificado",
  assumido_humano: "Em atendimento",
  agendado: "Agendado",
  cliente: "Cliente",
  perdido: "Perdido",
  perdido_recuperacao: "Perdido (recuperação)",
  mql_frio: "Lead frio",
};

const STAGES_ORDER = [
  "novo",
  "em_atendimento_bot",
  "qualificacao_iniciada",
  "aguardando_triagem",
  "sql_aguardando_humano",
  "assumido_humano",
  "agendado",
  "cliente",
];

function brl(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });
}

export function MetaAdsFunilTab({ campanhas, periodo }: Props) {
  const dias = periodo === "7d" ? 7 : periodo === "90d" ? 90 : 30;
  const dataInicioISO = subDays(new Date(), dias).toISOString();
  const dataInicioStr = format(subDays(new Date(), dias), "yyyy-MM-dd");

  // Funil completo: leads + status_sdr + converted + campaign_id.
  const { data: funnel = [], isLoading: loadingFunnel } = useQuery({
    queryKey: ["meta-funil-unificado", periodo],
    queryFn: async (): Promise<FunilRow[]> => {
      const { data, error } = await (supabase as any)
        .from("v_meta_lead_funnel")
        .select("lead_id, status_sdr, converted, campaign_id")
        .gte("lead_at", dataInicioISO);
      if (error) throw error;
      return (data ?? []) as FunilRow[];
    },
  });

  // Leads atribuidos pelo Meta por campanha (pra calcular aderência).
  const { data: metaLeadsByCampaign = new Map<string, number>() } = useQuery({
    queryKey: ["meta-funil-meta-leads", periodo],
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
  });

  // Agregados
  const totalLeads = funnel.length;
  const totalConv = funnel.filter((f) => f.converted).length;
  const taxaConv = totalLeads > 0 ? (totalConv / totalLeads) * 100 : 0;
  const totalGasto = campanhas.reduce((s, c) => s + c.gasto, 0);
  const cplPipe = totalLeads > 0 ? totalGasto / totalLeads : 0;
  const totalMetaLeads = Array.from(metaLeadsByCampaign.values()).reduce((s, v) => s + v, 0);
  const aderencia = totalMetaLeads > 0 ? (totalLeads / totalMetaLeads) * 100 : null;

  // Por estágio
  const byStage = useMemo(() => {
    const m = new Map<string, number>();
    for (const f of funnel) {
      const k = f.status_sdr ?? "sem_status";
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    return m;
  }, [funnel]);
  const stagesOrdered = [
    ...STAGES_ORDER.filter((s) => byStage.has(s)),
    ...Array.from(byStage.keys()).filter((s) => !STAGES_ORDER.includes(s)).sort(),
  ];

  // Por campanha — pra comparar CPL Meta x CPL Pipe
  const porCampanha = useMemo(() => {
    const pipeBy = new Map<string, { total: number; conv: number }>();
    for (const f of funnel) {
      if (!f.campaign_id) continue;
      const c = pipeBy.get(f.campaign_id) ?? { total: 0, conv: 0 };
      c.total++;
      if (f.converted) c.conv++;
      pipeBy.set(f.campaign_id, c);
    }
    return campanhas
      .map((c) => {
        const pipe = pipeBy.get(c.id) ?? { total: 0, conv: 0 };
        const lMeta = metaLeadsByCampaign.get(c.id) ?? 0;
        const cplPipe = pipe.total > 0 ? c.gasto / pipe.total : 0;
        return {
          id: c.id,
          nome: c.nome,
          gasto: c.gasto,
          leads_meta: lMeta,
          leads_pipe: pipe.total,
          convertidos: pipe.conv,
          cpl_meta: c.custo_lead,
          cpl_pipe: cplPipe,
        };
      })
      .filter((r) => r.gasto > 0 || r.leads_pipe > 0 || r.leads_meta > 0)
      .sort((a, b) => b.gasto - a.gasto)
      .slice(0, 10);
  }, [campanhas, funnel, metaLeadsByCampaign]);

  return (
    <div className="space-y-4">
      {/* KPIs gerais do funil */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        <MiniCard
          label="Leads de anúncio"
          value={String(totalLeads)}
          sub="no período"
        />
        <MiniCard
          label="Convertidos"
          value={String(totalConv)}
          sub={`${taxaConv.toFixed(1)}% do total`}
        />
        <MiniCard
          label="Investimento"
          value={totalGasto > 0 ? brl(totalGasto) : "—"}
        />
        <MiniCard
          label="CPL real (pipe)"
          value={cplPipe > 0 ? brl(cplPipe) : "—"}
          sub="gasto ÷ leads no bot"
        />
        <MiniCard
          label="Aderência"
          value={aderencia != null ? `${aderencia.toFixed(0)}%` : "—"}
          sub="leads pipe ÷ Meta"
        />
      </div>

      {/* Distribuicao por estagio (barras horizontais) */}
      <div className="rounded-lg border bg-muted/40 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm">Funil — distribuição por estágio</h3>
        </div>
        {loadingFunnel ? (
          <p className="text-xs text-muted-foreground">Carregando…</p>
        ) : totalLeads === 0 ? (
          <p className="text-xs text-muted-foreground">Sem leads de anúncio no período.</p>
        ) : (
          <div className="space-y-2">
            {stagesOrdered.map((s) => {
              const count = byStage.get(s) ?? 0;
              const pct = (count / totalLeads) * 100;
              return (
                <div key={s}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span>{STATUS_LABEL[s] ?? s}</span>
                    <span className="text-muted-foreground tabular-nums">
                      {count} <span className="text-[10px]">({pct.toFixed(1)}%)</span>
                    </span>
                  </div>
                  <div className="h-1.5 bg-background rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Top 10 campanhas — Meta x Pipe */}
      <div className="rounded-lg border bg-muted/40 p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold text-sm">Top campanhas — Meta × Pipe</h3>
            <p className="text-[11px] text-muted-foreground">
              Compara o que o Meta atribuiu com o que de fato entrou no bot.
            </p>
          </div>
        </div>
        {porCampanha.length === 0 ? (
          <p className="text-xs text-muted-foreground">Sem dados.</p>
        ) : (
          <div className="space-y-2">
            {porCampanha.map((l) => (
              <div key={l.id} className="rounded-md border bg-background p-3">
                <div className="flex items-center justify-between gap-3 mb-1">
                  <p className="font-medium text-sm truncate" title={l.nome}>{l.nome}</p>
                  <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                    {brl(l.gasto)}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-[11px]">
                  <div>
                    <p className="text-muted-foreground">Leads Meta</p>
                    <p className="font-semibold tabular-nums">{l.leads_meta}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Leads Pipe</p>
                    <p className="font-semibold tabular-nums">{l.leads_pipe}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">CPL Meta</p>
                    <p className="font-semibold tabular-nums">
                      {l.cpl_meta > 0 ? brl(l.cpl_meta) : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">CPL Pipe</p>
                    <p className="font-semibold tabular-nums">
                      {l.cpl_pipe > 0 ? brl(l.cpl_pipe) : "—"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
