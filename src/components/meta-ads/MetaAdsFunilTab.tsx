import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PeriodoFiltro } from "@/types/meta-ads";
import { subDays } from "date-fns";

interface Props {
  periodo: PeriodoFiltro;
}

interface FunilRow {
  lead_id: string;
  status_sdr: string | null;
  converted: boolean;
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

const STAGES_ORDER: string[] = ["novo", "em_atendimento_bot", "sql_aguardando_humano", "assumido_humano", "agendado", "cliente"];

export function MetaAdsFunilTab({ periodo }: Props) {
  const dias = periodo === "7d" ? 7 : periodo === "90d" ? 90 : 30;
  const dataInicioISO = subDays(new Date(), dias).toISOString();

  const { data, isLoading } = useQuery({
    queryKey: ["meta-funil-detalhe", periodo],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("v_meta_lead_funnel")
        .select("lead_id, status_sdr, converted")
        .gte("lead_at", dataInicioISO);
      if (error) throw error;
      return (data ?? []) as FunilRow[];
    },
  });

  const rows = data ?? [];
  const total = rows.length;
  const convertidos = rows.filter((r) => r.converted).length;
  const taxaConv = total > 0 ? (convertidos / total) * 100 : 0;

  // Conta por status_sdr (ordenado pela ordem do funil).
  const byStatus = new Map<string, number>();
  for (const r of rows) {
    const k = r.status_sdr ?? "sem_status";
    byStatus.set(k, (byStatus.get(k) ?? 0) + 1);
  }
  // Ordena: primeiro os do STAGES_ORDER, depois o resto alfa.
  const stagesOrdered = [
    ...STAGES_ORDER.filter((s) => byStatus.has(s)),
    ...Array.from(byStatus.keys()).filter((s) => !STAGES_ORDER.includes(s)).sort(),
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Leads que vieram de anúncio</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{total}</p>
            <p className="text-xs text-muted-foreground mt-1">no período selecionado</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Convertidos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{convertidos}</p>
            <p className="text-xs text-muted-foreground mt-1">cliente / agendado / assumido / sql_aguardando</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Taxa de Conversão</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{taxaConv.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground mt-1">convertidos / total</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Distribuição por estágio</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando…</p>
          ) : total === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum lead de anúncio no período.</p>
          ) : (
            <div className="space-y-3">
              {stagesOrdered.map((s) => {
                const count = byStatus.get(s) ?? 0;
                const pct = total > 0 ? (count / total) * 100 : 0;
                return (
                  <div key={s}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium">{STATUS_LABEL[s] ?? s}</span>
                      <span className="text-muted-foreground tabular-nums">
                        {count} <span className="text-xs">({pct.toFixed(1)}%)</span>
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
