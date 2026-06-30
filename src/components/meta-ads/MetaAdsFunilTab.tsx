import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PeriodoFiltro } from "@/types/meta-ads";
import { subDays } from "date-fns";
import { useMemo } from "react";

interface Props {
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

export function MetaAdsFunilTab({ periodo }: Props) {
  const dias = periodo === "7d" ? 7 : periodo === "90d" ? 90 : 30;
  const dataInicioISO = subDays(new Date(), dias).toISOString();

  const { data: funnel = [], isLoading } = useQuery({
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

  const totalLeads = funnel.length;

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

  const maxCount = Math.max(1, ...Array.from(byStage.values()));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between gap-2">
          <span>Funil — distribuição por estágio</span>
          {totalLeads > 0 && (
            <span className="text-xs font-normal text-muted-foreground">
              {totalLeads} {totalLeads === 1 ? "lead de anúncio" : "leads de anúncio"} no período
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Carregando…</p>
        ) : totalLeads === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Sem leads de anúncio no período.
          </p>
        ) : (
          <div className="space-y-3">
            {stagesOrdered.map((s) => {
              const count = byStage.get(s) ?? 0;
              const pct = (count / totalLeads) * 100;
              // Largura relativa ao maior estágio, para o funil "afunilar"
              // visualmente em vez de todas as barras parecerem cheias.
              const width = (count / maxCount) * 100;
              return (
                <div key={s}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium">{STATUS_LABEL[s] ?? s}</span>
                    <span className="text-muted-foreground tabular-nums">
                      {count}
                      <span className="text-xs text-muted-foreground/70"> ({pct.toFixed(1)}%)</span>
                    </span>
                  </div>
                  <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
